import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: string[];
}

const Select: React.FC<SelectProps> = ({ label, id, options, ...props }) => {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-text-secondary mb-1">
        {label}
      </label>
      <select
        id={id}
        className="block w-full rounded-md border-0 bg-bg-secondary py-2 px-3 text-text-primary shadow-sm ring-1 ring-inset ring-divider focus:ring-2 focus:ring-inset focus:ring-accent-primary sm:text-sm sm:leading-6"
        {...props}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
};

export default Select;