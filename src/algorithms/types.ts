import React from 'react';

export type AlgorithmType =
  | 'first-fit'
  | 'paging' | 'segmentation' | 'buddy-system' | 'best-fit' | 'worst-fit' | 'next-fit'
  | 'fifo' | 'lru' | 'optimal' | 'clock';

type AllocationStrategy =
| 'contiguous' // proceso → 1 bloque
| 'paged' // proceso → N páginas (tamaño fijo)
| 'segmented' // proceso → N segmentos (tamaño variable)
| 'buddy'; // proceso → 1 bloque (potencia de 2)


export interface Process {
  id: string;
  name: string;
  size: number;
  color: string;
  arrivalTime: number;
  duration: number;
}

export interface MemoryBlock {
  id: string;
  start: number;
  size: number; // En Contiguo/Buddy/Segmentado varía. En Paginado siempre es igual al pageSize.
  process: Process | null;
  isFree: boolean;
}
interface AlgorithmMeta {
    id: AlgorithmType;
    name: string;
    category: 'allocation' | 'replacement' | 'advanced';
    allocationStrategy: AllocationStrategy;
    requiresPageSize: boolean; // paginación necesita pageSize
    requiresSegments: boolean; // segmentación necesita tabla de segment
    splitsProcess: boolean; // ← LA CLAVE
}

// Registro central
export const ALGORITHM_REGISTRY: Partial<Record<AlgorithmType, AlgorithmMeta>> = {
    'first-fit': {
        id: 'first-fit',
        name: 'First Fit', 
        category: 'allocation',
        allocationStrategy: 'contiguous',
        requiresPageSize: false,
        requiresSegments: false,
        splitsProcess: false,
    },
    'buddy-system': {
        id: 'buddy-system',
        name: 'Buddy System',
        category: 'advanced',
        allocationStrategy: 'buddy',
        requiresPageSize: false,
        requiresSegments: false,
        splitsProcess: false, // ← proceso = 1 bloque (aunque la memo
    },
    'paging': {
        id: 'paging',
        name: 'Paginación',
        category: 'advanced',
        allocationStrategy: 'paged',
        requiresPageSize: true,
        requiresSegments: false,
        splitsProcess: true, // ← proceso = N páginas
    },
    'segmentation': {
        id: 'segmentation',
        name: 'Segmentación',
        category: 'advanced',
        allocationStrategy: 'segmented',
        requiresPageSize: false,
        requiresSegments: true,
        splitsProcess: true, // ← proceso = N segmentos
    },
} as Record<AlgorithmType, AlgorithmMeta>;;