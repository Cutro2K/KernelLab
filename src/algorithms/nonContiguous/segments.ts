import { type Process, type SegmentType } from '../types';

export type SegmentUnit = {
  id: string;
  parentProcessId: string;
  parentProcessName: string;
  segmentType: SegmentType;
  size: number;
  arrivalTime: number;
  color: string;
  baseProcess: Process;
};

function getSegmentArrival(process: Process, segmentType: SegmentType): number {
  if (segmentType === 'Code') return process.codeArrivalTime;
  if (segmentType === 'Data') return process.dataArrivalTime;
  if (segmentType === 'Stack') return process.stackArrivalTime;
  return process.heapArrivalTime;
}

// Convierte lista de procesos en lista de segmentos
export function buildSegmentsFromProcesses(processes: Process[]): SegmentUnit[] {
  return processes.flatMap((process) => {
    const segments: Array<{ segmentType: SegmentType; size: number }> = [
      { segmentType: 'Code', size: process.codeSize },
      { segmentType: 'Data', size: process.dataSize },
      { segmentType: 'Stack', size: process.stackSize },
      { segmentType: 'Heap', size: process.heapSize },
    ];

    return segments
      .filter((segment) => segment.size > 0)
      .map((segment, index) => ({
        id: `${process.id}-seg-${index}`,
        parentProcessId: process.id,
        parentProcessName: process.name,
        segmentType: segment.segmentType,
        size: segment.size,
        arrivalTime: Math.max(process.arrivalTime, getSegmentArrival(process, segment.segmentType)),
        color: process.color,
        baseProcess: process,
      }));
  });
}
