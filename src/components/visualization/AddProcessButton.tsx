import { useMemo, useState } from 'react';
import { type Process } from '../../algorithms/types';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { RETRO_NEUTRAL_COLORS } from './ProcessCard';
import { Tooltip } from '../ui/Tooltip';
import warningIcon from '../../assets/warning.svg';
import { useComparisonStore, useSimulationStore } from '../../store/simulationStore';

type AddProcessButtonProps = {
  processes: Process[];
  onAddProcess: (process: Process) => void;
  buttonLabel?: string;
  className?: string;
};

type ProcessDraft = {
  name: string;
  codeSize: number;
  dataSize: number;
  stackSize: number;
  heapSize: number;
  arrivalTime: number;
  duration: number;
  color: string;
};

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getNextProcessNumber(processes: Process[]): number {
  const numericIds = processes
    .map((process) => Number(process.id.replace(/^P/, '')))
    .filter((value) => Number.isFinite(value) && value > 0);

  if (numericIds.length === 0) {
    return 1;
  }

  return Math.max(...numericIds) + 1;
}

function createRandomDraft(nextNumber: number): ProcessDraft {
  return {
    name: `Proceso ${nextNumber}`,
    codeSize: randomInt(10, 50),
    dataSize: randomInt(10, 50),
    stackSize: randomInt(8, 37),
    heapSize: randomInt(12, 61),
    arrivalTime: randomInt(0, 20),
    duration: randomInt(10, 60),
    color: RETRO_NEUTRAL_COLORS[randomInt(0, RETRO_NEUTRAL_COLORS.length - 1)],
  };
}

