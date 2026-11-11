import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';

interface Option {
  value: string | number;
  label: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string | number | null;
  onChange: (value: string | number | null) => void;
  placeholder?: string;
  required?: boolean;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = "Seleccionar...",
  required = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => o.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(o => 
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div 
        className={`w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg cursor-pointer flex justify-between items-center text-sm transition-colors ${isOpen ? 'ring-2 ring-indigo-500 border-indigo-500' : 'hover:border-gray-400 focus:ring-2 focus:ring-indigo-500'}`}
        onClick={() => {
          setIsOpen(!isOpen);
          setSearch('');
        }}
        tabIndex={0}
      >
        <span className={selectedOption ? 'text-gray-900 truncate' : 'text-gray-500 truncate'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {value && !required && (
            <div 
              className="p-0.5 hover:bg-gray-100 rounded text-gray-400 transition-colors"
              onClick={(e) => { e.stopPropagation(); onChange(null); }}
            >
              <X size={14} />
            </div>
          )}
          <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* Hidden input for HTML required validation */}
      {required && (
        <input 
          type="text" 
          required 
          value={value || ''} 
          onChange={() => {}} 
          className="absolute opacity-0 w-0 h-0 pointer-events-none" 
        />
      )}

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-64 flex flex-col overflow-hidden">
          <div className="p-2 border-b border-gray-100 flex items-center shrink-0 bg-gray-50/50">
            <Search size={14} className="text-gray-400 mx-2" />
            <input 
              autoFocus
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full text-sm outline-none bg-transparent py-1.5"
              placeholder="Escribe para buscar..."
            />
          </div>
          <div className="overflow-y-auto flex-1">
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-sm text-gray-500 text-center italic">No se encontraron resultados</div>
            ) : (
              <div className="p-1">
                {filteredOptions.map(option => (
                  <div 
                    key={option.value}
                    className={`px-3 py-2 text-sm cursor-pointer rounded-lg mb-0.5 transition-colors ${value === option.value ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-gray-700 hover:bg-gray-50'}`}
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                  >
                    {option.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
