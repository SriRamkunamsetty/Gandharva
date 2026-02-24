"use client";

export default function BackgroundWave() {
    return (
        <div className="absolute inset-x-0 bottom-0 top-[20%] w-full h-[80%] overflow-hidden opacity-20 blur-[1px] pointer-events-none z-[1]">
            <div className="absolute w-[200%] h-full flex animate-[wave-flow_20s_linear_infinite]">

                <svg viewBox="0 0 1440 320" preserveAspectRatio="none" className="w-1/2 h-full text-violet/40 fill-current">
                    <path
                        fillOpacity="1"
                        d="M0,160L48,144C96,128,192,96,288,106.7C384,117,480,171,576,170.7C672,171,768,117,864,101.3C960,85,1056,107,1152,138.7C1248,171,1344,213,1392,234.7L1440,256L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
                    ></path>
                </svg>

                <svg viewBox="0 0 1440 320" preserveAspectRatio="none" className="w-1/2 h-full text-violet/40 fill-current">
                    <path
                        fillOpacity="1"
                        d="M0,160L48,144C96,128,192,96,288,106.7C384,117,480,171,576,170.7C672,171,768,117,864,101.3C960,85,1056,107,1152,138.7C1248,171,1344,213,1392,234.7L1440,256L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
                    ></path>
                </svg>

            </div>
        </div>
    );
}
