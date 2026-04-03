import { buildStepStats } from '../stepStats';
import { buildSegmentsFromProcesses, type SegmentUnit } from '../nonContiguous/segments';
import { selectFifoVictim } from '../replacement/fifo';
import { selectLruVictim } from '../replacement/lru';
import { selectOptimalVictim } from '../replacement/optimal';
import { selectClockVictim, selectNruVictim, selectSecondChanceVictim } from '../replacement/clock';
import { type FrameMeta, type ReplacementCandidate } from '../replacement/types';
import { type AlgorithmOption, type MemoryBlock, type Process, type SimulationConfig, type SimulationStep } from '../types';

type ReplacementAlgo = Extract<AlgorithmOption, 'Paginacion Simple' | 'OPT' | 'FIFO' | 'LRU' | 'NRU' | 'Segunda Oportunidad' | 'Clock'>;

type SegmentPageRequest = {
	id: string;
	parentProcessId: string;
	parentProcessName: string;
	segmentId: string;
	segmentType: SegmentUnit['segmentType'];
	color: string;
	arrivalTime: number;
	pageIndex: number;
	totalPages: number;
	usedBytes: number;
	baseProcess: Process;
};

function cloneMemoryState(state: MemoryBlock[]): MemoryBlock[] {
	return state.map((block) => ({
		...block,
		process: block.process ? { ...block.process } : null,
	}));
}

function toPageProcess(page: SegmentPageRequest, step: number, pageSize: number): Process {
	const pageUsedBytes = Math.max(0, Math.min(pageSize, page.usedBytes));
	return {
		...page.baseProcess,
		id: page.id,
		name: `${page.parentProcessName}-${page.segmentType} P${page.pageIndex + 1}`,
		size: pageUsedBytes,
		codeSize: page.segmentType === 'Code' ? pageUsedBytes : 0,
		dataSize: page.segmentType === 'Data' ? pageUsedBytes : 0,
		stackSize: page.segmentType === 'Stack' ? pageUsedBytes : 0,
		heapSize: page.segmentType === 'Heap' ? pageUsedBytes : 0,
		codeArrivalTime: page.arrivalTime,
		stackArrivalTime: page.arrivalTime,
		dataArrivalTime: page.arrivalTime,
		heapArrivalTime: page.arrivalTime,
		arrivalTime: step,
		duration: page.baseProcess.duration,
		color: page.color,
		parentProcessId: page.parentProcessId,
		segmentId: page.segmentId,
		segmentType: page.segmentType,
		pageIndex: page.pageIndex,
	};
}

function toSegmentPages(segments: SegmentUnit[], pageSize: number): SegmentPageRequest[] {
	return segments.flatMap((segment) => {
		const pageCount = Math.max(1, Math.ceil(segment.size / pageSize));
		return Array.from({ length: pageCount }, (_, pageIndex) => ({
			id: `${segment.id}-pg-${pageIndex}`,
			parentProcessId: segment.parentProcessId,
			parentProcessName: segment.parentProcessName,
			segmentId: segment.id,
			segmentType: segment.segmentType,
			color: segment.color,
			arrivalTime: segment.arrivalTime,
			pageIndex,
			totalPages: pageCount,
			usedBytes: Math.min(pageSize, Math.max(0, segment.size - pageIndex * pageSize)),
			baseProcess: segment.baseProcess,
		}));
	});
}

function createFrameMemoryState(initialState: MemoryBlock[], pageSize: number): MemoryBlock[] {
	const osBlock = initialState.find((block) => !block.isFree && block.process === null);
	const freeSize = initialState.filter((block) => block.isFree).reduce((sum, block) => sum + block.size, 0);
	const frameCount = Math.floor(freeSize / pageSize);
	const remainder = freeSize - frameCount * pageSize;

	const state: MemoryBlock[] = [];
	if (osBlock) {
		state.push({ ...osBlock, process: null, isFree: false });
	}

	const frameStart = osBlock ? osBlock.start + osBlock.size : 0;
	for (let index = 0; index < frameCount; index += 1) {
		state.push({
			id: `frame-${index}`,
			start: frameStart + index * pageSize,
			size: pageSize,
			process: null,
			isFree: true,
		});
	}

	if (remainder > 0) {
		state.push({
			id: 'frame-remainder',
			start: frameStart + frameCount * pageSize,
			size: remainder,
			process: null,
			isFree: true,
		});
	}

	return state;
}

