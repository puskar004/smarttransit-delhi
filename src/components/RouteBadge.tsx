import { OPERATOR_META } from '../data/delhiNetwork';
import type { BusOperator } from '../types/transit';

interface RouteBadgeProps {
  shortName: string;
  operator: BusOperator;
  size?: 'xs' | 'sm' | 'md';
  showOperator?: boolean;
}

export function RouteBadge({
  shortName,
  operator,
  size = 'sm',
  showOperator = false,
}: RouteBadgeProps) {
  const meta = OPERATOR_META[operator];
  const sizeClass =
    size === 'xs'
      ? 'text-[10px] px-1.5 py-0.5'
      : size === 'md'
        ? 'text-[12px] px-2.5 py-0.5'
        : 'text-[11px] px-2 py-0.5';

  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`font-mono-tabular inline-flex items-center font-bold rounded-[4px] leading-tight text-white tracking-tight ${sizeClass}`}
        style={{ backgroundColor: meta.color }}
        title={`${shortName} · ${meta.label}`}
      >
        {shortName}
      </span>
      {showOperator && (
        <span className="text-[11px] text-[#5A626A] font-medium">{meta.shortLabel}</span>
      )}
    </span>
  );
}
