import React, { useState, useRef } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  wrapperClassName?: string;
}

export function Tooltip({ content, children, wrapperClassName = 'relative inline-block' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!tooltipRef.current) return;

    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const padding = 8;

    // Position: bottom-left corner of tooltip at mouse cursor
    let left = e.clientX;
    let top = e.clientY - tooltipRect.height;

    // Clamp to viewport
    left = Math.max(padding, Math.min(left, window.innerWidth - tooltipRect.width - padding));
    top = Math.max(padding, Math.min(top, window.innerHeight - tooltipRect.height - padding));

    setCoords({ top, left });
  };

  const tooltipElement = (
    <div
      ref={tooltipRef}
      className="fixed z-9999 pointer-events-none max-w-72 whitespace-normal bg-[#111] text-[#ececec] px-3 py-2 border-2 border-[#111] shadow-[4px_4px_0_rgba(0,0,0,0.3)] text-xs font-semibold leading-snug transition-opacity duration-150"
      style={{
        top: `${coords.top}px`,
        left: `${coords.left}px`,
        opacity: isVisible ? 1 : 0,
        visibility: isVisible ? 'visible' : 'hidden',
      }}
    >
      {content}
    </div>
  );

  return (
    <>
      <div
        ref={triggerRef}
        className={wrapperClassName}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onMouseMove={handleMouseMove}
      >
        {children}
      </div>
      {createPortal(tooltipElement, document.body)}
    </>
  );
}
