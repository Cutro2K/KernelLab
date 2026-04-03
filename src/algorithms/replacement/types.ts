export type FrameMeta = {
  loadedAt: number;
  lastUsed: number;
  referenceBit: 0 | 1;
  modifiedBit: 0 | 1;
};

export type ReplacementCandidate = {
  index: number;
  frameId: string;
  processId: string;
};
