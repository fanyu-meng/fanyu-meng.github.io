import React from 'react';

interface WeChatIconProps {
  className?: string;
}

export const WeChatIcon: React.FC<WeChatIconProps> = ({ className }) => {
  return (
    <img
      src="/公众号logo.png"
      alt="微信公众号"
      className={className}
      style={{
        width: '1.25rem',
        height: '1.25rem',
        objectFit: 'contain',
        filter: 'brightness(0) invert(1)',
      }}
    />
  );
};
