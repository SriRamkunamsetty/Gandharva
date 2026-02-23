import os
import json
import numpy as np

# Use non-interactive backend for thread safety
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import librosa
import librosa.display

def generate_waveform_peaks(audio_path: str, output_json_path: str, num_peaks: int = 1000):
    try:
        y, sr = librosa.load(audio_path, sr=16000, mono=True)
        samples_per_peak = max(1, len(y) // num_peaks)
        peaks = []
        for i in range(num_peaks):
            start = i * samples_per_peak
            end = start + samples_per_peak
            if start >= len(y):
                break
            chunk = y[start:end]
            val = float(np.max(np.abs(chunk)))
            # Normalize to 0-100 range for frontend
            peaks.append(int(val * 100))
            
        with open(output_json_path, 'w') as f:
            json.dump(peaks, f)
            
    except Exception as e:
        print(f"Error generating waveform peaks: {e}")

def generate_spectrogram_png(audio_path: str, output_png_path: str):
    try:
        y, sr = librosa.load(audio_path, sr=16000, mono=True)
        
        S = librosa.feature.melspectrogram(y=y, sr=sr, n_mels=128, fmax=8000)
        S_dB = librosa.power_to_db(S, ref=np.max)
        
        plt.figure(figsize=(10, 4), dpi=100)
        plt.axes([0,0,1,1]) # Fill entire figure perfectly
        # Custom color map mapping to purple-cyan theme
        librosa.display.specshow(S_dB, sr=sr, cmap='twilight_shifted', fmax=8000)
        plt.axis('off')
        
        plt.savefig(output_png_path, format='png', bbox_inches='tight', pad_inches=0, transparent=True)
        plt.close()
        
    except Exception as e:
        print(f"Error generating spectrogram PNG: {e}")
