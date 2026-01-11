import React from 'react';
import { Mail } from 'lucide-react';

interface EmailIconProps {
  className?: string;
}

export const EmailIcon: React.FC<EmailIconProps> = ({ className }) => {
  return <Mail className={className} />;
};
