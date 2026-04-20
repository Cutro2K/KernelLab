import { type Process, type SimulationStep, type SimulationConfig, type MemoryBlock } from '../types';
import { buildStepStats } from '../stepStats';
import { cloneMemoryState } from '../../hooks/useAlgorithm';

// Matemática: Encuentra la siguiente potencia de 2 (Ej: 60KB -> 64KB, 120KB -> 128KB)
function nextPowerOf2(size: number): number {
    if (size <= 0) return 0;
    return Math.pow(2, Math.ceil(Math.log2(size)));
}

// Fusión de nodos hermanos (Buddies)
function mergeBuddies(state: MemoryBlock[]): MemoryBlock[] {
    if (state.length === 0) return state;

    let merged = true;
    let currentState = [...state];

    // Bucle para fusiones en cascada (Ej: 64+64 se hace 128, que se fusiona con otro 128...)
    while (merged) {
        merged = false;
        for (let i = 0; i < currentState.length - 1; i++) {
            const current = currentState[i];
            const next = currentState[i + 1];

            // Condición 1: Ambos libres y mismo tamaño
            if (current.isFree && next.isFree && current.size === next.size) {
                const mergedSize = current.size * 2;
                // Condición 2 (Magia del árbol): La dirección del bloque izquierdo debe ser 
                // múltiplo exacto del tamaño combinado para ser "hermanos reales".
                if (current.start % mergedSize === 0) {
                    currentState.splice(i, 2, {
                        id: `free-merged-${current.start}`,
                        start: current.start,
                        size: mergedSize,
                        isFree: true,
                        process: null
                    });
                    merged = true;
                    break; // Reiniciamos el bucle al modificar el array
                }
            }
        }
    }
    return currentState;
}

// Función maestra para dividir el árbol y asignar
function allocateBuddy(state: MemoryBlock[], process: Process, step: number): boolean {
    const requiredSize = nextPowerOf2(process.size);

    let bestBlockIndex = -1;
    let bestBlockSize = Number.MAX_VALUE;

    // Buscamos el bloque libre más pequeño que sea mayor o igual a requiredSize
    for (let i = 0; i < state.length; i++) {
        const block = state[i];
        if (block.isFree && block.size >= requiredSize) {
            if (block.size < bestBlockSize) {
                bestBlockSize = block.size;
                bestBlockIndex = i;
            }
        }
    }

    if (bestBlockIndex === -1) return false; // No hay espacio suficiente

    // DIVISIÓN EN FORMA DE ÁRBOL: 
    // Mientras el bloque sea más grande de lo necesario, lo cortamos a la mitad
    while (state[bestBlockIndex].size > requiredSize) {
        const blockToSplit = state[bestBlockIndex];
        const halfSize = blockToSplit.size / 2;

        const leftBuddy: MemoryBlock = {
            id: `free-${step}-${blockToSplit.start}-L`,
            start: blockToSplit.start,
            size: halfSize,
            isFree: true,
            process: null
        };
        const rightBuddy: MemoryBlock = {
            id: `free-${step}-${blockToSplit.start + halfSize}-R`,
            start: blockToSplit.start + halfSize,
            size: halfSize,
            isFree: true,
            process: null
        };

        // Reemplazamos el bloque grande por sus dos mitades (hermanos)
        state.splice(bestBlockIndex, 1, leftBuddy, rightBuddy);
        // bestBlockIndex queda apuntando al 'leftBuddy', y seguimos dividiendo si es necesario
    }

    // Asignamos el proceso al bloque que ya quedó del tamaño perfecto
    state[bestBlockIndex].isFree = false;
    state[bestBlockIndex].process = { ...process, arrivalTime: step };

    return true;
}

function hasRunningProcesses(state: MemoryBlock[]): boolean {
    // Verificamos si hay procesos corriendo (ignorando al OS)
    return state.some((block) => !block.isFree && block.process !== null && block.process.id !== 'os');
}

