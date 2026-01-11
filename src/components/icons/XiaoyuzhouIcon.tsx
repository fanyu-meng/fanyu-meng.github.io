import React from 'react';

interface XiaoyuzhouIconProps {
  className?: string;
}

export const XiaoyuzhouIcon: React.FC<XiaoyuzhouIconProps> = ({ className }) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* 小宇宙图标 - 基于其品牌标识，圆形内包含宇宙/星系图案 */}
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
      {/* 中心点 */}
      <circle cx="12" cy="12" r="2" fill="currentColor"/>
      {/* 轨道和星星 */}
      <circle cx="12" cy="7" r="1" fill="currentColor"/>
      <circle cx="12" cy="17" r="1" fill="currentColor"/>
      <circle cx="7" cy="12" r="1" fill="currentColor"/>
      <circle cx="17" cy="12" r="1" fill="currentColor"/>
      <circle cx="9.5" cy="9.5" r="0.8" fill="currentColor"/>
      <circle cx="14.5" cy="9.5" r="0.8" fill="currentColor"/>
      <circle cx="9.5" cy="14.5" r="0.8" fill="currentColor"/>
      <circle cx="14.5" cy="14.5" r="0.8" fill="currentColor"/>
    </svg>
  );
};
