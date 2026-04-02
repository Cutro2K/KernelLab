import { useEffect, useState } from 'react';
import { ProcessCard } from '../components/visualization/ProcessCard';
import { Button } from '../components/ui/Button';
import dice from "../assets/dice.svg";
import settingsIcon from "../assets/settings.svg";

type AlgorithmOption = 'First Fit' | 'Best Fit' | 'Worst Fit' | 'Next Fit';

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
};

const ALGORITHM_STYLES: Record<AlgorithmOption, { fill: string; pattern: string; label: string }> = {
  'First Fit': {
    fill: 'bg-[repeating-linear-gradient(90deg,#2f363f,#2f363f_8px,#59636d_8px,#59636d_16px)]',
    pattern: 'Lineal y estable',
    label: 'FF',
  },
  'Best Fit': {
    fill: 'bg-[repeating-linear-gradient(90deg,#7b4b22,#7b4b22_8px,#b68a5a_8px,#b68a5a_16px)]',
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
};

const ALGORITHMS: AlgorithmOption[] = ['First Fit', 'Best Fit', 'Worst Fit', 'Next Fit'];

// Vista simplificada de bloques de memoria para un snapshot puntual del algoritmo.
function MemoryPreview({ chunks }: { chunks: string[] }) {
  return (
    <div className="mt-4 border-2 border-[#111] bg-white p-3">
      <div className="grid grid-flow-col auto-cols-fr overflow-hidden border-2 border-[#111]">
        {chunks.map((chunk, index) => (
          <div
            key={`${chunk}-${index}`}
            className="border-r-2 border-[#111] bg-slate-50 px-3 py-2 text-center text-xl font-bold last:border-r-0"
          >
            {chunk}
          </div>
        ))}
      </div>
    </div>
  );
}

// Panel lateral de un algoritmo: título, estado del paso y estadísticas intermedias.
function ResultPanel({
  title,
  step,
  currentStep,
  maxStep,
}: {
  title: string;
  step: StepSnapshot;
  currentStep: number;
  maxStep: number;
}) {
  return (
    <section className="border-2 border-[#111] bg-[#f5f5f0] p-4">
      <h3 className="text-center text-2xl font-bold tracking-wide">{title.toUpperCase()}</h3>
      <div className="mt-2 text-center text-xs font-bold uppercase tracking-wide text-[#615b50]">
        Paso {currentStep + 1} / {maxStep + 1}
      </div>
      <MemoryPreview chunks={step.chunks} />
      <div className="mt-4 border-2 border-[#111] bg-[#f3ecde] p-3">
        <h4 className="text-sm font-bold uppercase tracking-wide text-[#615b50]">Estadisticas intermedias</h4>
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm font-bold">
          <div className="border border-[#111] bg-[#f8f2e4] px-2 py-1">Uso: {step.memoryUsage}%</div>
          <div className="border border-[#111] bg-[#f8f2e4] px-2 py-1">Fallos: {step.pageFaults}</div>
          <div className="border border-[#111] bg-[#f8f2e4] px-2 py-1">Frag. ext: {step.externalFragmentation}%</div>
          <div className="border border-[#111] bg-[#f8f2e4] px-2 py-1">Frag. int: {step.internalFragmentation}%</div>
          <div className="col-span-2 border border-[#111] bg-[#f8f2e4] px-2 py-1">
            Procesos en espera: {step.waitingProcesses}
          </div>
        </div>
        <Button variant="info" className="text-sm mr-2 w-full flex flex-row my-2 items-center justify-center text-center"><img src={settingsIcon} alt="Configuracion" className="mx-2 w-[16px] h-[16px]" /> Configuracion</Button>
      </div>
    </section>
  );
}

// Página principal de comparación: sincroniza ambos algoritmos, pasos y gráfico global.
export default function Comparison() {
  const [leftAlgorithm, setLeftAlgorithm] = useState<AlgorithmOption>('First Fit');
  const [rightAlgorithm, setRightAlgorithm] = useState<AlgorithmOption>('Best Fit');
  const [currentStep, setCurrentStep] = useState(0);

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
      max: 6,
      suffix: '',
      higherIsBetter: false,
    },
  ];

  return (
    <section className="w-full border-2 border-[#111] bg-[#d8d2c3] px-3 pt-4 pb-10 text-[#2f2a24] shadow-[8px_8px_0_0_rgba(17,17,17,0.12)]">
      <div className="border-2 border-[#111] bg-[#ece6da]">
        <div className="flex flex-wrap items-center gap-3 border-b-2 border-[#111] px-4 py-3 text-xl font-bold max-[640px]:text-lg">
          <span>Comparar:</span>

          <select
            value={leftAlgorithm}
            onChange={(event) => {
              setLeftAlgorithm(event.target.value as AlgorithmOption);
              setCurrentStep(0);
            }}
            className="border-2 border-[#111] bg-[#f7f2e8] px-2 py-1 text-lg font-bold"
          >
            {ALGORITHMS.map((algorithm) => (
              <option key={algorithm} value={algorithm}>
                {algorithm}
              </option>
            ))}
          </select>

          <span>vs</span>

          <select
            value={rightAlgorithm}
            onChange={(event) => {
              setRightAlgorithm(event.target.value as AlgorithmOption);
              setCurrentStep(0);
            }}
            className="border-2 border-[#111] bg-[#f7f2e8] px-2 py-1 text-lg font-bold"
          >
            {ALGORITHMS.map((algorithm) => (
              <option key={algorithm} value={algorithm}>
                {algorithm}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="ml-auto border-2 border-[#111] bg-[#d8c8af] px-3 py-1 text-lg font-bold transition hover:bg-[#c9b797] max-[640px]:ml-0"
          >
            [INICIAR]
          </button>

          <div className="flex items-center gap-2 border-2 border-[#111] bg-[#f3ecde] px-2 py-1 text-sm font-bold">
            <button
              type="button"
              onClick={() => setCurrentStep((prevStep) => Math.max(0, prevStep - 1))}
              className="border border-[#111] bg-[#e6dcc9] px-2 py-0.5 hover:bg-[#d8ccb5]"
              disabled={currentStep === 0}
            >
              ◄
            </button>
            <span>Paso {currentStep + 1} / {maxStep + 1}</span>
            <button
              type="button"
              onClick={() => setCurrentStep((prevStep) => Math.min(maxStep, prevStep + 1))}
              className="border border-[#111] bg-[#e6dcc9] px-2 py-0.5 hover:bg-[#d8ccb5]"
              disabled={currentStep === maxStep}
            >
              ►
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-0 border-b-2 border-[#111] max-[900px]:grid-cols-1">
          <ResultPanel title={leftAlgorithm} step={leftStepData} currentStep={currentStep} maxStep={maxStep} />
          <ResultPanel title={rightAlgorithm} step={rightStepData} currentStep={currentStep} maxStep={maxStep} />
        </div>
        <section className="h-75 bg-[#fbf7ef] p-2 border-2 border-[#111] m-2 overflow-y-auto overflow-x-hidden relative grid grid-cols-3 gap-3">
            <ProcessCard></ProcessCard>
            <ProcessCard></ProcessCard>
            <ProcessCard></ProcessCard>
            <ProcessCard></ProcessCard>
            <ProcessCard></ProcessCard>
            <ProcessCard></ProcessCard>
            <ProcessCard></ProcessCard>
            <ProcessCard></ProcessCard>
            <ProcessCard></ProcessCard>
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
        <section className="px-4 py-5">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="text-center text-2xl font-bold md:text-left">GRAFICO COMPARATIVO</h3>
              <p className="mt-1 text-sm font-semibold text-[#5a5348]">
                Comparación directa de rendimiento, fragmentación y fallos entre algoritmos.
              </p>
            </div>
            <div className="border-2 border-[#111] bg-[#f7f2e8] px-3 py-2 text-sm font-bold shadow-[3px_3px_0_rgba(0,0,0,0.08)]">
              Mejor resultado: <span className="text-[#7b4b22]">{betterChoice}</span>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="border-2 border-[#111] bg-[#f4eedf] p-4 shadow-[3px_3px_0_rgba(0,0,0,0.08)]">
              <p className="text-sm font-bold uppercase tracking-wide text-[#5a5348]">{leftAlgorithm}</p>
              <div className="mt-2 flex items-baseline justify-between gap-3">
                <span className="text-4xl font-bold">{leftMetrics.score}</span>
                <span className="text-sm font-bold text-[#5a5348]">score</span>
              </div>
              <div className="mt-4 h-3 border-2 border-[#111] bg-[#f8f2e4]">
                <div className={`h-full ${ALGORITHM_STYLES[leftAlgorithm].fill}`} style={{ width: `${leftMetrics.score}%` }} />
              </div>
              <p className="mt-2 text-xs font-semibold text-[#5a5348]">{ALGORITHM_STYLES[leftAlgorithm].pattern}</p>
            </div>

            <div className="border-2 border-[#111] bg-[#f4eedf] p-4 shadow-[3px_3px_0_rgba(0,0,0,0.08)]">
              <p className="text-sm font-bold uppercase tracking-wide text-[#5a5348]">{rightAlgorithm}</p>
              <div className="mt-2 flex items-baseline justify-between gap-3">
                <span className="text-4xl font-bold">{rightMetrics.score}</span>
                <span className="text-sm font-bold text-[#5a5348]">score</span>
              </div>
              <div className="mt-4 h-3 border-2 border-[#111] bg-[#f8f2e4]">
                <div className={`h-full ${ALGORITHM_STYLES[rightAlgorithm].fill}`} style={{ width: `${rightMetrics.score}%` }} />
              </div>
              <p className="mt-2 text-xs font-semibold text-[#5a5348]">{ALGORITHM_STYLES[rightAlgorithm].pattern}</p>
            </div>

            <div className="border-2 border-[#111] bg-[#ece3d2] p-4 shadow-[3px_3px_0_rgba(0,0,0,0.08)]">
              <p className="text-sm font-bold uppercase tracking-wide text-[#5a5348]">{leftAlgorithm}</p>
              <div className="mt-2 flex items-baseline justify-between gap-3">
                <span className="text-4xl font-bold">{leftMetrics.usage}%</span>
                <span className="text-sm font-bold text-[#5a5348]">uso</span>
              </div>
              <div className="mt-4 h-3 border-2 border-[#111] bg-[#f8f2e4]">
                <div className={`h-full ${ALGORITHM_STYLES[leftAlgorithm].fill}`} style={{ width: `${leftMetrics.usage}%` }} />
              </div>
              <p className="mt-2 text-xs font-semibold text-[#5a5348]">Memoria aprovechada</p>
            </div>

            <div className="border-2 border-[#111] bg-[#ece3d2] p-4 shadow-[3px_3px_0_rgba(0,0,0,0.08)]">
              <p className="text-sm font-bold uppercase tracking-wide text-[#5a5348]">{rightAlgorithm}</p>
              <div className="mt-2 flex items-baseline justify-between gap-3">
                <span className="text-4xl font-bold">{rightMetrics.usage}%</span>
                <span className="text-sm font-bold text-[#5a5348]">uso</span>
              </div>
              <div className="mt-4 h-3 border-2 border-[#111] bg-[#f8f2e4]">
                <div className={`h-full ${ALGORITHM_STYLES[rightAlgorithm].fill}`} style={{ width: `${rightMetrics.usage}%` }} />
              </div>
              <p className="mt-2 text-xs font-semibold text-[#5a5348]">Memoria aprovechada</p>
            </div>
          </div>

          <div className="mt-5 border-2 border-[#111] bg-[#f7f2e8] p-4 shadow-[4px_4px_0_rgba(0,0,0,0.08)]">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-lg font-bold">Desglose por métrica</h4>
              <div className="flex flex-wrap gap-2 text-xs font-bold uppercase tracking-wide text-[#5a5348]">
                <span className="border-2 border-[#111] bg-[#f1e6d4] px-2 py-1">{leftAlgorithm}</span>
                <span className="border-2 border-[#111] bg-[#efe0c9] px-2 py-1">{rightAlgorithm}</span>
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
                        <span className={`w-28 text-right text-xs font-bold ${leftWins ? 'text-[#7b4b22]' : 'text-[#5a5348]'}`}>
                          {leftAlgorithm}: {row.leftValue}{row.suffix}
                        </span>
                        <div className="h-4 flex-1 border-2 border-[#111] bg-[#f8f2e4]">
                          <div className={`h-full ${ALGORITHM_STYLES[leftAlgorithm].fill}`} style={{ width: `${leftWidth}%` }} />
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`w-28 text-right text-xs font-bold ${rightWins ? 'text-[#7b4b22]' : 'text-[#5a5348]'}`}>
                          {rightAlgorithm}: {row.rightValue}{row.suffix}
                        </span>
                        <div className="h-4 flex-1 border-2 border-[#111] bg-[#f8f2e4]">
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