import { useCallback, useRef, useState } from "react";

interface UseLiveRecorderOptions {
  chunkSeconds?: number;
  onChunk: (blob: Blob, index: number) => void | Promise<void>;
}

export const useLiveRecorder = ({ chunkSeconds = 5, onChunk }: UseLiveRecorderOptions) => {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunkIndex = useRef(0);

  const start = useCallback(async () => {
    setError(null);
    chunkIndex.current = 0;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/ogg";
      const recorder = new MediaRecorder(stream, { mimeType });
      recorderRef.current = recorder;
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          onChunk(e.data, chunkIndex.current++);
        }
      };
      recorder.start(chunkSeconds * 1000);
      setIsRecording(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Microphone access denied");
    }
  }, [chunkSeconds, onChunk]);

  const stop = useCallback(() => {
    recorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    recorderRef.current = null;
    streamRef.current = null;
    setIsRecording(false);
  }, []);

  return { isRecording, error, start, stop };
};