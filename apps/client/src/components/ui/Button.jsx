export function Button({ 
  children, 
  variant = 'primary', 
  className = '', 
  type = 'button',
  icon: Icon,
  ...props 
}) {
  const baseClasses = "inline-flex justify-center items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-150 shadow-sm";
  
  const variants = {
    primary: "bg-primary text-on-primary hover:bg-primary-dim active:bg-primary-dim focus:ring-primary",
    secondary: "bg-surface-variant text-on-surface-variant hover:bg-surface-container-highest focus:ring-primary",
    outline: "border border-outline-variant text-on-surface hover:bg-surface-container-low focus:ring-primary",
    ghost: "bg-transparent text-primary hover:bg-surface-container-low focus:ring-primary shadow-none",
    danger: "bg-error text-on-error hover:bg-error-dim focus:ring-error"
  };

  const variantClasses = variants[variant] || variants.primary;
  
  return (
    <button 
      type={type} 
      className={`${baseClasses} ${variantClasses} disabled:opacity-50 disabled:pointer-events-none ${className}`}
      {...props}
    >
      {children}
      {Icon && <Icon className="w-4 h-4" />}
    </button>
  );
}
