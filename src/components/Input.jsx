export default function Input({ 
  label, 
  error, 
  required,
  className = '',
  ...props 
}) {
  const handleInput = (e) => {
    if (props.type === 'number') {
      let value = e.target.value.replace(/[^0-9.,-]/g, '');
      
      const parts = value.split('-');
      if (parts.length > 2) {
        value = '-' + parts.slice(1).join('');
      }
      
      const decimalParts = value.split(/[.,]/);
      if (decimalParts.length > 2) {
        value = decimalParts[0] + '.' + decimalParts.slice(1).join('');
      }
      
      value = value.replace(',', '.');
      
      e.target.value = value;
    }
    
    if (props.onChange) {
      props.onChange(e);
    }
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
        onInput={handleInput}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

export function Select({ 
  label, 
  error, 
  required,
  children,
  className = '',
  ...props 
}) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        className={`w-full px-3 py-2.5 border rounded-lg bg-white
          focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
          hover:border-gray-400 transition-colors
          appearance-none cursor-pointer
          ${error ? 'border-red-500' : 'border-gray-300'}
          bg-[url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")] 
          bg-[length:1.5em_1.5em] bg-[right_0.5rem_center] bg-no-repeat pr-10`}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

