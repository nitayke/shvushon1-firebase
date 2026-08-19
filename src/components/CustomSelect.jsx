import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export default function CustomSelect({ options, value, onChange, placeholder = "בחר/י...", required = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const selectedOption = options.find(opt => opt.value === value) || options.find(opt => opt.id === value);
  const selectedLabel = selectedOption ? (selectedOption.label || selectedOption.name) : placeholder;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (val) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div className="custom-select-container" ref={containerRef}>
      <button
        type="button"
        className={`custom-select-trigger ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{selectedLabel}</span>
        <ChevronDown style={{ width: 18, height: 18, transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'none', color: '#a5b4fc' }} />
      </button>

      {isOpen && (
        <div className="custom-select-dropdown">
          {options.map((opt) => {
            const optVal = opt.value !== undefined ? opt.value : opt.id;
            const optLabel = opt.label || opt.name;
            const isSelected = optVal === value;

            return (
              <div
                key={optVal}
                className={`custom-select-option ${isSelected ? 'selected' : ''}`}
                onClick={() => handleSelect(optVal)}
              >
                <span>{optLabel}</span>
                {isSelected && <Check style={{ width: 16, height: 16, color: '#a855f7' }} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
