import Image from "next/image";
import Link from "next/link";

interface LogoProps {
    className?: string;
    width?: number;
    height?: number;
}

export default function Logo({ className = "", width = 40, height = 40 }: LogoProps) {
    return (
        <Image
            src="/logo.png"
            alt="Gandharva AI Music Studio"
            width={width}
            height={height}
            className={`object-contain ${className}`}
            priority
        />
    );
}
