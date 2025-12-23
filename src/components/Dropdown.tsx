'use client';

import { useState, useRef, useEffect, ReactNode } from 'react';

interface DropdownProps {
    trigger: ReactNode;
    children: ReactNode;
}

export function Dropdown({ trigger, children }: DropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    return (
        <div className="dropdown" ref={ref}>
            <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>
            {isOpen && (
                <div className="dropdown-menu" onClick={() => setIsOpen(false)}>
                    {children}
                </div>
            )}
        </div>
    );
}

interface DropdownItemProps {
    onClick: () => void;
    children: ReactNode;
    danger?: boolean;
}

export function DropdownItem({ onClick, children, danger }: DropdownItemProps) {
    return (
        <button
            className={`dropdown-item ${danger ? 'dropdown-item-danger' : ''}`}
            onClick={onClick}
        >
            {children}
        </button>
    );
}
