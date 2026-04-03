import { type MemoryBlock, type StepStats } from './types';

export function buildStepStats(memoryState: MemoryBlock[], totalMemory: number): StepStats {
  const used = memoryState.reduce((sum, block) => sum + (block.isFree ? 0 : block.size), 0);
  const freeBlocks = memoryState.filter((block) => block.isFree);
  const totalFree = freeBlocks.reduce((sum, block) => sum + block.size, 0);
  const largestFree = freeBlocks.reduce((max, block) => Math.max(max, block.size), 0);
  const fragmentedFree = totalFree > 0 ? totalFree - largestFree : 0;
  const normalizedTotalMemory = Math.max(1, totalMemory);

  return {
    totalFragmentation: fragmentedFree,
    externalFragmentation: Math.round((fragmentedFree / normalizedTotalMemory) * 100),
    internalFragmentation: 0,
    pageFaults: 0,
    pageHits: 0,
    memoryUsage: Math.round((used / normalizedTotalMemory) * 100),
  };
}
