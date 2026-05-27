import * as React from 'react';
import { cn } from '../../lib/utils';

const Input = React.forwardRef(
  ({ className, type = 'text', ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-2 text-sm text-slate-700 shadow-sm transition placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

export { Input };
