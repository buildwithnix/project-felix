'use client';

import React, { forwardRef } from 'react';

interface FormFieldProps {
  label: string;
  type?: 'text' | 'email' | 'tel';
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  autoComplete?: string;
  className?: string;
}

const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  (
    {
      label,
      type = 'text',
      value,
      onChange,
      error,
      placeholder,
      required = false,
      disabled = false,
      autoComplete,
      className = '',
    },
    ref
  ) => {
    const inputId = `field-${label.toLowerCase().replace(/\s+/g, '-')}`;

    return (
      <div className={`space-y-1 ${className}`}>
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <input
          ref={ref}
          id={inputId}
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoComplete={autoComplete}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={`
            w-full px-3 py-2 border rounded-md shadow-sm
            focus:outline-none focus:ring-2 focus:ring-black focus:border-black
            disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
            ${error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'}
          `}
        />
        {error && (
          <p id={`${inputId}-error`} className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

FormField.displayName = 'FormField';

export default FormField;
