import React from 'react';
import { Youtube } from 'lucide-react';

interface YoutubeIconProps {
  className?: string;
}

export const YoutubeIcon: React.FC<YoutubeIconProps> = ({ className }) => {
  return <Youtube className={className} />;
};
