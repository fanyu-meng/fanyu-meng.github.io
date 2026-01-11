import React from 'react';
import { Headphones } from 'lucide-react';

interface ApplePodcastIconProps {
  className?: string;
}

export const ApplePodcastIcon: React.FC<ApplePodcastIconProps> = ({ className }) => {
  return <Headphones className={className} />;
};
