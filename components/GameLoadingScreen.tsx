"use client";

export function GameLoadingScreen() {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-600">
            {/* Subtle glow removed to match flat design from image */}

            {/* Orbit spinner */}
            <div className="relative z-10 flex items-center justify-center w-20 h-20">
                <div
                    className="absolute inset-0"
                    style={{ animation: 'orbitSpin 4s cubic-bezier(0.4, 0, 0.2, 1) infinite' }}
                >
                    {/* Top Right Dot */}
                    <div className="absolute top-0 right-0 w-6 h-6 bg-white rounded-full shadow-lg" style={{ animation: 'dotPulse 2s ease-in-out infinite', animationDelay: '0s' }} />
                    {/* Bottom Right Dot */}
                    <div className="absolute bottom-0 right-0 w-6 h-6 bg-white rounded-full shadow-lg" style={{ animation: 'dotPulse 2s ease-in-out infinite', animationDelay: '0.5s' }} />
                    {/* Bottom Left Dot */}
                    <div className="absolute bottom-0 left-0 w-6 h-6 bg-white rounded-full shadow-lg" style={{ animation: 'dotPulse 2s ease-in-out infinite', animationDelay: '1s' }} />
                    {/* Top Left Dot */}
                    <div className="absolute top-0 left-0 w-6 h-6 bg-white rounded-full shadow-lg" style={{ animation: 'dotPulse 2s ease-in-out infinite', animationDelay: '1.5s' }} />
                </div>
            </div>

            <style>{`
                @keyframes orbitSpin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                @keyframes dotPulse {
                    0%, 100% { transform: scale(0.6); opacity: 0.4; }
                    50% { transform: scale(1.1); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
