"use client";

import React from "react";

interface LogoIconProps {
  className?: string;
  size?: number;
}

const LogoIcon: React.FC<LogoIconProps> = ({ className = "", size = 32 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* First wing (blue gradient) */}
      <path
        d="M67 57L96 100L72 128L48 100L67 57Z"
        fill="url(#blue-gradient-icon)"
      />
      <ellipse cx="83.2" cy="60.8" rx="3.2" ry="2.4" fill="white" />

      {/* Second wing (purple to cyan gradient) */}
      <path
        d="M133 57L152 88L136 112L104 80L133 57Z"
        fill="url(#purple-gradient-icon)"
      />

      {/* Third wing (cyan) */}
      <path
        d="M152 88L168 112L144 136L128 112L152 88Z"
        fill="url(#cyan-gradient-icon)"
      />

      {/* Gradients */}
      <defs>
        <linearGradient
          id="blue-gradient-icon"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#1E3A8A" stopOpacity="1" />
          <stop offset="100%" stopColor="#3B82F6" stopOpacity="1" />
        </linearGradient>
        <linearGradient
          id="purple-gradient-icon"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#A855F7" stopOpacity="1" />
          <stop offset="100%" stopColor="#00D4FF" stopOpacity="1" />
        </linearGradient>
        <linearGradient
          id="cyan-gradient-icon"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#00D4FF" stopOpacity="1" />
          <stop offset="100%" stopColor="#10B981" stopOpacity="1" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export default LogoIcon;
