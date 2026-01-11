import React from 'react';

interface ApplePodcastIconProps {
  className?: string;
}

export const ApplePodcastIcon: React.FC<ApplePodcastIconProps> = ({ className }) => {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Apple Podcast logo - 麦克风图标 */}
      <path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" fill="currentColor"/>
      <path d="M19 10v1a7 7 0 0 1-14 0v-1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 18v4M8 22h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
};
