import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

const Input: React.FC<InputProps> = ({ label, id, ...props }) => {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-text-secondary mb-1">
        {label}
      </label>
      <input
        id={id}
        className="block w-full rounded-md border-0 bg-bg-secondary py-2 px-3 text-text-primary shadow-sm ring-1 ring-inset ring-divider placeholder:text-text-secondary focus:ring-2 focus:ring-inset focus:ring-accent-primary sm:text-sm sm:leading-6"
        {...props}
      />
    </div>
  );
};

export default Input;