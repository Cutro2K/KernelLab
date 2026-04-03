import { type FrameMeta, type ReplacementCandidate } from './types';

export function selectFifoVictim(candidates: ReplacementCandidate[], frameMeta: Map<string, FrameMeta>): number {
	if (candidates.length === 0) {
		return -1;
	}

	const selected = candidates.reduce((current, candidate) => {
		const currentMeta = frameMeta.get(current.frameId);
		const candidateMeta = frameMeta.get(candidate.frameId);
		const currentLoadedAt = currentMeta?.loadedAt ?? Number.MAX_SAFE_INTEGER;
		const candidateLoadedAt = candidateMeta?.loadedAt ?? Number.MAX_SAFE_INTEGER;
		return candidateLoadedAt < currentLoadedAt ? candidate : current;
	}, candidates[0]);

	return selected.index;
}

