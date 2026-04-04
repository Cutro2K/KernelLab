import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button.tsx';

type ProcessItem = {
  id: number;
  name: string;
  color: string;
  units: number;
};

type MemoryBlock = {
  id: number;
  processId?: number;
  name?: string;
  color?: string;
};

const INITIAL_QUEUE: ProcessItem[] = [
  { id: 1, name: 'Proceso_01', color: '#6f6f6f', units: 3 },
  { id: 2, name: 'Proceso_02', color: '#a8a8a8', units: 3 },
  { id: 3, name: 'Proceso_03', color: '#d89a9f', units: 4 },
  { id: 4, name: 'Proceso_04', color: '#7a8e72', units: 3 },
  { id: 5, name: 'Proceso_05', color: '#9f96d6', units: 3 },
];

const INITIAL_MEMORY: MemoryBlock[] = Array.from({ length: 16 }, (_, index) => ({ id: index + 1 }));

type FlyingState = {
  process: ProcessItem;
  targetIndex: number;
  units: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  fromWidth: number;
  fromHeight: number;
  toWidth: number;
  toHeight: number;
};

function findNextAllocationStart(memory: MemoryBlock[], units: number): number {
  if (units <= 0 || units > memory.length) {
    return -1;
  }

  for (let start = 0; start <= memory.length - units; start += 1) {
    let canFit = true;

    for (let offset = 0; offset < units; offset += 1) {
      if (memory[start + offset].processId) {
        canFit = false;
        break;
      }
    }

    if (canFit) {
      return start;
    }
  }

  return -1;
}

