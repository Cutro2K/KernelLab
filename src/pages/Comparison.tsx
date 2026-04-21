import { useEffect, useRef, useState } from 'react';
import { ProcessCard, RETRO_NEUTRAL_COLORS } from '../components/visualization/ProcessCard';
import { Button } from '../components/ui/Button';
import { useComparisonStore } from '../store/simulationStore';
import dice from "../assets/dice.svg";
import {type AlgorithmOption, type AllocationMode } from '../algorithms/types';
import {CONTIGUOUS_ALGORITHMS, NON_CONTIGUOUS_ALGORITHMS, PAGE_REPLACEMENT_ALGORITHMS} from '../algorithms/types';
import { type Process } from '../algorithms/types';
import { type MemoryBlock } from '../algorithms/types';
import { type SimulationStep, type SimulationConfig, type PagingReferenceEvent} from '../algorithms/types';
import {computeStats, runAllocationSimulation, cloneMemoryState} from '../hooks/useAlgorithm';
import { AnimatePresence, motion } from 'framer-motion';
import { useStepController } from '../hooks/useStepController';
import { StepControls } from '../components/visualization/StepControls';
import { AddProcessButton } from '../components/visualization/AddProcessButton';
import { Tooltip } from '../components/ui/Tooltip';
import { Modal } from '../components/ui/Modal';
import { ProcessQueue } from '../components/visualization/ProcessQueue';

type SegmentationStrategy = 'First Fit' | 'Best Fit' | 'Worst Fit' | 'Next Fit';

type AlgorithmMetrics = {
  usage: number;
  externalFragmentation: number;
  internalFragmentation: number;
  osInternalFragmentation: number;
  faults: number;
  avgQueue: number;
  score: number;
};

function computeOsInternalFragmentationPercent(memoryState: MemoryBlock[]): number {
  const normalizedTotal = Math.max(1, memoryState.reduce((sum, block) => sum + block.size, 0));
  const osBlock = memoryState.find((block) => !block.isFree && block.id === 'os');

  if (!osBlock) {
    return 0;
  }

  const osUsed = Math.max(0, Math.min(osBlock.size, osBlock.usedSize ?? osBlock.process?.size ?? osBlock.size));
  const osWaste = Math.max(0, osBlock.size - osUsed);
  return Math.round((osWaste / normalizedTotal) * 100);
}

function buildMetricsFromSteps(steps: SimulationStep[], totalProcesses: number): AlgorithmMetrics {
  if (steps.length === 0) {
    return {
      usage: 0,
      externalFragmentation: 0,
      internalFragmentation: 0,
      osInternalFragmentation: 0,
      faults: 0,
      avgQueue: 0,
      score: 0,
    };
  }

  const stats = steps.map((step) => step.stats);
  const usage = Math.round(stats.reduce((sum, item) => sum + item.memoryUsage, 0) / stats.length);
  const externalFragmentation = Math.round(stats.reduce((sum, item) => sum + item.externalFragmentation, 0) / stats.length);
  const internalFragmentation = Math.round(stats.reduce((sum, item) => sum + item.internalFragmentation, 0) / stats.length);
  const osInternalFragmentation = Math.round(
    steps.reduce((sum, step) => sum + computeOsInternalFragmentationPercent(step.memoryState), 0) / steps.length,
  );
  const faults = stats.reduce((sum, item) => sum + item.pageFaults, 0);
  const avgQueue = Math.round(steps.reduce((sum, step) => sum + step.processQueue.length, 0) / steps.length);

  const normalizedProcessCount = Math.max(1, totalProcesses);

  const usageComponent = usage * 0.35;
  const externalFragmentationComponent = (100 - externalFragmentation) * 0.2;
  const internalFragmentationComponent = (100 - internalFragmentation) * 0.15;
  const queueComponent = (100 - Math.min(100, (avgQueue / normalizedProcessCount) * 100)) * 0.15;
  const faultPenalty = Math.min(20, faults * 0.8);
  const score = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        usageComponent
        + externalFragmentationComponent
        + internalFragmentationComponent
        + queueComponent
        - faultPenalty,
      ),
    ),
  );

  return { usage, externalFragmentation, internalFragmentation, osInternalFragmentation, faults, avgQueue, score };
}


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


type DisplayBlock = {
  id: string;
  label: string;
  compactLabel: string;
  tooltipLabel: string;
  identifierLabel: string;
  segmentTypeLabel?: string;
  pageNumber?: number;
  size: number;
  color?: string;
  isFree: boolean;
  isPagedSegment: boolean;
  internalFragmentation: number;
  bitsLabel?: string;
  referenceBit?: 0 | 1;
  modifiedBit?: 0 | 1;
};

