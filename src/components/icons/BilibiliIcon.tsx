import React from 'react';

interface BilibiliIconProps {
  className?: string;
}

export const BilibiliIcon: React.FC<BilibiliIconProps> = ({ className }) => {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Bilibili "b" 字母 - 圆润风格 */}
      <path d="M8 4v16M8 4c0-2 2-4 4-4s4 2 4 4v4c0 2-2 4-4 4M8 12h4c2 0 4-2 4-4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
};
