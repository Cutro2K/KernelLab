import { type Process } from '../../algorithms/types';
import { useSimulationStore, useComparisonStore } from '../../store/simulationStore';

// Definimos los modos posibles que acepta el componente
interface ProcessQueueProps {
  mode?: 'simulation' | 'comparison1' | 'comparison2';
}

export function ProcessQueue({ mode = 'simulation' }: ProcessQueueProps) {
  // 1. Obtenemos datos del Simulador Principal
  const simProcesses = useSimulationStore((state) => state.processes);
  const simMemory = useSimulationStore((state) => state.memoryState);
  const simStep = useSimulationStore((state) => state.currentStep);

  // 2. Obtenemos datos del Comparador
  // Nota: En la comparación la cola de procesos es la misma para ambos
  const compProcesses = useComparisonStore((state) => state.processes);
  const compMemory1 = useComparisonStore((state) => state.memoryState1);
  const compMemory2 = useComparisonStore((state) => state.memoryState2);
  const compStep = useComparisonStore((state) => state.currentStep);

  // 3. Función que decide qué datos usar según el 'mode' elegido
  const getActiveData = () => {
    switch (mode) {
      case 'comparison1':
        return { processList: compProcesses, memoryState: compMemory1, currentStep: compStep };
      case 'comparison2':
        return { processList: compProcesses, memoryState: compMemory2, currentStep: compStep };
      case 'simulation':
      default:
        return { processList: simProcesses, memoryState: simMemory, currentStep: simStep };
    }
  };

  // Extraemos los datos correctos
  const { processList, memoryState, currentStep } = getActiveData();

  // 4. Tu lógica intacta a partir de acá
  const processInMemory = memoryState?.filter((b) => !b.isFree);

  const finished = currentStep !== null
    ? processList?.filter((p) => p.duration + p.arrivalTime < currentStep) ?? []
    : [];
  const running = processInMemory
    ?.map((b) => b.process)
    .filter((process): process is Process => process !== null) ?? [];
  const waiting = processList?.filter(
    (p) => !finished.some((f) => f.id === p.id) && !running.some((r) => r.id === p.id),
  ) ?? [];

  const ProcessCard = ({ proc , status}: {  proc: Process; status: string }) => (
    <div className="border-2 border-gray-800 bg-white p-3 min-w-[120px] flex flex-col gap-2 shadow-[2px_2px_0px_rgba(0,0,0,0.1)]">
      <div className="font-bold text-gray-900">• {proc.name}</div>
      <div className="text-sm">{proc.size}KB</div>
      
      {status === 'running' && (
        <div className="mt-2 flex flex-col gap-1">
          {(() => {
            const elapsed = (currentStep ?? 0) - proc.arrivalTime;
            const rawProgress = proc.duration > 0 ? (elapsed / proc.duration) * 100 : 0;
            const progress = Math.max(0, Math.min(100, rawProgress));

            return (
              <>
                <div className="h-4 w-full border border-gray-800 flex bg-white">
                  <div 
                    className="h-full bg-gray-800 transition-all" 
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="text-xs text-center">{Math.round(progress)}% tiempo</div>
              </>
            );
          })()}
        </div>
      )}

      {status === 'waiting' && (
        <div className="mt-2 text-xs">Llegada t = {proc.arrivalTime}</div>
      )}

      {status === 'finished' && (
        <div className="mt-2 text-xs">Finalizado</div>
      )}
    </div>
  );

  const Section = ({ title, list , status}: { title: string, list: Process[], status: string }) => (
    <div className="border-2 border-gray-800 bg-gray-100 p-4 mb-4">
      <h3 className="font-bold text-lg mb-4 border-b-2 border-gray-800 inline-block">
        * {title}:
      </h3>
      <div className="flex flex-wrap gap-4">
        {list.length > 0 ? (
          list.map((p) => <ProcessCard key={p.id} proc={p} status={status} />)
        ) : (
          <span className="text-gray-500 italic text-sm">Vacío</span>
        )}
      </div>
    </div>
  );

  return (
    <div className="font-mono bg-white p-2">
      <Section title="EN EJECUCIÓN" list={running} status="running" />
      <Section title="EN ESPERA" list={waiting} status="waiting" />
      <Section title="Finalizados" list={finished} status="finished" />
    </div>
  );
}