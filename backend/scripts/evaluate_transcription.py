import os
import argparse
import time
import numpy as np
import pretty_midi
import mir_eval
from typing import List, Dict, Tuple
from collections import defaultdict
import matplotlib.pyplot as plt
from sklearn.metrics import confusion_matrix
import seaborn as sns

# Assuming we can run the pipeline directly on a raw file
# We will mock the DB and log dependencies to run basic_pitch locally
from basic_pitch.inference import predict

def load_ground_truth(midi_path: str) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    """
    Loads ground truth MIDI and extracts intervals (onset, offset) and pitches.
    Returns:
        intervals (N, 2)
        pitches (N,)
        velocities (N,)
    """
    midi_data = pretty_midi.PrettyMIDI(midi_path)
    intervals = []
    pitches = []
    velocities = []
    
    for instrument in midi_data.instruments:
        if instrument.is_drum:
            continue
        for note in instrument.notes:
            intervals.append([note.start, note.end])
            # midi to frequency logic if needed, mir_eval uses Hz
            freq = 440.0 * (2.0 ** ((note.pitch - 69) / 12.0))
            pitches.append(freq)
            velocities.append(note.velocity)
            
    intervals = np.array(intervals)
    pitches = np.array(pitches)
    velocities = np.array(velocities)
    
    # Sort chronologically
    if len(intervals) > 0:
        sort_idx = np.argsort(intervals[:, 0])
        intervals = intervals[sort_idx]
        pitches = pitches[sort_idx]
        velocities = velocities[sort_idx]
        
    return intervals, pitches, velocities

def run_transcription(audio_path: str) -> List[Dict]:
    """
    Runs basic_pitch + our post_process_notes pipeline.
    """
    # Import our pipeline heuristics
    from app.workers.tasks import post_process_notes
    
    model_output, midi_data, note_events = predict(audio_path)
    
    raw_notes = []
    for start_t, end_t, pitch, amplitude, _ in note_events:
        raw_notes.append({
            "start": float(start_t),
            "end": float(end_t),
            "midi": int(pitch),
            "confidence": float(amplitude)
        })
        
    processed_notes = post_process_notes(raw_notes)
    return processed_notes

