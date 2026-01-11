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
      {/* 小宇宙官方logo - 带环的行星设计，使用currentColor保持与其他icon风格一致 */}
      {/* 行星环的后半部分（在行星后面，下半部分可见，倾斜角度） */}
      <ellipse 
        cx="12" 
        cy="13.2" 
        rx="8" 
        ry="1.8" 
        fill="currentColor"
      />
      {/* 行星主体 - 圆形 */}
      <circle 
        cx="12" 
        cy="12" 
        r="5.5" 
        fill="currentColor"
      />
      {/* 行星环的前半部分（在行星前面，上半部分可见，倾斜角度） */}
      <ellipse 
        cx="12" 
        cy="10.8" 
        rx="8" 
        ry="1.8" 
        fill="currentColor"
      />
    </svg>
  );
};
