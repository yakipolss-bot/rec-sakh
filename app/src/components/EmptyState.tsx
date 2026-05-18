import type { ReactNode } from 'react';
import { FileX2 } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export default function EmptyState({
  title = 'Ничего не найдено',
  description = 'Попробуйте изменить параметры поиска или сбросить фильтры.',
  icon,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`sakh-empty ${className}`}>
      <div className="sakh-empty__icon">
        {icon ?? <FileX2 size={48} />}
      </div>
      <h3 className="sakh-empty__title">{title}</h3>
      <p className="sakh-empty__description">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