export function AddProcessButton({
  processes,
  onAddProcess,
  buttonLabel = '[+ Agregar]',
  className = '',
}: AddProcessButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState<ProcessDraft | null>(null);
  const simulationConfig = useSimulationStore((state) => state.configParams);
  const comparisonConfig1 = useComparisonStore((state) => state.configParams1);
  const comparisonConfig2 = useComparisonStore((state) => state.configParams2);

  const nextProcessNumber = useMemo(() => getNextProcessNumber(processes), [processes]);
  const totalSize = (draft?.codeSize ?? 0) + (draft?.dataSize ?? 0) + (draft?.stackSize ?? 0) + (draft?.heapSize ?? 0);
  const availableMemoryCandidates = [
    simulationConfig,
    comparisonConfig1,
    comparisonConfig2,
  ]
    .filter((config): config is NonNullable<typeof config> => config !== null)
    .map((config) => Math.max(0, config.totalMemory - (config.osSize ?? 0)));
  const availableMemory = availableMemoryCandidates.length > 0 ? Math.min(...availableMemoryCandidates) : null;
  const showSizeWarning = availableMemory !== null && totalSize > availableMemory;

  const openModal = () => {
    setDraft(createRandomDraft(nextProcessNumber));
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setDraft(null);
  };

  const handleSave = () => {
    if (!draft || showSizeWarning) return;

    const process: Process = {
      id: `P${nextProcessNumber}`,
      name: draft.name.trim() || `Proceso ${nextProcessNumber}`,
      codeSize: draft.codeSize,
      dataSize: draft.dataSize,
      stackSize: draft.stackSize,
      heapSize: draft.heapSize,
      size: totalSize,
      codeArrivalTime: draft.arrivalTime,
      dataArrivalTime: draft.arrivalTime,
      stackArrivalTime: draft.arrivalTime,
      heapArrivalTime: draft.arrivalTime,
      arrivalTime: draft.arrivalTime,
      duration: draft.duration,
      color: draft.color,
    };

    onAddProcess(process);
    closeModal();
  };

  const updateNumberField = (field: keyof Omit<ProcessDraft, 'name' | 'color'>, value: number, min = 0) => {
    setDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [field]: Math.max(min, Number.isFinite(value) ? value : min),
      };
    });
  };

  return (
    <>
      <Button variant="primary" className={className} onClick={openModal}>
        {buttonLabel}
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        title="AGREGAR PROCESO"
        maxWidth="max-w-4xl"
        overlayClassName="bg-black/70 backdrop-blur-sm"
        panelClassName="rounded-none border-2 border-[#111] bg-[#efefef] shadow-[10px_10px_0_rgba(0,0,0,0.45)]"
        headerClassName="border-b-2 border-[#111] bg-[#d4d4d4]"
        bodyClassName="bg-[#efefef]"
      >
        {draft && (
          <form className="border-2 border-[#111] bg-[#f5f5f5] p-4" onSubmit={(event) => event.preventDefault()}>
            <div className="mb-4 flex flex-col items-start justify-between gap-3 border-b-2 border-[#111] pb-3 min-[640px]:flex-row min-[640px]:gap-4">
              <div className="w-full">
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#4b5563]">Nombre del proceso</label>
                <input
                  type="text"
                  value={draft.name}
                  onChange={(event) => setDraft((prev) => (prev ? { ...prev, name: event.target.value } : prev))}
                  className="w-full border-2 border-[#111] bg-white px-2 py-1 font-bold"
                />
              </div>
              <div className="flex w-full min-w-0 gap-2 border-2 border-[#111] bg-white px-3 py-2 text-right min-[640px]:w-auto min-[640px]:min-w-40">
                {showSizeWarning && (
                  <Tooltip content={`El proceso (${totalSize}KB) supera la memoria util (${availableMemory}KB)`}>
                    <img className="w-10 h-10 self-end" src={warningIcon} alt="Warning" />
                  </Tooltip>
                )}
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#4b5563]">Tamaño total</p>
                <p className="text-xl font-black">{totalSize} KB</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <SegmentInput label="Código" value={draft.codeSize} onChange={(value) => updateNumberField('codeSize', value)} />
                <SegmentInput label="Datos" value={draft.dataSize} onChange={(value) => updateNumberField('dataSize', value)} />
                <SegmentInput label="Stack" value={draft.stackSize} onChange={(value) => updateNumberField('stackSize', value)} />
                <SegmentInput label="Heap" value={draft.heapSize} onChange={(value) => updateNumberField('heapSize', value)} />

                <label className="flex flex-col items-start justify-between gap-2 border-2 border-[#111] bg-white px-3 py-2 text-sm font-bold min-[520px]:flex-row min-[520px]:items-center min-[520px]:gap-3">
                  <span>Tiempo de llegada</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      value={draft.arrivalTime}
                      onChange={(event) => updateNumberField('arrivalTime', Number(event.target.value), 0)}
                      className="w-20 border-2 border-[#111] bg-[#fafafa] px-2 py-1 text-right min-[520px]:w-24"
                    />
                    <span className="text-xs uppercase tracking-wider text-[#4b5563]">Ciclo</span>
                  </div>
                </label>

                <label className="flex flex-col items-start justify-between gap-2 border-2 border-[#111] bg-white px-3 py-2 text-sm font-bold min-[520px]:flex-row min-[520px]:items-center min-[520px]:gap-3">
                  <span>Duración</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      value={draft.duration}
                      onChange={(event) => updateNumberField('duration', Number(event.target.value), 1)}
                      className="w-20 border-2 border-[#111] bg-[#fafafa] px-2 py-1 text-right min-[520px]:w-24"
                    />
                    <span className="text-xs uppercase tracking-wider text-[#4b5563]">Ciclos</span>
                  </div>
                </label>
              </div>

              <div className="border-2 border-[#111] bg-white p-3">
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-[#4b5563]">Color del proceso</p>
                <div className="grid grid-cols-4 gap-3 min-[520px]:grid-cols-5">
                  {RETRO_NEUTRAL_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setDraft((prev) => (prev ? { ...prev, color } : prev))}
                      className={`h-10 w-10 border-2 border-[#111] shadow-[2px_2px_0_rgba(0,0,0,0.2)] ${
                        draft.color === color ? 'ring-2 ring-[#111] ring-offset-2' : ''
                      }`}
                      style={{ backgroundColor: color }}
                      aria-label={`Seleccionar ${color}`}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2 border-t-2 border-[#111] pt-3">
              <Button variant="secondary" type="button" onClick={closeModal}>
                Cancelar
              </Button>
              <Button variant="primary" type="button" onClick={handleSave} disabled={showSizeWarning}>
                Guardar
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}

type SegmentInputProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
};

function SegmentInput({ label, value, onChange }: SegmentInputProps) {
  return (
    <label className="flex flex-col items-start justify-between gap-2 border-2 border-[#111] bg-white px-3 py-2 text-sm font-bold min-[520px]:flex-row min-[520px]:items-center min-[520px]:gap-3">
      <span className="text-base">● {label}</span>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={0}
          value={value}
          onChange={(event) => onChange(Math.max(0, Number(event.target.value) || 0))}
          className="w-20 border-2 border-[#111] bg-[#fafafa] px-2 py-1 text-right focus:outline-none min-[520px]:w-24"
        />
        <span className="text-xs uppercase tracking-wider text-[#4b5563]">KB</span>
      </div>
    </label>
  );
}
