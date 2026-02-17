export const Card = ({ children, className = '' }) => {
  return (
    <div className={`bg-white rounded-xl shadow-lg p-8 w-full max-w-md md:max-w-lg border border-gray-100 ${className}`}>
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '' }) => {
  return <div className={`mb-6 ${className}`}>{children}</div>;
};

export const CardTitle = ({ children, className = '' }) => {
  return <h2 className={`text-3xl font-bold text-gray-900 ${className}`}>{children}</h2>;
};

export const CardDescription = ({ children, className = '' }) => {
  return <p className={`text-sm text-gray-600 mt-2 ${className}`}>{children}</p>;
};

export const CardContent = ({ children, className = '' }) => {
  return <div className={className}>{children}</div>;
};