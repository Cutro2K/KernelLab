import { Button } from "../components/ui/Button";
import { useState } from 'react';
import { ProcessCard } from "../components/visualization/ProcessCard";
import { StepControls } from '../components/visualization/StepControls';
import { type MemoryBlock , type QueuedProcess} from  "../algorithms/types";
import { MemoryMap } from "../components/visualization/MemoryMap";
import { AlgorithmConfig, MemoryConfig } from "../components/forms/AlgorithmConfig";
import { ProcessQueue } from "../components/visualization/ProcessQueue";
import { Modal } from "../components/ui/Modal";

export default function Simulator() {

  // Variables para prueba de visualizacion de memoria (en un futuro esto vendrá del estado de la simulación)
  const TOTAL_MEMORY = 512;

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
      size: 168,
      isFree: true,
      process: null
    }
  ];

  const mockProcessQueue: QueuedProcess[] = [
  // --- Procesos en Ejecución (Deberían mostrar la barra de progreso) ---
  { 
    id: 'p1', 
    name: 'P1', 
    size: 128, 
    status: 'ejecucion', 
    progress: 85 
  },
  { 
    id: 'p2', 
    name: 'P2', 
    size: 64, 
    status: 'ejecucion', 
    progress: 30 
  },

  // --- Procesos en Espera (Deberían mostrar el arrivalTime) ---
  { 
    id: 'p3', 
    name: 'P3', 
    size: 256, 
    status: 'espera', 
    arrivalTime: 3 
  },
  { 
    id: 'p4', 
    name: 'P4', 
    size: 512, 
    status: 'espera', 
    arrivalTime: 5 
  },
  { 
    id: 'p5', 
    name: 'P5', 
    size: 1024, 
    status: 'espera', 
    arrivalTime: 8 
  },

  // --- Procesos Finalizados (Solo muestran la etiqueta de finalizado) ---
  { 
    id: 'p0', 
    name: 'P0', 
    size: 32, 
    status: 'finalizado' 
  },
  { 
    id: 'p6', 
    name: 'P6', 
    size: 128, 
    status: 'finalizado' 
  }
  ];
  const [showProcessCard, setShowProcessCard] = useState(false);

  return (
    
    <div className="flex flex-col lg:flex-row gap-5 p-4 font-mono text-black max-w-[1600px] mx-auto">
      
      {/* =========================================
          COLUMNA 1: PROCESOS (25% en PC) 
      ========================================= */}
      <Modal 
        isOpen={showProcessCard} 
        onClose={() => setShowProcessCard(false)}
        title="* COLA DE PROCESOS"
        panelClassName=" shadow-[10px_10px_0_rgba(0,0,0,0.45)]"
        maxWidth="max-w-4xl" // Para que sea bien ancho
      >
        {/* max-h limita la altura y overflow-y-auto le pone barra de scrolleo si hay muchos procesos */}
        <div className="max-h-[70vh] overflow-y-auto bg-gray-100 p-2">
          {/* Acá ejecutamos el mock sin modificarlo */}
          <ProcessQueue processes={mockProcessQueue} />
        </div>
      </Modal>

      <div className="w-full lg:w-1/4 flex flex-col gap-2 border-2 border-black px-2 py-2 bg-[#ffb6c1]/10">
        <h1 className="text-lg font-bold pl-2 pb-2">&curren; PROCESOS</h1>
        
        {/* Cambié la altura fija por max-h para que no sea inmenso en celular */}
        <div className="border-y-2 border-black py-3 max-h-[600px] flex flex-col gap-3 overflow-y-auto">
          <ProcessCard/>
          <ProcessCard/>
          <ProcessCard/>
          <ProcessCard/>
        </div>
        
        <div className="flex flex-col gap-2 mt-2">
          <Button variant="primary" className="border-2 border-black">[+ Agregar]</Button>
          <Button variant="secondary" className="border-2 border-black bg-transparent text-black hover:bg-black/10">[&curren; Random]</Button>
        </div>
      </div>

      {/* =========================================
          COLUMNA 2: CONFIGURACIÓN Y MAPA (50% en PC) 
      ========================================= */}
      <div className="w-full lg:w-2/4 flex flex-col gap-5 border-2 border-black px-2 py-2 bg-[#ffb6c1]/10">

        <h1 className="text-lg font-bold pl-2 pb-1 border-b-2 border-black">&curren; CONFIGURACIÓN</h1>

        <MemoryConfig />
        <AlgorithmConfig />
        
        <h1 className="text-lg font-bold pl-2 pb-1 border-b-2 border-black">&curren; VISUALIZACIÓN DE MEMORIA</h1>
        
        <p className="px-2 text-sm text-center">Particiones (dirección baja &rarr; alta)</p>
        
        {/* Usamos w-full para que el mapa ocupe el ancho disponible */}
        <div className="w-full px-2 lg:px-6 overflow-x-auto">
          <MemoryMap
            className="mx-auto"
            memoryState={mockMemoryState} 
            totalMemory={TOTAL_MEMORY} 
            algorithmId="First Fit" 
          />      
        </div>
        
        <div className="mx-auto flex justify-center w-full">
          <StepControls
            onPlay={() => console.log('Play')}
            onPause={() => console.log('Pause')}
            onStepForward={() => console.log('Step Forward')}
            onStepBackward={() => console.log('Step Backward')}
            onReset={() => console.log('Reset')}
          />
        </div>
        
        {/* Cambié w-[400px] por max-w-[400px] w-full para evitar que rompa pantallas chicas */}
        <div className="w-full max-w-[400px] border-2 border-black mx-auto bg-transparent">
            <p className="p-4 leading-relaxed text-sm">
              &curren; PASO 3: <br/> <br /> 
              "Best Fit asigna P1 (40KB) al bloque libre de 52KB en posición 460KB. <br /> 
              Fragmentación interna: 12KB"
            </p>   
        </div>
      </div>

      {/* =========================================
          COLUMNA 3: ESTADÍSTICAS (25% en PC) 
      ========================================= */}
      <div className="w-full lg:w-1/4 flex flex-col border-2 border-black px-4 py-4 bg-[#ffb6c1]/10">
        
        <h1 className="text-lg font-bold pb-2 border-b-2 border-black mb-4">&curren; ESTADÍSTICAS</h1>

        {/* Info Básica */}
        <div className="flex flex-col gap-2 border-b-2 border-black pb-4 text-sm">
          <div className="flex justify-between"><span>Total:</span> <span>512KB</span></div>
          <div className="flex justify-between"><span>Usado:</span> <span>320KB</span></div>
          <div className="flex justify-between"><span>Libre:</span> <span>192KB</span></div>
        </div>

        {/* Barra de Progreso Visual */}
        <div className="py-4 border-b-2 border-black flex flex-col items-center gap-2">
          <div className="w-full h-8 border-2 border-black flex p-1">
            <div className="h-full bg-black/80 w-[62.5%] transition-all"></div>
          </div>
          <span className="text-sm border-2 border-black px-2 mt-1">62.5%</span>
        </div>

        {/* Detalle de Fragmentación */}
        <div className="flex flex-col gap-2 py-4 border-b-2 border-black text-sm">
          <div className="flex justify-between"><span>Frag ext:</span> <span>192KB</span></div>
          <div className="flex justify-between"><span>Bloq libre:</span> <span>2</span></div>
          <div className="flex justify-between"><span>Bloq ocup:</span> <span>3</span></div>
        </div>

        {/* Info de Cola */}
        <div className="flex flex-col gap-2 pt-4 text-sm">
          <div className="flex justify-between"><span>Activos:</span> <span>3/5</span></div>
          <div className="flex justify-between"><span>Espera:</span> <span>2</span></div>
          <div className="flex justify-between"><span>Rechazados:</span> <span>0</span></div>
        </div>
        
        <div className="flex flex-col gap-2 mt-2">
          <Button 
          variant="primary" 
          className="border-2 border-black"
          onClick={() => {setShowProcessCard(true)}}
          >[&curren; Ver Procesos]</Button>
        </div>
      </div>
    </div>
  );
}