import { useState, useRef, useEffect, type FormEvent } from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value?: string;
  onChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
}

export default function SearchBar({
  value = '',
  onChange,
  onSubmit,
  placeholder = 'Найти на Сахалине...',
  autoFocus = false,
  className = '',
}: SearchBarProps) {
  const [query, setQuery] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      onSubmit?.(trimmed);
    }
  };

  const handleClear = () => {
    setQuery('');
    onChange?.('');
    inputRef.current?.focus();
  };

  const handleChange = (val: string) => {
    setQuery(val);
    onChange?.(val);
  };

  return (
    <form onSubmit={handleSubmit} className={`sakh-search ${className}`}>
      <Search className="sakh-search__icon" size={16} aria-hidden="true" />
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className="sakh-search__input"
        aria-label="Поиск"
      />
      {query && (
        <button
          type="button"
          onClick={handleClear}
          className="sakh-search__clear"
          aria-label="Очистить поиск"
        >
          <X size={16} />
        </button>
      )}
    </form>
  );
}
