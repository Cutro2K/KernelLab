import { calculateStats } from '../../utils/helpers';
import { MemoryBlock } from './MemoryBlock';
import { type MemoryBlock as MemoryBlockType,type AlgorithmType } from '../../algorithms/types';
import { ALGORITHM_REGISTRY } from '../../algorithms/types'; // Asumiendo que exportas el registro de tu Doc 1

interface MemoryMapProps {
  memoryState: MemoryBlockType[];
  totalMemory: number;
  algorithmId: AlgorithmType;
  pageTable?: any[]; 
  segmentTable?: any[];
}

export function MemoryMap({ memoryState, totalMemory, algorithmId, pageTable, segmentTable }: MemoryMapProps) {
  const meta = ALGORITHM_REGISTRY[algorithmId];

    if (!meta) {
    return (
      <div className="flex items-center justify-center w-full h-[600px] bg-gray-100 border-2 border-dashed border-gray-400 rounded-md text-gray-500 font-mono">
        ⚠️ El algoritmo "{algorithmId}" todavía no está en el registro.
      </div>
    );
  }

  const stats = calculateStats(memoryState, totalMemory);

  return (
    <div className="flex flex-col gap-2 flex-1 w-[500px] h-full bg-gray-100 border-2 border-black shadow-md overflow-hidden">        
        <div className="flex flex-row mt-2 mx-2 flex-1 overflow-x-auto bg-gray-50">
          {memoryState.map((block) => (
            <MemoryBlock 
              key={block.id} 
              block={block} 
              totalMemory={totalMemory} 
            />
          ))}
        </div>
        <div className="mx-auto px-3 mb-2 border-2 border-black">
          {stats.memoryUsage}%
        </div>
    </div>
  );
}