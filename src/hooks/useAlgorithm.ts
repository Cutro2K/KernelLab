import { bestFitCon } from '../algorithms/allocation/bestFit';
import { firstFitCon } from '../algorithms/allocation/firstFit';
import { worstFitCon } from '../algorithms/allocation/worstFit';
import { nextFitCon } from '../algorithms/allocation/nextFit';
import { pagingSimulation } from '../algorithms/paging/paging';
import { segmentationSimulation } from '../algorithms/segmentation/segmentation';
import { buddySystem } from '../algorithms/allocation/buddySystem';
import { buildStepStats } from '../algorithms/stepStats';
import {type MemoryBlock, type StepStats, type AlgorithmOption, type Process, type SimulationStep, type SimulationConfig} from '../algorithms/types';

function createInitialMemoryState(totalMemory: number, osSize: number): MemoryBlock[] {
  const normalizedTotal = Math.max(1, totalMemory);
  const normalizedOs = Math.min(Math.max(0, osSize), normalizedTotal);
  const freeSize = normalizedTotal - normalizedOs;

  const initialState: MemoryBlock[] = [];

  if (normalizedOs > 0) {
    initialState.push({
      id: 'os',
      start: 0,
      size: normalizedOs,
      usedSize: normalizedOs,
      process: null,
      isFree: false,
    });
  }

  if (freeSize > 0) {
    initialState.push({
      id: 'free-0',
      start: normalizedOs,
      size: freeSize,
      process: null,
      isFree: true,
    });
  }

  return initialState;
}

export function mergeAdjacentFreeBlocks(state: MemoryBlock[]): MemoryBlock[] {
	if (state.length === 0) return state;

	const merged: MemoryBlock[] = [];
	for (const block of state) {
		const last = merged[merged.length - 1];
		if (last && last.isFree && block.isFree) {
			last.size += block.size;
			continue;
		}
		merged.push({ ...block, process: block.process ? { ...block.process } : null });
	}

	return merged;
}

export function cloneMemoryState(state: MemoryBlock[]): MemoryBlock[] {
  return state.map((block) => ({
    ...block,
    process: block.process ? { ...block.process } : null,
    pageMeta: block.pageMeta ? { ...block.pageMeta } : undefined,
  }));
}

export function computeStats(memoryState: MemoryBlock[], totalMemory: number): StepStats {
  return buildStepStats(memoryState, totalMemory);
}

export function runAllocationSimulation(algorithm: AlgorithmOption, processes: Process[], config: SimulationConfig): SimulationStep[] {
  const initialState = createInitialMemoryState(config.totalMemory, config.osSize ?? 0);
  const inputProcesses = processes.map((process) => ({ ...process }));

  let steps: SimulationStep[] = [];
  if (algorithm === 'First Fit') {
    steps = firstFitCon(inputProcesses, cloneMemoryState(initialState), config);
  } else if (algorithm === 'Best Fit') {
    steps = bestFitCon(inputProcesses, cloneMemoryState(initialState), config);
  } else if (algorithm === 'Worst Fit') {
    steps = worstFitCon(inputProcesses, cloneMemoryState(initialState), config);
  } else if (algorithm === 'Next Fit') {
    steps = nextFitCon(inputProcesses, cloneMemoryState(initialState), config);
  }else if (algorithm === 'Buddy System') {
    steps = buddySystem(inputProcesses, cloneMemoryState(initialState), config);
  } else if (
    algorithm === 'Paginacion Simple'
    || algorithm === 'OPT'
    || algorithm === 'FIFO'
    || algorithm === 'LRU'
    || algorithm === 'NRU'
    || algorithm === 'Segunda Oportunidad'
    || algorithm === 'Clock'
  ) {
    steps = pagingSimulation(algorithm, inputProcesses, cloneMemoryState(initialState), config);
  } else if (algorithm === 'Segmentacion') {
    steps = segmentationSimulation(inputProcesses, cloneMemoryState(initialState), config);
  }

  if (steps.length > 0) {
    return steps;
  }
  
  return [{ stepNumber: 0, memoryState: cloneMemoryState(initialState), processQueue: [], stats: computeStats(cloneMemoryState(initialState), config.totalMemory) }];
}