export default function Home() {
  const [queue, setQueue] = useState<ProcessItem[]>(INITIAL_QUEUE);
  const [memory, setMemory] = useState<MemoryBlock[]>(INITIAL_MEMORY);
  const [flying, setFlying] = useState<FlyingState | null>(null);
  const [retryTick, setRetryTick] = useState(0);

  const sceneRef = useRef<HTMLDivElement | null>(null);
  const queueBoxRef = useRef<HTMLDivElement | null>(null);
  const memoryGridRef = useRef<HTMLDivElement | null>(null);

  const nextAllocation = useMemo(() => {
    if (queue.length === 0) {
      return null;
    }

    const process = queue[0];
    const startIndex = findNextAllocationStart(memory, process.units);

    if (startIndex === -1) {
      return null;
    }

    return { process, startIndex };
  }, [memory, queue]);

  const finishMove = () => {
    if (!flying) {
      return;
    }

    const { process, targetIndex, units } = flying;
    setMemory((prev) =>
      prev.map((block, index) =>
        index >= targetIndex && index < targetIndex + units
          ? {
              ...block,
              processId: process.id,
              name: index === targetIndex ? process.name : undefined,
              color: process.color,
            }
          : block,
      ),
    );
    setFlying(null);
  };

  const resetDemo = () => {
    setQueue(INITIAL_QUEUE);
    setMemory(INITIAL_MEMORY);
    setFlying(null);
  };

  useEffect(() => {
    if (!flying) {
      return;
    }

    // Advance state even if framer misses animation-complete callback.
    const commitTimer = window.setTimeout(() => {
      finishMove();
    }, 820);

    return () => window.clearTimeout(commitTimer);
  }, [flying]);

  useEffect(() => {
    if (flying) {
      return;
    }

    if (nextAllocation) {
      const playTimer = window.setTimeout(() => {
        const { process, startIndex } = nextAllocation;

        if (!sceneRef.current || !queueBoxRef.current || !memoryGridRef.current) {
          setRetryTick((prev) => prev + 1);
          return;
        }

        const sceneRect = sceneRef.current.getBoundingClientRect();
        const queueRect = queueBoxRef.current.getBoundingClientRect();
        const gridRect = memoryGridRef.current.getBoundingClientRect();

        const fromWidth = queueRect.width - 8;
        const fromHeight = 24;
        const fromX = queueRect.left - sceneRect.left + 4;
        const fromY = queueRect.top - sceneRect.top + 4;

        const slotHeight = gridRect.height / 16;
        const toWidth = gridRect.width;
        const rawToX = gridRect.left - sceneRect.left;
        const toX = Math.min(Math.max(rawToX, 0), Math.max(0, sceneRect.width - toWidth));
        const toY = gridRect.top - sceneRect.top + startIndex * slotHeight;
        const toHeight = process.units * slotHeight;

        setFlying({
          process,
          targetIndex: startIndex,
          units: process.units,
          fromX,
          fromY,
          toX,
          toY,
          fromWidth,
          fromHeight,
          toWidth,
          toHeight,
        });
        setQueue((prev) => prev.slice(1));
      }, 850);

      return () => window.clearTimeout(playTimer);
    }

    const resetTimer = window.setTimeout(() => {
      resetDemo();
    }, 1100);

    return () => window.clearTimeout(resetTimer);
  }, [flying, nextAllocation, retryTick]);

  return (
    <div className="mx-auto my-5 max-w-6xl border-2 border-[#111] bg-[#d8d8d8] p-6 shadow-[8px_8px_0_0_rgba(17,17,17,0.15)]">
      <h1 className="mx-auto text-center text-3xl font-bold text-gray-800">
        Kernel-Lab - Visualizador de memoria
      </h1>
      <p className="mx-auto my-5 max-w-4xl text-base text-gray-700">
        Kernel-Lab es una innovadora herramienta educativa e interactiva diseñada para mostrarte,
        paso a paso, como operan los algoritmos de planificacion de memoria. A traves de
        visualizaciones animadas, podras comprender desde las tecnicas de asignacion contigua hasta
        los complejos sistemas de reemplazo de paginas. Toma el control total de cada simulacion:
        configura el tamano de la memoria y los procesos, avanza a tu propio ritmo con los
        controles de reproduccion, y compara la eficiencia de dos algoritmos diferentes lado a
        lado.
      </p>

      <div className="mx-auto flex max-w-4xl flex-row gap-5 max-[640px]:flex-col">
        <Link className="w-full" to="/simulator">
          <Button variant="primary" className="w-full">
            Comenzar simulacion +
          </Button>
        </Link>
        <Link className="w-full" to="/about">
          <Button variant="info" className="w-full">
            Ver documentacion
          </Button>
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto border-2 border-[#111] bg-[#ececec] p-4">
        <div ref={sceneRef} className="relative mx-auto flex min-w-215 items-start justify-center gap-24 bg-[#f2f2f2] px-14 py-10">
          <section className="flex flex-col items-center pt-28">
            <p className="mb-2 text-center text-3xl text-[#3f3f3f]">Cola de procesos</p>
            <div ref={queueBoxRef} className="relative h-36 w-52 overflow-hidden border-[3px] border-[#111] bg-[#e9e9e9] p-1">
              <AnimatePresence>
                {queue.map((process, index) => (
                  <motion.div
                    key={process.id}
                    layout
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute left-1 right-1 grid place-items-center border border-[#9d9d9d] text-center text-[0.72rem] leading-none tracking-[0.02em] text-[#f1f1f1]"
                    style={{
                      height: 24,
                      backgroundColor: process.color,
                      top: index * 24 + 4,
                      zIndex: 20 - index,
                    }}
                  >
                    {process.name}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </section>

          <section className="flex w-80 flex-col items-center">
            <p className="mb-2 w-full text-center text-3xl text-[#3f3f3f]">Memoria</p>
            <div ref={memoryGridRef} className="grid h-130 w-44 grid-rows-16 border-[3px] border-[#111] bg-[#ececec] p-1">
              {memory.map((block) => (
                <div key={block.id} className="overflow-visible border border-[#a6a6a6] bg-[#d9d9d9]">
                  {block.processId ? (
                    <motion.div
                      layout
                      className="grid h-full place-items-center border border-[#8e8e8e] text-center text-[0.68rem] leading-none tracking-[0.02em] text-[#f4f4f4]"
                      style={{ backgroundColor: block.color }}
                    >
                      {block.name}
                    </motion.div>
                  ) : null}
                </div>
              ))}
            </div>
          </section>

          <AnimatePresence>
            {flying ? (
              <motion.div
                key={flying.process.id}
                initial={{
                  x: flying.fromX,
                  y: flying.fromY,
                  width: flying.fromWidth,
                  height: flying.fromHeight,
                  opacity: 1,
                }}
                animate={{
                  x: flying.toX,
                  y: flying.toY,
                  width: flying.toWidth,
                  height: flying.toHeight,
                  opacity: 1,
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: 'easeInOut' }}
                className="pointer-events-none absolute top-0 left-0 z-50 grid place-items-center border border-[#8e8e8e] text-[0.72rem] tracking-[0.02em] text-[#f1f1f1]"
                style={{
                  width: flying.fromWidth,
                  height: flying.fromHeight,
                  backgroundColor: flying.process.color,
                }}
              >
                {flying.process.name}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}