import { type Process, type SimulationStep, type SimulationConfig, type MemoryBlock } from '../types';

function buildStepStats(memoryState: MemoryBlock[], totalMemory: number) {
	const used = memoryState.reduce((sum, block) => sum + (block.isFree ? 0 : block.size), 0);
	const freeBlocks = memoryState.filter((block) => block.isFree);
	const totalFree = freeBlocks.reduce((sum, block) => sum + block.size, 0);
	const largestFree = freeBlocks.reduce((max, block) => Math.max(max, block.size), 0);

	return {
		totalFragmentation: totalFree > 0 ? totalFree - largestFree : 0,
		externalFragmentation: totalFree > 0 ? totalFree - largestFree : 0,
		internalFragmentation: 0,
		pageFaults: 0,
		pageHits: 0,
		memoryUsage: Math.round((used / Math.max(1, totalMemory)) * 100),
	};
}

function cloneMemoryState(state: MemoryBlock[]): MemoryBlock[] {
	return state.map((block) => ({
		...block,
		process: block.process ? { ...block.process } : null,
	}));
}

function mergeAdjacentFreeBlocks(state: MemoryBlock[]): MemoryBlock[] {
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

function hasRunningProcesses(state: MemoryBlock[]): boolean {
	return state.some((block) => !block.isFree && block.process !== null);
}

export function nextFitCon(processes: Process[], memoryState: MemoryBlock[], _params: SimulationConfig): SimulationStep[] {
	const pending = [...processes].sort((a, b) => a.arrivalTime - b.arrivalTime);
	let state = cloneMemoryState(memoryState);
	const steps: SimulationStep[] = [];
	let step = 0;
	let searchStartIndex = 0;

	while (pending.length > 0 || hasRunningProcesses(state)) {
		let didRelease = false;

		for (const block of state) {
			if (!block.isFree && block.process && step >= block.process.arrivalTime + block.process.duration) {
				block.isFree = true;
				block.process = null;
				didRelease = true;
			}
		}

		if (didRelease) {
			state = mergeAdjacentFreeBlocks(state);
			if (state.length > 0) {
				searchStartIndex = searchStartIndex % state.length;
			} else {
				searchStartIndex = 0;
			}
		}

		const arrived = pending.filter((process) => process.arrivalTime <= step);
		if (arrived.length > 0) {
			let selectedProcess: Process | null = null;
			let selectedPendingIndex = -1;
			let selectedBlockIndex = -1;

			for (let pIndex = 0; pIndex < pending.length; pIndex += 1) {
				const process = pending[pIndex];
				if (process.arrivalTime > step) continue;

				if (state.length === 0) break;

				for (let offset = 0; offset < state.length; offset += 1) {
					const bIndex = (searchStartIndex + offset) % state.length;
					const block = state[bIndex];
					if (block.isFree && block.size >= process.size) {
						selectedProcess = process;
						selectedPendingIndex = pIndex;
						selectedBlockIndex = bIndex;
						break;
					}
				}

				if (selectedBlockIndex !== -1) {
					break;
				}
			}

			if (selectedProcess && selectedBlockIndex !== -1) {
				const targetBlock = state[selectedBlockIndex];
				const allocatedProcess: Process = {
					...selectedProcess,
					arrivalTime: step,
				};

				targetBlock.isFree = false;
				targetBlock.process = allocatedProcess;

				if (targetBlock.size > selectedProcess.size) {
					const remainingSize = targetBlock.size - selectedProcess.size;
					targetBlock.size = selectedProcess.size;

					const newBlock: MemoryBlock = {
						id: `free-${step}-${selectedBlockIndex}`,
						start: targetBlock.start + targetBlock.size,
						size: remainingSize,
						process: null,
						isFree: true,
					};

					state.splice(selectedBlockIndex + 1, 0, newBlock);
					searchStartIndex = (selectedBlockIndex + 1) % state.length;
				} else {
					searchStartIndex = (selectedBlockIndex + 1) % state.length;
				}

				pending.splice(selectedPendingIndex, 1);
			}
		}

		const waitingQueue = pending
			.filter((process) => process.arrivalTime <= step)
			.map((process) => ({ ...process }));

		steps.push({
			stepNumber: step,
			memoryState: cloneMemoryState(state),
			processQueue: waitingQueue,
			stats: buildStepStats(state, _params.totalMemory),
		});

		const hasFutureArrivals = pending.some((process) => process.arrivalTime > step);
		const hasAnyFitNow = pending
			.filter((process) => process.arrivalTime <= step)
			.some((process) => state.some((block) => block.isFree && block.size >= process.size));

		if (!hasRunningProcesses(state) && !hasFutureArrivals && !hasAnyFitNow && pending.length > 0) {
			break;
		}

		step += 1;
	}

	return steps;
}
