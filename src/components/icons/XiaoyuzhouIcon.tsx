import React from 'react';

interface XiaoyuzhouIconProps {
  className?: string;
}

export const XiaoyuzhouIcon: React.FC<XiaoyuzhouIconProps> = ({ className }) => {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* 遮罩：用于让环的后半部分只显示在行星下方 */}
        <clipPath id="ringBackClip">
          <rect x="0" y="12" width="24" height="12" />
        </clipPath>
        {/* 遮罩：用于让环的前半部分只显示在行星上方 */}
        <clipPath id="ringFrontClip">
          <rect x="0" y="0" width="24" height="12" />
        </clipPath>
      </defs>
      {/* 小宇宙官方logo - 带环的行星设计，使用currentColor保持与其他icon风格一致 */}
      {/* 环的后半部分（在行星后面，下半部分可见，倾斜角度） */}
      <ellipse 
        cx="12" 
        cy="12.5" 
        rx="8.5" 
        ry="2" 
        fill="currentColor"
        clipPath="url(#ringBackClip)"
      />
      {/* 行星主体 - 圆形 */}
      <circle 
        cx="12" 
        cy="12" 
        r="5.5" 
        fill="currentColor"
      />
      {/* 环的前半部分（在行星前面，上半部分可见，倾斜角度） */}
      <ellipse 
        cx="12" 
        cy="11.5" 
        rx="8.5" 
        ry="2" 
        fill="currentColor"
        clipPath="url(#ringFrontClip)"
      />
    </svg>
  );
};
