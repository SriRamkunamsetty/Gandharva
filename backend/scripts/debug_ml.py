from basic_pitch.inference import predict
import os

test_file = "tests/test_a_short.wav"
if not os.path.exists(test_file):
    print(f"File not found: {test_file}")
else:
    print(f"Testing basic-pitch on {test_file}")
    try:
        model_output, midi_data, note_events = predict(test_file)
        print(f"Success! Extracted {len(note_events)} notes.")
    except Exception as e:
        import traceback
        traceback.print_exc()
