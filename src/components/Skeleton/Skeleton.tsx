import React from 'react';
import './Skeleton.scss';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  style?: React.CSSProperties;
  className?: string;
}

function Skeleton({ width, height, style, className }: SkeletonProps) {
  return (
    <div
      className={`skeleton-loader${className ? ` ${className}` : ''}`}
      style={{ width, height, ...style }}
      aria-busy="true"
      aria-label="Loading..."
    />
  );
}

export default Skeleton;
