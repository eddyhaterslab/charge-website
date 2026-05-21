import { cn } from '@/lib/utils';

interface MetricCardProps {
  label: string;
  value: string;
  delta?: { value: string; direction: 'up' | 'down' | 'flat' };
  caption?: string;
  className?: string;
}

export function MetricCard({ label, value, delta, caption, className }: MetricCardProps) {
  return (
    <div className={cn('border border-zinc-200 bg-white p-6', className)}>
      <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500">
        {label}
      </div>
      <div className="mt-3 flex items-baseline gap-3">
        <span className="text-4xl font-semibold tracking-tight tabular-nums text-zinc-900">
          {value}
        </span>
        {delta && (
          <span
            className={cn(
              'text-xs font-medium',
              delta.direction === 'up' && 'text-emerald-700',
              delta.direction === 'down' && 'text-red-700',
              delta.direction === 'flat' && 'text-zinc-500'
            )}
          >
            {delta.direction === 'up' && '▲ '}
            {delta.direction === 'down' && '▼ '}
            {delta.value}
          </span>
        )}
      </div>
      {caption && <div className="mt-2 text-xs text-zinc-500">{caption}</div>}
    </div>
  );
}
