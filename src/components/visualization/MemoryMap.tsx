import { MemoryBlock } from './MemoryBlock';
import { useSimulationStore } from '../../store/simulationStore';
import { AnimatePresence } from 'framer-motion';

interface MemoryMapProps {
  className?: string;
}

export function MemoryMap({className = '', }: MemoryMapProps) {
  const memoryState = useSimulationStore((state) => state.memoryState);
  const totalMemory = useSimulationStore((state) => state.configParams?.totalMemory) ?? 0;
  const algorithmId = useSimulationStore((state) => state.algorithm);

  if (memoryState === null) {
    return (
      <div className="flex items-center justify-center w-full h-[600px] bg-gray-100 border-2 border-dashed border-gray-400 rounded-md text-gray-500 font-mono">
        ⚠️ El algoritmo "{algorithmId}" todavía no está en el registro.
      </div>
    );
  }

  return (
    <div className={`flex flex-col w-full bg-gray-100 border-2 border-black shadow-md overflow-hidden ${className}`}>
        <div className="flex flex-row m-2 flex-1 overflow-x-auto bg-gray-50">
          <AnimatePresence initial={false} mode="popLayout">
            {memoryState.map((block, index) => (
              <MemoryBlock 
                key={block.id} 
                block={block} 
                totalMemory={totalMemory}
                isLast={index === memoryState.length - 1}
              />
            ))}
          </AnimatePresence>
        </div>
    </div>
  );
}