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

export const useStore = create<SimulationStore>()((set) => ({
    algorithm: null,
    currentStep: null,
    memoryState: null,
    configParams: null,
    statistics: null,
    processes: [],

    setMemoryState: (state: MemoryBlock[]) => set({ memoryState: state }),
    setAlgorithm: (algo: any) => set({ algorithm: algo }), // Reemplaza 'any' por tu tipo
    setCurrentStep: (step: number) => set({ currentStep: step }),
    setConfigParams: (params: SimulationConfig) => set({ configParams: params }),
    setStatistics: (stats: StepStats) => set({ statistics: stats }),
    addProcess: (process) => set((state) => ({
        processes: state.processes ? [...state.processes, process] : [process],
    })),
    removeProcess: (id: string | number) => set((state) => ({
        processes: state.processes 
            ? state.processes.filter((p) => p.id !== id)
            : null,
    })),
}));

export const useComparisonStore = create<ComparisonStore>()((set) => ({
    processes: [],
    algorithm1: null,
    algorithm2: null,
    memoryState1: null,
    memoryState2: null,
    configParams1: null,
    configParams2: null,
    statistics1: null,
    statistics2: null,
    currentStep: null,
    
    addProcess: (process) => set((state) => ({
        processes: state.processes ? [...state.processes, process] : [process],
    })),
    
    // Aquí está la parte que faltaba completada
    removeProcess: (id: string | number) => set((state) => ({
        processes: state.processes 
            ? state.processes.filter((p) => p.id !== id)
            : null,
    })),
    setMemoryState1: (state) => set({ memoryState1: state }),
    setMemoryState2: (state) => set({ memoryState2: state }),
    setConfigParams1: (params) => set({ configParams1: params }),
    setConfigParams2: (params) => set({ configParams2: params }),
    setStatistics1: (stats) => set({ statistics1: stats }),
    setStatistics2: (stats) => set({ statistics2: stats }),
    setCurrentStep: (step) => set({ currentStep: step }),
}));