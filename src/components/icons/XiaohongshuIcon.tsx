import React from 'react';

interface XiaohongshuIconProps {
  className?: string;
}

export const XiaohongshuIcon: React.FC<XiaohongshuIconProps> = ({ className }) => {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 小红书"红"字 - 简洁风格 */}
      <path d="M7 5h10v2H7zm0 4h8v2H7zm0 4h10v2H7zm0 4h6v2H7z" fill="currentColor"/>
      <circle cx="17" cy="7" r="1.5" fill="currentColor"/>
    </svg>
  );
};
