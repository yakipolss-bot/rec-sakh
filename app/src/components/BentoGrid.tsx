import type { ReactNode } from 'react';

export interface BentoItem {
  id: string;
  type: 'hero' | 'default' | 'wide' | 'sidebar';
  content: ReactNode;
}

interface BentoGridProps {
  items: BentoItem[];
  className?: string;
}

export default function BentoGrid({ items, className = '' }: BentoGridProps) {
  return (
    <div className={`bento-grid ${className}`}>
      {items.map((item) => (
        <div
          key={item.id}
          className={`bento-item bento-item--${item.type}`}
        >
          {item.content}
        </div>
      ))}
    </div>
  );
}
