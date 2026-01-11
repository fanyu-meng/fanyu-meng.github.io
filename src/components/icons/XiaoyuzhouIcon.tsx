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
      {/* 小宇宙官方logo - 两个连接的圆点 */}
      <circle cx="9" cy="12" r="2.5" fill="currentColor"/>
      <circle cx="15" cy="12" r="2.5" fill="currentColor"/>
      <rect x="11.5" y="11.5" width="1" height="1" fill="currentColor"/>
    </svg>
  );
};
