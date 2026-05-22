import { ChevronDown } from "lucide-react";

export default function SelectMenu({ id, label, value, onChange, options, className = "" }) {
  return (
    <label htmlFor={id} className={`block ${className}`}>
      {label ? <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span> : null}
      <span className="relative block">
        <select
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-10 w-full appearance-none rounded-md border border-slate-300 bg-white px-3 pr-9 text-sm font-medium text-slate-800 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
      </span>
    </label>
  );
}
