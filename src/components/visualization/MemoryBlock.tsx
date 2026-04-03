import {type MemoryBlock as MemoryBlockType } from '../../algorithms/types';
import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

interface MemoryBlockProps {
  block: MemoryBlockType;
  totalMemory: number;
}

export function MemoryBlock({ block, totalMemory }: MemoryBlockProps) {
  const normalizedTotalMemory = Math.max(1, totalMemory);
  const widthPercent = (block.size / normalizedTotalMemory) * 100;
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
        relative h-full border-2 border-black flex flex-col justify-center items-center overflow-hidden transition-all duration-300
        ${block.isFree ? 'bg-gray-200/50 pattern-diagonal-lines pattern-gray-200 pattern-size-2 pattern-opacity-100' : 'bg-gray-400'}
      `}
      style={{ width: `${widthPercent}%` }}
    >
      {/* Info del bloque */}
      <div className="text-center">
        <span className="font-bold text-black text-sm">
          {block.isFree ? 'LIBRE' : block.process?.name}
        </span>
        <span className="block text-xs text-black font-mono">
          {block.size} KB
        </span>
      </div>
    </motion.div>
  );
}