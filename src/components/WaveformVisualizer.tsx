import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Play, Pause, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WaveformVisualizerProps {
  audioFile: File | null;
}

const WaveformVisualizer = ({ audioFile }: WaveformVisualizerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const animFrameRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);

  const drawWaveform = useCallback((buffer: AudioBuffer) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);

    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    const data = buffer.getChannelData(0);
    const step = Math.ceil(data.length / w);

    ctx.clearRect(0, 0, w, h);

    // Draw waveform
    const gradient = ctx.createLinearGradient(0, 0, w, 0);
    gradient.addColorStop(0, "hsl(270,80%,60%)");
    gradient.addColorStop(0.5, "hsl(180,100%,50%)");
    gradient.addColorStop(1, "hsl(200,100%,50%)");

    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    for (let i = 0; i < w; i++) {
      let min = 1.0, max = -1.0;
      for (let j = 0; j < step; j++) {
        const d = data[i * step + j] || 0;
        if (d < min) min = d;
        if (d > max) max = d;
      }
      ctx.lineTo(i, (1 + min) * h / 2);
    }
    for (let i = w - 1; i >= 0; i--) {
      let max = -1.0;
      for (let j = 0; j < step; j++) {
        const d = data[i * step + j] || 0;
        if (d > max) max = d;
      }
      ctx.lineTo(i, (1 + max) * h / 2);
    }
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.globalAlpha = 0.6;
    ctx.fill();
    ctx.globalAlpha = 1;

    // Center line
    ctx.strokeStyle = "hsl(180,100%,50%)";
    ctx.lineWidth = 0.5;
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }, []);

  // Live analyzer visualization
  const drawLive = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      analyser.getByteFrequencyData(dataArray);
      ctx.clearRect(0, 0, w * 2, h * 2);
      ctx.save();
      ctx.scale(2, 2);

      const barWidth = w / bufferLength * 2.5;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * h * 0.8;
        const hue = 180 + (i / bufferLength) * 90;
        ctx.fillStyle = `hsla(${hue},100%,50%,0.7)`;
        ctx.fillRect(x, h - barHeight, barWidth - 1, barHeight);
        x += barWidth;
      }
      ctx.restore();
      animFrameRef.current = requestAnimationFrame(render);
    };
    render();
  }, []);

  useEffect(() => {
    if (!audioFile) return;
    const ctx = new AudioContext();
    audioContextRef.current = ctx;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const buffer = await ctx.decodeAudioData(e.target?.result as ArrayBuffer);
      audioBufferRef.current = buffer;
      setDuration(buffer.duration);
      drawWaveform(buffer);
    };
    reader.readAsArrayBuffer(audioFile);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      ctx.close();
    };
  }, [audioFile, drawWaveform]);

  const togglePlay = () => {
    const ctx = audioContextRef.current;
    const buffer = audioBufferRef.current;
    if (!ctx || !buffer) return;

    if (isPlaying) {
      sourceRef.current?.stop();
      cancelAnimationFrame(animFrameRef.current);
      setIsPlaying(false);
      drawWaveform(buffer);
      return;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyserRef.current = analyser;
    source.connect(analyser);
    analyser.connect(ctx.destination);
    source.start();
    sourceRef.current = source;
    setIsPlaying(true);
    drawLive();

    source.onended = () => {
      setIsPlaying(false);
      cancelAnimationFrame(animFrameRef.current);
      drawWaveform(buffer);
    };
  };

  if (!audioFile) {
    return (
      <div className="glass rounded-xl p-8 flex items-center justify-center h-48">
        <p className="text-muted-foreground text-sm">Upload audio to see waveform visualization</p>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-display text-foreground">Waveform</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{duration.toFixed(1)}s</span>
          <Button variant="glass" size="icon" className="h-8 w-8" onClick={togglePlay}>
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      <canvas ref={canvasRef} className="w-full h-32 rounded-lg" />
    </div>
  );
};

export default WaveformVisualizer;
