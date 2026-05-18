export interface FilterOption {
  value: string;
  label: string;
}

interface FilterBarProps {
  options: FilterOption[];
  selected: string | null;
  onChange: (value: string | null) => void;
  className?: string;
  allLabel?: string;
}

export default function FilterBar({
  options,
  selected,
  onChange,
  className = '',
  allLabel = 'Все',
}: FilterBarProps) {
  return (
    <div className={`sakh-filter-bar ${className}`} role="tablist" aria-label="Фильтры">
      <button
        className={`sakh-filter-bar__item ${selected === null ? 'sakh-filter-bar__item--active' : ''}`}
        onClick={() => onChange(null)}
        role="tab"
        aria-selected={selected === null}
      >
        {allLabel}
      </button>
      {options.map((option) => (
        <button
          key={option.value}
          className={`sakh-filter-bar__item ${selected === option.value ? 'sakh-filter-bar__item--active' : ''}`}
          onClick={() => onChange(option.value)}
          role="tab"
          aria-selected={selected === option.value}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