def evaluate_predictions(predicted_notes: List[Dict], ref_intervals: np.ndarray, ref_pitches: np.ndarray):
    """
    Evaluates predictions against ground truth using mir_eval and calculates
    extra metrics.
    """
    est_intervals = []
    est_pitches = []
    est_midi_pitches = []
    for n in predicted_notes:
        est_intervals.append([n["start"], n["end"]])
        freq = 440.0 * (2.0 ** ((n["midi"] - 69) / 12.0))
        est_pitches.append(freq)
        est_midi_pitches.append(n["midi"])
        
    est_intervals = np.array(est_intervals)
    est_pitches = np.array(est_pitches)
    
    print("\n--- mir_eval Transcription Metrics ---")
    if len(est_intervals) == 0 or len(ref_intervals) == 0:
        print("Empty predictions or ground truth!")
        return
        
    # Standard mir_eval with 50ms tolerance
    scores = mir_eval.transcription.evaluate(
        ref_intervals, ref_pitches,
        est_intervals, est_pitches,
        onset_tolerance=0.05,
        offset_ratio=0.2, # standard
        offset_min_tolerance=0.05
    )
    
    print(f"Precision: {scores['Precision']:.4f}")
    print(f"Recall:    {scores['Recall']:.4f}")
    print(f"F1-score:  {scores['F-measure']:.4f}")
    
    # ---------------------------------------------------------
    # Custom Rigorous Metrics calculation (Deviation & Confusion)
    # ---------------------------------------------------------
    
    # Match notes via onset overlap for deviation logic
    # We will use mir_eval's matchmaking
    matching = mir_eval.transcription.match_notes(
        ref_intervals, ref_pitches,
        est_intervals, est_pitches,
        onset_tolerance=0.05,
        offset_ratio=0.2,
        offset_min_tolerance=0.05
    )
    
    onset_deviations = []
    offset_deviations = []
    matched_ref_midi = []
    matched_est_midi = []
    exact_pitch_matches = 0
    
    for ref_idx, est_idx in matching:
        ref_on = ref_intervals[ref_idx][0]
        ref_off = ref_intervals[ref_idx][1]
        est_on = est_intervals[est_idx][0]
        est_off = est_intervals[est_idx][1]
        
        onset_dev_ms = (est_on - ref_on) * 1000.0
        offset_dev_ms = (est_off - ref_off) * 1000.0
        
        onset_deviations.append(onset_dev_ms)
        offset_deviations.append(offset_dev_ms)
        
        ref_freq = ref_pitches[ref_idx]
        ref_m = int(round(69 + 12 * np.log2(ref_freq / 440.0)))
        est_m = est_midi_pitches[est_idx]
        
        matched_ref_midi.append(ref_m)
        matched_est_midi.append(est_m)
        
        if ref_m == est_m:
            exact_pitch_matches += 1
            
    print("\n--- Additional Academic Metrics ---")
    if len(matching) > 0:
        avg_onset_dev = np.mean(np.abs(onset_deviations))
        avg_offset_dev = np.mean(np.abs(offset_deviations))
        pitch_accuracy = exact_pitch_matches / len(matching)
        print(f"Average Onset Deviation:  {avg_onset_dev:.2f} ms")
        print(f"Average Offset Deviation: {avg_offset_dev:.2f} ms")
        print(f"Pitch Accuracy (Matched): {pitch_accuracy:.2%}")
    else:
        print("No matched notes found for deviation metrics.")
        
    print(f"Note Density (Ref): {len(ref_intervals)} notes")
    print(f"Note Density (Est): {len(est_intervals)} notes")
    if len(ref_intervals) > 0:
        ratio = len(est_intervals) / len(ref_intervals)
        print(f"Note Density Ratio: {ratio:.3f} (Est/Ref)")
    
    # Confusion Matrix (Matched Notes Only)
    if len(matching) > 0:
        unique_pitches = sorted(list(set(matched_ref_midi + matched_est_midi)))
        cm = confusion_matrix(matched_ref_midi, matched_est_midi, labels=unique_pitches)
        
        plt.figure(figsize=(12, 10))
        sns.heatmap(cm, annot=cm.max() < 100, fmt="d", 
                    xticklabels=unique_pitches, yticklabels=unique_pitches,
                    cmap="Blues")
        plt.ylabel('Ground Truth Pitch')
        plt.xlabel('Predicted Pitch')
        plt.title('Confusion Matrix (Onset-Matched Notes)')
        
        out_path = "confusion_matrix.png"
        plt.savefig(out_path, dpi=300)
        print(f"\nSaved Confusion Matrix to {out_path}")

def main():
    parser = argparse.ArgumentParser(description="Evaluate transcription accuracy.")
    parser.add_argument("--audio", required=True, help="Path to input audio (.wav)")
    parser.add_argument("--midi", required=True, help="Path to ground truth (.mid)")
    args = parser.parse_args()
    
    if not os.path.exists(args.audio) or not os.path.exists(args.midi):
        print("Error: Input files not found.")
        return
        
    print(f"Evaluating {args.audio} against {args.midi}...")
    
    start_t = time.time()
    ref_intervals, ref_pitches, _ = load_ground_truth(args.midi)
    print(f"Loaded {len(ref_intervals)} ground truth notes.")
    
    predicted_notes = run_transcription(args.audio)
    print(f"Transcription predicted {len(predicted_notes)} notes. (Took {time.time() - start_t:.2f}s)")
    
    evaluate_predictions(predicted_notes, ref_intervals, ref_pitches)
    
if __name__ == "__main__":
    main()
