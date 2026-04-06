import { type MemoryBlock, type StepStats } from './types';

export function buildStepStats(memoryState: MemoryBlock[], totalMemory: number): StepStats {
  const used = memoryState.reduce((sum, block) => sum + (block.isFree ? 0 : block.size), 0);
  const freeBlocks = memoryState.filter((block) => block.isFree);
  const totalFree = freeBlocks.reduce((sum, block) => sum + block.size, 0);
  const largestFree = freeBlocks.reduce((max, block) => Math.max(max, block.size), 0);
  const fragmentedFree = totalFree > 0 ? totalFree - largestFree : 0;
  const isPagingLayout = memoryState.some((block) => block.id.startsWith('frame-'));
  const effectiveExternalFragmentation = isPagingLayout ? 0 : fragmentedFree;
  const internalWaste = memoryState.reduce((sum, block) => {
    if (block.isFree) {
      return sum;
    }

    const explicitUsedSize = block.usedSize;
    const processUsedSize = block.process?.size;
    const usedInBlock = Math.max(
      0,
      Math.min(
        block.size,
        explicitUsedSize ?? processUsedSize ?? block.size,
      ),
    );
    return sum + (block.size - usedInBlock);
  }, 0);
  const normalizedTotalMemory = Math.max(1, totalMemory);

  return {
    totalFragmentation: effectiveExternalFragmentation,
    externalFragmentation: Math.round((effectiveExternalFragmentation / normalizedTotalMemory) * 100),
    internalFragmentation: Math.round((internalWaste / normalizedTotalMemory) * 100),
    pageFaults: 0,
    pageHits: 0,
    memoryUsage: Math.round((used / normalizedTotalMemory) * 100),
  };
}
