import { useEffect, useState } from 'react';
import { ProcessCard } from '../components/visualization/ProcessCard';
import { Button } from '../components/ui/Button';
import dice from "../assets/dice.svg";
import settingsIcon from "../assets/settings.svg";

type AlgorithmOption =
  | 'First Fit'
  | 'Best Fit'
  | 'Worst Fit'
  | 'Next Fit'
  | 'Buddy System'
  | 'Paginacion Simple'
  | 'OPT'
  | 'FIFO'
  | 'LRU'
  | 'NRU'
  | 'Segunda Oportunidad'
  | 'Clock'
  | 'Segmentacion';

type AllocationMode = 'Contigua' | 'No contigua';

type AlgorithmMetrics = {
  usage: number;
  fragmentation: number;
  faults: number;
  score: number;
};

type StepSnapshot = {
  chunks: string[];
  memoryUsage: number;
  externalFragmentation: number;
  internalFragmentation: number;
  pageFaults: number;
  waitingProcesses: number;
};

const ALGORITHM_METRICS: Record<AlgorithmOption, AlgorithmMetrics> = {
  'First Fit': { usage: 67, fragmentation: 34, faults: 3, score: 76 },
  'Best Fit': { usage: 82, fragmentation: 18, faults: 2, score: 91 },
  'Worst Fit': { usage: 74, fragmentation: 29, faults: 4, score: 69 },
  'Next Fit': { usage: 78, fragmentation: 24, faults: 3, score: 83 },
  'Buddy System': { usage: 84, fragmentation: 12, faults: 2, score: 90 },
  'Paginacion Simple': { usage: 80, fragmentation: 14, faults: 5, score: 84 },
  'OPT': { usage: 86, fragmentation: 12, faults: 3, score: 93 },
  'FIFO': { usage: 73, fragmentation: 16, faults: 7, score: 71 },
  'LRU': { usage: 81, fragmentation: 13, faults: 4, score: 88 },
  'NRU': { usage: 78, fragmentation: 15, faults: 6, score: 80 },
  'Segunda Oportunidad': { usage: 77, fragmentation: 15, faults: 5, score: 83 },
  'Clock': { usage: 79, fragmentation: 14, faults: 5, score: 85 },
  'Segmentacion': { usage: 76, fragmentation: 20, faults: 3, score: 82 },
};

