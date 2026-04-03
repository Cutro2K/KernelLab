import { type ReplacementCandidate } from './types';

export function selectOptimalVictim(candidates: ReplacementCandidate[], futureReferenceIds: string[]): number {
	if (candidates.length === 0) {
		return -1;
	}

	let selected = candidates[0];
	let farthestDistance = -1;

	for (const candidate of candidates) {
		const nextUse = futureReferenceIds.findIndex((id) => id === candidate.processId);
		const distance = nextUse === -1 ? Number.MAX_SAFE_INTEGER : nextUse;
		if (distance > farthestDistance) {
			farthestDistance = distance;
			selected = candidate;
		}
	}

	return selected.index;
}

