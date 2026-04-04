import { buildStepStats } from '../stepStats';
import { buildSegmentsFromProcesses, type SegmentUnit } from '../nonContiguous/segments';
import { type MemoryBlock, type Process, type SimulationConfig, type SimulationStep } from '../types';

type SegmentStrategy = 'First Fit' | 'Best Fit' | 'Worst Fit' | 'Next Fit';
type ProcessRuntime = {
	process: Process;
	totalSegments: number;
	loadedSegments: number;
	startedAt: number | null;
	completed: boolean;
};

function cloneMemoryState(state: MemoryBlock[]): MemoryBlock[] {
	return state.map((block) => ({
		...block,
		process: block.process ? { ...block.process } : null,
	}));
}

function toProcess(segment: SegmentUnit, step: number): Process {
	return {
		...segment.baseProcess,
		id: segment.id,
		name: `${segment.parentProcessName}-${segment.segmentType}`,
		size: segment.size,
		codeSize: segment.segmentType === 'Code' ? segment.size : 0,
		dataSize: segment.segmentType === 'Data' ? segment.size : 0,
		stackSize: segment.segmentType === 'Stack' ? segment.size : 0,
		heapSize: segment.segmentType === 'Heap' ? segment.size : 0,
		arrivalTime: step,
		codeArrivalTime: segment.arrivalTime,
		dataArrivalTime: segment.arrivalTime,
		stackArrivalTime: segment.arrivalTime,
		heapArrivalTime: segment.arrivalTime,
		color: segment.color,
		duration: segment.baseProcess.duration,
		parentProcessId: segment.parentProcessId,
		segmentId: segment.id,
		segmentType: segment.segmentType,
	};
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

function isOnlyOsOccupied(state: MemoryBlock[]): boolean {
	return state.every((block) => block.isFree || (block.id === 'os' && !block.isFree && block.process === null));
}

function selectFreeBlockIndex(
	state: MemoryBlock[],
	segmentSize: number,
	strategy: SegmentStrategy,
	nextFitStartIndex: number,
): number {
	if (strategy === 'Best Fit') {
		let bestIndex = -1;
		let bestSize = Number.MAX_VALUE;
		for (let i = 0; i < state.length; i += 1) {
			const block = state[i];
			if (!block.isFree || block.size < segmentSize) continue;
			if (block.size < bestSize) {
				bestSize = block.size;
				bestIndex = i;
			}
		}
		return bestIndex;
	}

	if (strategy === 'Worst Fit') {
		let worstIndex = -1;
		let worstSize = -1;
		for (let i = 0; i < state.length; i += 1) {
			const block = state[i];
			if (!block.isFree || block.size < segmentSize) continue;
			if (block.size > worstSize) {
				worstSize = block.size;
				worstIndex = i;
			}
		}
		return worstIndex;
	}

	if (strategy === 'Next Fit') {
		if (state.length === 0) {
			return -1;
		}

		for (let offset = 0; offset < state.length; offset += 1) {
			const i = (nextFitStartIndex + offset) % state.length;
			const block = state[i];
			if (block.isFree && block.size >= segmentSize) {
				return i;
			}
		}

		return -1;
	}

	return state.findIndex((block) => block.isFree && block.size >= segmentSize);
}

export function segmentationSimulation(processes: Process[], memoryState: MemoryBlock[], config: SimulationConfig): SimulationStep[] {
	let state = cloneMemoryState(memoryState);
	const processRuntime = new Map<string, ProcessRuntime>();

	for (const process of processes) {
		processRuntime.set(process.id, {
			process: { ...process },
			totalSegments: 0,
			loadedSegments: 0,
			startedAt: null,
			completed: false,
		});
	}

	const pending = buildSegmentsFromProcesses(processes)
		.map((segment) => ({
			...segment,
			arrivalTime: segment.baseProcess.arrivalTime,
		}))
		.sort((a, b) => a.arrivalTime - b.arrivalTime);

	for (const segment of pending) {
		const runtime = processRuntime.get(segment.parentProcessId);
		if (runtime) {
			runtime.totalSegments += 1;
		}
	}

	const steps: SimulationStep[] = [];
	const strategy: SegmentStrategy = config.segmentationStrategy ?? 'First Fit';
	let nextFitStartIndex = 0;
	let step = 0;

	while (true) {
		const releasedProcessNames: string[] = [];
		const loadedSegmentNames: string[] = [];
		const startedProcessNames: string[] = [];

		let didRelease = false;
		for (const runtime of processRuntime.values()) {
			if (runtime.completed || runtime.startedAt === null) {
				continue;
			}

			if (step < runtime.startedAt + runtime.process.duration) {
				continue;
			}

			for (const block of state) {
				if (block.isFree || !block.process) {
					continue;
				}

				if (block.process.parentProcessId === runtime.process.id) {
					block.isFree = true;
					block.process = null;
					didRelease = true;
				}
			}

			runtime.completed = true;
			runtime.startedAt = null;
			releasedProcessNames.push(runtime.process.name);
		}

		if (didRelease) {
			state = mergeAdjacentFreeBlocks(state);
			if (state.length > 0) {
				nextFitStartIndex = nextFitStartIndex % state.length;
			} else {
				nextFitStartIndex = 0;
			}
		}

		for (let index = 0; index < pending.length; ) {
			const segment = pending[index];
			if (segment.arrivalTime > step) {
				index += 1;
				continue;
			}

			const runtime = processRuntime.get(segment.parentProcessId);
			if (!runtime || runtime.completed) {
				pending.splice(index, 1);
				continue;
			}

			const freeBlockIndex = selectFreeBlockIndex(state, segment.size, strategy, nextFitStartIndex);
			if (freeBlockIndex === -1) {
				index += 1;
				continue;
			}

			const targetBlock = state[freeBlockIndex];
			targetBlock.isFree = false;
			targetBlock.process = toProcess(segment, step);
			loadedSegmentNames.push(`${segment.parentProcessName}-${segment.segmentType}`);

			if (targetBlock.size > segment.size) {
				const remainingSize = targetBlock.size - segment.size;
				targetBlock.size = segment.size;

				state.splice(freeBlockIndex + 1, 0, {
					id: `free-seg-${step}-${freeBlockIndex}`,
					start: targetBlock.start + targetBlock.size,
					size: remainingSize,
					process: null,
					isFree: true,
				});
			}

			if (strategy === 'Next Fit' && state.length > 0) {
				nextFitStartIndex = (freeBlockIndex + 1) % state.length;
			}

			runtime.loadedSegments += 1;

			pending.splice(index, 1);
		}

		for (const runtime of processRuntime.values()) {
			if (runtime.completed || runtime.startedAt !== null) {
				continue;
			}

			if (step < runtime.process.arrivalTime) {
				continue;
			}

			if (runtime.loadedSegments === runtime.totalSegments) {
				runtime.startedAt = step;
				startedProcessNames.push(runtime.process.name);
			}
		}

		const waitingParents = Array.from(processRuntime.values())
			.filter((runtime) => !runtime.completed && runtime.startedAt === null && step >= runtime.process.arrivalTime)
			.map((runtime) => ({ ...runtime.process }));

		const descriptionParts: string[] = [];
		if (releasedProcessNames.length > 0) {
			descriptionParts.push(`Liberados: ${releasedProcessNames.join(', ')}.`);
		}
		if (loadedSegmentNames.length > 0) {
			descriptionParts.push(`Cargados (${strategy}): ${loadedSegmentNames.join(', ')}.`);
		}
		if (startedProcessNames.length > 0) {
			descriptionParts.push(`En ejecucion: ${startedProcessNames.join(', ')}.`);
		}
		if (waitingParents.length > 0 && loadedSegmentNames.length === 0) {
			descriptionParts.push(`En espera: ${waitingParents.map((process) => process.name).join(', ')}.`);
		}
		if (descriptionParts.length === 0) {
			descriptionParts.push('Estado: segmentacion en ejecucion.');
		}

		steps.push({
			stepNumber: step,
			memoryState: cloneMemoryState(state),
			processQueue: waitingParents,
			stats: buildStepStats(state, config.totalMemory),
			description: descriptionParts.join(' '),
		});

		const hasFutureArrivals = Array.from(processRuntime.values()).some(
			(runtime) => !runtime.completed && runtime.startedAt === null && runtime.process.arrivalTime > step,
		);
		const hasRunningProcesses = Array.from(processRuntime.values()).some(
			(runtime) => !runtime.completed && runtime.startedAt !== null,
		);
		const hasArrivedPendingSegments = pending.some((segment) => segment.arrivalTime <= step);
		const hasAnyFitNow = pending
			.filter((segment) => segment.arrivalTime <= step)
			.some((segment) => selectFreeBlockIndex(state, segment.size, strategy, nextFitStartIndex) !== -1);

		if (!hasRunningProcesses && !hasFutureArrivals && hasArrivedPendingSegments && !hasAnyFitNow) {
			steps[steps.length - 1].description = 'Bloqueo: quedan segmentos en cola y no hay huecos contiguos para ubicarlos.';
			break;
		}

		if (!hasRunningProcesses && !hasFutureArrivals && isOnlyOsOccupied(state)) {
			break;
		}

		if (pending.length === 0 && !hasRunningProcesses && !hasFutureArrivals) {
			break;
		}

		step += 1;
	}

	return steps;
}

