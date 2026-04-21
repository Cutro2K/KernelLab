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
  codeArrivalTime: number;
  stackArrivalTime: number;
  dataArrivalTime: number;
  heapArrivalTime: number;
  color: string;
  arrivalTime: number;
  duration: number;
  parentProcessId?: string;
  segmentId?: string;
  segmentType?: SegmentType;
  pageIndex?: number;
}

export type SegmentType = 'Stack' | 'Heap' | 'Data' | 'Code';

export interface Segment extends Process {
    parentId: number;
    segmentNumber: number;
} 


export interface MemoryBlock {
  id: string;
  start: number;
  size: number; // En Contiguo/Buddy/Segmentado varía. En Paginado siempre es igual al pageSize.
  usedSize?: number; // Bytes realmente usados dentro del bloque (permite modelar frag. interna del OS).
  process: Process | null;
  isFree: boolean;
  pageMeta?: {
    loadedAt: number;
    lastUsed: number;
    referenceBit: 0 | 1;
    modifiedBit: 0 | 1;
  };
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

  export interface PagingReferenceEvent {
    step: number;
    processId: string;
    processName: string;
    segmentType: SegmentType;
    pageId: string;
    pageNumber: number;
    operation: 'read' | 'write';
    outcome: 'hit' | 'fault' | 'blocked';
  }

export interface SimulationStep {
    stepNumber: number;
    action?: string;
    description?: string;
    memoryState: MemoryBlock[];
    processQueue: Process[];
    highlights?: string[];
    stats: StepStats;
    referenceEvents?: PagingReferenceEvent[];
}

export interface SimulationConfig {
    algorithm: AlgorithmOption;
    totalMemory: number;
    osSize?: number;
    processes: Process[];
    frames?: number; // para paginación
    pageSize?: number;
    segmentationStrategy?: 'First Fit' | 'Best Fit' | 'Worst Fit' | 'Next Fit';
    referenceString?: number[]; // para reemplazo de páginas
  referenceSeed?: number;
  referenceLocality?: number;
  maxReferencesPerCycle?: number;
  nruResetInterval?: number;
  enableWriteReferences?: boolean;
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