const ALGORITHM_STEPS: Record<AlgorithmOption, StepSnapshot[]> = {
  'First Fit': [
    {
      chunks: ['OS', 'P1', 'FREE', 'FREE'],
      memoryUsage: 42,
      externalFragmentation: 12,
      internalFragmentation: 4,
      pageFaults: 1,
      waitingProcesses: 4,
    },
    {
      chunks: ['OS', 'P1', 'P2', 'FREE'],
      memoryUsage: 58,
      externalFragmentation: 21,
      internalFragmentation: 5,
      pageFaults: 2,
      waitingProcesses: 3,
    },
    {
      chunks: ['OS', 'P1', 'P2', 'P3'],
      memoryUsage: 67,
      externalFragmentation: 34,
      internalFragmentation: 7,
      pageFaults: 3,
      waitingProcesses: 2,
    },
  ],
  'Best Fit': [
    {
      chunks: ['OS', 'P1', 'FREE', 'FREE'],
      memoryUsage: 45,
      externalFragmentation: 10,
      internalFragmentation: 3,
      pageFaults: 1,
      waitingProcesses: 4,
    },
    {
      chunks: ['OS', 'P1', 'P3', 'FREE'],
      memoryUsage: 66,
      externalFragmentation: 16,
      internalFragmentation: 4,
      pageFaults: 2,
      waitingProcesses: 3,
    },
    {
      chunks: ['OS', 'P1', 'P3', 'P2'],
      memoryUsage: 82,
      externalFragmentation: 18,
      internalFragmentation: 5,
      pageFaults: 2,
      waitingProcesses: 1,
    },
  ],
  'Worst Fit': [
    {
      chunks: ['OS', 'P1', 'FREE', 'FREE'],
      memoryUsage: 44,
      externalFragmentation: 14,
      internalFragmentation: 4,
      pageFaults: 1,
      waitingProcesses: 4,
    },
    {
      chunks: ['OS', 'P1', 'FREE', 'P2'],
      memoryUsage: 61,
      externalFragmentation: 25,
      internalFragmentation: 6,
      pageFaults: 3,
      waitingProcesses: 3,
    },
    {
      chunks: ['OS', 'P1', 'P4', 'P2'],
      memoryUsage: 74,
      externalFragmentation: 29,
      internalFragmentation: 8,
      pageFaults: 4,
      waitingProcesses: 2,
    },
  ],
  'Next Fit': [
    {
      chunks: ['OS', 'P1', 'FREE', 'FREE'],
      memoryUsage: 43,
      externalFragmentation: 11,
      internalFragmentation: 4,
      pageFaults: 1,
      waitingProcesses: 4,
    },
    {
      chunks: ['OS', 'P1', 'P2', 'FREE'],
      memoryUsage: 64,
      externalFragmentation: 19,
      internalFragmentation: 5,
      pageFaults: 2,
      waitingProcesses: 3,
    },
    {
      chunks: ['OS', 'P1', 'P2', 'P3'],
      memoryUsage: 78,
      externalFragmentation: 24,
      internalFragmentation: 6,
      pageFaults: 3,
      waitingProcesses: 2,
    },
  ],
  'Buddy System': [
    {
      chunks: ['OS', 'B64', 'FREE', 'FREE'],
      memoryUsage: 50,
      externalFragmentation: 7,
      internalFragmentation: 4,
      pageFaults: 1,
      waitingProcesses: 4,
    },
    {
      chunks: ['OS', 'B64', 'B128', 'FREE'],
      memoryUsage: 69,
      externalFragmentation: 9,
      internalFragmentation: 6,
      pageFaults: 2,
      waitingProcesses: 3,
    },
    {
      chunks: ['OS', 'B64', 'B128', 'B256'],
      memoryUsage: 84,
      externalFragmentation: 12,
      internalFragmentation: 7,
      pageFaults: 2,
      waitingProcesses: 2,
    },
  ],
  'Paginacion Simple': [
    {
      chunks: ['SO', 'Pg0', 'Pg1', 'FREE'],
      memoryUsage: 52,
      externalFragmentation: 8,
      internalFragmentation: 6,
      pageFaults: 2,
      waitingProcesses: 4,
    },
    {
      chunks: ['SO', 'Pg0', 'Pg1', 'Pg2'],
      memoryUsage: 68,
      externalFragmentation: 10,
      internalFragmentation: 8,
      pageFaults: 4,
      waitingProcesses: 3,
    },
    {
      chunks: ['SO', 'Pg3', 'Pg1', 'Pg2'],
      memoryUsage: 80,
      externalFragmentation: 14,
      internalFragmentation: 10,
      pageFaults: 5,
      waitingProcesses: 2,
    },
  ],
  'OPT': [
    {
      chunks: ['SO', 'Pg0', 'Pg1', 'FREE'],
      memoryUsage: 58,
      externalFragmentation: 7,
      internalFragmentation: 5,
      pageFaults: 1,
      waitingProcesses: 4,
    },
    {
      chunks: ['SO', 'Pg0', 'Pg2', 'Pg3'],
      memoryUsage: 74,
      externalFragmentation: 9,
      internalFragmentation: 6,
      pageFaults: 2,
      waitingProcesses: 3,
    },
    {
      chunks: ['SO', 'Pg4', 'Pg2', 'Pg3'],
      memoryUsage: 86,
      externalFragmentation: 12,
      internalFragmentation: 7,
      pageFaults: 3,
      waitingProcesses: 2,
    },
  ],
  'FIFO': [
    {
      chunks: ['SO', 'PgA', 'PgB', 'FREE'],
      memoryUsage: 50,
      externalFragmentation: 9,
      internalFragmentation: 6,
      pageFaults: 3,
      waitingProcesses: 4,
    },
    {
      chunks: ['SO', 'PgA', 'PgC', 'PgD'],
      memoryUsage: 65,
      externalFragmentation: 12,
      internalFragmentation: 8,
      pageFaults: 5,
      waitingProcesses: 3,
    },
    {
      chunks: ['SO', 'PgE', 'PgC', 'PgD'],
      memoryUsage: 73,
      externalFragmentation: 16,
      internalFragmentation: 9,
      pageFaults: 7,
      waitingProcesses: 2,
    },
  ],
  'LRU': [
    {
      chunks: ['SO', 'Pg0', 'Pg1', 'FREE'],
      memoryUsage: 55,
      externalFragmentation: 8,
      internalFragmentation: 5,
      pageFaults: 2,
      waitingProcesses: 4,
    },
    {
      chunks: ['SO', 'Pg0', 'Pg2', 'Pg3'],
      memoryUsage: 70,
      externalFragmentation: 11,
      internalFragmentation: 7,
      pageFaults: 3,
      waitingProcesses: 3,
    },
    {
      chunks: ['SO', 'Pg4', 'Pg2', 'Pg3'],
      memoryUsage: 81,
      externalFragmentation: 13,
      internalFragmentation: 8,
      pageFaults: 4,
      waitingProcesses: 2,
    },
  ],
  'NRU': [
    {
      chunks: ['SO', 'Pg0', 'Pg1', 'FREE'],
      memoryUsage: 53,
      externalFragmentation: 10,
      internalFragmentation: 6,
      pageFaults: 3,
      waitingProcesses: 4,
    },
    {
      chunks: ['SO', 'Pg2', 'Pg1', 'Pg3'],
      memoryUsage: 68,
      externalFragmentation: 12,
      internalFragmentation: 7,
      pageFaults: 5,
      waitingProcesses: 3,
    },
    {
      chunks: ['SO', 'Pg2', 'Pg4', 'Pg3'],
      memoryUsage: 78,
      externalFragmentation: 15,
      internalFragmentation: 8,
      pageFaults: 6,
      waitingProcesses: 2,
    },
  ],
  'Segunda Oportunidad': [
    {
      chunks: ['SO', 'Pg0', 'Pg1', 'FREE'],
      memoryUsage: 54,
      externalFragmentation: 9,
      internalFragmentation: 5,
      pageFaults: 2,
      waitingProcesses: 4,
    },
    {
      chunks: ['SO', 'Pg0', 'Pg2', 'Pg3'],
      memoryUsage: 70,
      externalFragmentation: 11,
      internalFragmentation: 7,
      pageFaults: 4,
      waitingProcesses: 3,
    },
    {
      chunks: ['SO', 'Pg5', 'Pg2', 'Pg3'],
      memoryUsage: 77,
      externalFragmentation: 15,
      internalFragmentation: 8,
      pageFaults: 5,
      waitingProcesses: 2,
    },
  ],
  'Clock': [
    {
      chunks: ['SO', 'Pg0', 'Pg1', 'FREE'],
      memoryUsage: 54,
      externalFragmentation: 9,
      internalFragmentation: 5,
      pageFaults: 2,
      waitingProcesses: 4,
    },
    {
      chunks: ['SO', 'Pg0', 'Pg2', 'Pg3'],
      memoryUsage: 69,
      externalFragmentation: 11,
      internalFragmentation: 7,
      pageFaults: 4,
      waitingProcesses: 3,
    },
    {
      chunks: ['SO', 'Pg5', 'Pg2', 'Pg3'],
      memoryUsage: 79,
      externalFragmentation: 14,
      internalFragmentation: 8,
      pageFaults: 5,
      waitingProcesses: 2,
    },
  ],
  'Segmentacion': [
    {
      chunks: ['SO', 'SEG-C', 'FREE', 'FREE'],
      memoryUsage: 48,
      externalFragmentation: 10,
      internalFragmentation: 4,
      pageFaults: 1,
      waitingProcesses: 4,
    },
    {
      chunks: ['SO', 'SEG-C', 'SEG-D', 'FREE'],
      memoryUsage: 63,
      externalFragmentation: 16,
      internalFragmentation: 6,
      pageFaults: 2,
      waitingProcesses: 3,
    },
    {
      chunks: ['SO', 'SEG-C', 'SEG-D', 'SEG-S'],
      memoryUsage: 76,
      externalFragmentation: 20,
      internalFragmentation: 7,
      pageFaults: 3,
      waitingProcesses: 2,
    },
  ],
};

