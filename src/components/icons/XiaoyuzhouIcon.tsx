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
      {/* 小宇宙官方logo - 带环的行星 */}
      {/* 行星环的后半部分（在行星后面） */}
      <ellipse cx="12" cy="12" rx="7" ry="1.8" fill="currentColor" opacity="0.4"/>
      {/* 行星主体 - 圆形 */}
      <circle cx="12" cy="12" r="5.5" fill="currentColor"/>
      {/* 行星环的前半部分（在行星前面） */}
      <ellipse cx="12" cy="10.5" rx="7" ry="1.8" fill="currentColor"/>
    </svg>
  );
};
