export function Card({ children, className = '', ...props }) {
  return (
    <div 
      className={`bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 p-6 sm:p-8 transition-all ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return (
    <div className={`mb-6 ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '' }) {
  return (
    <h3 className={`text-xl sm:text-2xl font-headline font-bold text-on-surface tracking-tight ${className}`}>
      {children}
    </h3>
  );
}

export function CardContent({ children, className = '' }) {
  return (
    <div className={`${className}`}>
      {children}
    </div>
  );
}
