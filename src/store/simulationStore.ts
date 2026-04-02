import { create } from 'zustand';
import {type Process, type SimulationStep, type StepStats, type SimulationConfig, type SimulationStore, type MemoryBlock, type AlgorithmOption} from '../algorithms/types';

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