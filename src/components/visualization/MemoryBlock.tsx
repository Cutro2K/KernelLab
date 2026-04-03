import {type MemoryBlock as MemoryBlockType } from '../../algorithms/types';
import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { Tooltip } from '../ui/Tooltip';

interface MemoryBlockProps {
  block: MemoryBlockType;
  totalMemory: number;
  isLast?: boolean;
}

export function MemoryBlock({ block, totalMemory, isLast = false }: MemoryBlockProps) {
  const normalizedTotalMemory = Math.max(1, totalMemory);
  const widthPercent = (block.size / normalizedTotalMemory) * 100;
  const showFullLabel = widthPercent >= 9;
  const showCompactLabel = widthPercent >= 4.5;
  const process = block.process;
  const isPagedSegment = Boolean(process?.parentProcessId && process?.pageIndex !== undefined);
  const ownerLabel = block.isFree
    ? 'LIBRE'
    : process?.parentProcessId ?? process?.name ?? 'OS';
  const pageLabel = isPagedSegment
    ? `${process?.segmentType ?? 'Seg'} P${(process?.pageIndex ?? 0) + 1}`
    : `${block.size} KB`;
  const identifier = isPagedSegment
    ? `${ownerLabel}-P${(process?.pageIndex ?? 0) + 1}`
    : ownerLabel;
  const label = ownerLabel;
  const compactLabel = block.isFree
    ? 'L'
    : isPagedSegment
      ? `${ownerLabel}-P${(process?.pageIndex ?? 0) + 1}`
      : label.slice(0, 2).toUpperCase();
  const occupiedColor = block.process?.color ?? '#6b7280';
  const tooltipContent = (
    <div className="space-y-1">
      <div className="text-[11px] font-black uppercase tracking-wide">{block.isFree ? 'Bloque libre' : 'Bloque ocupado'}</div>
      <div>ID: {identifier}</div>
      {isPagedSegment && <div>Tipo: {process?.segmentType ?? 'Seg'}</div>}
      {isPagedSegment && <div>Pagina: {(process?.pageIndex ?? 0) + 1}</div>}
      <div>Tamano: {block.size}KB</div>
    </div>
  );
  const previousIsFree = useRef(block.isFree);
  const [releasePulse, setReleasePulse] = useState(false);

  useEffect(() => {
    const wasReleased = !previousIsFree.current && block.isFree;
    previousIsFree.current = block.isFree;

    if (!wasReleased) {
      return;
    }

    setReleasePulse(true);
    const timeoutId = window.setTimeout(() => {
      setReleasePulse(false);
    }, 440);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [block.isFree]);

  return (
    <Tooltip content={tooltipContent} wrapperClassName="contents">
      <motion.div
      layout
      initial={{ opacity: 0, y: 8, scaleY: 0.92 }}
      animate={{
        opacity: 1,
        y: 0,
        scaleY: 1,
        boxShadow: releasePulse
          ? [
              'inset 0 0 0 rgba(34,197,94,0)',
              'inset 0 0 0 4px rgba(34,197,94,0.55)',
              'inset 0 0 0 rgba(34,197,94,0)',
            ]
          : 'inset 0 0 0 rgba(34,197,94,0)',
        filter: releasePulse
          ? ['saturate(1)', 'saturate(1.3)', 'saturate(1)']
          : 'saturate(1)',
      }}
      exit={{ opacity: 0, y: -8, scaleY: 0.92 }}
      transition={{
        duration: 0.24,
        ease: 'easeOut',
        layout: { duration: 0.28 },
        boxShadow: { duration: 0.44, times: [0, 0.35, 1], ease: 'easeOut' },
        filter: { duration: 0.44, times: [0, 0.35, 1], ease: 'easeOut' },
      }}
      className={`
        relative h-full border-y-2 border-l-2 border-black flex flex-col justify-center items-center overflow-hidden transition-all duration-300 ${isLast ? 'border-r-2' : ''}
        ${block.isFree ? 'bg-gray-200/50 pattern-diagonal-lines pattern-gray-200 pattern-size-2 pattern-opacity-100' : 'bg-gray-400'}
      `}
      style={{
        width: `${widthPercent}%`,
        backgroundColor: block.isFree ? undefined : occupiedColor,
      }}
    >
      {/* Info del bloque */}
      <div className="w-full overflow-hidden text-center text-ellipsis whitespace-nowrap px-1 leading-tight">
        {showFullLabel ? (
          <>
            <span className={`block truncate font-bold text-sm ${block.isFree ? 'text-black' : 'text-white'}`}>
              {label}
            </span>
            <span className={`block truncate text-xs font-mono ${block.isFree ? 'text-black' : 'text-white'}`}>
              {pageLabel}
            </span>
            {isPagedSegment && (
              <span className={`block truncate text-[11px] font-mono ${block.isFree ? 'text-black' : 'text-white'}`}>
                {block.size} KB
              </span>
            )}
          </>
        ) : showCompactLabel ? (
          <span className={`text-[10px] font-bold uppercase ${block.isFree ? 'text-black' : 'text-white'}`}>
            {compactLabel}
          </span>
        ) : null}
      </div>
      </motion.div>
    </Tooltip>
  );
}
