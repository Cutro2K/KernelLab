import { useEffect, useRef, useState } from 'react';

const MIN_SIDEBAR_WIDTH = 220;
const MAX_SIDEBAR_WIDTH = 520;

const DOC_TREE = [
  {
    title: 'Base',
    items: [{ href: '#intro', label: 'Introduccion' }],
  },
  {
    title: 'Memoria',
    items: [
      { href: '#allocation', label: 'Asignacion continua' },
      { href: '#paging', label: 'Paginacion' },
      { href: '#segmentation', label: 'Segmentacion' },
    ],
  },
  {
    title: 'Politicas',
    items: [{ href: '#replacement', label: 'Reemplazo de paginas' }],
  },
  {
    title: 'Practica',
    items: [{ href: '#tips', label: 'Consejos de uso' }],
  },
] as const;

export default function About() {
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const [isResizing, setIsResizing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 900px)');
    const syncMobileState = () => setIsMobile(media.matches);

    syncMobileState();
    media.addEventListener('change', syncMobileState);

    return () => {
      media.removeEventListener('change', syncMobileState);
    };
  }, []);

  useEffect(() => {
    if (!isResizing || isMobile) {
      return;
    }

    const handleMouseMove = (event: MouseEvent) => {
      if (!containerRef.current) {
        return;
      }

      const containerRect = containerRef.current.getBoundingClientRect();
      const nextWidth = event.clientX - containerRect.left;
      const maxByContainer = Math.max(MIN_SIDEBAR_WIDTH, containerRect.width - 320);
      const boundedWidth = Math.min(
        Math.max(nextWidth, MIN_SIDEBAR_WIDTH),
        Math.min(MAX_SIDEBAR_WIDTH, maxByContainer),
      );

      setSidebarWidth(boundedWidth);
    };

    const stopResizing = () => setIsResizing(false);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', stopResizing);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [isMobile, isResizing]);

  return (
    <section
      className="min-h-[calc(100vh-140px)] border-2 border-[#111] bg-linear-to-br from-[#f9f7f1] via-[#f3f6fb] to-[#ece6df]"
      aria-label="Documentacion de Kernel-Lab"
    >
      <header className="border-b-2 border-[#111] bg-slate-200 px-4 py-5">
        <p className="m-0 text-xs tracking-[0.08em] uppercase">Documentacion</p>
        <h1 className="my-1 text-[clamp(1.7rem,3vw,2.25rem)]">Kernel-Lab Docs</h1>
        <p className="m-0 max-w-[70ch]">
          Guia rapida para entender el simulador y las estrategias de memoria incluidas.
        </p>
      </header>

      <div ref={containerRef} className="relative flex min-h-[68vh] max-[900px]:flex-col">
        <nav
          className="flex shrink-0 grow-0 basis-auto flex-col gap-2 border-r-2 border-[#111] bg-[#fafafa] p-4 max-[900px]:w-full max-[900px]:border-r-0 max-[900px]:border-b-2"
          aria-label="Indice de documentacion"
          style={{ width: isMobile ? '100%' : `${sidebarWidth}px` }}
        >
          <h2 className="mb-1 text-base font-bold">Secciones</h2>
          <p className="mb-1 border border-[#111] bg-[#f4efd8] px-2 py-1 text-xs">root/docs</p>

          <ul className="space-y-3 text-[0.95rem]">
            {DOC_TREE.map((branch) => (
              <li key={branch.title}>
                <div className="inline-block border border-[#111] bg-[#e9e9e9] px-2 py-1 text-sm font-bold">
                  +-- {branch.title}
                </div>

                <ul className="mt-1 ml-3 border-l-2 border-dashed border-[#111] pl-3">
                  {branch.items.map((item) => (
                    <li key={item.href} className="my-1">
                      <a
                        className="inline-block border border-[#111] bg-white px-2 py-1 no-underline transition hover:translate-x-1 hover:bg-[#fff2cf]"
                        href={item.href}
                      >
                        |-- {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </nav>

        {!isMobile ? (
          <div
            className={`w-2.5 cursor-col-resize bg-[#111]/45 hover:bg-[#111]/90 ${
              isResizing ? 'bg-[#111]/90' : ''
            }`}
            role="separator"
            aria-orientation="vertical"
            aria-label="Redimensionar barra lateral"
            onMouseDown={() => setIsResizing(true)}
          />
        ) : null}

        <article className="grid flex-1 gap-5 px-6 py-5 max-[900px]:px-4">
          <section id="intro" className="border-2 border-[#111] bg-white/85 p-4 shadow-[6px_6px_0_0_rgba(17,17,17,0.15)]">
            <h2 className="mt-0 text-2xl font-bold">+-- Introduccion</h2>
            <p>
              Kernel-Lab permite explorar visualmente algoritmos de administracion de memoria.
              Puedes ejecutar los pasos uno por uno o animar la simulacion para comparar decisiones
              del sistema operativo.
            </p>
          </section>

          <section id="allocation" className="border-2 border-[#111] bg-white/85 p-4 shadow-[6px_6px_0_0_rgba(17,17,17,0.15)]">
            <h2 className="mt-0 text-2xl font-bold">+-- Asignacion continua</h2>
            <p>
              Incluye First Fit, Best Fit, Worst Fit y Next Fit para mostrar como cambia la
              fragmentacion externa segun la politica elegida.
            </p>
          </section>

          <section id="paging" className="border-2 border-[#111] bg-white/85 p-4 shadow-[6px_6px_0_0_rgba(17,17,17,0.15)]">
            <h2 className="mt-0 text-2xl font-bold">+-- Paginacion</h2>
            <p>
              La vista de paginacion descompone procesos en paginas y marcos, facilitando el
              analisis de traduccion de direcciones.
            </p>
          </section>

          <section id="replacement" className="border-2 border-[#111] bg-white/85 p-4 shadow-[6px_6px_0_0_rgba(17,17,17,0.15)]">
            <h2 className="mt-0 text-2xl font-bold">+-- Reemplazo de paginas</h2>
            <p>
              Puedes comparar FIFO, LRU, OPTIMO y CLOCK para observar fallos de pagina y tasa de
              aciertos en diferentes secuencias de referencia.
            </p>
          </section>

          <section id="segmentation" className="border-2 border-[#111] bg-white/85 p-4 shadow-[6px_6px_0_0_rgba(17,17,17,0.15)]">
            <h2 className="mt-0 text-2xl font-bold">+-- Segmentacion</h2>
            <p>
              Esta seccion destaca como crecen y se ubican los segmentos logicos de un proceso,
              incluyendo limites y permisos.
            </p>
          </section>

          <section id="tips" className="border-2 border-[#111] bg-white/85 p-4 shadow-[6px_6px_0_0_rgba(17,17,17,0.15)]">
            <h2 className="mt-0 text-2xl font-bold">+-- Consejos de uso</h2>
            <ul className="mt-2 ml-5 list-disc">
              <li>Empieza con pocos procesos para leer mejor cada paso.</li>
              <li>Usa la comparacion para ver diferencias lado a lado.</li>
              <li>Exporta resultados cuando quieras documentar una practica.</li>
            </ul>
          </section>
        </article>
      </div>
    </section>
  );
}