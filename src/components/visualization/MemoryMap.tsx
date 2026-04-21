import { MemoryBlock } from './MemoryBlock';
import { useSimulationStore } from '../../store/simulationStore';
import { AnimatePresence } from 'framer-motion';
import { useMemo } from 'react';

interface MemoryMapProps {
  className?: string;
}

export function MemoryMap({className = '', }: MemoryMapProps) {
  const memoryState = useSimulationStore((state) => state.memoryState);
  const totalMemory = useSimulationStore((state) => state.configParams?.totalMemory) ?? 0;
  const algorithmId = useSimulationStore((state) => state.algorithm);
  const processes = useSimulationStore((state) => state.processes ?? []);
  const processColorById = useMemo(() => {
    return new Map(processes.map((process) => [process.id, process.color]));
  }, [processes]);

  if (memoryState === null) {
    return (
      <div className="flex items-center justify-center w-full h-150 bg-gray-100 border-2 border-dashed border-gray-400 rounded-md text-gray-500 font-mono">
        ⚠️ El algoritmo "{algorithmId}" todavía no está en el registro.
      </div>
    );
  }

  return (
    <div className={`flex flex-col w-full bg-gray-100 border-2 border-black shadow-md overflow-hidden ${className}`}>
        <div className="flex flex-row m-2 flex-1 overflow-x-auto bg-gray-50">
          <AnimatePresence initial={false} mode="popLayout">
            {memoryState.map((block, index) => {
              const ownerId = block.process?.parentProcessId ?? block.process?.id;
              const resolvedColor = ownerId ? processColorById.get(ownerId) : undefined;

              return (
              <MemoryBlock 
                key={block.id} 
                block={block} 
                totalMemory={totalMemory}
                isLast={index === memoryState.length - 1}
                processColorOverride={resolvedColor}
              />
              );
            })}
          </AnimatePresence>
        </div>
    </div>
  );
}