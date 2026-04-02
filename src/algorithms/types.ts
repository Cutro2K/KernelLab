import React from 'react';

// TYPES

export type AlgorithmOption =
  | 'First Fit'
  | 'Best Fit'
  | 'Worst Fit'
  | 'Next Fit'
  | 'Buddy System'
  | 'Paginacion Simple'
  | 'OPT'
  | 'FIFO'
  | 'LRU'
  | 'NRU'
  | 'Segunda Oportunidad'
  | 'Clock'
  | 'Segmentacion';

export type AllocationMode = 'Contigua' | 'No contigua';

// VARIABLES

export const ALLOCATIONS : AllocationMode[] = ['Contigua', 'No contigua'];
export const NON_CONTIGUOUS_ALGORITHMS: AlgorithmOption[] = ['Paginacion Simple', 'Segmentacion'];
export const CONTIGUOUS_ALGORITHMS: AlgorithmOption[] = ['First Fit', 'Next Fit', 'Best Fit', 'Worst Fit', 'Buddy System'];
export const PAGE_REPLACEMENT_ALGORITHMS: AlgorithmOption[] = ['OPT', 'FIFO', 'LRU', 'NRU', 'Segunda Oportunidad', 'Clock'];

// INTERFACES
export interface Process {
  id: string;
  name: string;
  size: number;
  codeSize: number;
  stackSize: number;
  dataSize: number;
  heapSize: number;
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
    id: AlgorithmOption;
    name: string;
    category: 'allocation' | 'replacement' | 'advanced';
    allocationStrategy: AllocationMode;
    requiresPageSize: boolean; // paginación necesita pageSize
    requiresSegments: boolean; // segmentación necesita tabla de segment
    splitsProcess: boolean; // ← LA CLAVE
}

// Registro central
export const ALGORITHM_REGISTRY: Partial<Record<AlgorithmOption, AlgorithmMeta>> = {
    'First Fit': {
        id: 'First Fit',
        name: 'First Fit', 
        category: 'allocation',
        allocationStrategy: 'Contigua',
        requiresPageSize: false,
        requiresSegments: false,
        splitsProcess: false,
    },
    'Buddy System': {
        id: 'Buddy System',
        name: 'Buddy System',
        category: 'advanced',
        allocationStrategy: 'Contigua',
        requiresPageSize: false,
        requiresSegments: false,
        splitsProcess: false, // ← proceso = 1 bloque (aunque la memo
    },
    'Paginacion Simple': {
        id: 'Paginacion Simple',
        name: 'Paginación',
        category: 'advanced',
        allocationStrategy: 'No contigua',
        requiresPageSize: true,
        requiresSegments: false,
        splitsProcess: true, // ← proceso = N páginas
    },
    'Segmentacion': {
        id: 'Segmentacion',
        name: 'Segmentación',
        category: 'advanced',
        allocationStrategy: 'Contigua',
        requiresPageSize: false,
        requiresSegments: true,
        splitsProcess: true, // ← proceso = N segmentos
    },
} as Record<AlgorithmOption, AlgorithmMeta>;;