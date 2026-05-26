'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string | number;
  label: string;
}

interface CustomSelectProps {
  options: SelectOption[];
  value: string | number;
  onChange: (value: any) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  className?: string;
  triggerClassName?: string;
  dropdownClassName?: string;
  size?: 'sm' | 'md';
}

export default function CustomSelect({
  options,
  value,
  onChange,
  placeholder = 'Select…',
  icon,
  className = '',
  triggerClassName = '',
  dropdownClassName = '',
  size = 'md',
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selectedOption = options.find((o) => String(o.value) === String(value));

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
          e.preventDefault();
          setIsOpen(true);
          setHighlightedIndex(options.findIndex((o) => String(o.value) === String(value)));
        }
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex((prev) => (prev < options.length - 1 ? prev + 1 : 0));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : options.length - 1));
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (highlightedIndex >= 0) {
            onChange(options[highlightedIndex].value);
            setIsOpen(false);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          break;
      }
    },
    [isOpen, highlightedIndex, options, value, onChange]
  );

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && listRef.current && highlightedIndex >= 0) {
      const item = listRef.current.children[highlightedIndex] as HTMLElement;
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex, isOpen]);

  const sizeClasses = size === 'sm'
    ? 'py-1.5 px-3 text-xs'
    : 'py-2 px-4 text-sm';

  return (
    <div ref={containerRef} className={`relative ${className}`} onKeyDown={handleKeyDown}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            setHighlightedIndex(options.findIndex((o) => String(o.value) === String(value)));
          }
        }}
        className={`
          w-full flex items-center gap-2 bg-white border rounded-lg font-medium
          transition-all cursor-pointer select-none
          ${isOpen
            ? 'border-primary-500 ring-2 ring-primary-500/20 shadow-sm'
            : 'border-slate-300 hover:border-slate-400 shadow-sm'
          }
          ${sizeClasses}
          ${triggerClassName}
        `}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        {icon && <span className="text-slate-400 shrink-0">{icon}</span>}
        <span className={`flex-1 text-left truncate ${selectedOption ? 'text-slate-900' : 'text-slate-400'}`}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown
          size={14}
          className={`text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <ul
          ref={listRef}
          role="listbox"
          className={`
            absolute z-50 mt-1.5 w-full min-w-[140px]
            bg-white border border-slate-200 rounded-lg shadow-lg
            py-1 max-h-[220px] overflow-y-auto
            animate-in fade-in slide-in-from-top-1 duration-150
            ${dropdownClassName}
          `}
        >
          {options.map((option, index) => {
            const isSelected = String(option.value) === String(value);
            const isHighlighted = index === highlightedIndex;

            return (
              <li
                key={option.value}
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`
                  flex items-center justify-between gap-2 px-3 cursor-pointer select-none transition-colors
                  ${size === 'sm' ? 'py-1.5 text-xs' : 'py-2 text-sm'}
                  ${isHighlighted ? 'bg-slate-50' : ''}
                  ${isSelected ? 'text-primary-600 font-semibold' : 'text-slate-700'}
                `}
              >
                <span className="truncate">{option.label}</span>
                {isSelected && <Check size={14} className="text-primary-600 shrink-0" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
