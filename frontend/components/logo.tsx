"use client";

import React from "react";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
}

const Logo: React.FC<LogoProps> = ({
  className = "",
  size = "md",
  showText = true,
}) => {
  const sizeMap = {
    sm: { width: 100, height: 80, fontSize: 12 },
    md: { width: 150, height: 120, fontSize: 16 },
    lg: { width: 200, height: 160, fontSize: 20 },
    xl: { width: 250, height: 200, fontSize: 24 },
  };

  const { width, height, fontSize } = sizeMap[size];

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 500 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* First wing (blue gradient) */}
      <path
        d="M167 142L240 250L180 320L120 250L167 142Z"
        fill="url(#blue-gradient)"
      />
      <ellipse cx="208" cy="152" rx="8" ry="6" fill="white" />

      {/* Second wing (purple to cyan gradient) */}
      <path
        d="M334 142L380 220L340 280L260 200L334 142Z"
        fill="url(#purple-gradient)"
      />

      {/* Third wing (cyan) */}
      <path
        d="M380 220L420 280L360 340L320 280L380 220Z"
        fill="url(#cyan-gradient)"
      />

      {/* Text */}
      {showText && (
        <g>
          <text
            x="130"
            y="360"
            fontFamily="Arial, sans-serif"
            fontSize={fontSize * 2}
            fontWeight="600"
            fill="currentColor"
          >
            PREDICT.
          </text>
          <text
            x="340"
            y="360"
            fontFamily="Arial, sans-serif"
            fontSize={fontSize * 2}
            fontWeight="600"
            fill="#00D4FF"
          >
            X
          </text>
        </g>
      )}

      {/* Gradients */}
      <defs>
        <linearGradient id="blue-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1E3A8A" stopOpacity="1" />
          <stop offset="100%" stopColor="#3B82F6" stopOpacity="1" />
        </linearGradient>
        <linearGradient
          id="purple-gradient"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#A855F7" stopOpacity="1" />
          <stop offset="100%" stopColor="#00D4FF" stopOpacity="1" />
        </linearGradient>
        <linearGradient id="cyan-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00D4FF" stopOpacity="1" />
          <stop offset="100%" stopColor="#10B981" stopOpacity="1" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export default Logo;
