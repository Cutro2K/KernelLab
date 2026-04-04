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

  // --- CÁLCULO DE FRAGMENTACIÓN INTERNA ---
  // Restamos el tamaño del proceso al tamaño del bloque.
  const internalFragmentation = (!block.isFree && block.process)
    ? Math.max(0, block.size - block.process.size)
    : 0;

  const tooltipContent = (
    <div className="space-y-1">
      <div className="text-[11px] font-black uppercase tracking-wide">{block.isFree ? 'Bloque libre' : 'Bloque ocupado'}</div>
      <div>ID: {identifier}</div>
      {isPagedSegment && <div>Tipo: {process?.segmentType ?? 'Seg'}</div>}
      {isPagedSegment && <div>Pagina: {(process?.pageIndex ?? 0) + 1}</div>}
      <div>Tamano: {block.size}KB</div>
      
      {/* NUEVO: Mostramos la fragmentación interna solo si está ocupado */}
      {!block.isFree && (
        <div className={internalFragmentation > 0 ? "text-yellow-400 font-bold" : ""}>
          Frag. Interna: {internalFragmentation}KB
        </div>
      )}
    </div>
  );

  const previousIsFree = useRef(block.isFree);
  const [allocationFade, setAllocationFade] = useState(false);

  useEffect(() => {
    const wasAllocated = previousIsFree.current && !block.isFree;
    previousIsFree.current = block.isFree;

    if (!wasAllocated || !isPagedSegment) {
      return;
    }

    setAllocationFade(true);
    const timeoutId = window.setTimeout(() => {
      setAllocationFade(false);
    }, 320);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [block.isFree, isPagedSegment]);

  return (
    <Tooltip content={tooltipContent} wrapperClassName="contents">
      <motion.div
      layout
      initial={{ opacity: 0, y: 8, scaleY: 0.92 }}
      animate={{
        opacity: allocationFade ? [0.2, 1] : 1,
        y: 0,
        scaleY: 1,
      }}
      exit={{ opacity: 0, y: -8, scaleY: 0.92 }}
      transition={{
        duration: 0.24,
        ease: 'easeOut',
        layout: { duration: 0.28 },
        opacity: { duration: allocationFade ? 0.32 : 0.24, ease: 'easeOut' },
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