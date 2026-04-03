import { buildStepStats } from '../stepStats';
import { buildSegmentsFromProcesses, type SegmentUnit } from '../nonContiguous/segments';
import { type MemoryBlock, type Process, type SimulationConfig, type SimulationStep } from '../types';

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

export function segmentationSimulation(processes: Process[], memoryState: MemoryBlock[], config: SimulationConfig): SimulationStep[] {
	let state = cloneMemoryState(memoryState);
	const pending = buildSegmentsFromProcesses(processes).sort((a, b) => a.arrivalTime - b.arrivalTime);
	const steps: SimulationStep[] = [];
	let step = 0;

	while (pending.length > 0) {
		for (let index = 0; index < pending.length; ) {
			const segment = pending[index];
			if (segment.arrivalTime > step) {
				index += 1;
				continue;
			}

			const freeBlockIndex = state.findIndex((block) => block.isFree && block.size >= segment.size);
			if (freeBlockIndex === -1) {
				index += 1;
				continue;
			}

			const targetBlock = state[freeBlockIndex];
			targetBlock.isFree = false;
			targetBlock.process = toProcess(segment, step);

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

			pending.splice(index, 1);
		}

		const waitingParents = Array.from(
			new Map(
				pending
					.filter((segment) => segment.arrivalTime <= step)
					.map((segment) => [segment.parentProcessId, segment.baseProcess]),
			).values(),
		).map((process) => ({ ...process }));

		steps.push({
			stepNumber: step,
			memoryState: cloneMemoryState(state),
			processQueue: waitingParents,
			stats: buildStepStats(state, config.totalMemory),
		});

		const hasFutureArrivals = pending.some((segment) => segment.arrivalTime > step);
		const hasAnyFitNow = pending
			.filter((segment) => segment.arrivalTime <= step)
			.some((segment) => state.some((block) => block.isFree && block.size >= segment.size));

		if (!hasFutureArrivals && !hasAnyFitNow && pending.length > 0) {
			break;
		}

		step += 1;
	}

	return steps;
}

