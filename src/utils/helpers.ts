import { type MemoryBlock } from '../algorithms/types';

export function calculateStats(memoryState: MemoryBlock[], totalMemory: number) {
  // 1. Sumamos el tamaño de todos los bloques que NO están libres
  const occupiedMemory = memoryState.reduce((acumulador, block) => {
    if (!block.isFree) {
      return acumulador + block.size;
    }
    return acumulador; 
  }, 0); 

  // 2. Calculamos el porcentaje
  const memoryUsage = (occupiedMemory / totalMemory) * 100;

  // 3. Devolvemos las estadísticas
  return {
    // Math.round() redondea el número para que quede "45" en lugar de "45.33333333"
    memoryUsage: Math.round(memoryUsage), 
    
    // (Acá en el futuro vas a poder agregar la fragmentación externa, interna, etc.)
    occupiedMemory, // Te lo dejo por si querés mostrar "X KB / Total KB"
    freeMemory: totalMemory - occupiedMemory
  };
}

export function cloneMemoryState(state: MemoryBlock[]): MemoryBlock[] {
	return state.map((block) => ({
		...block,
		process: block.process ? { ...block.process } : null,
	}));
}