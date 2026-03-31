import { create } from 'zustand';

interface MemoryBlock {
    id: string;
    start: number; // dirección inicio
    size: number; // tamaño en KB
    process: Process | null; // null = libre
    isFree: boolean;
}

interface Process {
    id: string;
    name: string;
    size: number;
    color: string;
    arrivalTime: number;
    duration: number;
}

interface SimulationStep {
    stepNumber: number;
    action: string; // "ALLOCATE" | "DEALLOCATE" | "PAGE_FAULT" | ...
    description: string; // texto legible para el usuario
    memoryState: MemoryBlock[];
    processQueue: Process[];
    highlights: string[]; // IDs de bloques a resaltar
    stats: StepStats;
}

interface StepStats {
    totalFragmentation: number;
    externalFragmentation: number;
    internalFragmentation: number;
    pageFaults: number;
    pageHits: number;
    memoryUsage: number; // porcentaje
}

interface SimulationConfig {
    algorithm: AlgorithmType;
    totalMemory: number;
    processes: Process[];
    frames?: number; // para paginación
    pageSize?: number;
    referenceString?: number[]; // para reemplazo de páginas
}

interface SimulationStore {
    algorithm: AlgorithmType | null;
    memoryState: MemoryBlock[] | null;
    currentStep: SimulationStep | null;
    configParams: SimulationConfig | null;
    statistics: StepStats | null;
    setMemState: (state : MemoryBlock[]) => void;
    setAlgorithm: (algo: AlgorithmType) => void;
    setStep: (step: SimulationStep) => void;
    setParams: (params : SimulationConfig) => void;
    setStats: (stats : StepStats) => void;
}

type AlgorithmType =
    | 'first-fit' | 'best-fit' | 'worst-fit' | 'next-fit'
    | 'fifo' | 'lru' | 'optimal' | 'clock'
    | 'paging' | 'segmentation' | 'buddy-system';

export const useStore = create<SimulationStore>((set) => ({
    algorithm : null,
    currentStep : null,
    memoryState : null,
    configParams : null,
    statistics : null,

    setMemState: (state : MemoryBlock[]) => set({memoryState : state}),
    setAlgorithm: (algo) => set({ algorithm: algo}),
    setStep: (step : SimulationStep) => set({currentStep : step}),
    setParams: (params : SimulationConfig) => set({configParams : params}),
    setStats: (stats : StepStats) => set({statistics : stats}),
}));