// src/pages/Simulator.tsx
import { useState } from 'react';
import { StepControls } from '../components/visualization/StepControls';
import { MemoryMap } from '../components/visualization/MemoryMap';
import { ProcessQueue, type QueuedProcess } from '../components/visualization/ProcessQueue';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { type MemoryBlock } from '../algorithms/types'; // Asegurate de que la ruta sea correcta

export default function Simulator() {
  const [isRunning, setIsRunning] = useState(false);
  const [isQueueModalOpen, setIsQueueModalOpen] = useState(false);

  // 1. DATOS DE MENTIRA: Simulamos una RAM de 512KB
  const TOTAL_MEMORY = 512;

  // Creamos un estado de memoria "a mano" como si el algoritmo ya hubiera corrido
  const mockMemoryState: MemoryBlock[] = [
    {
      id: 'block-os',
      start: 0,
      size: 64,
      isFree: false,
      process: { id: 'os', name: 'OS', size: 64, color: 'bg-red-200', arrivalTime: 0, duration: 999 }
    },
    {
      id: 'block-1',
      start: 64,
      size: 120,
      isFree: false,
      process: { id: 'p1', name: 'P1', size: 120, color: 'bg-blue-200', arrivalTime: 0, duration: 5 }
    },
    {
      id: 'block-free-1',
      start: 184,
      size: 100,
      isFree: true,
      process: null
    },
    {
      id: 'block-2',
      start: 284,
      size: 60,
      isFree: false,
      process: { id: 'p2', name: 'P2', size: 60, color: 'bg-green-200', arrivalTime: 2, duration: 3 }
    },
    {
      id: 'block-free-2',
      start: 344,
      size: 168, // El resto hasta llegar a 512
      isFree: true,
      process: null
    }
  ];

  // 2. DATOS DE LA COLA (Los que usamos antes)
  const mockProcesses: QueuedProcess[] = [
    { id: '1', name: 'P1', size: 120, status: 'ejecucion', progress: 60 },
    { id: '2', name: 'P2', size: 60, status: 'ejecucion', progress: 10 },
    { id: '4', name: 'P4', size: 200, status: 'espera', arrivalTime: 4 },
  ];

  return (
    <div className="p-10 flex flex-col gap-6 font-mono max-w-6xl mx-auto">
      
      {/* Cabecera */}
      <div className="flex justify-between items-end border-b-2 border-gray-800 pb-4">
        <div>
          <h1 className="text-3xl font-bold font-sans uppercase">Simulador de Memoria</h1>
          <p className="text-gray-600 mt-1">Algoritmo actual: <span className="font-bold text-blue-600">First Fit</span></p>
        </div>
        <Button variant="primary" onClick={() => setIsQueueModalOpen(true)}>
          Ver Cola de Procesos
        </Button>
      </div>
      
      {/* Controles */}
      <div className="bg-gray-100 p-2 rounded border border-gray-300 w-fit">
        <StepControls 
          onPlay={() => setIsRunning(true)}
          onPause={() => setIsRunning(false)}
          onStepForward={() => console.log("Avanzando un paso...")}
          onStepBackward={() => console.log("Retrocediendo un paso...")}
          onReset={() => setIsRunning(false)}
          isRunning={isRunning} 
        />
      </div>

      {/* Mapa de Memoria Visual */}
      <div className="mt-4">
        <MemoryMap 
          memoryState={mockMemoryState} 
          totalMemory={TOTAL_MEMORY} 
          algorithmId="first-fit" 
        />
      </div>

      {/* Modal de la Cola */}
      <Modal 
        isOpen={isQueueModalOpen} 
        onClose={() => setIsQueueModalOpen(false)}
        title="* COLA DE PROCESOS"
        maxWidth="max-w-4xl"
      >
        <div className="max-h-[70vh] overflow-y-auto">
          <ProcessQueue processes={mockProcesses} />
        </div>
      </Modal>

    </div>
  );
}