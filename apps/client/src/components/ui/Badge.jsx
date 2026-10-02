export function Badge({ 
  children, 
  variant = 'default',
  className = '' 
}) {
  const baseClasses = "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium tracking-wide border";
  
  const variants = {
    default: "bg-surface-container-low text-on-surface border-outline-variant/30",
    primary: "bg-primary-container/30 text-on-primary-container border-primary/20",
    success: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
    error: "bg-error-container/30 text-on-error-container border-error/20",
    // Special variant for the high-contrast dashboard brand badge
    brand: "bg-white/10 text-primary-fixed backdrop-blur-sm border-white/10"
  };

  const variantClasses = variants[variant] || variants.default;

  return (
    <span className={`${baseClasses} ${variantClasses} ${className}`}>
      {children}
    </span>
  );
}