function selectVictimFrame(
	state: MemoryBlock[],
	frameMeta: Map<string, FrameMeta>,
	pending: SegmentPageRequest[],
	algorithm: ReplacementAlgo,
	clockPointer: number,
): { victimIndex: number; nextClockPointer: number } {
	const candidates: ReplacementCandidate[] = state
		.map((block, index) => ({ block, index }))
		.filter(({ block }) => !block.isFree && block.id.startsWith('frame-') && block.process !== null)
		.map(({ block, index }) => ({
			index,
			frameId: block.id,
			processId: block.process?.id ?? '',
		}));

	if (candidates.length === 0) {
		return { victimIndex: -1, nextClockPointer: clockPointer };
	}

	if (algorithm === 'OPT') {
		const victimIndex = selectOptimalVictim(candidates, pending.map((request) => request.id));
		return { victimIndex, nextClockPointer: clockPointer };
	}

	if (algorithm === 'LRU') {
		const victimIndex = selectLruVictim(candidates, frameMeta);
		return { victimIndex, nextClockPointer: clockPointer };
	}

	if (algorithm === 'NRU') {
		const victimIndex = selectNruVictim(candidates, frameMeta);
		return { victimIndex, nextClockPointer: clockPointer };
	}

	if (algorithm === 'Segunda Oportunidad') {
		const result = selectSecondChanceVictim(candidates, frameMeta, clockPointer);
		return { victimIndex: result.victimIndex, nextClockPointer: result.nextPointer };
	}

	if (algorithm === 'Clock') {
		const result = selectClockVictim(candidates, frameMeta, clockPointer);
		return { victimIndex: result.victimIndex, nextClockPointer: result.nextPointer };
	}

	const victimIndex = selectFifoVictim(candidates, frameMeta);

	return { victimIndex, nextClockPointer: clockPointer };
}

export function pagingSimulation(
	algorithm: ReplacementAlgo,
	processes: Process[],
	memoryState: MemoryBlock[],
	config: SimulationConfig,
): SimulationStep[] {
	const pageSize = Math.max(4, config.pageSize ?? 16);
	let state = createFrameMemoryState(memoryState, pageSize);
	const segmentUnits = buildSegmentsFromProcesses(processes);
	const pending = toSegmentPages(segmentUnits, pageSize).sort((a, b) => a.arrivalTime - b.arrivalTime);
	const frameMeta = new Map<string, FrameMeta>();
	const steps: SimulationStep[] = [];
	let clockPointer = 0;
	let step = 0;

	while (pending.length > 0) {
		for (let index = 0; index < pending.length; ) {
			const pageRequest = pending[index];
			if (pageRequest.arrivalTime > step) {
				index += 1;
				continue;
			}

			let freeFrameIndex = state.findIndex((block) => block.isFree && block.id.startsWith('frame-') && block.size === pageSize);
			if (freeFrameIndex === -1 && algorithm !== 'Paginacion Simple') {
				const { victimIndex, nextClockPointer } = selectVictimFrame(state, frameMeta, pending.slice(index + 1), algorithm, clockPointer);
				clockPointer = nextClockPointer;
				if (victimIndex !== -1) {
					frameMeta.delete(state[victimIndex].id);
					state[victimIndex].isFree = true;
					state[victimIndex].process = null;
					freeFrameIndex = victimIndex;
				}
			}

			if (freeFrameIndex === -1) {
				index += 1;
				continue;
			}

			state[freeFrameIndex].isFree = false;
			state[freeFrameIndex].process = toPageProcess(pageRequest, step, pageSize);
			frameMeta.set(state[freeFrameIndex].id, { loadedAt: step, lastUsed: step, referenceBit: 1, modifiedBit: 0 });

			pending.splice(index, 1);
		}

		const waitingProcesses = Array.from(
			new Map(
				pending
					.filter((request) => request.arrivalTime <= step)
					.map((request) => [request.parentProcessId, request.baseProcess]),
			).values(),
		).map((process) => ({ ...process }));

		steps.push({
			stepNumber: step,
			memoryState: cloneMemoryState(state),
			processQueue: waitingProcesses,
			stats: buildStepStats(state, config.totalMemory),
		});

		const hasFutureArrivals = pending.some((process) => process.arrivalTime > step);
		const hasArrivedPending = pending.some((process) => process.arrivalTime <= step);
		const hasFreeFrame = state.some((block) => block.isFree && block.id.startsWith('frame-') && block.size === pageSize);

		if (algorithm === 'Paginacion Simple' && hasArrivedPending && !hasFreeFrame && !hasFutureArrivals) {
			break;
		}

		step += 1;
	}

	return steps;
}

