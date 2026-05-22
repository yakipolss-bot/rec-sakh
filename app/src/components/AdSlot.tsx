interface Props {
  code?: string | null;
  className?: string;
}

export default function AdSlot({ code, className = '' }: Props) {
  if (!code) return null;

  return (
    <div
      className={`flex items-center justify-center bg-[var(--bg-surface)] border border-[var(--border-color)] ${className}`}
      dangerouslySetInnerHTML={{ __html: code }}
    />
  );
}
