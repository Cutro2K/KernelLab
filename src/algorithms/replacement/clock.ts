import { type FrameMeta, type ReplacementCandidate } from './types';

type ClockSelection = {
	victimIndex: number;
	nextPointer: number;
};

export function selectClockVictim(
	candidates: ReplacementCandidate[],
	frameMeta: Map<string, FrameMeta>,
	pointer: number,
): ClockSelection {
	if (candidates.length === 0) {
		return { victimIndex: -1, nextPointer: pointer };
	}

	let cursor = pointer % candidates.length;

	for (let attempts = 0; attempts < candidates.length * 2; attempts += 1) {
		const candidate = candidates[cursor];
		const meta = frameMeta.get(candidate.frameId);

		if ((meta?.referenceBit ?? 0) === 0) {
			return {
				victimIndex: candidate.index,
				nextPointer: (cursor + 1) % candidates.length,
			};
		}

		if (meta) {
			frameMeta.set(candidate.frameId, { ...meta, referenceBit: 0 });
		}

		cursor = (cursor + 1) % candidates.length;
	}

	return {
		victimIndex: candidates[cursor].index,
		nextPointer: (cursor + 1) % candidates.length,
	};
}

export function selectSecondChanceVictim(
	candidates: ReplacementCandidate[],
	frameMeta: Map<string, FrameMeta>,
	pointer: number,
): ClockSelection {
	return selectClockVictim(candidates, frameMeta, pointer);
}

export function selectNruVictim(candidates: ReplacementCandidate[], frameMeta: Map<string, FrameMeta>): number {
	if (candidates.length === 0) {
		return -1;
	}

	// Clase 0: R=0,M=0 | Clase 1: R=0,M=1 | Clase 2: R=1,M=0 | Clase 3: R=1,M=1
	const byClass = [0, 1, 2, 3].map(() => [] as ReplacementCandidate[]);

	for (const candidate of candidates) {
		const meta = frameMeta.get(candidate.frameId);
		const r = meta?.referenceBit ?? 0;
		const m = meta?.modifiedBit ?? 0;
		const classIndex = (r << 1) + m;
		byClass[classIndex].push(candidate);
	}

	for (const group of byClass) {
		if (group.length > 0) {
			return group[0].index;
		}
	}

	return candidates[0].index;
}

