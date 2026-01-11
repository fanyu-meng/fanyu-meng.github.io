import React from 'react';

interface ZhihuIconProps {
  className?: string;
}

export const ZhihuIcon: React.FC<ZhihuIconProps> = ({ className }) => {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 知乎logo - "知"字简化版，使用SVG路径 */}
      <path d="M8 4h8v2H8zm0 4h6v2H8zm0 4h8v2H8zm0 4h4v2H8z" fill="currentColor"/>
      <circle cx="17" cy="7" r="1.5" fill="currentColor"/>
    </svg>
  );
};