const ALGORITHM_STYLES: Record<AlgorithmOption, { fill: string; pattern: string; label: string }> = {
  'First Fit': {
    fill: 'bg-[repeating-linear-gradient(90deg,#2f363f,#2f363f_8px,#59636d_8px,#59636d_16px)]',
    pattern: 'Lineal y estable',
    label: 'FF',
  },
  'Best Fit': {
    fill: 'bg-[repeating-linear-gradient(90deg,#3b4d63,#3b4d63_8px,#60758d_8px,#60758d_16px)]',
    pattern: 'Más eficiente',
    label: 'BF',
  },
  'Worst Fit': {
    fill: 'bg-[repeating-linear-gradient(90deg,#59524a,#59524a_8px,#8a7f72_8px,#8a7f72_16px)]',
    pattern: 'Más disperso',
    label: 'WF',
  },
  'Next Fit': {
    fill: 'bg-[repeating-linear-gradient(90deg,#345b53,#345b53_8px,#6f8e83_8px,#6f8e83_16px)]',
    pattern: 'Recorrido continuo',
    label: 'NF',
  },
  'Buddy System': {
    fill: 'bg-[repeating-linear-gradient(90deg,#3b3b59,#3b3b59_8px,#6f6f98_8px,#6f6f98_16px)]',
    pattern: 'Partición binaria',
    label: 'BS',
  },
  'Paginacion Simple': {
    fill: 'bg-[repeating-linear-gradient(90deg,#3f3f46,#3f3f46_8px,#71717a_8px,#71717a_16px)]',
    pattern: 'Frames fijos',
    label: 'PG',
  },
  'OPT': {
    fill: 'bg-[repeating-linear-gradient(90deg,#1f3b57,#1f3b57_8px,#3b6489_8px,#3b6489_16px)]',
    pattern: 'Referencia teórica',
    label: 'OP',
  },
  'FIFO': {
    fill: 'bg-[repeating-linear-gradient(90deg,#475569,#475569_8px,#64748b_8px,#64748b_16px)]',
    pattern: 'Cola circular',
    label: 'FI',
  },
  'LRU': {
    fill: 'bg-[repeating-linear-gradient(90deg,#1f4d4d,#1f4d4d_8px,#3d7a7a_8px,#3d7a7a_16px)]',
    pattern: 'Recencia de uso',
    label: 'LR',
  },
  'NRU': {
    fill: 'bg-[repeating-linear-gradient(90deg,#5b5b3a,#5b5b3a_8px,#8a8a57_8px,#8a8a57_16px)]',
    pattern: 'No usada reciente',
    label: 'NR',
  },
  'Segunda Oportunidad': {
    fill: 'bg-[repeating-linear-gradient(90deg,#3f4a5a,#3f4a5a_8px,#66758b_8px,#66758b_16px)]',
    pattern: 'Mejora de FIFO',
    label: 'SC',
  },
  'Clock': {
    fill: 'bg-[repeating-linear-gradient(90deg,#2f4f4f,#2f4f4f_8px,#4f7a7a_8px,#4f7a7a_16px)]',
    pattern: 'Segunda oportunidad',
    label: 'CL',
  },
  'Segmentacion': {
    fill: 'bg-[repeating-linear-gradient(90deg,#4b5563,#4b5563_8px,#6b7280_8px,#6b7280_16px)]',
    pattern: 'Segmentos lógicos',
    label: 'SG',
  },
};

