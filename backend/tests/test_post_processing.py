import pytest
from app.workers.tasks import post_process_notes

def test_drop_min_duration():
    notes = [
        {"start": 1.0, "end": 1.03, "midi": 60, "confidence": 0.9}, # 30ms -> Drop
        {"start": 2.0, "end": 2.15, "midi": 62, "confidence": 0.9}, # 150ms -> Keep
    ]
    processed = post_process_notes(notes)
    assert len(processed) == 1
    assert processed[0]["midi"] == 62

def test_merge_adjacent_notes():
    notes = [
        {"start": 1.0, "end": 1.5, "midi": 60, "confidence": 0.8},
        {"start": 1.54, "end": 2.0, "midi": 60, "confidence": 0.9}, # Gap is 40ms -> Merge
    ]
    processed = post_process_notes(notes)
    assert len(processed) == 1
    assert processed[0]["start"] == 1.0
    assert processed[0]["end"] == 2.0
    assert processed[0]["confidence"] == 0.9

def test_merge_overlapping_notes():
    notes = [
        {"start": 1.0, "end": 1.8, "midi": 60, "confidence": 0.8},
        {"start": 1.5, "end": 2.0, "midi": 60, "confidence": 0.95}, # Overlaps -> Merge
    ]
    processed = post_process_notes(notes)
    assert len(processed) == 1
    assert processed[0]["start"] == 1.0
    assert processed[0]["end"] == 2.0
    assert processed[0]["confidence"] == 0.95

def test_preserve_chord():
    notes = [
        {"start": 1.0, "end": 2.0, "midi": 60, "confidence": 0.9}, # C
        {"start": 1.01, "end": 2.0, "midi": 64, "confidence": 0.85}, # E
        {"start": 0.99, "end": 2.0, "midi": 67, "confidence": 0.8}, # G
    ]
    processed = post_process_notes(notes)
    assert len(processed) == 3
    # All are strong enough to survive
    
def test_drop_polyphonic_false_positive():
    notes = [
        {"start": 1.0, "end": 2.0, "midi": 60, "confidence": 0.9}, 
        {"start": 1.005, "end": 2.0, "midi": 64, "confidence": 0.8}, # E
        {"start": 1.01, "end": 1.5, "midi": 61, "confidence": 0.3}, # Weak false positive (< 0.9 * 0.5)
    ]
    processed = post_process_notes(notes)
    assert len(processed) == 2
    assert processed[0]["midi"] == 60
    assert processed[1]["midi"] == 64

def test_boundary_merge_scenario():
    notes = [
        # Simulating window edge duplicates
        {"start": 29.8, "end": 30.0, "midi": 65, "confidence": 0.9},
        {"start": 29.95, "end": 30.5, "midi": 65, "confidence": 0.85},
    ]
    processed = post_process_notes(notes)
    assert len(processed) == 1
    assert processed[0]["start"] == 29.8
    assert processed[0]["end"] == 30.5
    assert processed[0]["confidence"] == 0.9

def test_extreme_noise_burst():
    # Simulate a burst of 100 alternating ultra-short notes
    notes = []
    base_time = 5.0
    for i in range(100):
        notes.append({
            "start": base_time + (i * 0.005), # 5ms apart
            "end": base_time + (i * 0.005) + 0.015, # 15ms duration (will be dropped!)
            "midi": 60 + (i % 2), # Alternating pitches
            "confidence": 0.8
        })
        
    # Inject one valid long note at the end to ensure it survives the burst
    notes.append({
        "start": 6.0,
        "end": 7.0,
        "midi": 64,
        "confidence": 0.95
    })
        
    processed = post_process_notes(notes)
    
    # All 15ms length notes (< POST_MIN_DURATION) should be completely dropped.
    # System should not hang or merge incorrectly.
    assert len(processed) == 1
    assert processed[0]["midi"] == 64
    assert processed[0]["start"] == 6.0
