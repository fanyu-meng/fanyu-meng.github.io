import React from 'react';

interface XiaoyuzhouIconProps {
  className?: string;
}

export const XiaoyuzhouIcon: React.FC<XiaoyuzhouIconProps> = ({ className }) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* 小宇宙图标 - 基于其品牌标识，圆形内包含宇宙/星系图案 */}
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      {/* 中心圆点 */}
      <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
      {/* 内圈轨道 */}
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1" fill="none" strokeDasharray="1 1"/>
      {/* 外圈星星 */}
      <circle cx="12" cy="6" r="1" fill="currentColor"/>
      <circle cx="12" cy="18" r="1" fill="currentColor"/>
      <circle cx="6" cy="12" r="1" fill="currentColor"/>
      <circle cx="18" cy="12" r="1" fill="currentColor"/>
      {/* 对角线星星 */}
      <circle cx="9" cy="9" r="0.8" fill="currentColor"/>
      <circle cx="15" cy="9" r="0.8" fill="currentColor"/>
      <circle cx="9" cy="15" r="0.8" fill="currentColor"/>
      <circle cx="15" cy="15" r="0.8" fill="currentColor"/>
    </svg>
  );
};
