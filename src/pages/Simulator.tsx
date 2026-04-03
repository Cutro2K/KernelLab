import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { ProcessCard, RETRO_NEUTRAL_COLORS } from "../components/visualization/ProcessCard";
import { StepControls } from '../components/visualization/StepControls';
import { type Process, type SimulationStep, type SimulationConfig, type AlgorithmOption} from  "../algorithms/types";
import { MemoryMap } from "../components/visualization/MemoryMap";
import { AlgorithmConfig, MemoryConfig } from "../components/forms/AlgorithmConfig";
import { useSimulationStore } from "../store/simulationStore";
import { useEffect, useState } from 'react';
import { ProcessQueue } from "../components/visualization/ProcessQueue";
import { cloneMemoryState, computeStats, runAllocationSimulation } from "../hooks/useAlgorithm";
import { useStepController } from "../hooks/useStepController";
import { AddProcessButton } from "../components/visualization/AddProcessButton";

const PAGING_ALGORITHMS: AlgorithmOption[] = ['Paginacion Simple', 'OPT', 'FIFO', 'LRU', 'NRU', 'Segunda Oportunidad', 'Clock'];


export const SimProcessList = () => {
  const processes = useSimulationStore((state) => state.processes);
  const removeProcess = useSimulationStore((state) => state.removeProcess);

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
  const addProcess = useSimulationStore((state) => state.addProcess);
  const processes = useSimulationStore((state) => state.processes ?? []);
  const memoryState = useSimulationStore((state) => state.memoryState);
  const stats = useSimulationStore((state) => state.statistics);
  const setMemoryState = useSimulationStore((state) => state.setMemoryState);
  const setStatistics = useSimulationStore((state) => state.setStatistics);
  const setStoreCurrentStep = useSimulationStore((state) => state.setCurrentStep);
  const setConfigParams = useSimulationStore((state) => state.setConfigParams);
  const processCount = useSimulationStore((state) => state.processes?.length ?? 0);
  const [steps, setSteps] = useState<SimulationStep[]>([]);
  const [memoriaGuardada, setMemoriaGuardada] = useState<number>(512);
  const [osGuardado, setOsGuardado] = useState<number>(64);
  const [algorithm, setAlgorithm] = useState<AlgorithmOption>('First Fit');
  const [segmentationStrategy, setSegmentationStrategy] = useState<'First Fit' | 'Best Fit' | 'Worst Fit' | 'Next Fit'>('First Fit');
  const [allocationMode, setAllocationMode] = useState('Contigua');
  const [pageSize, setPageSize] = useState<number>(16);
  const [autoPlayPending, setAutoPlayPending] = useState(false);
  const maxStep = Math.max(0, steps.length - 1);
  const {
    currentStep,
    isRunning,
    play,
    pause,
    stepForward,
    stepBackward,
    reset,
  } = useStepController({ maxStep, intervalMs: 1000 });
  const currentSimulationStep = steps[Math.min(currentStep, Math.max(0, steps.length - 1))] ?? null;

  const handleRandomProcesses = () => {
    const totalToAdd = Math.floor(Math.random() * 5) + 3;

    for (let i = 0; i < totalToAdd; i += 1) {
      const processNumber = processCount + i + 1;
      const codeSize = Math.floor(Math.random() * 40) + 10;
      const dataSize = Math.floor(Math.random() * 40) + 10;
      const stackSize = Math.floor(Math.random() * 30) + 8;
      const heapSize = Math.floor(Math.random() * 50) + 12;
      const heapArrivalTime = Math.floor(Math.random() * 20);
      const stackArrivalTime = Math.floor(Math.random() * 5);
      const dataArrivalTime = Math.floor(Math.random() * 10);
      const codeArrivalTime = Math.floor(Math.random() * 15);

      const process: Process = {
        id: `P${processNumber}`,
        name: `Proceso ${processNumber}`,
        size: codeSize + dataSize + stackSize + heapSize,
        codeSize,
        dataSize,
        stackSize,
        heapSize,
        codeArrivalTime,
        stackArrivalTime,
        dataArrivalTime,
        heapArrivalTime,
        arrivalTime: Math.floor(Math.random() * 20),
        duration: Math.floor(Math.random() * 50) + 10,
        color: RETRO_NEUTRAL_COLORS[Math.floor(Math.random() * RETRO_NEUTRAL_COLORS.length)],
      };

      addProcess(process);
    }
  };
  
  // Variables para prueba de visualizacion de memoria (en un futuro esto vendrá del estado de la simulación)
  const [isViewProces, setViewProces] = useState(false);

  const runSimulation = () => {
    const config: SimulationConfig = {
      algorithm,
      totalMemory: memoriaGuardada,
      processes,
      osSize: osGuardado,
      pageSize: PAGING_ALGORITHMS.includes(algorithm) ? pageSize : undefined,
      segmentationStrategy: algorithm === 'Segmentacion' ? segmentationStrategy : undefined,
    };

    const generatedSteps = runAllocationSimulation(algorithm, processes, config);
    setSteps(generatedSteps);
    setConfigParams(config);

    useSimulationStore.setState((prevState) => ({
      ...prevState,
      allocationStrategy: allocationMode,
      algorithm,
      currentStep: 0,
      configParams: config,
    }));

    return generatedSteps;
  };

  const handlePlay = () => {
    if (steps.length === 0) {
      runSimulation();
      setAutoPlayPending(true);
      return;
    }
    play();
  };

  useEffect(() => {
    if (!autoPlayPending) {
      return;
    }

    if (maxStep > 0) {
      play();
    }

    setAutoPlayPending(false);
  }, [autoPlayPending, maxStep, play]);

  useEffect(() => {
    if (!currentSimulationStep) {
      return;
    }

    setMemoryState(cloneMemoryState(currentSimulationStep.memoryState));
    setStatistics(currentSimulationStep.stats ?? computeStats(currentSimulationStep.memoryState, memoriaGuardada));
    setStoreCurrentStep(currentStep);
  }, [currentSimulationStep, currentStep, memoriaGuardada, setMemoryState, setStatistics, setStoreCurrentStep]);

  useEffect(() => {
    pause();
    setStoreCurrentStep(0);
    setSteps([]);
  }, [algorithm, segmentationStrategy, allocationMode, memoriaGuardada, osGuardado, pageSize, processes.length, pause, setStoreCurrentStep]);

  const occupiedMemory = memoryState?.reduce((sum, block) => sum + (block.isFree ? 0 : block.size), 0) ?? 0;
  const freeMemory = Math.max(0, memoriaGuardada - occupiedMemory);
  const runningCount = memoryState?.filter((block) => !block.isFree && block.process).length ?? 0;
  const finishedCount = processes.filter((process) => process.arrivalTime + process.duration <= currentStep).length;
  const waitingCount = Math.max(0, processes.length - runningCount - finishedCount);
  const isPagingAlgorithm = PAGING_ALGORITHMS.includes(algorithm);

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
          <AddProcessButton
            processes={processes}
            onAddProcess={addProcess}
            className="border-2 border-black"
            buttonLabel="[+ Agregar]"
          />
          <Button variant="secondary" onClick={handleRandomProcesses} className="border-2 border-black bg-transparent text-black hover:bg-black/10">[&curren; Random]</Button>
        </div>
      </div>

      {/* =========================================
          COLUMNA 2: CONFIGURACIÓN Y MAPA (50% en PC) 
      ========================================= */}
      <div className="w-full lg:w-2/4 flex flex-col gap-5 border-2 border-black px-2 py-2 bg-[#ffb6c1]/10">

        <h1 className="text-lg font-bold pl-2 pb-1 border-b-2 border-black">&curren; CONFIGURACIÓN</h1>

        <MemoryConfig 
        onConfigSave={({ totalMemory, osSize }) => {
          setMemoriaGuardada(totalMemory);
          setOsGuardado(osSize);
        }} 
        />
        <AlgorithmConfig 
        totalMemory={memoriaGuardada}
        onConfigSave={({ algorithm , allocationMode, replacementAlgorithm, pageSize }) => {
          const selectedAlgorithm = allocationMode === 'No contigua' && algorithm === 'Paginacion Simple'
            ? replacementAlgorithm
            : algorithm;
          setAlgorithm(selectedAlgorithm as AlgorithmOption);
          if (pageSize !== undefined) {
            setPageSize(pageSize);
          }
          if (algorithm === 'Segmentacion') {
            setSegmentationStrategy(replacementAlgorithm as 'First Fit' | 'Best Fit' | 'Worst Fit' | 'Next Fit');
          }
          setAllocationMode(allocationMode);
        }} 
        />

        <div className="px-2">
          <Button variant="primary" className="border-2 border-black" onClick={() => {
            runSimulation();
            reset();
          }}>
            [INICIAR SIMULACIÓN]
          </Button>
        </div>
        
        <h1 className="text-lg font-bold pl-2 pb-1 border-b-2 border-black">&curren; VISUALIZACIÓN DE MEMORIA</h1>
        
        <p className="px-2 text-sm text-center">Particiones (dirección baja &rarr; alta)</p>
        
        <div className="w-full px-2 overflow-x-auto">
          <MemoryMap
            className="w-full h-24"
          />      
        </div>
        
        <div className="mx-auto flex justify-center w-full">
          <StepControls
            onPlay={handlePlay}
            onPause={pause}
            onStepForward={stepForward}
            onStepBackward={stepBackward}
            onReset={reset}
            isRunning={isRunning}
          />
        </div>
        <p className="text-center text-xs font-bold uppercase">Paso {currentStep + 1} / {maxStep + 1}</p>
        <div className="w-full px-2">
          <div className="w-full min-h-[200px] border-2 border-black bg-transparent">
            <p className="p-4 leading-relaxed text-sm">
              {currentSimulationStep?.description
                ? `¤ ${currentSimulationStep.description}`
                : 'Iniciá la simulación para ver el detalle de cada paso.'}
            </p>
          </div>
        </div>
      </div>

      {/* =========================================
          COLUMNA 3: ESTADÍSTICAS (25% en PC) 
      ========================================= */}
      <div className="w-full lg:w-1/4 flex flex-col border-2 border-black px-4 py-4 bg-[#ffb6c1]/10">
        
        <h1 className="text-lg font-bold pb-2 border-b-2 border-black mb-4">&curren; ESTADÍSTICAS</h1>

        {/* Info Básica */}
        <div className="flex flex-col gap-2 border-b-2 border-black pb-4 text-sm">
          <div className="flex justify-between"><span>Total:</span> <span>{memoriaGuardada}KB</span></div>
          <div className="flex justify-between"><span>Usado:</span> <span>{occupiedMemory}KB</span></div>
          <div className="flex justify-between"><span>Libre:</span> <span>{freeMemory}KB</span></div>
        </div>

        {/* Barra de Progreso Visual */}
        <div className="py-4 border-b-2 border-black flex flex-col items-center gap-2">
          <div className="w-full h-8 border-2 border-black flex p-1">
            <div className="h-full bg-black/80 transition-all" style={{ width: `${stats?.memoryUsage ?? 0}%` }}></div>
          </div>
          <span className="text-sm border-2 border-black px-2 mt-1">{stats?.memoryUsage ?? 0}%</span>
        </div>

        {/* Detalle de Fragmentación */}
        <div className="flex flex-col gap-2 py-4 border-b-2 border-black text-sm">
          <div className="flex justify-between"><span>Frag ext:</span> <span>{stats?.externalFragmentation ?? 0}%</span></div>
          <div className="flex justify-between"><span>Frag int:</span> <span>{stats?.internalFragmentation ?? 0}%</span></div>
          <div className="flex justify-between"><span>Bloq libre:</span> <span>{memoryState?.filter((block) => block.isFree).length ?? 0}</span></div>
          <div className="flex justify-between"><span>Bloq ocup:</span> <span>{memoryState?.filter((block) => !block.isFree).length ?? 0}</span></div>
          {isPagingAlgorithm && (
            <p className="text-xs text-slate-600">En paginacion, la fragmentacion externa se considera 0%.</p>
          )}
        </div>

        {/* Info de Cola */}
        <div className="flex flex-col gap-2 pt-4 text-sm">
          <div className="flex justify-between"><span>Activos:</span> <span>{runningCount}/{processes.length}</span></div>
          <div className="flex justify-between"><span>Espera:</span> <span>{waitingCount}</span></div>
          <div className="flex justify-between"><span>Finalizados:</span> <span>{finishedCount}</span></div>
        </div>
        <div className="flex flex-col gap-2 mt-2">
          <Button 
          variant="primary" 
          className="border-2 border-black"
          onClick={() => setViewProces(true)}
          > 
          [Ver Procesos]
          </Button>
        </div>
      </div>

      <Modal 
        isOpen={isViewProces} 
        onClose={() => setViewProces(false)}
        title="* COLA DE PROCESOS"
        maxWidth="max-w-4xl"
      >
        <div className="max-h-[70vh] overflow-y-auto bg-gray-100 p-2">
          <ProcessQueue/>
        </div>
      </Modal>

    </div>
  );
}