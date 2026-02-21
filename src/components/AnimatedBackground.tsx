import { motion } from "framer-motion";
import { useCallback, useEffect, useRef } from "react";

const AnimatedWaveformBg = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);

    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    let t = 0;

    const animate = () => {
      ctx.clearRect(0, 0, w, h);
      t += 0.008;

      // Draw multiple wave layers
      const waves = [
        { amplitude: 40, frequency: 0.008, speed: 1, color: "hsla(180,100%,50%,0.08)", yOffset: 0.5 },
        { amplitude: 30, frequency: 0.012, speed: 1.3, color: "hsla(270,80%,60%,0.06)", yOffset: 0.45 },
        { amplitude: 50, frequency: 0.006, speed: 0.7, color: "hsla(200,100%,50%,0.05)", yOffset: 0.55 },
        { amplitude: 20, frequency: 0.015, speed: 1.6, color: "hsla(180,100%,50%,0.04)", yOffset: 0.4 },
      ];

      waves.forEach((wave) => {
        ctx.beginPath();
        ctx.moveTo(0, h * wave.yOffset);
        for (let x = 0; x <= w; x++) {
          const y =
            h * wave.yOffset +
            Math.sin(x * wave.frequency + t * wave.speed) * wave.amplitude +
            Math.sin(x * wave.frequency * 2.5 + t * wave.speed * 0.8) * (wave.amplitude * 0.4);
          ctx.lineTo(x, y);
        }
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.closePath();
        ctx.fillStyle = wave.color;
        ctx.fill();
      });

      requestAnimationFrame(animate);
    };

    animate();
  }, []);

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ opacity: 0.7 }}
    />
  );
};

// Floating music particles
const MusicParticles = () => {
  const notes = ["♪", "♫", "♬", "♩", "𝅘𝅥𝅮"];
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 15 }).map((_, i) => (
        <motion.span
          key={i}
          className="absolute text-neon/20 text-lg"
          initial={{
            x: `${Math.random() * 100}%`,
            y: "110%",
            rotate: 0,
            opacity: 0,
          }}
          animate={{
            y: "-10%",
            rotate: 720,
            opacity: [0, 0.6, 0.6, 0],
          }}
          transition={{
            duration: 12 + Math.random() * 10,
            repeat: Infinity,
            delay: Math.random() * 10,
            ease: "linear",
          }}
        >
          {notes[i % notes.length]}
        </motion.span>
      ))}
    </div>
  );
};

// Equalizer bars
const EqualizerBars = () => (
  <div className="flex items-end gap-1 h-16">
    {Array.from({ length: 24 }).map((_, i) => (
      <motion.div
        key={i}
        className="w-1 rounded-full bg-primary/40"
        animate={{
          height: [
            `${10 + Math.random() * 20}%`,
            `${60 + Math.random() * 40}%`,
            `${10 + Math.random() * 20}%`,
          ],
        }}
        transition={{
          duration: 0.8 + Math.random() * 0.6,
          repeat: Infinity,
          ease: "easeInOut",
          delay: i * 0.05,
        }}
      />
    ))}
  </div>
);

export { AnimatedWaveformBg, MusicParticles, EqualizerBars };
