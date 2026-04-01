import {type MemoryBlock as MemoryBlockType } from '../../algorithms/types';

interface MemoryBlockProps {
  block: MemoryBlockType;
  totalMemory: number;
}

export function MemoryBlock({ block }: MemoryBlockProps) {
  // Calculamos qué porcentaje de la memoria total ocupa este bloque

  return (
    <div 
      className={`
        relative w-full h-full border-2 border-black flex flex-col justify-center items-center overflow-hidden transition-all duration-300
        ${block.isFree ? 'bg-gray-200/50 pattern-diagonal-lines pattern-gray-200 pattern-size-2 pattern-opacity-100' : 'bg-gray-400'}
      `}
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
    </div>
  );
}