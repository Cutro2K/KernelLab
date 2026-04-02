import { Button } from "../components/ui/Button";
import { ProcessCard, RETRO_NEUTRAL_COLORS } from "../components/visualization/ProcessCard";
import { StepControls } from '../components/visualization/StepControls';
import { type MemoryBlock, type Process } from  "../algorithms/types";
import { MemoryMap } from "../components/visualization/MemoryMap";
import { AlgorithmConfig, MemoryConfig } from "../components/forms/AlgorithmConfig";
import { useStore } from "../store/simulationStore";

export const SimProcessList = () => {
  const processes = useStore((state) => state.processes);
  const removeProcess = useStore((state) => state.removeProcess);

  return (
    <div className="flex flex-col gap-3">
      {processes && processes.length > 0 ? (
        processes.map((process) => (
          <ProcessCard
            key={process.id}
            id={process.id}
            name={process.name}
            color={process.color}
            codeSize={process.codeSize}
            dataSize={process.dataSize}
            stackSize={process.stackSize}
            heapSize={process.heapSize}
            arrivalTime={process.arrivalTime}
            duration={process.duration}
            onDelete={removeProcess}
          />
        ))
      ) : (
        <div className="border-2 border-black bg-white px-3 py-2 text-sm">No hay procesos cargados.</div>
      )}
    </div>
  );
};

export default function Simulator() {
  const addProcess = useStore((state) => state.addProcess);
  const processCount = useStore((state) => state.processes?.length ?? 0);

  const handleRandomProcesses = () => {
    const totalToAdd = Math.floor(Math.random() * 5) + 3;

    for (let i = 0; i < totalToAdd; i += 1) {
      const processNumber = processCount + i + 1;
      const codeSize = Math.floor(Math.random() * 40) + 10;
      const dataSize = Math.floor(Math.random() * 40) + 10;
      const stackSize = Math.floor(Math.random() * 30) + 8;
      const heapSize = Math.floor(Math.random() * 50) + 12;

      const process: Process = {
        id: `P${processNumber}`,
        name: `Proceso ${processNumber}`,
        codeSize,
        dataSize,
        stackSize,
        heapSize,
        size: codeSize + dataSize + stackSize + heapSize,
        arrivalTime: Math.floor(Math.random() * 20),
        duration: Math.floor(Math.random() * 50) + 10,
        color: RETRO_NEUTRAL_COLORS[Math.floor(Math.random() * RETRO_NEUTRAL_COLORS.length)],
      };

      addProcess(process);
    }
  };

  // Variables para prueba de visualizacion de memoria (en un futuro esto vendrá del estado de la simulación)
  const TOTAL_MEMORY = 512;

  const mockMemoryState: MemoryBlock[] = [
    {
      id: 'block-os',
      start: 0,
      size: 64,
      isFree: false,
      process: {
        id: 'os',
        name: 'OS',
        size: 64,
        codeSize: 24,
        dataSize: 16,
        stackSize: 8,
        heapSize: 16,
        color: '#ef4444',
        arrivalTime: 0,
        duration: 999,
      }
    },
    {
      id: 'block-1',
      start: 64,
      size: 120,
      isFree: false,
      process: {
        id: 'p1',
        name: 'P1',
        size: 120,
        codeSize: 40,
        dataSize: 30,
        stackSize: 20,
        heapSize: 30,
        color: '#60a5fa',
        arrivalTime: 0,
        duration: 5,
      }
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
      process: {
        id: 'p2',
        name: 'P2',
        size: 60,
        codeSize: 18,
        dataSize: 16,
        stackSize: 10,
        heapSize: 16,
        color: '#4ade80',
        arrivalTime: 2,
        duration: 3,
      }
    },
    {
      id: 'block-free-2',
      start: 344,
      size: 168,
      isFree: true,
      process: null
    }
  ];

  return (
    
    <div className="flex flex-col lg:flex-row gap-5 p-4 font-mono text-black max-w-[1600px] mx-auto">
      
      {/* =========================================
          COLUMNA 1: PROCESOS (25% en PC) 
      ========================================= */}
      <div className="w-full lg:w-1/4 flex flex-col gap-2 border-2 border-black px-2 py-2 bg-[#ffb6c1]/10">
        <h1 className="text-lg font-bold pl-2 pb-2">&curren; PROCESOS</h1>
        
        {/* Cambié la altura fija por max-h para que no sea inmenso en celular */}
        <div className="border-y-2 border-black py-3 max-h-[600px] flex flex-col gap-3 overflow-y-auto">
          <SimProcessList />
        </div>
        
        <div className="flex flex-col gap-2 mt-2">
          <Button variant="primary" className="border-2 border-black">[+ Agregar]</Button>
          <Button variant="secondary" onClick={handleRandomProcesses} className="border-2 border-black bg-transparent text-black hover:bg-black/10">[&curren; Random]</Button>
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

      </div>
    </div>
  );
}