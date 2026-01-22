'use client';

import { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'pink';
  size?: 'sm' | 'md';
  className?: string;
}

export default function Badge({
  children,
  variant = 'default',
  size = 'sm',
  className = '',
}: BadgeProps) {
  const variants = {
    default: 'bg-gh-bg-tertiary text-gh-text-muted border-gh-border',
    success: 'bg-gh-success/20 text-gh-success border-gh-success/30',
    warning: 'bg-gh-warning/20 text-gh-warning border-gh-warning/30',
    danger: 'bg-gh-danger/20 text-gh-danger border-gh-danger/30',
    info: 'bg-gh-accent/20 text-gh-accent border-gh-accent/30',
    purple: 'bg-gh-purple/20 text-gh-purple border-gh-purple/30',
    pink: 'bg-gh-pink/20 text-gh-pink border-gh-pink/30',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </span>
  );
}

// Label badge with custom color from GitHub
interface LabelBadgeProps {
  name: string;
  color: string;
  className?: string;
}

export function LabelBadge({ name, color, className = '' }: LabelBadgeProps) {
  // Determine if text should be light or dark based on background color
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  };

  const rgb = hexToRgb(color);
  const luminance = rgb ? (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255 : 0.5;
  const textColor = luminance > 0.5 ? '#000000' : '#ffffff';

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${className}`}
      style={{
        backgroundColor: `#${color}`,
        color: textColor,
      }}
    >
      {name}
    </span>
  );
}