const CONTIGUOUS_ALGORITHMS: AlgorithmOption[] = ['First Fit', 'Next Fit', 'Best Fit', 'Worst Fit', 'Buddy System'];
const NON_CONTIGUOUS_ALGORITHMS: AlgorithmOption[] = ['Paginacion Simple', 'Segmentacion'];
const PAGE_REPLACEMENT_ALGORITHMS: AlgorithmOption[] = ['OPT', 'FIFO', 'LRU', 'NRU', 'Segunda Oportunidad', 'Clock'];

// Vista simplificada de bloques de memoria para un snapshot puntual del algoritmo.
function MemoryPreview({ chunks }: { chunks: string[] }) {
  return (
    <div className="mt-4 border-2 border-[#111] bg-white p-3">
      <div className="grid grid-flow-col auto-cols-fr overflow-hidden border-2 border-[#111]">
        {chunks.map((chunk, index) => (
          <div
            key={`${chunk}-${index}`}
            className="border-r-2 border-[#111] bg-white px-3 py-2 text-center text-xl font-bold last:border-r-0"
          >
            {chunk}
          </div>
        ))}
      </div>
    </div>
  );
}

// Panel tipo simulador para cada lado de la comparación.
function SimulatorPanel({
  title,
  allocationMode,
  onAllocationModeChange,
  subAlgorithm,
  onSubAlgorithmChange,
  replacementAlgorithm,
  onReplacementAlgorithmChange,
  segmentationStrategy,
  onSegmentationStrategyChange,
  step,
  currentStep,
  maxStep,
}: {
  title: string;
  allocationMode: AllocationMode;
  onAllocationModeChange: (next: AllocationMode) => void;
  subAlgorithm: AlgorithmOption;
  onSubAlgorithmChange: (next: AlgorithmOption) => void;
  replacementAlgorithm: AlgorithmOption;
  onReplacementAlgorithmChange: (next: AlgorithmOption) => void;
  segmentationStrategy: AlgorithmOption;
  onSegmentationStrategyChange: (next: AlgorithmOption) => void;
  step: StepSnapshot;
  currentStep: number;
  maxStep: number;
}) {
  const subAlgorithmOptions = allocationMode === 'Contigua' ? CONTIGUOUS_ALGORITHMS : NON_CONTIGUOUS_ALGORITHMS;
  const showReplacementSelector = subAlgorithm === 'Paginacion Simple';
  const showSegmentationSelector = subAlgorithm === 'Segmentacion';

  return (
    <section className="border-2 border-[#111] bg-white p-4 shadow-[6px_6px_0_rgba(17,17,17,0.1)]">
      <header className="mb-4 border-b-2 border-[#111] pb-2">
        <h3 className="text-xl font-bold uppercase tracking-wide">{title}</h3>
      </header>

      <div className="space-y-4">
        <div className="border-2 border-[#111] bg-white p-3">
          <h4 className="mb-2 text-sm font-bold uppercase tracking-wide text-[#4b5563]">* Configuración</h4>
          <label className="mb-2 flex items-center gap-2 text-sm font-bold">
            Tipo de asignación:
            <select
              value={allocationMode}
              onChange={(event) => onAllocationModeChange(event.target.value as AllocationMode)}
              className="border-2 rounded-none border-[#111] bg-white px-2 py-1 text-sm font-bold"
            >
              <option value="Contigua">Contigua</option>
              <option value="No contigua">No contigua</option>
            </select>
          </label>

          <label className="flex items-center gap-2 text-sm font-bold">
            Sub algoritmo:
            <select
              value={subAlgorithm}
              onChange={(event) => onSubAlgorithmChange(event.target.value as AlgorithmOption)}
              className="border-2 rounded-none border-[#111] bg-white px-2 py-1 text-sm font-bold"
            >
              {subAlgorithmOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          {showReplacementSelector && (
            <label className="mt-2 flex items-center gap-2 text-sm font-bold">
              Reemplazo de páginas:
              <select
                value={replacementAlgorithm}
                onChange={(event) => onReplacementAlgorithmChange(event.target.value as AlgorithmOption)}
                className="border-2 rounded-none border-[#111] bg-white px-2 py-1 text-sm font-bold"
              >
                {PAGE_REPLACEMENT_ALGORITHMS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          )}

          {showSegmentationSelector && (
            <label className="mt-2 flex items-center gap-2 text-sm font-bold">
              Estrategia contigua:
              <select
                value={segmentationStrategy}
                onChange={(event) => onSegmentationStrategyChange(event.target.value as AlgorithmOption)}
                className="border-2 rounded-none border-[#111] bg-white px-2 py-1 text-sm font-bold"
              >
                {CONTIGUOUS_ALGORITHMS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        <div className="border-2 border-[#111] bg-white p-3">
          <h4 className="mb-2 text-sm font-bold uppercase tracking-wide text-[#4b5563]">* Visualización de memoria</h4>
          <div className="text-xs font-bold uppercase tracking-wide text-[#4b5563]">
            Paso {currentStep + 1} / {maxStep + 1}
          </div>
          <MemoryPreview chunks={step.chunks} />
        </div>

        <div className="border-2 border-[#111] bg-white p-3">
          <h4 className="text-sm font-bold uppercase tracking-wide text-[#4b5563]">* Estadísticas intermedias</h4>
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm font-bold">
            <div className="border border-[#111] bg-white px-2 py-1">Uso: {step.memoryUsage}%</div>
            <div className="border border-[#111] bg-white px-2 py-1">Fallos: {step.pageFaults}</div>
            <div className="border border-[#111] bg-white px-2 py-1">Frag. ext: {step.externalFragmentation}%</div>
            <div className="border border-[#111] bg-white px-2 py-1">Frag. int: {step.internalFragmentation}%</div>
            <div className="col-span-2 border border-[#111] bg-white px-2 py-1">
              Procesos en espera: {step.waitingProcesses}
            </div>
          </div>
          <Button variant="info" className="mt-3 w-full text-sm flex items-center justify-center">
            <img src={settingsIcon} alt="Configuracion" className="mr-2 h-4 w-4" />
            Configuracion
          </Button>
        </div>
      </div>
    </section>
  );
}

// Página principal de comparación: sincroniza ambos algoritmos, pasos y gráfico global.
export default function Comparison() {
  const [allocationMode, setAllocationMode] = useState<AllocationMode>('Contigua');
  const [leftSubAlgorithm, setLeftSubAlgorithm] = useState<AlgorithmOption>('First Fit');
  const [rightSubAlgorithm, setRightSubAlgorithm] = useState<AlgorithmOption>('Best Fit');
  const [leftReplacementAlgorithm, setLeftReplacementAlgorithm] = useState<AlgorithmOption>('FIFO');
  const [rightReplacementAlgorithm, setRightReplacementAlgorithm] = useState<AlgorithmOption>('LRU');
  const [leftSegmentationStrategy, setLeftSegmentationStrategy] = useState<AlgorithmOption>('First Fit');
  const [rightSegmentationStrategy, setRightSegmentationStrategy] = useState<AlgorithmOption>('Best Fit');
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    setLeftSubAlgorithm(allocationMode === 'Contigua' ? 'First Fit' : 'Paginacion Simple');
    setRightSubAlgorithm(allocationMode === 'Contigua' ? 'Best Fit' : 'Paginacion Simple');
    setCurrentStep(0);
  }, [allocationMode]);

  const leftAlgorithm: AlgorithmOption =
    leftSubAlgorithm === 'Paginacion Simple'
      ? leftReplacementAlgorithm
      : leftSubAlgorithm === 'Segmentacion'
        ? leftSegmentationStrategy
        : leftSubAlgorithm;

  const rightAlgorithm: AlgorithmOption =
    rightSubAlgorithm === 'Paginacion Simple'
      ? rightReplacementAlgorithm
      : rightSubAlgorithm === 'Segmentacion'
        ? rightSegmentationStrategy
        : rightSubAlgorithm;

  const leftSteps = ALGORITHM_STEPS[leftAlgorithm];
  const rightSteps = ALGORITHM_STEPS[rightAlgorithm];
  const maxStep = Math.max(leftSteps.length, rightSteps.length) - 1;

  useEffect(() => {
    setCurrentStep((prevStep) => Math.min(prevStep, maxStep));
  }, [maxStep]);

  const leftStepData = leftSteps[Math.min(currentStep, leftSteps.length - 1)];
  const rightStepData = rightSteps[Math.min(currentStep, rightSteps.length - 1)];

  const leftMetrics = ALGORITHM_METRICS[leftAlgorithm];
  const rightMetrics = ALGORITHM_METRICS[rightAlgorithm];
  const betterChoice = leftMetrics.score >= rightMetrics.score ? leftAlgorithm : rightAlgorithm;

  const comparisonRows = [
    {
      label: 'Uso de memoria',
      leftValue: leftMetrics.usage,
      rightValue: rightMetrics.usage,
      max: 100,
      suffix: '%',
      higherIsBetter: true,
    },
    {
      label: 'Fragmentación ext.',
      leftValue: leftMetrics.fragmentation,
      rightValue: rightMetrics.fragmentation,
      max: 40,
      suffix: '%',
      higherIsBetter: false,
    },
    {
      label: 'Fallos de página',
      leftValue: leftMetrics.faults,
      rightValue: rightMetrics.faults,
      max: 10,
      suffix: '',
      higherIsBetter: false,
    },
  ];

  return (
    <section className="w-full bg-white px-3 py-4 text-[#2f2a24]">
      <div className="mx-auto max-w-375 space-y-6">
        <section className="border-2 border-[#111] bg-white p-4 shadow-[6px_6px_0_rgba(17,17,17,0.1)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold uppercase tracking-wide">Comparador de simuladores</h2>
              <p className="text-sm font-semibold text-[#4b5563]">Dos ejecuciones en paralelo con paso sincronizado y categoría de comparación unificada.</p>
            </div>
            <button
              type="button"
              className="border-2 border-[#111] bg-white px-3 py-1 text-base font-bold transition hover:bg-white"
            >
              [INICIAR]
            </button>
          </div>

          <p className="mt-3 text-sm font-semibold text-[#4b5563]">
            Seleccioná la asignación de espacio y, si elegís paginación, también el reemplazo de páginas.
          </p>

          <div className="mt-4 flex items-center justify-center">
            <div className="flex items-center gap-2 border-2 border-[#111] bg-white px-3 py-2 text-sm font-bold">
              <button
                type="button"
                onClick={() => setCurrentStep((prevStep) => Math.max(0, prevStep - 1))}
                className="border border-[#111] bg-white px-2 py-0.5 hover:bg-white"
                disabled={currentStep === 0}
              >
                ◄
              </button>
              <span>Paso {currentStep + 1} / {maxStep + 1}</span>
              <button
                type="button"
                onClick={() => setCurrentStep((prevStep) => Math.min(maxStep, prevStep + 1))}
                className="border border-[#111] bg-white px-2 py-0.5 hover:bg-white"
                disabled={currentStep === maxStep}
              >
                ►
              </button>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <SimulatorPanel
            title="Simulador A"
            allocationMode={allocationMode}
            onAllocationModeChange={setAllocationMode}
            subAlgorithm={leftSubAlgorithm}
            onSubAlgorithmChange={(next) => {
              setLeftSubAlgorithm(next);
              setCurrentStep(0);
            }}
            replacementAlgorithm={leftReplacementAlgorithm}
            onReplacementAlgorithmChange={(next) => {
              setLeftReplacementAlgorithm(next);
              setCurrentStep(0);
            }}
            segmentationStrategy={leftSegmentationStrategy}
            onSegmentationStrategyChange={(next) => {
              setLeftSegmentationStrategy(next);
              setCurrentStep(0);
            }}
            step={leftStepData}
            currentStep={currentStep}
            maxStep={maxStep}
          />
          <SimulatorPanel
            title="Simulador B"
            allocationMode={allocationMode}
            onAllocationModeChange={setAllocationMode}
            subAlgorithm={rightSubAlgorithm}
            onSubAlgorithmChange={(next) => {
              setRightSubAlgorithm(next);
              setCurrentStep(0);
            }}
            replacementAlgorithm={rightReplacementAlgorithm}
            onReplacementAlgorithmChange={(next) => {
              setRightReplacementAlgorithm(next);
              setCurrentStep(0);
            }}
            segmentationStrategy={rightSegmentationStrategy}
            onSegmentationStrategyChange={(next) => {
              setRightSegmentationStrategy(next);
              setCurrentStep(0);
            }}
            step={rightStepData}
            currentStep={currentStep}
            maxStep={maxStep}
          />
        </section>

        <section className="border-2 border-[#111] bg-white p-4 shadow-[6px_6px_0_rgba(17,17,17,0.08)]">
          <h3 className="mb-3 text-xl font-bold uppercase">* Procesos compartidos</h3>
          <div className="h-75 overflow-y-auto overflow-x-hidden border-2 border-[#111] bg-white p-3">
            <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
              <ProcessCard></ProcessCard>
              <ProcessCard></ProcessCard>
              <ProcessCard></ProcessCard>
              <ProcessCard></ProcessCard>
              <ProcessCard></ProcessCard>
              <ProcessCard></ProcessCard>
              <ProcessCard></ProcessCard>
              <ProcessCard></ProcessCard>
              <ProcessCard></ProcessCard>
            </div>
          </div>
        </section>

        <section className="gap-2 w-full flex flex-row justify-end">
          <Button variant="info" className="flex flex-row">
            <img src={dice} alt="Randomize" className="w-5 ml-2 mr-2" />
            Generar aleatorio
          </Button>
          <Button variant="primary">
            + Agregar proceso
          </Button>
        </section>
        <section className="border-2 border-[#111] bg-white px-4 py-5 shadow-[6px_6px_0_rgba(17,17,17,0.08)]">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="text-center text-2xl font-bold md:text-left">GRAFICO COMPARATIVO</h3>
              <p className="mt-1 text-sm font-semibold text-[#4b5563]">
                Comparación directa de rendimiento, fragmentación y fallos entre algoritmos.
              </p>
            </div>
            <div className="border-2 border-[#111] bg-white px-3 py-2 text-sm font-bold shadow-[3px_3px_0_rgba(0,0,0,0.08)]">
              Mejor resultado: <span className="text-[#364152]">{betterChoice}</span>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="border-2 border-[#111] bg-white p-4 shadow-[3px_3px_0_rgba(0,0,0,0.08)]">
              <p className="text-sm font-bold uppercase tracking-wide text-[#4b5563]">{leftAlgorithm}</p>
              <div className="mt-2 flex items-baseline justify-between gap-3">
                <span className="text-4xl font-bold">{leftMetrics.score}</span>
                <span className="text-sm font-bold text-[#4b5563]">score</span>
              </div>
              <div className="mt-4 h-3 border-2 border-[#111] bg-white">
                <div className={`h-full ${ALGORITHM_STYLES[leftAlgorithm].fill}`} style={{ width: `${leftMetrics.score}%` }} />
              </div>
              <p className="mt-2 text-xs font-semibold text-[#4b5563]">{ALGORITHM_STYLES[leftAlgorithm].pattern}</p>
            </div>

            <div className="border-2 border-[#111] bg-white p-4 shadow-[3px_3px_0_rgba(0,0,0,0.08)]">
              <p className="text-sm font-bold uppercase tracking-wide text-[#4b5563]">{rightAlgorithm}</p>
              <div className="mt-2 flex items-baseline justify-between gap-3">
                <span className="text-4xl font-bold">{rightMetrics.score}</span>
                <span className="text-sm font-bold text-[#4b5563]">score</span>
              </div>
              <div className="mt-4 h-3 border-2 border-[#111] bg-white">
                <div className={`h-full ${ALGORITHM_STYLES[rightAlgorithm].fill}`} style={{ width: `${rightMetrics.score}%` }} />
              </div>
              <p className="mt-2 text-xs font-semibold text-[#4b5563]">{ALGORITHM_STYLES[rightAlgorithm].pattern}</p>
            </div>

            <div className="border-2 border-[#111] bg-white p-4 shadow-[3px_3px_0_rgba(0,0,0,0.08)]">
              <p className="text-sm font-bold uppercase tracking-wide text-[#4b5563]">{leftAlgorithm}</p>
              <div className="mt-2 flex items-baseline justify-between gap-3">
                <span className="text-4xl font-bold">{leftMetrics.usage}%</span>
                <span className="text-sm font-bold text-[#4b5563]">uso</span>
              </div>
              <div className="mt-4 h-3 border-2 border-[#111] bg-white">
                <div className={`h-full ${ALGORITHM_STYLES[leftAlgorithm].fill}`} style={{ width: `${leftMetrics.usage}%` }} />
              </div>
              <p className="mt-2 text-xs font-semibold text-[#4b5563]">Memoria aprovechada</p>
            </div>

            <div className="border-2 border-[#111] bg-white p-4 shadow-[3px_3px_0_rgba(0,0,0,0.08)]">
              <p className="text-sm font-bold uppercase tracking-wide text-[#4b5563]">{rightAlgorithm}</p>
              <div className="mt-2 flex items-baseline justify-between gap-3">
                <span className="text-4xl font-bold">{rightMetrics.usage}%</span>
                <span className="text-sm font-bold text-[#4b5563]">uso</span>
              </div>
              <div className="mt-4 h-3 border-2 border-[#111] bg-white">
                <div className={`h-full ${ALGORITHM_STYLES[rightAlgorithm].fill}`} style={{ width: `${rightMetrics.usage}%` }} />
              </div>
              <p className="mt-2 text-xs font-semibold text-[#4b5563]">Memoria aprovechada</p>
            </div>
          </div>

          <div className="mt-5 border-2 border-[#111] bg-white p-4 shadow-[4px_4px_0_rgba(0,0,0,0.08)]">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-lg font-bold">Desglose por métrica</h4>
              <div className="flex flex-wrap gap-2 text-xs font-bold uppercase tracking-wide text-[#4b5563]">
                <span className="border-2 border-[#111] bg-white px-2 py-1">{leftAlgorithm}</span>
                <span className="border-2 border-[#111] bg-white px-2 py-1">{rightAlgorithm}</span>
              </div>
            </div>

            <div className="space-y-5">
              {comparisonRows.map((row) => {
                const leftWidth = Math.max(6, Math.round((row.leftValue / row.max) * 100));
                const rightWidth = Math.max(6, Math.round((row.rightValue / row.max) * 100));
                const leftWins = row.higherIsBetter ? row.leftValue >= row.rightValue : row.leftValue <= row.rightValue;
                const rightWins = row.higherIsBetter ? row.rightValue >= row.leftValue : row.rightValue <= row.leftValue;

                return (
                  <div key={row.label} className="grid gap-2 md:grid-cols-[180px_minmax(0,1fr)] md:items-center">
                    <div className="text-sm font-bold uppercase tracking-wide text-[#4b5563]">{row.label}</div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className={`w-28 text-right text-xs font-bold ${leftWins ? 'text-[#364152]' : 'text-[#4b5563]'}`}>
                          {leftAlgorithm}: {row.leftValue}{row.suffix}
                        </span>
                        <div className="h-4 flex-1 border-2 border-[#111] bg-white">
                          <div className={`h-full ${ALGORITHM_STYLES[leftAlgorithm].fill}`} style={{ width: `${leftWidth}%` }} />
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`w-28 text-right text-xs font-bold ${rightWins ? 'text-[#364152]' : 'text-[#4b5563]'}`}>
                          {rightAlgorithm}: {row.rightValue}{row.suffix}
                        </span>
                        <div className="h-4 flex-1 border-2 border-[#111] bg-white">
                          <div className={`h-full ${ALGORITHM_STYLES[rightAlgorithm].fill}`} style={{ width: `${rightWidth}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}