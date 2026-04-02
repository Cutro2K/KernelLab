import { useState } from 'react';
import { ProcessCard } from '../components/visualization/ProcessCard';

type AlgorithmOption = 'First Fit' | 'Best Fit' | 'Worst Fit' | 'Next Fit';

const ALGORITHMS: AlgorithmOption[] = ['First Fit', 'Best Fit', 'Worst Fit', 'Next Fit'];

function MemoryPreview({ mode }: { mode: AlgorithmOption }) {
  const chunks =
    mode === 'Best Fit'
      ? ['OS', 'P1', 'P2', 'FREE']
      : mode === 'Worst Fit'
        ? ['OS', 'P1', 'FREE', 'P2']
        : mode === 'Next Fit'
          ? ['OS', 'P1', 'P2', 'P3']
          : ['OS', 'P1', 'P2'];

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

function ResultPanel({
  title,
  mode,
  frag,
  faults,
}: {
  title: string;
  mode: AlgorithmOption;
  frag: string;
  faults: number;
}) {
  return (
    <section className="border-2 border-[#111] bg-[#f5f5f0] p-4">
      <h3 className="text-center text-2xl font-bold tracking-wide">{title.toUpperCase()}</h3>
      <MemoryPreview mode={mode} />
      <div className="mt-6 space-y-2 text-xl font-bold">
        <p>Frag ext: {frag}</p>
        <p>Fallos: {faults}</p>
      </div>
    </section>
  );
}

export default function Comparison() {
  const [leftAlgorithm, setLeftAlgorithm] = useState<AlgorithmOption>('First Fit');
  const [rightAlgorithm, setRightAlgorithm] = useState<AlgorithmOption>('Best Fit');

  const leftUsage = leftAlgorithm === 'First Fit' ? 67 : leftAlgorithm === 'Best Fit' ? 82 : 74;
  const rightUsage = rightAlgorithm === 'Best Fit' ? 82 : rightAlgorithm === 'First Fit' ? 67 : 78;

  return (
    <section className="w-full border-2 border-[#111] bg-slate-200 px-3 pt-4 pb-10 text-[#2a2d31] shadow-[8px_8px_0_0_rgba(17,17,17,0.15)]">
      <div className="border-2 border-[#111] bg-[#ececec]">
        <div className="flex flex-wrap items-center gap-3 border-b-2 border-[#111] px-4 py-3 text-xl font-bold max-[640px]:text-lg">
          <span>Comparar:</span>

          <select
            value={leftAlgorithm}
            onChange={(event) => setLeftAlgorithm(event.target.value as AlgorithmOption)}
            className="border-2 border-[#111] bg-white px-2 py-1 text-lg font-bold"
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
            onChange={(event) => setRightAlgorithm(event.target.value as AlgorithmOption)}
            className="border-2 border-[#111] bg-white px-2 py-1 text-lg font-bold"
          >
            {ALGORITHMS.map((algorithm) => (
              <option key={algorithm} value={algorithm}>
                {algorithm}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="ml-auto border-2 border-[#111] bg-[#d7d7d7] px-3 py-1 text-lg font-bold transition hover:bg-[#c5c5c5] max-[640px]:ml-0"
          >
            [INICIAR]
          </button>
        </div>

        <div className="grid grid-cols-2 gap-0 border-b-2 border-[#111] max-[900px]:grid-cols-1">
          <ResultPanel title={leftAlgorithm} mode={leftAlgorithm} frag="45KB" faults={3} />
          <ResultPanel title={rightAlgorithm} mode={rightAlgorithm} frag="23KB" faults={2} />
        </div>
        <section className="h-[300px] bg-white gap-2 p-2 border-2 border-[#111] m-2 overflow-y-auto overflow-x-hidden relative grid grid-cols-3 gap-3">
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
        <section className="px-4 py-4">
          <h3 className="mb-4 text-center text-2xl font-bold">GRAFICO COMPARATIVO</h3>

          <div className="space-y-3 text-xl font-bold max-[640px]:text-lg">
            <div className="flex items-center gap-4">
              <div className="h-8 w-24 border-2 border-[#111] bg-[repeating-linear-gradient(90deg,#1f2937,#1f2937_6px,#374151_6px,#374151_12px)]" />
              <span>
                {leftAlgorithm} (uso: {leftUsage}%)
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div className="h-8 w-32 border-2 border-[#111] bg-[repeating-linear-gradient(90deg,#111827,#111827_7px,#1f2937_7px,#1f2937_14px)]" />
              <span>
                {rightAlgorithm} (uso: {rightUsage}%)
              </span>
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}