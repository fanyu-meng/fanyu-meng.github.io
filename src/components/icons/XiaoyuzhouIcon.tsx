import React from 'react';

interface XiaoyuzhouIconProps {
  className?: string;
}

export const XiaoyuzhouIcon: React.FC<XiaoyuzhouIconProps> = ({ className }) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* 小宇宙图标 - 圆形轮廓风格，与 lucide-react 图标一致 */}
      <circle cx="12" cy="12" r="10" />
      {/* 中心点 */}
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      {/* 内圈轨道 */}
      <circle cx="12" cy="12" r="4" strokeDasharray="0.5 1.5" />
      {/* 外圈星星 */}
      <circle cx="12" cy="6" r="0.8" fill="currentColor" />
      <circle cx="12" cy="18" r="0.8" fill="currentColor" />
      <circle cx="6" cy="12" r="0.8" fill="currentColor" />
      <circle cx="18" cy="12" r="0.8" fill="currentColor" />
    </svg>
  );
};
