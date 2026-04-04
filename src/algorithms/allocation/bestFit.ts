import { type Process, type SimulationStep, type SimulationConfig, type MemoryBlock } from '../types';
import { buildStepStats } from '../stepStats';

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

function hasRunningProcesses(state: MemoryBlock[]): boolean {
    return state.some((block) => !block.isFree && block.process !== null);
}

export function bestFitCon(processes: Process[], memoryState: MemoryBlock[], _params: SimulationConfig): SimulationStep[] {
    const pending = [...processes].sort((a, b) => a.arrivalTime - b.arrivalTime);
    let state = cloneMemoryState(memoryState);
    const steps: SimulationStep[] = [];
    let step = 0;

    while (pending.length > 0 || hasRunningProcesses(state)) {
        let didRelease = false;
        const releasedProcessNames: string[] = [];
        let allocatedProcessName: string | null = null;

        for (const block of state) {
            if (!block.isFree && block.process && step >= block.process.arrivalTime + block.process.duration) {
                releasedProcessNames.push(block.process.name);
                block.isFree = true;
                block.process = null;
                didRelease = true;
            }
        }

        if (didRelease) {
            state = mergeAdjacentFreeBlocks(state);
        }

        const arrived = pending.filter((process) => process.arrivalTime <= step);
        if (arrived.length > 0) {
            let selectedProcess: Process | null = null;
            let selectedPendingIndex = -1;
            let selectedBlockIndex = -1;
            let selectedBlockSize = Number.MAX_VALUE;

            for (let pIndex = 0; pIndex < pending.length; pIndex += 1) {
                const process = pending[pIndex];
                if (process.arrivalTime > step) continue;

                let bestBlockIndexForProcess = -1;
                let bestBlockSizeForProcess = Number.MAX_VALUE;

                for (let bIndex = 0; bIndex < state.length; bIndex += 1) {
                    const block = state[bIndex];
                    if (!block.isFree || block.size < process.size) continue;

                    if (block.size < bestBlockSizeForProcess) {
                        bestBlockSizeForProcess = block.size;
                        bestBlockIndexForProcess = bIndex;
                    }
                }

                if (bestBlockIndexForProcess !== -1 && bestBlockSizeForProcess < selectedBlockSize) {
                    selectedProcess = process;
                    selectedPendingIndex = pIndex;
                    selectedBlockIndex = bestBlockIndexForProcess;
                    selectedBlockSize = bestBlockSizeForProcess;
                }
            }

            if (selectedProcess && selectedBlockIndex !== -1) {
                const targetBlock = state[selectedBlockIndex];
                const allocatedProcess: Process = {
                    ...selectedProcess,
                    arrivalTime: step,
                };
                allocatedProcessName = selectedProcess.name;

                targetBlock.isFree = false;
                targetBlock.process = allocatedProcess;

                if (targetBlock.size > selectedProcess.size) {
                    const remainingSize = targetBlock.size - selectedProcess.size;
                    targetBlock.size = selectedProcess.size;

                    const newBlock: MemoryBlock = {
                        id: `free-${step}-${selectedBlockIndex}`,
                        start: targetBlock.start + targetBlock.size,
                        size: remainingSize,
                        process: null,
                        isFree: true,
                    };

                    state.splice(selectedBlockIndex + 1, 0, newBlock);
                }

                pending.splice(selectedPendingIndex, 1);
            }
        }

        const waitingQueue = pending
            .filter((process) => process.arrivalTime <= step)
            .map((process) => ({ ...process }));

        const descriptionParts: string[] = [];
        if (releasedProcessNames.length > 0) {
            descriptionParts.push(`Liberados: ${releasedProcessNames.join(', ')}.`);
        }
        if (allocatedProcessName) {
            descriptionParts.push(`Asignacion (Best Fit): ${allocatedProcessName} en el bloque mas ajustado.`);
        }
        if (!allocatedProcessName && waitingQueue.length > 0) {
            descriptionParts.push(`En espera: ${waitingQueue.map((process) => process.name).join(', ')}.`);
        }
        if (descriptionParts.length === 0) {
            descriptionParts.push('Estado: procesos en ejecucion.');
        }

        steps.push({
            stepNumber: step,
            memoryState: cloneMemoryState(state),
            processQueue: waitingQueue,
            stats: buildStepStats(state, _params.totalMemory),
            description: descriptionParts.join(' '),
        });

        const hasFutureArrivals = pending.some((process) => process.arrivalTime > step);
        const hasAnyFitNow = pending
            .filter((process) => process.arrivalTime <= step)
            .some((process) => state.some((block) => block.isFree && block.size >= process.size));

        if (!hasRunningProcesses(state) && !hasFutureArrivals && !hasAnyFitNow && pending.length > 0) {
            steps[steps.length - 1].description = 'Bloqueo: quedan procesos en cola y no hay bloque contiguo suficiente.';
            break;
        }

        step += 1;
    }

    return steps;
}