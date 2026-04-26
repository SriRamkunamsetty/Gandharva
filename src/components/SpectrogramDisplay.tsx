import { useEffect, useRef } from "react";

interface SpectrogramProps {
  audioFile: File | null;
}

const SpectrogramDisplay = ({ audioFile }: SpectrogramProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!audioFile) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);

    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;

    const audioContext = new AudioContext();
    const reader = new FileReader();

    reader.onload = async (e) => {
      const buffer = await audioContext.decodeAudioData(e.target?.result as ArrayBuffer);
      const data = buffer.getChannelData(0);

      // Simple spectrogram via FFT slices
      const fftSize = 512;
      const hopSize = 256;
      const numSlices = Math.floor((data.length - fftSize) / hopSize);
      const sliceWidth = w / numSlices;

      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < numSlices && i < w; i++) {
        const start = i * hopSize;
        const slice = data.slice(start, start + fftSize);

        // Simple magnitude approximation
        const binCount = fftSize / 2;
        for (let j = 0; j < binCount; j++) {
          const mag = Math.abs(slice[j * 2] || 0) + Math.abs(slice[j * 2 + 1] || 0);
          const intensity = Math.min(mag * 5, 1);
          const hue = 180 + intensity * 90;
          const lightness = intensity * 60;
          ctx.fillStyle = `hsl(${hue}, 100%, ${lightness}%)`;
          const binHeight = h / binCount;
          ctx.fillRect(i * sliceWidth, h - j * binHeight - binHeight, sliceWidth + 0.5, binHeight + 0.5);
        }
      }
    };

    reader.readAsArrayBuffer(audioFile);

    return () => {
      audioContext.close();
    };
  }, [audioFile]);

  if (!audioFile) {
    return (
      <div className="glass-card p-8 flex items-center justify-center h-32">
        <p className="text-muted-foreground text-sm">
          Spectrogram will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card glass-card-hover p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="panel-heading text-sm">Spectrogram</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Frequency × time intensity
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-primary/60" />
          <span>Live</span>
        </div>
      </div>
      <div className="rounded-xl bg-black/30 border border-white/5 p-2">
        <canvas ref={canvasRef} className="w-full h-28 rounded-lg" />
      </div>
    </div>
  );
};

export default SpectrogramDisplay;
