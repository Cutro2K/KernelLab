import { create } from 'zustand';
import {type Process, type StepStats, type SimulationConfig, type MemoryBlock, type AlgorithmOption, type AllocationMode} from '../algorithms/types';

interface SimulationStore {
    algorithm: AlgorithmOption | null;
    processes: Process[] | null;
    addProcess: (process: Process) => void;
    removeProcess: (id: string) => void;
    memoryState: MemoryBlock[] | null;
    setMemoryState: (state: MemoryBlock[]) => void;
    configParams: SimulationConfig | null;
    setConfigParams: (params: SimulationConfig) => void;
    statistics: StepStats | null;
    setStatistics: (stats: StepStats) => void;
    currentStep: number | null;
    setCurrentStep: (step: number) => void;
}

interface ComparisonStore {
    allocationStrategy: AllocationMode | null;
    processes: Process[] | null;
    addProcess: (process: Process) => void;
    removeProcess: (id: string) => void;
    memoryState1: MemoryBlock[] | null;
    memoryState2: MemoryBlock[] | null;
    setMemoryState1: (state: MemoryBlock[]) => void;
    setMemoryState2: (state: MemoryBlock[]) => void;
    configParams1: SimulationConfig | null;
    configParams2: SimulationConfig | null;
    setConfigParams1: (params: SimulationConfig) => void;
    setConfigParams2: (params: SimulationConfig) => void;
    statistics1: StepStats | null;
    statistics2: StepStats | null;
    setStatistics1: (stats: StepStats) => void;
    setStatistics2: (stats: StepStats) => void;
    currentStep: number | null;
    setCurrentStep: (step: number) => void;
}

export const useSimulationStore = create<SimulationStore>()((set) => ({
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
    allocationStrategy: null,
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
    setAllocationStrategy: (strategy : AllocationMode) => set({ allocationStrategy: strategy }),
}));