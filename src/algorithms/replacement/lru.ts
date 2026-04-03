import { type FrameMeta, type ReplacementCandidate } from './types';

export function selectLruVictim(candidates: ReplacementCandidate[], frameMeta: Map<string, FrameMeta>): number {
	if (candidates.length === 0) {
		return -1;
	}

	const selected = candidates.reduce((current, candidate) => {
		const currentMeta = frameMeta.get(current.frameId);
		const candidateMeta = frameMeta.get(candidate.frameId);
		const currentLastUsed = currentMeta?.lastUsed ?? Number.MAX_SAFE_INTEGER;
		const candidateLastUsed = candidateMeta?.lastUsed ?? Number.MAX_SAFE_INTEGER;
		return candidateLastUsed < currentLastUsed ? candidate : current;
	}, candidates[0]);

	return selected.index;
}

