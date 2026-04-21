import { buildStepStats } from '../stepStats';
import { buildSegmentsFromProcesses, type SegmentUnit } from '../nonContiguous/segments';
import { selectFifoVictim } from '../replacement/fifo';
import { selectLruVictim } from '../replacement/lru';
import { selectOptimalVictim } from '../replacement/optimal';
import { selectClockVictim, selectNruVictim, selectSecondChanceVictim } from '../replacement/clock';
import { type FrameMeta, type ReplacementCandidate } from '../replacement/types';
import { type AlgorithmOption, type MemoryBlock, type PagingReferenceEvent, type Process, type SimulationConfig, type SimulationStep } from '../types';

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

type AccessOp = 'read' | 'write';

// Evento, parte de la lista de referencias
type AccessEvent = {
	step: number;
	pageId: string;
	parentProcessId: string;
	parentProcessName: string;
	segmentType: SegmentUnit['segmentType'];
	op: AccessOp;
};

type SegmentRuntime = {
	segmentId: string;
	parentProcessId: string;
	parentProcessName: string;
	segmentType: SegmentUnit['segmentType'];
	arrivalTime: number;
	pageCount: number;
	pageIds: string[];
	size: number;
	baseProcess: Process;
};

type AccessPlan = {
	eventsByStep: Map<number, AccessEvent[]>;
	flatEvents: AccessEvent[];
	maxStep: number;
};

