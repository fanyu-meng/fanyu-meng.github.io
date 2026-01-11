import React from 'react';

interface WeChatIconProps {
  className?: string;
}

export const WeChatIcon: React.FC<WeChatIconProps> = ({ className }) => {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 微信公众号logo - 两个对话气泡 */}
      <path d="M8.5 6c-2.5 0-4.5 2-4.5 4.5s2 4.5 4.5 4.5c.4 0 .8-.1 1.1-.2l1.8 1c.2.1.4.1.6 0l1.8-1c.3.1.7.2 1.1.2 2.5 0 4.5-2 4.5-4.5S13.5 6 11 6H8.5z" fill="currentColor"/>
      <path d="M15.5 12c-2.5 0-4.5 2-4.5 4.5s2 4.5 4.5 4.5c.4 0 .8-.1 1.1-.2l1.8 1c.2.1.4.1.6 0l1.8-1c.3.1.7.2 1.1.2 2.5 0 4.5-2 4.5-4.5S20.5 12 18 12h-2.5z" fill="currentColor" opacity="0.8"/>
    </svg>
  );
};
