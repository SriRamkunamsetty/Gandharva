try:
    from basic_pitch.inference import predict
    print("basic_pitch predict ok")
    from basic_pitch import ICASSP_2022_MODEL_PATH
    print("basic_pitch model path ok")
    import librosa
    print("librosa ok")
    import numpy as np
    print("numpy ok")
    import gc
    print("gc ok")
except ImportError as exc:
    print(f"ImportError: {exc}")
except Exception as e:
    print(f"Exception: {e}")
    import traceback
    traceback.print_exc()
