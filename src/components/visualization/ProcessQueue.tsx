export interface QueuedProcess {
  id: string;
  name: string;
  size: number;
  status: 'ejecucion' | 'espera' | 'finalizado';
  progress?: number;     
  arrivalTime?: number;  
}

interface ProcessQueueProps {
  processes: QueuedProcess[];
}

export function ProcessQueue({ processes }: ProcessQueueProps) {
  const enEjecucion = processes.filter(p => p.status === 'ejecucion');
  const enEspera = processes.filter(p => p.status === 'espera');
  const finalizados = processes.filter(p => p.status === 'finalizado');

  
  const ProcessCard = ({ id, proc }: { id: string; proc: QueuedProcess }) => (
    <div className="border-2 border-gray-800 bg-white p-3 min-w-[120px] flex flex-col gap-2 shadow-[2px_2px_0px_rgba(0,0,0,0.1)]">
      <div className="font-bold text-gray-900">• {proc.name}</div>
      <div className="text-sm">{proc.size}KB</div>
      
      {/* Contenido dinámico según el estado */}
      {proc.status === 'ejecucion' && (
        <div className="mt-2 flex flex-col gap-1">
          {/* Barra de progreso estilo retro */}
          <div className="h-4 w-full border border-gray-800 flex bg-white">
            <div 
              className="h-full bg-gray-800 transition-all" 
              style={{ width: `${proc.progress || 0}%` }}
            />
          </div>
          <div className="text-xs text-center">{proc.progress}% tiempo</div>
        </div>
      )}

      {proc.status === 'espera' && (
        <div className="mt-2 text-xs">Llegada t = {proc.arrivalTime}</div>
      )}

      {proc.status === 'finalizado' && (
        <div className="mt-2 text-xs">Finalizado</div>
      )}
    </div>
  );

  // Componente interno para las secciones (* EN EJECUCIÓN, etc.)
  const Section = ({ title, list }: { title: string, list: QueuedProcess[] }) => (
    <div className="border-2 border-gray-800 bg-gray-100 p-4 mb-4">
      <h3 className="font-bold text-lg mb-4 border-b-2 border-gray-800 inline-block">
        * {title}:
      </h3>
      <div className="flex flex-wrap gap-4">
        {list.length > 0 ? (
          list.map(p => <ProcessCard id ={p.id} proc={p} />)
        ) : (
          <span className="text-gray-500 italic text-sm">Vacío</span>
        )}
      </div>
    </div>
  );

  return (
    <div className="font-mono bg-white p-2">
      <Section title="EN EJECUCIÓN" list={enEjecucion} />
      <Section title="EN ESPERA" list={enEspera} />
      <Section title="Finalizados" list={finalizados} />
    </div>
  );
}