function AnimatedPreviewBlock({
  block,
  previewTotal,
  isLast,
}: {
  block: DisplayBlock;
  previewTotal: number;
  isLast: boolean;
}) {
  const previousIsFree = useRef(block.isFree);
  const [allocationFade, setAllocationFade] = useState(false);
  const widthPercent = (block.size / previewTotal) * 100;
  const showFullLabel = widthPercent >= 9;
  const showCompactLabel = widthPercent >= 4.5;
  const compactLabel = block.compactLabel;
  const tooltipContent = (
    <div className="space-y-1">
      <div className="text-[11px] font-black uppercase tracking-wide">{block.isFree ? 'Bloque libre' : 'Bloque ocupado'}</div>
      <div>ID: {block.identifierLabel}</div>
      {block.isPagedSegment && <div>Tipo: {block.segmentTypeLabel ?? 'Seg'}</div>}
      {block.isPagedSegment && <div>Pagina: {block.pageNumber ?? 1}</div>}
      {block.isPagedSegment && block.referenceBit !== undefined && block.modifiedBit !== undefined && (
        <div>Bits: R={block.referenceBit} M={block.modifiedBit}</div>
      )}
      <div>Tamano: {block.size}KB</div>
      {!block.isFree && (
        <div className={block.internalFragmentation > 0 ? 'font-bold text-yellow-400' : ''}>
          Frag. Interna: {block.internalFragmentation}KB
        </div>
      )}
    </div>
  );

  useEffect(() => {
    const wasAllocated = previousIsFree.current && !block.isFree;
    previousIsFree.current = block.isFree;

    if (!wasAllocated || !block.isPagedSegment) {
      return;
    }

    setAllocationFade(true);
    const timeoutId = window.setTimeout(() => {
      setAllocationFade(false);
    }, 320);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [block.isFree, block.isPagedSegment]);

  return (
    <Tooltip content={tooltipContent} wrapperClassName="contents">
      <motion.div
      layout
      initial={{ opacity: 0, y: 8, scaleY: 0.92 }}
      animate={{
        opacity: allocationFade ? [0.2, 1] : 1,
        y: 0,
        scaleY: 1,
      }}
      exit={{ opacity: 0, y: -8, scaleY: 0.92 }}
      transition={{
        duration: 0.24,
        ease: 'easeOut',
        layout: { duration: 0.28 },
        opacity: { duration: allocationFade ? 0.32 : 0.24, ease: 'easeOut' },
      }}
      className={`relative flex min-h-18 items-center justify-center border-[#111] py-2 text-center font-black ${
        isLast ? 'border-r-0' : 'border-r-2'
      } ${
        showFullLabel ? 'px-2' : showCompactLabel ? 'px-1' : 'px-0'
      } ${
        block.isFree ? 'bg-white text-[#4b5563]' : 'text-white'
      }`}
      style={{
        width: `${widthPercent}%`,
        backgroundColor: block.isFree ? undefined : block.color,
      }}
    >
      <div className="w-full overflow-hidden text-ellipsis whitespace-nowrap leading-tight">
        {showFullLabel ? (
          <div className="flex flex-col items-center">
            <span className="w-full truncate text-xs uppercase">{block.label}</span>
            <span className="w-full truncate text-[11px] font-bold">{block.size}KB</span>
            {block.bitsLabel && <span className="w-full truncate text-[11px] font-bold">{block.bitsLabel}</span>}
          </div>
        ) : showCompactLabel ? (
          <span className="text-[10px] uppercase">{block.bitsLabel ? `${compactLabel} ${block.bitsLabel}` : compactLabel}</span>
        ) : null}
      </div>
      </motion.div>
    </Tooltip>
  );
}

function MemoryPreview({ memoryState, totalMemory, processes }: { memoryState: MemoryBlock[] | null; totalMemory: number; processes: Process[] }) {
  const normalizedTotalMemory = Math.max(1, totalMemory);
  const sourceBlocks = memoryState ?? [];
  const processColorById = new Map(processes.map((process) => [process.id, process.color]));
  const displayBlocks: DisplayBlock[] =
    sourceBlocks.length > 0
      ? sourceBlocks.map((block) => ({
          id: block.id,
          label: block.isFree
            ? 'LIBRE'
            : block.process?.parentProcessId && block.process.pageIndex !== undefined
              ? `${block.process.parentProcessId} ${block.process.segmentType ?? 'SEG'} P${block.process.pageIndex + 1}`
              : block.process?.name ?? 'OS',
          compactLabel: block.isFree
            ? 'L'
            : block.process?.parentProcessId && block.process.pageIndex !== undefined
              ? `${block.process.parentProcessId}-P${block.process.pageIndex + 1}`
              : (block.process?.name ?? 'OS').slice(0, 2).toUpperCase(),
          tooltipLabel: block.isFree
            ? `LIBRE - ${block.size}KB`
            : block.process?.parentProcessId && block.process.pageIndex !== undefined
              ? `${block.process.parentProcessId} | ${block.process.segmentType ?? 'SEG'} | Pag ${block.process.pageIndex + 1} | ${block.size}KB`
              : `${block.process?.name ?? 'OS'} - ${block.size}KB`,
          identifierLabel: block.isFree
            ? 'LIBRE'
            : block.process?.parentProcessId && block.process.pageIndex !== undefined
              ? `${block.process.parentProcessId}-P${block.process.pageIndex + 1}`
              : block.process?.name ?? 'OS',
          segmentTypeLabel: block.process?.segmentType,
          pageNumber: block.process?.pageIndex !== undefined ? block.process.pageIndex + 1 : undefined,
          size: block.size,
          color: (() => {
            if (!block.process) {
              return '#4b5563';
            }

            const ownerId = block.process.parentProcessId ?? block.process.id;
            return processColorById.get(ownerId) ?? block.process.color ?? '#4b5563';
          })(),
          isFree: block.isFree,
          isPagedSegment: Boolean(block.process?.parentProcessId && block.process.pageIndex !== undefined),
          internalFragmentation: !block.isFree
            ? Math.max(0, block.size - (block.usedSize ?? block.process?.size ?? block.size))
            : 0,
          bitsLabel:
            block.process?.parentProcessId && block.process.pageIndex !== undefined && block.pageMeta
              ? `R${block.pageMeta.referenceBit} M${block.pageMeta.modifiedBit}`
              : undefined,
          referenceBit: block.pageMeta?.referenceBit,
          modifiedBit: block.pageMeta?.modifiedBit,
        }))
      : [
          {
            id: 'free-all',
            label: 'LIBRE',
            compactLabel: 'L',
            tooltipLabel: `LIBRE - ${normalizedTotalMemory}KB`,
            identifierLabel: 'LIBRE',
            size: normalizedTotalMemory,
            isFree: true,
            isPagedSegment: false,
            internalFragmentation: 0,
            bitsLabel: undefined,
            referenceBit: undefined,
            modifiedBit: undefined,
          },
        ];

  const usedSize = displayBlocks.reduce((sum, block) => sum + block.size, 0);
  if (usedSize < normalizedTotalMemory) {
    displayBlocks.push({
      id: 'free-remainder',
      label: 'LIBRE',
      compactLabel: 'L',
      tooltipLabel: `LIBRE - ${normalizedTotalMemory - usedSize}KB`,
      identifierLabel: 'LIBRE',
      size: normalizedTotalMemory - usedSize,
      isFree: true,
      isPagedSegment: false,
      internalFragmentation: 0,
      bitsLabel: undefined,
      referenceBit: undefined,
      modifiedBit: undefined,
    });
  }

  const previewTotal = Math.max(
    1,
    displayBlocks.reduce((sum, block) => sum + block.size, 0),
  );

  return (
    <div className="mt-4 border-2 border-[#111] bg-white p-3">
      <div className="flex w-full overflow-hidden border-2 border-[#111] bg-[#f8f8f8]">
        <AnimatePresence initial={false} mode="popLayout">
          {displayBlocks.map((block, index) => (
            <AnimatedPreviewBlock
              key={block.id}
              block={block}
              previewTotal={previewTotal}
              isLast={index === displayBlocks.length - 1}
            />
          ))}
        </AnimatePresence>
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
  memoryExponent,
  onMemoryExponentChange,
  pageSizeExponent,
  onPageSizeExponentChange,
  osSize,
  onOsSizeChange,
  memoryState,
  stats,
  processQueue,
  currentStep,
  maxStep,
  processQueueFunction,
  onReferenceView,
  canViewReferences,
  processes,
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
  memoryExponent: number;
  onMemoryExponentChange: (next: number) => void;
  pageSizeExponent: number;
  onPageSizeExponentChange: (next: number) => void;
  osSize: number;
  onOsSizeChange: (next: number) => void;
  memoryState: MemoryBlock[] | null;
  stats: {
    memoryUsage: number;
    pageFaults: number;
    externalFragmentation: number;
    internalFragmentation: number;
  } | null;
  processQueue: Process[];
  currentStep: number;
  maxStep: number;
  processQueueFunction: (value : boolean) => void;
  onReferenceView: () => void;
  canViewReferences: boolean;
  processes: Process[];
}) {
  const subAlgorithmOptions = allocationMode === 'Contigua' ? CONTIGUOUS_ALGORITHMS : NON_CONTIGUOUS_ALGORITHMS;
  const showReplacementSelector = subAlgorithm === 'Paginacion Simple';
  const showSegmentationSelector = subAlgorithm === 'Segmentacion';
  const memorySize = 2 ** memoryExponent;
  const maxPageSizeExponent = Math.max(2, Math.floor(Math.log2(Math.max(4, Math.floor(memorySize / 2)))));
  const safePageSizeExponent = Math.min(pageSizeExponent, maxPageSizeExponent);
  const pageSize = 2 ** safePageSizeExponent;
  const osInternalFragmentation = memoryState ? computeOsInternalFragmentationPercent(memoryState) : 0;

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
            <label className="mt-2 flex flex-col items-start gap-2 text-sm font-bold min-[520px]:flex-row min-[520px]:items-center">
              Reemplazo de páginas:
              <select
                value={replacementAlgorithm}
                onChange={(event) => onReplacementAlgorithmChange(event.target.value as AlgorithmOption)}
                className="w-full border-2 rounded-none border-[#111] bg-white px-2 py-1 text-sm font-bold min-[520px]:w-auto"
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
            <label className="mt-2 flex flex-col items-start gap-2 text-sm font-bold min-[520px]:flex-row min-[520px]:items-center">
              Estrategia contigua:
              <select
                value={segmentationStrategy}
                onChange={(event) => onSegmentationStrategyChange(event.target.value as AlgorithmOption)}
                className="w-full border-2 rounded-none border-[#111] bg-white px-2 py-1 text-sm font-bold min-[520px]:w-auto"
              >
                {CONTIGUOUS_ALGORITHMS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          )}

          <div className="mt-3 space-y-2 border-t-2 border-[#111] pt-3">
            <div className="flex flex-col items-start gap-2 text-sm font-bold min-[520px]:flex-row min-[520px]:items-center">
              <span className="min-[520px]:min-w-35">Memoria total:</span>
              <input
                type="range"
                min={6}
                max={11}
                step={1}
                value={memoryExponent}
                onChange={(event) => onMemoryExponentChange(Number(event.target.value))}
                className="w-full accent-black min-[520px]:w-auto"
              />
              <span className="border border-[#111] bg-white px-2 py-1 font-mono text-xs">{memorySize}KB</span>
            </div>

            <div className="flex flex-col items-start gap-2 text-sm font-bold min-[520px]:flex-row min-[520px]:items-center">
              <span className="min-[520px]:min-w-35">Tamaño del OS:</span>
              <input
                type="range"
                min={32}
                max={memorySize / 2}
                step={16}
                value={osSize}
                onChange={(event) => onOsSizeChange(Number(event.target.value))}
                className="w-full accent-black min-[520px]:w-auto"
              />
              <span className="border border-[#111] bg-white px-2 py-1 font-mono text-xs">{osSize}KB</span>
            </div>

            {showReplacementSelector && (
              <div className="flex flex-col items-start gap-2 text-sm font-bold min-[520px]:flex-row min-[520px]:items-center">
                <span className="min-[520px]:min-w-35">Tamaño de página:</span>
                <input
                  type="range"
                  min={2}
                  max={maxPageSizeExponent}
                  step={1}
                  value={safePageSizeExponent}
                  onChange={(event) => onPageSizeExponentChange(Number(event.target.value))}
                  className="w-full accent-black min-[520px]:w-auto"
                />
                <span className="border border-[#111] bg-white px-2 py-1 font-mono text-xs">{pageSize}KB</span>
              </div>
            )}
          </div>
        </div>

        <div className="border-2 border-[#111] bg-white p-3">
          <h4 className="mb-2 text-sm font-bold uppercase tracking-wide text-[#4b5563]">* Visualización de memoria</h4>
          <div className="text-xs font-bold uppercase tracking-wide text-[#4b5563]">
            Paso {currentStep + 1} / {maxStep + 1}
          </div>
          <MemoryPreview memoryState={memoryState} totalMemory={memorySize} processes={processes} />
        </div>

        <div className="border-2 border-[#111] bg-white p-3">
          <h4 className="text-sm font-bold uppercase tracking-wide text-[#4b5563]">* Estadísticas intermedias</h4>
          <div className="mt-3 grid grid-cols-1 gap-2 text-sm font-bold min-[520px]:grid-cols-2">
            <div className="border border-[#111] bg-white px-2 py-1">Uso: {stats ? `${stats.memoryUsage}%` : '-'}</div>
            <div className="border border-[#111] bg-white px-2 py-1">Fallos: {stats?.pageFaults ?? '-'}</div>
            <div className="border border-[#111] bg-white px-2 py-1">Frag. ext: {stats ? `${stats.externalFragmentation}%` : '-'}</div>
            <div className="border border-[#111] bg-white px-2 py-1">Frag. int: {stats ? `${stats.internalFragmentation}%` : '-'}</div>
            <div className="border border-[#111] bg-white px-2 py-1 min-[520px]:col-span-2">Frag. int OS: {stats ? `${osInternalFragmentation}%` : '-'}</div>
            <div className="col-span-2 flex w-full">
              <div className="flex-1 border border-[#111] bg-white px-2 py-1">
                <div>Procesos en espera: {processQueue.length}</div>
                <div className="mt-1 text-xs font-semibold text-[#4b5563]">
                  {processQueue.length > 0
                    ? processQueue.map((process) => process.name).join(', ')
                    : 'Cola vacía'}
                </div>
              </div>
              <Button
                variant="primary"
                className="border-2 border-black border-l-0" 
                onClick={() => processQueueFunction(true)}
              >
                [Ver Procesos]
              </Button>
            </div>
            <Button
              variant="secondary"
              className="col-span-2 border-2 border-black"
              onClick={onReferenceView}
              disabled={!canViewReferences}
            >
              [Ver Referencias]
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function buildReferenceData(simulationSteps: SimulationStep[], activeStep: number) {
  const stepData = simulationSteps[Math.min(activeStep, Math.max(0, simulationSteps.length - 1))] ?? null;
  const currentEvents = stepData?.referenceEvents ?? [];
  const futureEvents: PagingReferenceEvent[] = [];

  for (let stepIndex = activeStep + 1; stepIndex < simulationSteps.length; stepIndex += 1) {
    const events = simulationSteps[stepIndex].referenceEvents ?? [];
    for (const event of events) {
      futureEvents.push(event);
      if (futureEvents.length >= 100) {
        break;
      }
    }
    if (futureEvents.length >= 100) {
      break;
    }
  }

  const loadedPageForecast = (() => {
    const blocks = stepData?.memoryState ?? [];
    const pagedBlocks = blocks.filter((block) => !block.isFree && block.process?.id && block.process?.pageIndex !== undefined);
    return pagedBlocks.map((block) => {
      const pageId = block.process?.id ?? '';
      const nextReference = futureEvents.find((event) => event.pageId === pageId);
      const nextWrite = futureEvents.find((event) => event.pageId === pageId && event.operation === 'write');
      return {
        label: block.process?.name ?? pageId,
        nextReferenceStep: nextReference?.step,
        nextWriteStep: nextWrite?.step,
      };
    });
  })();

  const loadedSegmentForecast = (() => {
    const blocks = stepData?.memoryState ?? [];
    const segmentMap = new Map<string, string>();

    for (const block of blocks) {
      if (block.isFree || !block.process?.segmentId) {
        continue;
      }
      const label = `${block.process.parentProcessId ?? block.process.name}-${block.process.segmentType ?? 'Seg'}`;
      segmentMap.set(block.process.segmentId, label);
    }

    return Array.from(segmentMap.entries()).map(([segmentId, label]) => {
      const nextReference = futureEvents.find((event) => event.pageId.startsWith(`${segmentId}-pg-`));
      const nextWrite = futureEvents.find(
        (event) => event.pageId.startsWith(`${segmentId}-pg-`) && event.operation === 'write',
      );
      return {
        label,
        nextReferenceStep: nextReference?.step,
        nextWriteStep: nextWrite?.step,
      };
    });
  })();

  return {
    currentEvents,
    futureEvents,
    loadedPageForecast,
    loadedSegmentForecast,
  };
}

function ReferenceTimelineModal({
  isOpen,
  onClose,
  title,
  isPagingAlgorithm,
  step,
  referenceData,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  isPagingAlgorithm: boolean;
  step: number;
  referenceData: ReturnType<typeof buildReferenceData>;
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="max-w-4xl"
    >
      <div className="max-h-[70vh] overflow-y-auto bg-gray-100 p-3 text-sm">
        {!isPagingAlgorithm ? (
          <p>Disponible solo para algoritmos de paginación.</p>
        ) : (
          <div className="space-y-4">
            <section className="border-2 border-black bg-white p-3">
              <h3 className="mb-2 font-bold">Paso actual: {step}</h3>
              {referenceData.currentEvents.length === 0 ? (
                <p>Sin referencias en este paso.</p>
              ) : (
                <div className="space-y-1">
                  {referenceData.currentEvents.map((event, index) => (
                    <div key={`${event.pageId}-${event.step}-${index}`} className="flex flex-wrap gap-2 border border-black px-2 py-1">
                      <span className="font-bold">t{event.step}</span>
                      <span>{event.processName}</span>
                      <span>{event.segmentType} P{event.pageNumber}</span>
                      <span className="font-mono uppercase">{event.operation}</span>
                      <span className={`font-bold ${event.outcome === 'hit' ? 'text-green-700' : event.outcome === 'fault' ? 'text-red-700' : 'text-amber-700'}`}>
                        {event.outcome}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="border-2 border-black bg-white p-3">
              <h3 className="mb-2 font-bold">Próximas referencias (preview)</h3>
              {referenceData.futureEvents.length === 0 ? (
                <p>No hay referencias futuras.</p>
              ) : (
                <div className="space-y-1">
                  {referenceData.futureEvents.slice(0, 25).map((event, index) => (
                    <div key={`future-${event.pageId}-${event.step}-${index}`} className="flex flex-wrap gap-2 border border-black px-2 py-1">
                      <span className="font-bold">t{event.step}</span>
                      <span>{event.processName}</span>
                      <span>{event.segmentType} P{event.pageNumber}</span>
                      <span className="font-mono uppercase">{event.operation}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="border-2 border-black bg-white p-3">
              <h3 className="mb-2 font-bold">Próximo uso por página cargada</h3>
              {referenceData.loadedPageForecast.length === 0 ? (
                <p>No hay páginas cargadas en este paso.</p>
              ) : (
                <div className="space-y-1">
                  {referenceData.loadedPageForecast.map((item) => (
                    <div key={item.label} className="flex flex-wrap justify-between gap-2 border border-black px-2 py-1">
                      <span className="font-semibold">{item.label}</span>
                      <span>Próx ref: {item.nextReferenceStep !== undefined ? `t${item.nextReferenceStep}` : '-'}</span>
                      <span>Próx modif: {item.nextWriteStep !== undefined ? `t${item.nextWriteStep}` : '-'}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="border-2 border-black bg-white p-3">
              <h3 className="mb-2 font-bold">Próximo uso por segmento cargado</h3>
              {referenceData.loadedSegmentForecast.length === 0 ? (
                <p>No hay segmentos cargados en este paso.</p>
              ) : (
                <div className="space-y-1">
                  {referenceData.loadedSegmentForecast.map((item) => (
                    <div key={item.label} className="flex flex-wrap justify-between gap-2 border border-black px-2 py-1">
                      <span className="font-semibold">{item.label}</span>
                      <span>Próx ref: {item.nextReferenceStep !== undefined ? `t${item.nextReferenceStep}` : '-'}</span>
                      <span>Próx modif: {item.nextWriteStep !== undefined ? `t${item.nextWriteStep}` : '-'}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </Modal>
  );
}

/*

*/

export const CompProcessList = () => {
  const processes = useComparisonStore((state) => state.processes);

  return (<div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
              {processes?.map((process) => (
                <ProcessCard key={process.id} 
                id={process.id} 
                name={process.name} 
                color={process.color}
                codeArrivalTime={process.codeArrivalTime}
                stackArrivalTime={process.stackArrivalTime}
                dataArrivalTime={process.dataArrivalTime}
                heapArrivalTime={process.heapArrivalTime}
                codeSize={process.codeSize}
                dataSize={process.dataSize}
                arrivalTime={process.arrivalTime} 
                duration={process.duration}
                stackSize={process.stackSize}
                heapSize={process.heapSize} />
              ))}
            </div>);
}

// Página principal de comparación: sincroniza ambos algoritmos, pasos y gráfico global.
export default function Comparison() {
  const SHARED_REFERENCE_SEED = 42;
  const SHARED_REFERENCE_LOCALITY = 0.7;
  const SHARED_MAX_REFS_PER_CYCLE = 4;
  const SHARED_NRU_RESET_INTERVAL = 4;
  const SHARED_ENABLE_WRITES = true;

  const addProcess = useComparisonStore((state) => state.addProcess);
  const setMemoryState1 = useComparisonStore((state) => state.setMemoryState1);
  const setMemoryState2 = useComparisonStore((state) => state.setMemoryState2);
  const setConfigParams1 = useComparisonStore((state) => state.setConfigParams1);
  const setConfigParams2 = useComparisonStore((state) => state.setConfigParams2);
  const setStatistics1 = useComparisonStore((state) => state.setStatistics1);
  const setStatistics2 = useComparisonStore((state) => state.setStatistics2);
  const setStoreCurrentStep = useComparisonStore((state) => state.setCurrentStep);
  const processCount = useComparisonStore((state) => state.processes?.length ?? 0);
  const processes = useComparisonStore((state) => state.processes ?? []);
  const leftMemoryState = useComparisonStore((state) => state.memoryState1);
  const rightMemoryState = useComparisonStore((state) => state.memoryState2);
  const leftStatistics = useComparisonStore((state) => state.statistics1);
  const rightStatistics = useComparisonStore((state) => state.statistics2);
  const [allocationMode, setAllocationMode] = useState<AllocationMode>('Contigua');
  const [leftSubAlgorithm, setLeftSubAlgorithm] = useState<AlgorithmOption>('First Fit');
  const [rightSubAlgorithm, setRightSubAlgorithm] = useState<AlgorithmOption>('Best Fit');
  const [leftReplacementAlgorithm, setLeftReplacementAlgorithm] = useState<AlgorithmOption>('FIFO');
  const [rightReplacementAlgorithm, setRightReplacementAlgorithm] = useState<AlgorithmOption>('LRU');
  const [leftSegmentationStrategy, setLeftSegmentationStrategy] = useState<SegmentationStrategy>('First Fit');
  const [rightSegmentationStrategy, setRightSegmentationStrategy] = useState<SegmentationStrategy>('Best Fit');
  const [leftMemoryExponent, setLeftMemoryExponent] = useState(9);
  const [rightMemoryExponent, setRightMemoryExponent] = useState(9);
  const [leftPageSizeExponent, setLeftPageSizeExponent] = useState(4);
  const [rightPageSizeExponent, setRightPageSizeExponent] = useState(4);
  const [leftOsSize, setLeftOsSize] = useState(64);
  const [rightOsSize, setRightOsSize] = useState(64);
  const [leftSteps, setLeftSteps] = useState<SimulationStep[]>([]);
  const [rightSteps, setRightSteps] = useState<SimulationStep[]>([]);
  const [autoPlayPending, setAutoPlayPending] = useState(false);
  const [isViewProces1, setViewProces1] = useState(false);
  const [isViewProces2, setViewProces2] = useState(false);
  const [isViewReferences1, setViewReferences1] = useState(false);
  const [isViewReferences2, setViewReferences2] = useState(false);
  const maxStep = Math.max(0, Math.max(leftSteps.length, rightSteps.length) - 1);
  const {
    currentStep,
    isRunning,
    play,
    pause,
    stepForward,
    stepBackward,
    reset,
  } = useStepController({ maxStep, intervalMs: 1000 });

  const handleLeftMemoryExponentChange = (next: number) => {
    setLeftMemoryExponent(next);
    setLeftOsSize((prev) => Math.min(prev, 2 ** (next - 1)));
    setLeftPageSizeExponent((prev) => {
      const nextMax = Math.max(2, Math.floor(Math.log2(Math.max(4, Math.floor((2 ** next) / 2)))));
      return Math.min(prev, nextMax);
    });
  };

  const handleRightMemoryExponentChange = (next: number) => {
    setRightMemoryExponent(next);
    setRightOsSize((prev) => Math.min(prev, 2 ** (next - 1)));
    setRightPageSizeExponent((prev) => {
      const nextMax = Math.max(2, Math.floor(Math.log2(Math.max(4, Math.floor((2 ** next) / 2)))));
      return Math.min(prev, nextMax);
    });
  };

  useEffect(() => {
    setLeftSubAlgorithm(allocationMode === 'Contigua' ? 'First Fit' : 'Paginacion Simple');
    setRightSubAlgorithm(allocationMode === 'Contigua' ? 'Best Fit' : 'Paginacion Simple');
    reset();
  }, [allocationMode]);

  useEffect(() => {
    pause();
    reset();
    setLeftSteps([]);
    setRightSteps([]);
  }, [
    allocationMode,
    leftSubAlgorithm,
    rightSubAlgorithm,
    leftReplacementAlgorithm,
    rightReplacementAlgorithm,
    leftSegmentationStrategy,
    rightSegmentationStrategy,
    leftMemoryExponent,
    rightMemoryExponent,
    leftPageSizeExponent,
    rightPageSizeExponent,
    leftOsSize,
    rightOsSize,
    processes,
    pause,
    reset,
  ]);

  const leftAlgorithmForMetrics: AlgorithmOption =
    leftSubAlgorithm === 'Paginacion Simple'
      ? leftReplacementAlgorithm
      : leftSubAlgorithm === 'Segmentacion'
        ? leftSegmentationStrategy
        : leftSubAlgorithm;

  const rightAlgorithmForMetrics: AlgorithmOption =
    rightSubAlgorithm === 'Paginacion Simple'
      ? rightReplacementAlgorithm
      : rightSubAlgorithm === 'Segmentacion'
        ? rightSegmentationStrategy
        : rightSubAlgorithm;

  const leftSimulationAlgorithm: AlgorithmOption =
    leftSubAlgorithm === 'Paginacion Simple' ? leftReplacementAlgorithm : leftSubAlgorithm;

  const rightSimulationAlgorithm: AlgorithmOption =
    rightSubAlgorithm === 'Paginacion Simple' ? rightReplacementAlgorithm : rightSubAlgorithm;

  useEffect(() => {
    const leftTotalMemory = 2 ** leftMemoryExponent;
    const rightTotalMemory = 2 ** rightMemoryExponent;
    const leftPageSize = 2 ** Math.min(leftPageSizeExponent, Math.max(2, Math.floor(Math.log2(Math.max(4, Math.floor(leftTotalMemory / 2))))));
    const rightPageSize = 2 ** Math.min(rightPageSizeExponent, Math.max(2, Math.floor(Math.log2(Math.max(4, Math.floor(rightTotalMemory / 2))))));

    setConfigParams1({
      algorithm: leftSimulationAlgorithm,
      totalMemory: leftTotalMemory,
      processes,
      osSize: leftOsSize,
      pageSize: leftSubAlgorithm === 'Paginacion Simple' ? leftPageSize : undefined,
      segmentationStrategy: leftSubAlgorithm === 'Segmentacion' ? leftSegmentationStrategy : undefined,
      referenceSeed: SHARED_REFERENCE_SEED,
      referenceLocality: SHARED_REFERENCE_LOCALITY,
      maxReferencesPerCycle: SHARED_MAX_REFS_PER_CYCLE,
      nruResetInterval: SHARED_NRU_RESET_INTERVAL,
      enableWriteReferences: SHARED_ENABLE_WRITES,
    });

    setConfigParams2({
      algorithm: rightSimulationAlgorithm,
      totalMemory: rightTotalMemory,
      processes,
      osSize: rightOsSize,
      pageSize: rightSubAlgorithm === 'Paginacion Simple' ? rightPageSize : undefined,
      segmentationStrategy: rightSubAlgorithm === 'Segmentacion' ? rightSegmentationStrategy : undefined,
      referenceSeed: SHARED_REFERENCE_SEED,
      referenceLocality: SHARED_REFERENCE_LOCALITY,
      maxReferencesPerCycle: SHARED_MAX_REFS_PER_CYCLE,
      nruResetInterval: SHARED_NRU_RESET_INTERVAL,
      enableWriteReferences: SHARED_ENABLE_WRITES,
    });
  }, [
    leftMemoryExponent,
    rightMemoryExponent,
    leftPageSizeExponent,
    rightPageSizeExponent,
    leftOsSize,
    rightOsSize,
    leftSimulationAlgorithm,
    rightSimulationAlgorithm,
    leftSubAlgorithm,
    rightSubAlgorithm,
    leftSegmentationStrategy,
    rightSegmentationStrategy,
    processes,
    setConfigParams1,
    setConfigParams2,
  ]);

  const leftCurrentStep = leftSteps[Math.min(currentStep, Math.max(0, leftSteps.length - 1))] ?? null;
  const rightCurrentStep = rightSteps[Math.min(currentStep, Math.max(0, rightSteps.length - 1))] ?? null;
  const leftReferenceData = buildReferenceData(leftSteps, currentStep);
  const rightReferenceData = buildReferenceData(rightSteps, currentStep);
  const leftCanViewReferences = leftSubAlgorithm === 'Paginacion Simple' && leftSteps.length > 0;
  const rightCanViewReferences = rightSubAlgorithm === 'Paginacion Simple' && rightSteps.length > 0;

  useEffect(() => {
    const leftStep = leftCurrentStep;
    const rightStep = rightCurrentStep;

    if (leftStep) {
      const leftTotalMemory = 2 ** leftMemoryExponent;
      setMemoryState1(cloneMemoryState(leftStep.memoryState));
      setStatistics1(leftStep.stats ?? computeStats(leftStep.memoryState, leftTotalMemory));
    }

    if (rightStep) {
      const rightTotalMemory = 2 ** rightMemoryExponent;
      setMemoryState2(cloneMemoryState(rightStep.memoryState));
      setStatistics2(rightStep.stats ?? computeStats(rightStep.memoryState, rightTotalMemory));
    }

    setStoreCurrentStep(currentStep);
  }, [
    currentStep,
    leftCurrentStep,
    rightCurrentStep,
    leftMemoryExponent,
    rightMemoryExponent,
    setMemoryState1,
    setMemoryState2,
    setStatistics1,
    setStatistics2,
    setStoreCurrentStep,
  ]);

  const leftMetrics = buildMetricsFromSteps(leftSteps, processes.length);
  const rightMetrics = buildMetricsFromSteps(rightSteps, processes.length);
  const betterChoice = leftMetrics.score >= rightMetrics.score ? leftAlgorithmForMetrics : rightAlgorithmForMetrics;
  const faultsMax = Math.max(1, leftMetrics.faults, rightMetrics.faults);
  const queueMax = Math.max(1, processes.length, leftMetrics.avgQueue, rightMetrics.avgQueue);

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
      leftValue: leftMetrics.externalFragmentation,
      rightValue: rightMetrics.externalFragmentation,
      max: 100,
      suffix: '%',
      higherIsBetter: false,
    },
    {
      label: 'Fragmentación int.',
      leftValue: leftMetrics.internalFragmentation,
      rightValue: rightMetrics.internalFragmentation,
      max: 100,
      suffix: '%',
      higherIsBetter: false,
    },
    {
      label: 'Fragmentación int. OS',
      leftValue: leftMetrics.osInternalFragmentation,
      rightValue: rightMetrics.osInternalFragmentation,
      max: 100,
      suffix: '%',
      higherIsBetter: false,
    },
    {
      label: 'Fallos de página',
      leftValue: leftMetrics.faults,
      rightValue: rightMetrics.faults,
      max: faultsMax,
      suffix: '',
      higherIsBetter: false,
    },
    {
      label: 'Cola promedio',
      leftValue: leftMetrics.avgQueue,
      rightValue: rightMetrics.avgQueue,
      max: queueMax,
      suffix: '',
      higherIsBetter: false,
    },
  ];
  // Generador de lista aleatoria de procesos, no reemplaza procesos existentes
  const handleAddRandomProcesses = () => {
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

  // Funcion que se ejecuta el presionar INICIAR
  // Se encarga de calcular cada paso y hacer las comparaciones

  const handleStartComparison = () => {
    const leftTotalMemory = 2 ** leftMemoryExponent;
    const rightTotalMemory = 2 ** rightMemoryExponent;
    const leftPageSize = 2 ** Math.min(leftPageSizeExponent, Math.max(2, Math.floor(Math.log2(Math.max(4, Math.floor(leftTotalMemory / 2))))));
    const rightPageSize = 2 ** Math.min(rightPageSizeExponent, Math.max(2, Math.floor(Math.log2(Math.max(4, Math.floor(rightTotalMemory / 2))))));
    // Configuracion izquierda
    const leftConfig: SimulationConfig = {
      algorithm: leftSimulationAlgorithm,
      totalMemory: leftTotalMemory,
      processes,
      osSize: leftOsSize,
      pageSize: leftSubAlgorithm === 'Paginacion Simple' ? leftPageSize : undefined,
      segmentationStrategy: leftSubAlgorithm === 'Segmentacion' ? leftSegmentationStrategy : undefined,
      referenceSeed: SHARED_REFERENCE_SEED,
      referenceLocality: SHARED_REFERENCE_LOCALITY,
      maxReferencesPerCycle: SHARED_MAX_REFS_PER_CYCLE,
      nruResetInterval: SHARED_NRU_RESET_INTERVAL,
      enableWriteReferences: SHARED_ENABLE_WRITES,
    };
    // Configuracion derecha
    const rightConfig: SimulationConfig = {
      algorithm: rightSimulationAlgorithm,
      totalMemory: rightTotalMemory,
      processes,
      osSize: rightOsSize,
      pageSize: rightSubAlgorithm === 'Paginacion Simple' ? rightPageSize : undefined,
      segmentationStrategy: rightSubAlgorithm === 'Segmentacion' ? rightSegmentationStrategy : undefined,
      referenceSeed: SHARED_REFERENCE_SEED,
      referenceLocality: SHARED_REFERENCE_LOCALITY,
      maxReferencesPerCycle: SHARED_MAX_REFS_PER_CYCLE,
      nruResetInterval: SHARED_NRU_RESET_INTERVAL,
      enableWriteReferences: SHARED_ENABLE_WRITES,
    };
    // Vectores de Steps: SimulationStep[]
    const generatedLeftSteps = runAllocationSimulation(leftSimulationAlgorithm, processes, leftConfig);
    const generatedRightSteps = runAllocationSimulation(rightSimulationAlgorithm, processes, rightConfig);

    setLeftSteps(generatedLeftSteps);
    setRightSteps(generatedRightSteps);

    // Setea estado global de Comparador (Zustand)
    useComparisonStore.setState((prevState) => ({
      ...prevState,
      allocationStrategy: allocationMode,
      algorithm1: leftSimulationAlgorithm,
      algorithm2: rightSimulationAlgorithm,
      currentStep: 0,
      configParams1: leftConfig,
      configParams2: rightConfig,
    }));

    reset();
    pause();
  };

  const handlePlayComparison = () => {
    const hasSteps = leftSteps.length > 0 || rightSteps.length > 0;
    if (!hasSteps) {
      handleStartComparison();
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
              onClick={handleStartComparison}
            >
              [INICIAR]
            </button>
          </div>

          <p className="mt-3 text-sm font-semibold text-[#4b5563]">
            Seleccioná la asignación de espacio y, si elegís paginación, también el reemplazo de páginas.
          </p>

          <div className="mt-4 flex items-center justify-center">
            <div className="flex w-full max-w-full flex-col items-center gap-1 text-xs font-bold min-[480px]:w-auto min-[480px]:flex-row min-[480px]:gap-3 min-[480px]:text-sm">
              { /* Ver visualization/StepControl.tsx para información */ }
              <StepControls
                onPlay={handlePlayComparison}
                onPause={pause}
                onStepForward={stepForward}
                onStepBackward={stepBackward}
                onReset={reset}
                compact
                isRunning={isRunning}
              />
              <span className="text-center">Paso {currentStep + 1} / {maxStep + 1}</span>
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
              reset();
            }}
            replacementAlgorithm={leftReplacementAlgorithm}
            onReplacementAlgorithmChange={(next) => {
              setLeftReplacementAlgorithm(next);
              reset();
            }}
            segmentationStrategy={leftSegmentationStrategy}
            onSegmentationStrategyChange={(next) => {
              setLeftSegmentationStrategy(next as SegmentationStrategy);
              reset();
            }}
            memoryExponent={leftMemoryExponent}
            onMemoryExponentChange={handleLeftMemoryExponentChange}
            pageSizeExponent={leftPageSizeExponent}
            onPageSizeExponentChange={setLeftPageSizeExponent}
            osSize={leftOsSize}
            onOsSizeChange={setLeftOsSize}
            memoryState={leftMemoryState}
            stats={leftStatistics}
            processQueue={leftCurrentStep?.processQueue ?? []}
            currentStep={currentStep}
            maxStep={maxStep}
            processQueueFunction={setViewProces1}
            onReferenceView={() => setViewReferences1(true)}
            canViewReferences={leftCanViewReferences}
            processes={processes}
          />
          <Modal 
                  isOpen={isViewProces1} 
                  onClose={() => setViewProces1(false)}
                  title="* COLA DE PROCESOS"
                  maxWidth="max-w-4xl"
                >
                  <div className="max-h-[70vh] overflow-y-auto bg-gray-100 p-2">
                    <ProcessQueue mode="comparison1"/>
                  </div>
          </Modal>
          <ReferenceTimelineModal
            isOpen={isViewReferences1}
            onClose={() => setViewReferences1(false)}
            title="* REFERENCIAS Y MODIFICACIONES (SIMULADOR A)"
            isPagingAlgorithm={leftSubAlgorithm === 'Paginacion Simple'}
            step={currentStep}
            referenceData={leftReferenceData}
          />
          <SimulatorPanel
            title="Simulador B"
            allocationMode={allocationMode}
            onAllocationModeChange={setAllocationMode}
            subAlgorithm={rightSubAlgorithm}
            onSubAlgorithmChange={(next) => {
              setRightSubAlgorithm(next);
              reset();
            }}
            replacementAlgorithm={rightReplacementAlgorithm}
            onReplacementAlgorithmChange={(next) => {
              setRightReplacementAlgorithm(next);
              reset();
            }}
            segmentationStrategy={rightSegmentationStrategy}
            onSegmentationStrategyChange={(next) => {
              setRightSegmentationStrategy(next as SegmentationStrategy);
              reset();
            }}
            memoryExponent={rightMemoryExponent}
            onMemoryExponentChange={handleRightMemoryExponentChange}
            pageSizeExponent={rightPageSizeExponent}
            onPageSizeExponentChange={setRightPageSizeExponent}
            osSize={rightOsSize}
            onOsSizeChange={setRightOsSize}
            memoryState={rightMemoryState}
            stats={rightStatistics}
            processQueue={rightCurrentStep?.processQueue ?? []}
            currentStep={currentStep}
            maxStep={maxStep}
            processQueueFunction={setViewProces2}
            onReferenceView={() => setViewReferences2(true)}
            canViewReferences={rightCanViewReferences}
            processes={processes}
          />
          <Modal 
                  isOpen={isViewProces2} 
                  onClose={() => setViewProces2(false)}
                  title="* COLA DE PROCESOS"
                  maxWidth="max-w-4xl"
                >
                  <div className="max-h-[70vh] overflow-y-auto bg-gray-100 p-2">
                    <ProcessQueue mode="comparison2"/>
                  </div>
          </Modal>
          <ReferenceTimelineModal
            isOpen={isViewReferences2}
            onClose={() => setViewReferences2(false)}
            title="* REFERENCIAS Y MODIFICACIONES (SIMULADOR B)"
            isPagingAlgorithm={rightSubAlgorithm === 'Paginacion Simple'}
            step={currentStep}
            referenceData={rightReferenceData}
          />
        </section>

        <section className="border-2 border-[#111] bg-white p-4 shadow-[6px_6px_0_rgba(17,17,17,0.08)]">
          <h3 className="mb-3 text-xl font-bold uppercase">* Procesos compartidos</h3>
          <div className="h-75 overflow-y-auto overflow-x-hidden border-2 border-[#111] bg-white p-3">
            <CompProcessList></CompProcessList>
          </div>
        </section>

        <section className="gap-2 w-full flex flex-row justify-end">
          <Button variant="info" onClick={handleAddRandomProcesses} className="flex flex-row">
            <img src={dice} alt="Randomize" className="w-5 ml-2 mr-2" />
            Generar aleatorio
          </Button>
          <AddProcessButton
            processes={processes}
            onAddProcess={addProcess}
            buttonLabel="+ Agregar proceso"
          />
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

          {leftSteps.length === 0 && rightSteps.length === 0 && (
            <p className="mb-4 border-2 border-dashed border-[#111] bg-white px-3 py-2 text-sm font-semibold text-[#4b5563]">
              Ejecutá la comparación para poblar el gráfico con métricas reales.
            </p>
          )}

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="border-2 border-[#111] bg-white p-4 shadow-[3px_3px_0_rgba(0,0,0,0.08)]">
              <p className="text-sm font-bold uppercase tracking-wide text-[#4b5563]">{leftAlgorithmForMetrics}</p>
              <div className="mt-2 flex items-baseline justify-between gap-3">
                <span className="text-4xl font-bold">{leftMetrics.score}</span>
                <span className="text-sm font-bold text-[#4b5563]">score</span>
              </div>
              <div className="mt-4 h-3 border-2 border-[#111] bg-white">
                <div className={`h-full ${ALGORITHM_STYLES[leftAlgorithmForMetrics].fill}`} style={{ width: `${leftMetrics.score}%` }} />
              </div>
              <p className="mt-2 text-xs font-semibold text-[#4b5563]">{ALGORITHM_STYLES[leftAlgorithmForMetrics].pattern}</p>
            </div>

            <div className="border-2 border-[#111] bg-white p-4 shadow-[3px_3px_0_rgba(0,0,0,0.08)]">
              <p className="text-sm font-bold uppercase tracking-wide text-[#4b5563]">{rightAlgorithmForMetrics}</p>
              <div className="mt-2 flex items-baseline justify-between gap-3">
                <span className="text-4xl font-bold">{rightMetrics.score}</span>
                <span className="text-sm font-bold text-[#4b5563]">score</span>
              </div>
              <div className="mt-4 h-3 border-2 border-[#111] bg-white">
                <div className={`h-full ${ALGORITHM_STYLES[rightAlgorithmForMetrics].fill}`} style={{ width: `${rightMetrics.score}%` }} />
              </div>
              <p className="mt-2 text-xs font-semibold text-[#4b5563]">{ALGORITHM_STYLES[rightAlgorithmForMetrics].pattern}</p>
            </div>

            <div className="border-2 border-[#111] bg-white p-4 shadow-[3px_3px_0_rgba(0,0,0,0.08)]">
              <p className="text-sm font-bold uppercase tracking-wide text-[#4b5563]">{leftAlgorithmForMetrics}</p>
              <div className="mt-2 flex items-baseline justify-between gap-3">
                <span className="text-4xl font-bold">{leftMetrics.usage}%</span>
                <span className="text-sm font-bold text-[#4b5563]">uso</span>
              </div>
              <div className="mt-4 h-3 border-2 border-[#111] bg-white">
                <div className={`h-full ${ALGORITHM_STYLES[leftAlgorithmForMetrics].fill}`} style={{ width: `${leftMetrics.usage}%` }} />
              </div>
              <p className="mt-2 text-xs font-semibold text-[#4b5563]">Memoria aprovechada</p>
            </div>

            <div className="border-2 border-[#111] bg-white p-4 shadow-[3px_3px_0_rgba(0,0,0,0.08)]">
              <p className="text-sm font-bold uppercase tracking-wide text-[#4b5563]">{rightAlgorithmForMetrics}</p>
              <div className="mt-2 flex items-baseline justify-between gap-3">
                <span className="text-4xl font-bold">{rightMetrics.usage}%</span>
                <span className="text-sm font-bold text-[#4b5563]">uso</span>
              </div>
              <div className="mt-4 h-3 border-2 border-[#111] bg-white">
                <div className={`h-full ${ALGORITHM_STYLES[rightAlgorithmForMetrics].fill}`} style={{ width: `${rightMetrics.usage}%` }} />
              </div>
              <p className="mt-2 text-xs font-semibold text-[#4b5563]">Memoria aprovechada</p>
            </div>
          </div>

          <div className="mt-5 border-2 border-[#111] bg-white p-4 shadow-[4px_4px_0_rgba(0,0,0,0.08)]">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-lg font-bold">Desglose por métrica</h4>
              <div className="flex flex-wrap gap-2 text-xs font-bold uppercase tracking-wide text-[#4b5563]">
                <span className="border-2 border-[#111] bg-white px-2 py-1">{leftAlgorithmForMetrics}</span>
                <span className="border-2 border-[#111] bg-white px-2 py-1">{rightAlgorithmForMetrics}</span>
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
                          {leftAlgorithmForMetrics}: {row.leftValue}{row.suffix}
                        </span>
                        <div className="h-4 flex-1 border-2 border-[#111] bg-white">
                          <div className={`h-full ${ALGORITHM_STYLES[leftAlgorithmForMetrics].fill}`} style={{ width: `${leftWidth}%` }} />
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`w-28 text-right text-xs font-bold ${rightWins ? 'text-[#364152]' : 'text-[#4b5563]'}`}>
                          {rightAlgorithmForMetrics}: {row.rightValue}{row.suffix}
                        </span>
                        <div className="h-4 flex-1 border-2 border-[#111] bg-white">
                          <div className={`h-full ${ALGORITHM_STYLES[rightAlgorithmForMetrics].fill}`} style={{ width: `${rightWidth}%` }} />
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