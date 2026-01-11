import React from 'react';

interface WeChatIconProps {
  className?: string;
}

export const WeChatIcon: React.FC<WeChatIconProps> = ({ className }) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* 微信公众号图标 - 基于微信的经典设计，两个对话气泡 */}
      <path d="M12 2C6.477 2 2 6.477 2 12c0 1.74.456 3.373 1.252 4.787L2 22l5.213-1.252C8.627 21.544 10.26 22 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18c-1.38 0-2.68-.35-3.81-.97l-.27-.15-.28.07-3.04.73.73-3.04.07-.28-.15-.27C4.35 14.68 4 13.38 4 12c0-4.418 3.582-8 8-8s8 3.582 8 8-3.582 8-8 8z"/>
      <circle cx="8.5" cy="10.5" r="1" fill="currentColor"/>
      <circle cx="15.5" cy="10.5" r="1" fill="currentColor"/>
    </svg>
  );
};
