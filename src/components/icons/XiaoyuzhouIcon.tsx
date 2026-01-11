import React from 'react';

interface XiaoyuzhouIconProps {
  className?: string;
}

export const XiaoyuzhouIcon: React.FC<XiaoyuzhouIconProps> = ({ className }) => {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 
        设计思路：
        1. 环是一个倾斜的椭圆描边 (stroke)
        2. 行星是一个实心圆 (fill)
        3. 为了实现环绕效果，将环分为后半部分和前半部分
      */}
      
      {/* 定义遮罩，用于分割环的前后部分 */}
      <defs>
        <clipPath id="xiaoyuzhou-clip-back">
          <rect x="0" y="0" width="24" height="12" transform="rotate(-25 12 12)" />
        </clipPath>
        <clipPath id="xiaoyuzhou-clip-front">
          <rect x="0" y="12" width="24" height="12" transform="rotate(-25 12 12)" />
        </clipPath>
      </defs>

      {/* 1. 后半部分的环（在行星后面） */}
      <ellipse
        cx="12"
        cy="12"
        rx="10.5"
        ry="3.8"
        stroke="currentColor"
        strokeWidth="1.4"
        transform="rotate(-25 12 12)"
        clipPath="url(#xiaoyuzhou-clip-back)"
      />

      {/* 2. 行星主体 */}
      <circle 
        cx="12" 
        cy="12" 
        r="6.8" 
        fill="currentColor" 
      />

      {/* 3. 前半部分的环（在行星前面） */}
      <ellipse
        cx="12"
        cy="12"
        rx="10.5"
        ry="3.8"
        stroke="currentColor"
        strokeWidth="1.4"
        transform="rotate(-25 12 12)"
        clipPath="url(#xiaoyuzhou-clip-front)"
      />
    </svg>
  );
};
