import { cn } from '../../lib/utils';

export function Card({ className, ...props }) {
  return (
    <div
      className={cn(
        'rounded-3xl border border-white/60 bg-white/80 shadow-xl backdrop-blur-sm',
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }) {
  return <div className={cn('p-6 pb-2', className)} {...props} />;
}

export function CardTitle({ className, ...props }) {
  return (
    <h2
      className={cn(
        'text-xl font-semibold tracking-tight text-slate-900',
        className
      )}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }) {
  return <p className={cn('text-sm text-slate-500', className)} {...props} />;
}

export function CardContent({ className, ...props }) {
  return <div className={cn('p-6 pt-2', className)} {...props} />;
}

export function CardFooter({ className, ...props }) {
  return <div className={cn('p-6 pt-0', className)} {...props} />;
}
