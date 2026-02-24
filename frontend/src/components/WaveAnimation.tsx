"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function WaveAnimation() {
    const [isMounted, setIsMounted] = useState(false);
    const bars = 40; // Number of equalizer bars

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) return <div className="h-16 w-full max-w-md" />;

    return (
        <div className="flex items-end justify-center gap-[4px] h-20 w-full max-w-md mx-auto mb-8">
            {Array.from({ length: bars }).map((_, i) => {
                const randomHeight = Math.random() * 60 + 30;
                const randomDuration = Math.random() * 0.6 + 0.6;
                const randomDelay = Math.random() * 0.5;

                return (
                    <motion.div
                        key={i}
                        className="w-1.5 rounded-full bg-gradient-to-t from-violet to-neon"
                        initial={{ height: "15%" }}
                        animate={{ height: ["15%", `${randomHeight}%`, "15%"] }}
                        transition={{
                            duration: randomDuration,
                            repeat: Infinity,
                            ease: [0.42, 0, 0.58, 1], // cubic-bezier smooth easing
                            delay: randomDelay,
                        }}
                        style={{
                            boxShadow: "0 0 12px rgba(0, 229, 255, 0.6)",
                            filter: "drop-shadow(0 0 4px rgba(139, 92, 246, 0.4))",
                        }}
                    />
                );
            })}
        </div>
    );
}
