import React from 'react';

interface WeChatIconProps {
  className?: string;
}

export const WeChatIcon: React.FC<WeChatIconProps> = ({ className }) => {
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
      {/* 微信公众号图标 - 中心对话气泡 + 三个循环箭头轮廓 */}
      {/* 中心对话气泡 */}
      <path d="M12 9c-1.7 0-3 1.3-3 3s1.3 3 3 3c.4 0 .8-.1 1.1-.2l1.2 1.2c.1.1.3.1.4 0l1.2-1.2c.3.1.7.2 1.1.2 1.7 0 3-1.3 3-3s-1.3-3-3-3H12z" />
      {/* 三个循环箭头（围绕中心，形成循环） */}
      <path d="M8 7l2-2 2 2" />
      <path d="M16 17l-2 2-2-2" />
      <path d="M7 12l-2-2v4l2-2" />
      <path d="M17 12l2-2v4l-2-2" />
    </svg>
  );
};