export function buddySystem(processes: Process[], _memoryState: MemoryBlock[], params: SimulationConfig): SimulationStep[] {
    // 1. IGNORAMOS EL _memoryState y creamos un árbol perfecto inicial
    const totalMem = nextPowerOf2(params.totalMemory);
    let state: MemoryBlock[] = [{
        id: `free-0`,
        start: 0,
        size: totalMem,
        isFree: true,
        process: null
    }];

    // 2. Asignamos el Sistema Operativo para que divida el árbol inicial
    if (params.osSize && params.osSize > 0) {
        const osProcess: Process = {
            id: 'os',
            name: 'OS',
            codeSize: 0,
            stackSize: 0,
            dataSize: 0,
            heapSize: 0,
            codeArrivalTime: 0,
            stackArrivalTime: 0,
            dataArrivalTime: 0,
            heapArrivalTime: 0,
            size: params.osSize,
            arrivalTime: 0,
            duration: 999999, // SO nunca termina
            color: 'bg-red-400'
        };
        const osAllocated = allocateBuddy(state, osProcess, 0);

        // Normalizamos la representación del OS para que coincida con el resto de algoritmos:
        // bloque reservado (ocupado) con process=null y id='os'.
        if (osAllocated) {
            const osBlock = state.find((block) => !block.isFree && block.process?.id === 'os');
            if (osBlock) {
                osBlock.id = 'os';
                osBlock.usedSize = params.osSize;
                osBlock.process = null;
            }
        }
    }

    const pending = [...processes].sort((a, b) => a.arrivalTime - b.arrivalTime);
    const steps: SimulationStep[] = [];
    let step = 0;

    // Guardamos el paso inicial para la visualización (Paso 0)
    steps.push({
        stepNumber: step,
        memoryState: cloneMemoryState(state),
        processQueue: pending.map(p => ({...p})),
        stats: buildStepStats(state, totalMem),
        description: `Estado: memoria inicializada. Reservado para OS: ${params.osSize ?? 0}KB.`
    });

    step = 1;

    // Bucle principal de simulación por "ticks" (pasos)
    while (pending.length > 0 || hasRunningProcesses(state)) {
        let didRelease = false;
        let releasedProcessNames: string[] = [];

        // 1. Liberar procesos terminados
        for (const block of state) {
            if (!block.isFree && block.process && block.process.id !== 'os' && step >= block.process.arrivalTime + block.process.duration) {
                block.isFree = true;
                releasedProcessNames.push(block.process.name);
                block.process = null;
                didRelease = true;
            }
        }

        // Fusión de hermanos si hubo liberación
        if (didRelease) {
            state = mergeBuddies(state);
        }

        // 2. Asignar procesos que ya llegaron
        const arrived = pending.filter((process) => process.arrivalTime <= step);
        let allocatedProcessNames: string[] = [];

        if (arrived.length > 0) {
            // Intentamos asignar los procesos en orden
            for (let i = 0; i < arrived.length; i++) {
                const process = arrived[i];
                const success = allocateBuddy(state, process, step);
                
                if (success) {
                    allocatedProcessNames.push(process.name);
                    const index = pending.findIndex(p => p.id === process.id);
                    if (index !== -1) pending.splice(index, 1);
                }
            }
        }

        // 3. Crear el log/descripción del paso
        const waitingQueue = pending
            .filter((process) => process.arrivalTime <= step)
            .map((process) => ({ ...process }));

        const descriptionParts: string[] = [];
        if (releasedProcessNames.length > 0) {
            descriptionParts.push(`Liberados: ${releasedProcessNames.join(', ')}.`);
        }
        if (allocatedProcessNames.length > 0) {
            descriptionParts.push(`Cargados (Buddy System): ${allocatedProcessNames.join(', ')}.`);
        }
        if (waitingQueue.length > 0 && allocatedProcessNames.length === 0) {
            descriptionParts.push(`En espera: ${waitingQueue.map((process) => process.name).join(', ')}.`);
        }
        if (descriptionParts.length === 0) {
            descriptionParts.push('Estado: procesos en ejecucion.');
        }

        steps.push({
            stepNumber: step,
            memoryState: cloneMemoryState(state),
            processQueue: waitingQueue,
            stats: buildStepStats(state, totalMem),
            description: descriptionParts.join(' ')
        });

        // 4. Chequear Deadlock (terminar simulación si nadie puede entrar y nadie corre)
        const hasFutureArrivals = pending.some((process) => process.arrivalTime > step);
        const hasAnyFitNow = pending
            .filter((process) => process.arrivalTime <= step)
            .some((process) => {
                const reqSize = nextPowerOf2(process.size);
                return state.some((block) => block.isFree && block.size >= reqSize);
            });

        if (!hasRunningProcesses(state) && !hasFutureArrivals && !hasAnyFitNow && pending.length > 0) {
            steps[steps.length - 1].description = 'Bloqueo: quedan procesos en cola y no hay bloques compatibles en potencias de 2.';
            break; 
        }

        step += 1;
    }

    return steps;
}