// Se clona el estado de la memoria para no modificar el original
function cloneMemoryState(state: MemoryBlock[]): MemoryBlock[] {
	return state.map((block) => ({
		...block,
		process: block.process ? { ...block.process } : null,
		pageMeta: block.pageMeta ? { ...block.pageMeta } : undefined,
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

// Convierte un segmento de un proceso en un conjunto de páginas
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

// Construye metadatos de ejecución para cada página por segmento, para luego generar referencias
function toSegmentRuntime(segments: SegmentUnit[], pageSize: number): SegmentRuntime[] {
	return segments
		.filter((segment) => segment.size > 0)
		.map((segment) => {
			const pageCount = Math.max(1, Math.ceil(segment.size / pageSize));
			const pageIds = Array.from({ length: pageCount }, (_, pageIndex) => `${segment.id}-pg-${pageIndex}`);
			return {
				segmentId: segment.id,
				parentProcessId: segment.parentProcessId,
				parentProcessName: segment.parentProcessName,
				segmentType: segment.segmentType,
				arrivalTime: segment.arrivalTime,
				pageCount,
				pageIds,
				size: segment.size,
				baseProcess: segment.baseProcess,
			};
		});
}

// Generador de numeros pseudo-aleatorios
function createPrng(seed: number): () => number {
	let state = seed >>> 0;
	return () => {
		state = (1664525 * state + 1013904223) >>> 0;
		return state / 4294967296;
	};
}

// Helper para normalizar valores entre 0 y 1, útil para ajustar probabilidades de referencia
function clamp01(value: number): number {
	if (!Number.isFinite(value)) {
		return 0;
	}
	if (value < 0) {
		return 0;
	}
	if (value > 1) {
		return 1;
	}
	return value;
}

// Recibe array de pesos y devuelve un índice basado en esos pesos (mayor peso = mayor probabilidad de ser elegido)
// Se usa para elegir segmentos a referenciar basados en su tipo y progreso de ejecución
function selectWeightedIndex(weights: number[], rand: () => number): number {
	const totalWeight = weights.reduce((sum, weight) => sum + Math.max(0, weight), 0);
	if (totalWeight <= 0) {
		return 0;
	}

	const target = rand() * totalWeight;
	let accumulated = 0;
	for (let index = 0; index < weights.length; index += 1) {
		accumulated += Math.max(0, weights[index]);
		if (target <= accumulated) {
			return index;
		}
	}

	return Math.max(0, weights.length - 1);
}

// Calcula en qué paso finaliza un proceso
function getProcessEndStep(process: Process): number {
	return process.arrivalTime + Math.max(1, process.duration);
}

// Asigna un peso a cada segmento
function getBaseSegmentWeight(segmentType: SegmentUnit['segmentType']): number {
	if (segmentType === 'Code') return 0.35;
	if (segmentType === 'Data') return 0.3;
	if (segmentType === 'Heap') return 0.2;
	return 0.15;
}

// Ajusta el peso de cada segmento según el progreso de ejecución del proceso, para simular patrones de referencia realistas
function getAdjustedSegmentWeight(segmentType: SegmentUnit['segmentType'], progress: number): number {
	let weight = getBaseSegmentWeight(segmentType);
	if (progress <= 0.25) {
		if (segmentType === 'Code') weight += 0.1;
		if (segmentType === 'Heap') weight -= 0.05;
		if (segmentType === 'Stack') weight -= 0.05;
	}
	if (progress >= 0.75) {
		if (segmentType === 'Stack') weight += 0.1;
		if (segmentType === 'Code') weight -= 0.05;
		if (segmentType === 'Data') weight -= 0.05;
	}
	return Math.max(0.01, weight);
}

// Decide si una referencia va a ser de lectura o escritura, y ajusta probabilidades según el tipo de segmento
function chooseOperation(segmentType: SegmentUnit['segmentType'], rand: () => number, enableWrites: boolean): AccessOp {
	if (!enableWrites) {
		return 'read';
	}

	const writeProbability = segmentType === 'Code'
		? 0.05
		: segmentType === 'Data'
			? 0.3
			: segmentType === 'Heap'
				? 0.4
				: 0.45;

	return rand() < writeProbability ? 'write' : 'read';
}

// Decide que página del segmento referenciar, con alta probabilidad de elegir la misma página o páginas cercanas a la última referenciada, para simular localidad
function choosePageIndex(segment: SegmentRuntime, lastPageBySegment: Map<string, number>, locality: number, rand: () => number): number {
	const last = lastPageBySegment.get(segment.segmentId);
	if (last === undefined || segment.pageCount <= 1 || rand() > locality) {
		return Math.floor(rand() * segment.pageCount);
	}

	const roll = rand();
	if (roll < 0.6) {
		return last;
	}

	if (roll < 0.85) {
		return Math.min(segment.pageCount - 1, last + 1);
	}

	return Math.max(0, last - 1);
}

// Construye el plan de acceso (referencias) a páginas para la simulación
function buildAccessPlan(segments: SegmentRuntime[], processes: Process[], config: SimulationConfig): AccessPlan {
	const seed = Math.floor(config.referenceSeed ?? 42);
	const rand = createPrng(seed);
	const locality = clamp01(config.referenceLocality ?? 0.7);
	const maxReferencesPerCycle = Math.max(1, Math.min(8, Math.floor(config.maxReferencesPerCycle ?? 4)));
	const enableWrites = config.enableWriteReferences ?? true;
	const maxProcessEndStep = processes.reduce((max, process) => Math.max(max, getProcessEndStep(process)), 0);
	const maxSegmentArrival = segments.reduce((max, segment) => Math.max(max, segment.arrivalTime), 0);
	const maxStep = Math.max(maxProcessEndStep, maxSegmentArrival);

	const segmentsByProcess = new Map<string, SegmentRuntime[]>();
	for (const segment of segments) {
		const current = segmentsByProcess.get(segment.parentProcessId) ?? [];
		current.push(segment);
		segmentsByProcess.set(segment.parentProcessId, current);
	}

	const lastPageBySegment = new Map<string, number>();
	const eventsByStep = new Map<number, AccessEvent[]>();
	const flatEvents: AccessEvent[] = [];

	for (let step = 0; step <= maxStep; step += 1) {
		const stepEvents: AccessEvent[] = [];

		for (const process of processes) {
			const processEnd = getProcessEndStep(process);
			if (step < process.arrivalTime || step >= processEnd) {
				continue;
			}

			const processSegments = (segmentsByProcess.get(process.id) ?? []).filter((segment) => segment.arrivalTime <= step);
			if (processSegments.length === 0) {
				continue;
			}

			const refsForCycle = Math.min(maxReferencesPerCycle, 1 + Math.floor(process.size / 64));
			const processLifeSpan = Math.max(1, processEnd - process.arrivalTime);
			const progress = clamp01((step - process.arrivalTime) / processLifeSpan);

			for (let count = 0; count < refsForCycle; count += 1) {
				const weights = processSegments.map((segment) => getAdjustedSegmentWeight(segment.segmentType, progress));
				const chosenSegment = processSegments[selectWeightedIndex(weights, rand)];
				const pageIndex = choosePageIndex(chosenSegment, lastPageBySegment, locality, rand);
				lastPageBySegment.set(chosenSegment.segmentId, pageIndex);

				stepEvents.push({
					step,
					pageId: chosenSegment.pageIds[pageIndex],
					parentProcessId: chosenSegment.parentProcessId,
					parentProcessName: chosenSegment.parentProcessName,
					segmentType: chosenSegment.segmentType,
					op: chooseOperation(chosenSegment.segmentType, rand, enableWrites),
				});
			}
		}

		eventsByStep.set(step, stepEvents);
		flatEvents.push(...stepEvents);
	}

	return {
		eventsByStep,
		flatEvents,
		maxStep,
	};
}

// Reserva espacio para el OS y divide el resto de la memoria en marcos de página
function createFrameMemoryState(initialState: MemoryBlock[], pageSize: number): MemoryBlock[] {
	const osBlock = initialState.find((block) => !block.isFree && block.process === null);
	const totalSize = initialState.reduce((sum, block) => sum + block.size, 0);
	const osUsedSize = Math.max(0, osBlock?.usedSize ?? osBlock?.size ?? 0);
	const alignedOsSize = osUsedSize > 0 ? Math.ceil(osUsedSize / pageSize) * pageSize : 0;
	const osReservedSize = Math.min(totalSize, alignedOsSize);
	const freeSize = Math.max(0, totalSize - osReservedSize);
	const frameCount = Math.floor(freeSize / pageSize);
	const remainder = freeSize - frameCount * pageSize;

	const state: MemoryBlock[] = [];
	if (osReservedSize > 0) {
		state.push({
			id: 'os',
			start: 0,
			size: osReservedSize,
			usedSize: osUsedSize,
			process: null,
			isFree: false,
			pageMeta: undefined,
		});
	}

	const frameStart = osReservedSize;
	for (let index = 0; index < frameCount; index += 1) {
		state.push({
			id: `frame-${index}`,
			start: frameStart + index * pageSize,
			size: pageSize,
			process: null,
			isFree: true,
			pageMeta: undefined,
		});
	}

	if (remainder > 0) {
		state.push({
			id: 'frame-remainder',
			start: frameStart + frameCount * pageSize,
			size: remainder,
			process: null,
			isFree: true,
			pageMeta: undefined,
		});
	}

	return state;
}

// Elige la página a reemplazar según algoritmo seleccionado y estado de la memoria
// Algoritmos en ../algorithms/allocation se encargan de devolver el indice de la página a reemplazar
function selectVictimFrame(
	state: MemoryBlock[],
	frameMeta: Map<string, FrameMeta>,
	futureReferenceIds: string[],
	algorithm: ReplacementAlgo,
	clockPointer: number,
): { victimIndex: number; nextClockPointer: number } {
	// Calcula candidatos a reemplazo
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
		const victimIndex = selectOptimalVictim(candidates, futureReferenceIds);
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

// Crea todos los pasos de la simulación de paginación, incluyendo referencias, cargas, reemplazos y liberaciones
export function pagingSimulation(
	algorithm: ReplacementAlgo,
	processes: Process[],
	memoryState: MemoryBlock[],
	config: SimulationConfig,
): SimulationStep[] {
	const pageSize = Math.max(4, config.pageSize ?? 16);
	let state = createFrameMemoryState(memoryState, pageSize);
	const segmentUnits = buildSegmentsFromProcesses(processes);
	const allPages = toSegmentPages(segmentUnits, pageSize);
	const pageById = new Map(allPages.map((page) => [page.id, page]));
	const segmentRuntime = toSegmentRuntime(segmentUnits, pageSize);
	const accessPlan = buildAccessPlan(segmentRuntime, processes, config);
	const frameMeta = new Map<string, FrameMeta>();
	const steps: SimulationStep[] = [];
	let clockPointer = 0;
	let flatCursor = 0;
	const finishedProcesses = new Set<string>();
	const nruResetInterval = Math.max(1, Math.floor(config.nruResetInterval ?? 4));

	for (let step = 0; step <= accessPlan.maxStep; step += 1) {
		const loadedPageNames: string[] = [];
		const replacedPageNames: string[] = [];
		const waitingPageNames: string[] = [];
		const releasedProcessNames: string[] = [];
		const referenceEvents: PagingReferenceEvent[] = [];

		let pageFaults = 0;
		let pageHits = 0;

		for (const process of processes) {
			if (finishedProcesses.has(process.id)) {
				continue;
			}

			if (step < getProcessEndStep(process)) {
				continue;
			}

			let releasedAny = false;
			for (const block of state) {
				if (block.isFree || block.process?.parentProcessId !== process.id) {
					continue;
				}

				block.isFree = true;
				block.process = null;
				block.pageMeta = undefined;
				frameMeta.delete(block.id);
				releasedAny = true;
			}

			finishedProcesses.add(process.id);
			if (releasedAny) {
				releasedProcessNames.push(process.name);
			}
		}

		const stepEvents = accessPlan.eventsByStep.get(step) ?? [];
		for (let index = 0; index < stepEvents.length; index += 1) {
			const event = stepEvents[index];
			const page = pageById.get(event.pageId);
			if (!page) {
				continue;
			}

			const baseEvent: Omit<PagingReferenceEvent, 'outcome'> = {
				step,
				processId: event.parentProcessId,
				processName: event.parentProcessName,
				segmentType: event.segmentType,
				pageId: event.pageId,
				pageNumber: page.pageIndex + 1,
				operation: event.op,
			};

			const loadedIndex = state.findIndex((block) => !block.isFree && block.process?.id === event.pageId);
			if (loadedIndex !== -1) {
				pageHits += 1;
				referenceEvents.push({ ...baseEvent, outcome: 'hit' });
				const frameId = state[loadedIndex].id;
				const currentMeta = frameMeta.get(frameId);
				if (currentMeta) {
					const nextMeta: FrameMeta = {
						...currentMeta,
						lastUsed: step,
						referenceBit: 1,
						modifiedBit: event.op === 'write' ? 1 : currentMeta.modifiedBit,
					};
					frameMeta.set(frameId, nextMeta);
					state[loadedIndex].pageMeta = { ...nextMeta };
				}
				continue;
			}

			pageFaults += 1;
			let freeFrameIndex = state.findIndex((block) => block.isFree && block.id.startsWith('frame-') && block.size === pageSize);

			if (freeFrameIndex === -1 && algorithm !== 'Paginacion Simple') {
				const futureReferenceIds = accessPlan.flatEvents
					.slice(flatCursor + index + 1)
					.map((futureEvent) => futureEvent.pageId);
				const { victimIndex, nextClockPointer } = selectVictimFrame(state, frameMeta, futureReferenceIds, algorithm, clockPointer);
				clockPointer = nextClockPointer;

				if (victimIndex !== -1) {
					const replacedPage = state[victimIndex].process;
					if (replacedPage) {
						replacedPageNames.push(replacedPage.name);
					}
					frameMeta.delete(state[victimIndex].id);
					state[victimIndex].isFree = true;
					state[victimIndex].process = null;
					state[victimIndex].pageMeta = undefined;
					freeFrameIndex = victimIndex;
				}
			}

			if (freeFrameIndex === -1) {
				waitingPageNames.push(`${event.parentProcessName}-${event.segmentType}`);
				referenceEvents.push({ ...baseEvent, outcome: 'blocked' });
				continue;
			}

			state[freeFrameIndex].isFree = false;
			state[freeFrameIndex].process = toPageProcess(page, step, pageSize);
			loadedPageNames.push(`${event.parentProcessName}-${event.segmentType} P${page.pageIndex + 1}`);
			const loadedMeta: FrameMeta = {
				loadedAt: step,
				lastUsed: step,
				referenceBit: 1,
				modifiedBit: event.op === 'write' ? 1 : 0,
			};
			frameMeta.set(state[freeFrameIndex].id, loadedMeta);
			state[freeFrameIndex].pageMeta = { ...loadedMeta };
			referenceEvents.push({ ...baseEvent, outcome: 'fault' });
		}

		flatCursor += stepEvents.length;

		if (algorithm === 'NRU' && step > 0 && step % nruResetInterval === 0) {
			for (const [frameId, meta] of frameMeta.entries()) {
				const nextMeta: FrameMeta = { ...meta, referenceBit: 0 };
				frameMeta.set(frameId, nextMeta);
				const blockIndex = state.findIndex((block) => block.id === frameId && !block.isFree);
				if (blockIndex !== -1) {
					state[blockIndex].pageMeta = { ...nextMeta };
				}
			}
		}

		const waitingProcesses = processes
			.filter((process) => step >= process.arrivalTime && step < getProcessEndStep(process))
			.filter((process) => !state.some((block) => !block.isFree && block.process?.parentProcessId === process.id))
			.map((process) => ({ ...process }));

		const descriptionParts: string[] = [];
		if (releasedProcessNames.length > 0) {
			descriptionParts.push(`Liberados: ${releasedProcessNames.join(', ')}.`);
		}
		if (loadedPageNames.length > 0) {
			descriptionParts.push(`Cargadas: ${loadedPageNames.join(', ')}.`);
		}
		if (replacedPageNames.length > 0) {
			descriptionParts.push(`Reemplazo (${algorithm}): ${replacedPageNames.join(', ')}.`);
		}
		if (waitingPageNames.length > 0) {
			descriptionParts.push(`En espera: ${waitingPageNames.join(', ')}.`);
		}
		descriptionParts.push(`Referencias: ${stepEvents.length}. Hits: ${pageHits}. Fallos: ${pageFaults}.`);
		if (descriptionParts.length === 0) {
			descriptionParts.push('Estado: paginacion en ejecucion.');
		}

		const stats = buildStepStats(state, config.totalMemory);

		steps.push({
			stepNumber: step,
			memoryState: cloneMemoryState(state),
			processQueue: waitingProcesses,
			referenceEvents,
			stats: {
				...stats,
				pageFaults,
				pageHits,
			},
			description: descriptionParts.join(' '),
		});

		const hasFutureSteps = step < accessPlan.maxStep;
		const hasRunningProcesses = processes.some((process) => step + 1 < getProcessEndStep(process));
		if (!hasFutureSteps && !hasRunningProcesses) {
			break;
		}
	}

	return steps;
}

