import React from 'react';
import { cn } from '../../utils/cn';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

const Card: React.FC<CardProps> = ({ children, className, hover = true }) => {
  return (
    <div
      className={cn(
        'bg-mediterranean-bianco rounded-lg shadow-md p-6',
        hover && 'transition-all duration-200 hover:shadow-lg hover:-translate-y-1',
        className
      )}
    >
      {children}
    </div>
  );
};

export default Card;