import { forwardRef } from 'react';

export const Input = forwardRef(({ 
  label, 
  id, 
  error, 
  className = '', 
  wrapperClassName = '', 
  type = 'text',
  ...props 
}, ref) => {
  const baseClasses = "block w-full rounded-lg bg-surface-container-lowest px-3.5 py-2.5 text-xs text-on-surface placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-150";
  const stateClasses = error 
    ? "border-error focus:border-error focus:ring-error" 
    : "border-outline-variant/60";

  return (
    <div className={`space-y-1.5 text-left ${wrapperClassName}`}>
      {label && (
        <label className="block text-xs font-semibold text-on-surface" htmlFor={id}>
          {label}
        </label>
      )}
      <div className="relative rounded-lg shadow-none">
        <input 
          ref={ref}
          id={id}
          type={type}
          className={`${baseClasses} ${stateClasses} disabled:bg-surface-container-low disabled:text-on-surface/50 ${className}`}
          {...props}
        />
      </div>
      {error && (
        <p className="text-[11px] text-error font-medium mt-1">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
