export default function Input({ 
  label, 
  error, 
  required,
  className = '',
  onChange,
  ...props 
}) {
  const handleKeyDown = (e) => {
    if (props.type === 'number') {
      const isDecimalField = props.name && props.name.includes('z');
      const allowedKeys = isDecimalField 
        ? ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '.', ',', '-', 'Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Enter', 'Home', 'End']
        : ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '-', 'Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Enter', 'Home', 'End'];
      
      if (!allowedKeys.includes(e.key)) {
        e.preventDefault();
        return;
      }
      
      if (isDecimalField && (e.key === '.' || e.key === ',')) {
        const currentValue = e.target.value;
        const hasDot = currentValue.includes('.') || currentValue.includes(',');
        if (hasDot) {
          e.preventDefault();
          return;
        }
      }
    }
  };

  const handleChange = (e) => {
    if (props.type === 'number') {
      const isDecimalField = props.name && props.name.includes('z');
      const pattern = isDecimalField ? /[^0-9.,-]/g : /[^0-9-]/g;
      let value = e.target.value.replace(pattern, '');
      
      const parts = value.split('-');
      if (parts.length > 2) {
        value = '-' + parts.slice(1).join('');
      }
      
      if (isDecimalField) {
        value = value.replace(',', '.');
        
        const dotIndex = value.indexOf('.');
        if (dotIndex !== -1) {
          const beforeDot = value.substring(0, dotIndex + 1);
          const afterDot = value.substring(dotIndex + 1).replace(/\./g, '');
          value = beforeDot + afterDot;
        }
      }
      
      if (e.target.value !== value) {
        e.target.value = value;
      }
    }
    
    if (onChange) {
      onChange(e);
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
        onKeyDown={handleKeyDown}
        onChange={handleChange}
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

