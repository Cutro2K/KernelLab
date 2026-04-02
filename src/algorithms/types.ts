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
  color: string;
  arrivalTime: number;
  duration: number;
}

export interface QueuedProcess {
  id: string;
  name: string;
  size: number;
  status: 'ejecucion' | 'espera' | 'finalizado';
  progress?: number;     
  arrivalTime?: number;  
}

export interface MemoryBlock {
  id: string;
  start: number;
  size: number; // En Contiguo/Buddy/Segmentado varía. En Paginado siempre es igual al pageSize.
  process: Process | null;
  isFree: boolean;
}

export interface AlgorithmMeta {
    id: AlgorithmOption;
    name: string;
    category: 'allocation' | 'replacement' | 'advanced';
    allocationStrategy: AllocationMode;
    requiresPageSize: boolean; // paginación necesita pageSize
    requiresSegments: boolean; // segmentación necesita tabla de segment
    splitsProcess: boolean; // ← LA CLAVE
}

// STORE INTERFACES

export interface StepStats {
    totalFragmentation: number;
    externalFragmentation: number;
    internalFragmentation: number;
    pageFaults: number;
    pageHits: number;
    memoryUsage: number; // porcentaje
}

export interface SimulationStep {
    stepNumber: number;
    action: string; // "ALLOCATE" | "DEALLOCATE" | "PAGE_FAULT" | ...
    description: string; // texto legible para el usuario
    memoryState: MemoryBlock[];
    processQueue: Process[];
    highlights: string[]; // IDs de bloques a resaltar
    stats: StepStats;
}

export interface SimulationConfig {
    algorithm: AlgorithmOption;
    totalMemory: number;
    processes: Process[];
    frames?: number; // para paginación
    pageSize?: number;
    referenceString?: number[]; // para reemplazo de páginas
}

export interface SimulationStore {
    algorithm: AlgorithmOption | null;
    memoryState: MemoryBlock[] | null;
    currentStep: SimulationStep | null;
    configParams: SimulationConfig | null;
    statistics: StepStats | null;
    setMemState: (state : MemoryBlock[]) => void;
    setAlgorithm: (algo: AlgorithmOption) => void;
    setStep: (step: SimulationStep) => void;
    setParams: (params : SimulationConfig) => void;
    setStats: (stats : StepStats) => void;
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