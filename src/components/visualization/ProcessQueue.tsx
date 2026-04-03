import {type Process} from '../../algorithms/types';
import { useSimulationStore } from '../../store/simulationStore';

export function ProcessQueue() {
  const processList = useSimulationStore((state) => state.processes);
  const memoryState = useSimulationStore((state) => state.memoryState);
  const currentStep = useSimulationStore((state) => state.currentStep);
  const processInMemory = memoryState?.filter(b => !b.isFree);

  let finished = currentStep !== null ? processList?.filter(p => p.duration + p.arrivalTime < currentStep) : [];
  let running  = processInMemory !== null ? processInMemory?.map(b => b.process) as Process[] : [];
  let waiting = processList?.filter(p => !finished?.some(f => f.id === p.id) && !running?.some(r => r.id === p.id));
  waiting === undefined ? [] : waiting;
  running === undefined ? [] : running;
  finished === undefined ? [] : finished;


  const ProcessCard = ({ id, proc , status}: { id: string; proc: Process; status: string }) => (
    <div className="border-2 border-gray-800 bg-white p-3 min-w-[120px] flex flex-col gap-2 shadow-[2px_2px_0px_rgba(0,0,0,0.1)]">
      <div className="font-bold text-gray-900">• {proc.name}</div>
      <div className="text-sm">{proc.size}KB</div>
      
      {/* Contenido dinámico según el estado */}
      {status === 'running' && (
        <div className="mt-2 flex flex-col gap-1">
          {/* Barra de progreso estilo retro */}
          <div className="h-4 w-full border border-gray-800 flex bg-white">
            <div 
              className="h-full bg-gray-800 transition-all" 
              style={{ width: `${((currentStep ?? 0) - proc.arrivalTime) / proc.duration * 100}%` }}  
            />
          </div>
          <div className="text-xs text-center">{((currentStep ?? 0) - proc.arrivalTime) / proc.duration * 100}% tiempo</div>
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

  // Componente interno para las secciones (* EN EJECUCIÓN, etc.)
  const Section = ({ title, list , status}: { title: string, list: Process[], status: string }) => (
    <div className="border-2 border-gray-800 bg-gray-100 p-4 mb-4">
      <h3 className="font-bold text-lg mb-4 border-b-2 border-gray-800 inline-block">
        * {title}:
      </h3>
      <div className="flex flex-wrap gap-4">
        {list.length > 0 ? (
          list.map(p => <ProcessCard id ={p.id} proc={p} status={status} />)
        ) : (
          <span className="text-gray-500 italic text-sm">Vacío</span>
        )}
      </div>
    </div>
  );

  return (
    <div className="font-mono bg-white p-2">
      <Section title="EN EJECUCIÓN" list={running || []} status="running" />
      <Section title="EN ESPERA" list={waiting || []} status="waiting" />
      <Section title="Finalizados" list={finished || []} status="finished" />
    </div>
  );
}