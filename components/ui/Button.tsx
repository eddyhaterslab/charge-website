import { cn } from '@/lib/utils';
import { forwardRef, type ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-medium tracking-tight transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-900',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          size === 'sm' && 'px-3 py-1.5 text-sm',
          size === 'md' && 'px-4 py-2 text-sm',
          size === 'lg' && 'px-5 py-2.5 text-sm',
          variant === 'primary' && 'bg-zinc-900 text-white hover:bg-zinc-800',
          variant === 'secondary' && 'border border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-50',
          variant === 'ghost' && 'text-zinc-900 hover:bg-zinc-100',
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
