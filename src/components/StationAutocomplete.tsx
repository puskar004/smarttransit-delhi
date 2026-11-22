import { Check, ChevronDown, MapPin, Search, Train, X } from 'lucide-react';
import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { DELHI_STOPS } from '../data/delhiNetwork';
import type { BusStop } from '../types/transit';

interface StationAutocompleteProps {
  label: string;
  sublabel?: string;
  value: string;
  onChange: (stopId: string) => void;
  excludeStopId?: string;
  placeholder?: string;
  isOrigin?: boolean;
  error?: string | null;
}

export function StationAutocomplete({
  label,
  sublabel,
  value,
  onChange,
  excludeStopId,
  placeholder = 'Search stop or metro station...',
  isOrigin = false,
  error,
}: StationAutocompleteProps) {
  const inputId = useId();
  const listboxId = useId();

  const selectedStop = useMemo(
    () => DELHI_STOPS.find((s) => s.id === value) ?? null,
    [value]
  );

  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Sync search input with selected stop when closed
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm(selectedStop ? selectedStop.name : '');
    }
  }, [selectedStop, isOpen]);

  // Filter stops based on search term
  const filteredStops = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const stops = DELHI_STOPS.filter((s) => s.id !== excludeStopId);

    if (!q) {
      // Prioritize transit hubs first, then alphabetical
      return [...stops].sort((a, b) => {
        if (a.isHub && !b.isHub) return -1;
        if (!a.isHub && b.isHub) return 1;
        return a.name.localeCompare(b.name);
      });
    }

    return stops.filter((stop) => {
      const matchName = stop.name.toLowerCase().includes(q);
      const matchCorridor = stop.corridor.toLowerCase().includes(q);
      const matchZone = stop.zone.toLowerCase().includes(q);
      const matchMetro = stop.metroInterchange?.toLowerCase().includes(q) ?? false;
      const matchCode = stop.code.toLowerCase().includes(q);
      return matchName || matchCorridor || matchZone || matchMetro || matchCode;
    });
  }, [searchTerm, excludeStopId]);

  // Reset highlight index when filter changes
  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredStops]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (!isOpen || !listRef.current) return;
    const items = listRef.current.querySelectorAll('li');
    if (items[highlightedIndex]) {
      items[highlightedIndex].scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex, isOpen]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        // If query doesn't match any stop, revert to selectedStop
        if (selectedStop) {
          setSearchTerm(selectedStop.name);
        } else {
          setSearchTerm('');
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedStop]);

  const selectStop = (stop: BusStop) => {
    onChange(stop.id);
    setSearchTerm(stop.name);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredStops.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredStops.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredStops[highlightedIndex]) {
          selectStop(filteredStops[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        if (selectedStop) {
          setSearchTerm(selectedStop.name);
        }
        break;
      case 'Tab':
        setIsOpen(false);
        break;
    }
  };

  const clearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSearchTerm('');
    setIsOpen(true);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative w-full space-y-1">
      {/* Accessible Visible Label */}
      <div className="flex items-center justify-between text-xs">
        <label
          htmlFor={inputId}
          className="font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isOrigin
                ? 'bg-[#CCFF00] shadow-[0_0_6px_#CCFF00]'
                : 'bg-white shadow-[0_0_6px_white]'
            }`}
          />
          <span>{label}</span>
        </label>
        {sublabel && (
          <span className="text-[10px] font-mono text-slate-500 uppercase">{sublabel}</span>
        )}
      </div>

      {/* Input Container */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
          <MapPin
            className={`w-4 h-4 ${isOrigin ? 'text-[#CCFF00]' : 'text-slate-300'}`}
          />
        </div>

        <input
          ref={inputRef}
          id={inputId}
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-label={label}
          value={searchTerm}
          placeholder={placeholder}
          onFocus={() => {
            setIsOpen(true);
            // Select all text on focus for quick overwrite
            inputRef.current?.select();
          }}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          className={`w-full h-11 pl-9 pr-14 bg-[#11141c] hover:bg-[#151923] border ${
            error
              ? 'border-amber-400 text-amber-200'
              : isOpen
                ? 'border-[#CCFF00] text-white ring-1 ring-[#CCFF00]/30'
                : 'border-[#222838] text-white'
          } rounded-xl text-xs font-semibold placeholder:text-slate-500 focus:outline-none transition-all`}
        />

        {/* Right action icons (Clear or Chevron) */}
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {searchTerm && (
            <button
              type="button"
              onClick={clearSelection}
              aria-label={`Clear ${label}`}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            tabIndex={-1}
            onClick={() => {
              setIsOpen((prev) => !prev);
              inputRef.current?.focus();
            }}
            aria-label="Toggle stop suggestions"
            className="p-1 rounded-md text-slate-400 hover:text-white transition-colors"
          >
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* Inline Validation / Error Message */}
      {error && (
        <p className="text-[11px] font-mono text-amber-400 flex items-center gap-1 pl-1">
          <span>⚠️</span>
          <span>{error}</span>
        </p>
      )}

      {/* Autocomplete Dropdown Listbox */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-[200] max-h-64 overflow-y-auto rounded-xl bg-[#0f121a] border border-[#2b3348] shadow-[0_12px_36px_rgba(0,0,0,0.85)] no-scrollbar backdrop-blur-xl">
          <div className="sticky top-0 px-3 py-1.5 bg-[#141824] border-b border-[#242b3d] flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase">
            <span>{filteredStops.length} STOPS AVAILABLE</span>
            <span>Use ↑↓ Enter</span>
          </div>

          <ul
            id={listboxId}
            ref={listRef}
            role="listbox"
            aria-label={`Matching stops for ${label}`}
            className="py-1 divide-y divide-[#1b2130]"
          >
            {filteredStops.length === 0 ? (
              <li className="px-4 py-6 text-center text-xs text-slate-400 space-y-1">
                <Search className="w-4 h-4 mx-auto text-slate-500 mb-1" />
                <p className="font-semibold text-white">No stop matching &ldquo;{searchTerm}&rdquo;</p>
                <p className="text-[10.5px] font-mono text-slate-500">
                  Try typing AIIMS, Nehru Place, Kashmere Gate, or Hauz Khas.
                </p>
              </li>
            ) : (
              filteredStops.map((stop, index) => {
                const isSelected = stop.id === value;
                const isHighlighted = index === highlightedIndex;

                return (
                  <li
                    key={stop.id}
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    onClick={() => selectStop(stop)}
                    className={`px-3 py-2.5 flex items-center justify-between gap-2.5 cursor-pointer transition-colors ${
                      isHighlighted
                        ? 'bg-[#1b2234] text-white'
                        : isSelected
                          ? 'bg-[#161c2b] text-white'
                          : 'text-slate-300 hover:bg-[#151a26]'
                    }`}
                  >
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-white uppercase tracking-tight">
                          {stop.name}
                        </span>
                        {stop.isHub && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-[#CCFF00]/15 text-[#CCFF00] border border-[#CCFF00]/30">
                            HUB
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10.5px] font-mono text-slate-400 truncate">
                        <span>{stop.corridor}</span>
                        {stop.metroInterchange && (
                          <>
                            <span>•</span>
                            <span className="text-[#38bdf8] flex items-center gap-1">
                              <Train className="w-2.5 h-2.5" />
                              {stop.metroInterchange}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1">
                      {isSelected && (
                        <Check className="w-4 h-4 text-[#CCFF00] stroke-[2.5]" />
                      )}
                      <span className="text-[9px] font-mono text-slate-500 uppercase">
                        {stop.code}
                      </span>
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
