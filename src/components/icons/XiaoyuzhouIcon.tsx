import React from 'react';

interface XiaoyuzhouIconProps {
  className?: string;
}

export const XiaoyuzhouIcon: React.FC<XiaoyuzhouIconProps> = ({ className }) => {
  return (
    <img
      src="/小宇宙logo.png"
      alt="小宇宙"
      className={className}
      style={{ width: '1.25rem', height: '1.25rem', objectFit: 'contain' }}
    />
  );
};
