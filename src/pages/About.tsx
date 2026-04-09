import { type MouseEvent as ReactMouseEvent, useEffect, useRef, useState } from 'react';

const MIN_SIDEBAR_WIDTH = 220;
const MAX_SIDEBAR_WIDTH = 520;

const DOC_TREE = [
  {
    title: 'Base',
    items: [
      { href: '#intro', label: 'Introduccion' },
      { href: '#memory-model', label: 'Modelo de memoria' },
      { href: '#metrics', label: 'Metricas clave' },
    ],
  },
  {
    title: 'Memoria',
    items: [
      { href: '#allocation', label: 'Asignacion continua' },
      { href: '#paging', label: 'Paginación' },
      { href: '#segmentation', label: 'Segmentación' },
      { href: '#compare-models', label: 'Comparacion de modelos' },
    ],
  },
  {
    title: 'Politícas',
    items: [
      { href: '#replacement', label: 'Reemplazo de páginas' },
      { href: '#thrashing', label: 'Thrashing y localidad' },
    ],
  },
  {
    title: 'Practica',
    items: [
      { href: '#state-kernellab', label: 'Estado en Kernel-Lab' },
      { href: '#tips', label: 'Consejos de uso' },
    ],
  },
] as const;

export default function About() {
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const [isResizing, setIsResizing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const scrollToSection = (href: string) => {
    const target = document.querySelector(href);
    if (!(target instanceof HTMLElement)) {
      return;
    }

    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.history.replaceState(null, '', href);
  };

  const handleDocNavClick = (event: ReactMouseEvent<HTMLAnchorElement>, href: string) => {
    event.preventDefault();
    scrollToSection(href);
  };

  useEffect(() => {
    if (!window.location.hash) {
      return;
    }

    const hash = window.location.hash;
    const timer = window.setTimeout(() => scrollToSection(hash), 0);
    return () => window.clearTimeout(timer);
  }, []);

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

    const handleMouseMove = (event: globalThis.MouseEvent) => {
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
      className="relative flex min-h-[calc(100vh-140px)] flex-col overflow-hidden border-2 border-[#111] bg-linear-to-br from-[#f9f7f1] via-[#f3f6fb] to-[#ece6df] max-[900px]:min-h-0 max-[900px]:overflow-visible"
      aria-label="Documentacion de Kernel-Lab"
    >
      <header className="border-b-2 border-[#111] bg-slate-200 px-4 py-5">
        <p className="m-0 text-xs tracking-[0.08em] uppercase">Documentación</p>
        <h1 className="my-1 text-[clamp(1.7rem,3vw,2.25rem)]">Kernel-Lab Docs</h1>
        <p className="m-0 max-w-[70ch]">
          Guía rápida para entender el simulador y las estrategias de memoria incluídas.
        </p>
      </header>

      <div ref={containerRef} className="relative flex min-h-0 flex-1 max-[900px]:w-full max-[900px]:min-w-0 max-[900px]:flex-col max-[900px]:overflow-x-hidden">
        <nav
          className="flex min-h-0 shrink-0 grow-0 basis-auto flex-col gap-2 overflow-y-auto border-r-2 border-[#111] bg-[#fafafa] p-4 max-[900px]:w-full max-[900px]:border-r-0 max-[900px]:border-b-2"
          aria-label="Indice de documentacion"
          style={{ width: isMobile ? '100%' : `${sidebarWidth}px` }}
        >
          <h2 className="mb-1 text-base font-bold">Secciones</h2>
          <p className="mb-1 border border-[#111] bg-[#f4efd8] px-2 py-1 text-xs">root/docs</p>

          <ul className="space-y-3 text-[0.95rem] wrap-break-word">
            {DOC_TREE.map((branch) => (
              <li key={branch.title}>
                <div className="inline-block border border-[#111] bg-[#e9e9e9] px-2 py-1 text-sm font-bold">
                  +-- {branch.title}
                </div>

                <ul className="mt-1 ml-3 border-l-2 border-dashed border-[#111] pl-3">
                  {branch.items.map((item) => (
                    <li key={item.href} className="my-1">
                      {/* 3. ARREGLO: Agregamos el onClick correcto al <a> */}
                      <a
                        className="inline-block max-w-full wrap-break-word border border-[#111] bg-white px-2 py-1 no-underline transition hover:translate-x-1 hover:bg-[#fff2cf]"
                        href={item.href}
                        onClick={(event) => handleDocNavClick(event, item.href)}
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

        <article className="relative grid min-h-0 min-w-0 flex-1 gap-5 overflow-y-auto px-6 py-5 [&>section]:min-w-0 [&>section]:w-full max-[900px]:w-full max-[900px]:overflow-visible max-[900px]:px-4">
          <section id="intro" className="border-2 border-[#111] bg-white/85 p-4 shadow-[6px_6px_0_0_rgba(17,17,17,0.15)]">
            <h2 className="mt-0 text-xl font-bold min-[640px]:text-2xl">+-- Introducción</h2>
            <p>
              Kernel-Lab permite explorar visualmente algoritmos de administración de memoria.
              Puedes ejecutar los pasos uno por uno o animar la simulacion para comparar decisiones
              del sistema operativo.
            </p>
            <p>
              Esta documentación está pensada para usuario final: resume teoria de Sistemas
              Operativos, explica las politícas implementadas y te ayuda a interpretar las métricas
              que muestra el simulador.
            </p>
          </section>

          <section id="memory-model" className="border-2 border-[#111] bg-white/85 p-4 shadow-[6px_6px_0_0_rgba(17,17,17,0.15)]">
            <h2 className="mt-0 text-2xl font-bold">+-- Modelo de memoria</h2>
            <p>
              En términos generales, el SO reserva una zona para el kernel (OS) y administra el
              resto para procesos de usuario. Segun la técnica, el espacio libre se maneja como
              huecos variables (asignación continua), marcos de tamaño fijo (paginación) o segmentos
              lógicos (segmentación).
            </p>
            <pre className="overflow-x-auto border border-[#111] bg-[#f7f7f7] p-2 text-sm">
{`+-----------------------------------------------------+
| OS |                Memoria de usuario              |
+-----------------------------------------------------+
     |<---- administrada por el algoritmo elegido --->|`}
            </pre>
          </section>

          <section id="metrics" className="border-2 border-[#111] bg-white/85 p-4 shadow-[6px_6px_0_0_rgba(17,17,17,0.15)]">
            <h2 className="mt-0 text-2xl font-bold">+-- Metricas clave</h2>
            <ul className="ml-5 list-disc space-y-1">
              <li><strong>Uso de memoria:</strong> porcentaje de memoria ocupada.</li>
              <li><strong>Fragmentación externa:</strong> memoria libre total no útil por estar dispersa.</li>
              <li><strong>Fragmentación interna:</strong> bytes desperdiciados dentro de bloques asignados.</li>
              <li><strong>Page Faults / Hits:</strong> en paginación, fallos y aciertos de acceso a página.</li>
            </ul>
            <p className="mt-2">Fórmula intuitiva de externa:</p>
            <pre className="overflow-x-auto border border-[#111] bg-[#f7f7f7] p-2 text-sm">
{`fragmentación_externa ~= memoria_libre_total - mayor_hueco_libre`}
            </pre>
          </section>

          <section id="allocation" className="border-2 border-[#111] bg-white/85 p-4 shadow-[6px_6px_0_0_rgba(17,17,17,0.15)]">
            <h2 className="mt-0 text-2xl font-bold">+-- Asignación continua</h2>
            <p>
              En asignación continua cada proceso ocupa un bloque contiguo. El problema principal
              es la fragmentación externa: hay memoria libre, pero en pedazos separados.
            </p>
            <h2 className="text-xl font-bold mt-10">First Fit</h2>
            <p>
              Recorre la lista de huecos desde el inicio y toma el primero que alcance. Es veloz,
              simple y suele funcionar bien en carga media.
            </p>
            <h2 className="text-xl font-bold mt-10">Next Fit</h2>
            <p>
              Variante de First Fit: en lugar de comenzar siempre desde el inicio, retoma la
              busqueda desde la última posición usada. Mejora el costo promedio cuando la lista es
              grande.
            </p>
            <h2 className="text-xl font-bold mt-10">Best Fit</h2>
            <p>
              Busca el hueco mas pequeño que pueda contener al proceso. Tiende a dejar muchos
              huecos chicos (difíciles de reútilizar) y puede aumentar la fragmentación externa.
            </p>
            <h2 className="text-xl font-bold mt-10">Worst Fit</h2>
            <p>
              Toma el hueco mas grande disponible para que el resto tambien quede grande y útil.
              En la práctica no suele superar consistentemente a First Fit.
            </p>
            <h2 className="text-xl font-bold mt-10">Buddy System</h2>
            <div className="space-y-3 leading-relaxed">
              <p>
                En Buddy System, la memoria se organiza en bloques de tamaño potencia de 2.
                Si m &lt;= k &lt;= n, entonces los bloques posibles son 2^k bytes.
                El tamamño mínimo de bloque es 2^m y el máximo suele ser 2^n
                (la memoria completa).
              </p>

              <p>
                Para asignar un proceso de tamaño x, se busca el bloque mas pequeño que
                lo pueda contener.
              </p>

              <pre className="overflow-x-auto border border-[#111] bg-[#f7f7f7] p-2 text-sm">
{`for (i = N; !(2^(i-1) < S && S <= 2^i); i--)`}
              </pre>

              <p>Proceso de asignación:</p>
              <ul className="ml-5 list-disc space-y-1">
                <li>Si el bloque es mayor al necesario, se divide en dos buddies iguales.</li>
                <li>Se repite la división hasta alcanzar el tamaño adecuado.</li>
                <li>Una mitad se asigna al proceso y la otra queda libre.</li>
              </ul>

              <p>Liberación rápida (fusión):</p>
              <ul className="ml-5 list-disc space-y-1">
                <li>Dos huecos se fusionan sí tienen el mismo tamaño.</li>
                <li>Además, deben ser buddies reales: hijos del mismo bloque padre.</li>
                <li>Si no comparten padre, no pueden fusionarse aunque estén juntos.</li>
              </ul>

              <p>
                Ejemplo: si un proceso ocupa un bloque distinto al esperado, pueden quedar
                huecos de igual tamaño en el medio que no se fusionan por no ser buddies del
                mismo padre.
              </p>
            </div>

            <pre className="mt-4 overflow-x-auto border border-[#111] bg-[#f7f7f7] p-2 text-sm">
{`Ejemplo continuo (huecos y procesos)

[OS][ HUECO 120 ][ HUECO 80 ][ HUECO 40 ]
                llega P=70

First Fit -> [OS][ P70 | H50 ][ H80 ][ H40 ]
Best Fit  -> [OS][ H120 ][ P70 | H10 ][ H40 ]
Worst Fit -> [OS][ P70 | H50 ][ H80 ][ H40 ] (si 120 era el mayor)
`}
            </pre>
          </section>

          <section id="paging" className="border-2 border-[#111] bg-white/85 p-4 shadow-[6px_6px_0_0_rgba(17,17,17,0.15)]">
            <h2 className="mt-0 text-2xl font-bold">+-- Paginación</h2>
            <p>
              Paginación divide procesos en páginas de tamaño fijo y la memoria física en marcos
              del mismo tamaño. Evita fragmentación externa, pero puede generar fragmentación
              interna en la última página de cada proceso.
            </p>
            <pre className="overflow-x-auto border border-[#111] bg-[#f7f7f7] p-2 text-sm">
{`Direccion logica = (numero_pagina, desplazamiento)

Tabla de páginas:
Pag 0 -> Marco 5
Pag 1 -> Marco 2
Pag 2 -> Marco 9

Direccion física = marco * tam_pagina + desplazamiento`}
            </pre>
            <p className="mt-3">
              En Kernel-Lab, la opción "Paginación Simple" intenta ubicar páginas solo en marcos
              libres. Cuando se combinan con politícas de reemplazo, el simulador elige víctimas
              para liberar marcos si ya no hay espacio disponible.
            </p>
          </section>

          <section id="replacement" className="border-2 border-[#111] bg-white/85 p-4 shadow-[6px_6px_0_0_rgba(17,17,17,0.15)]">
            <h2 className="mt-0 text-2xl font-bold">+-- Reemplazo de páginas</h2>
            <p>
              Cuando no hay marcos libres, el sistema debe elegir que página sale para cargar
              la nueva. Kernel-Lab permite comparar varias politícas de reemplazo para observar
              su impacto en fallos de página y rendimiento.
            </p>

            <h2 className="text-xl font-bold mt-10">FIFO</h2>
            <p>
              First In, First Out expulsa la página que lleva mas tiempo cargada en memoria.
              Es simple de implementar, pero puede reemplazar páginas que todavia se usan mucho,
              lo que puede aumentar los fallos en algunas secuencias.
            </p>

            <h2 className="text-xl font-bold mt-10">LRU</h2>
            <p>
              Least Recently Used elimina la página menos útilizada recientemente. Se apoya en la
              idea de localidad temporal: si una página se uso hace poco, probablemente se vuelva
              a usar pronto. Suele rendir mejor que FIFO cuando el patrón de acceso tiene localidad.
            </p>

            <h2 className="text-xl font-bold mt-10">OPT (Optimo)</h2>
            <p>
              El algoritmo óptimo reemplaza la página cuyo próximo uso está más lejano en el
              futuro. Como requiere conocer referencias futuras, se usa como referencia teórica
              para comparar qué tan cerca están los algoritmos reales del mejor caso posible.
            </p>

            <h2 className="text-xl font-bold mt-10">NRU</h2>
            <p>
              Not Recently Used clasifica páginas segun los bits de referencia (R) y modificación
              (M). Primero intenta reemplazar páginas no referenciadas y no modificadas, y deja para
              el final las que fueron usadas recientemente o están sucias.
            </p>

            <h2 className="text-xl font-bold mt-10">Segunda Oportunidad</h2>
            <p>
              Es una mejora de FIFO: antes de expulsar una página, revisa su bit de referencia.
              Si R=1, la página recibe una "segunda oportunidad", se limpia el bit y se pospone
              su reemplazo. Asi evita expulsar páginas activas de forma prematura.
            </p>

            <h2 className="text-xl font-bold mt-10">Clock</h2>
            <p>
              Clock implementa Segunda Oportunidad con un puntero circular. La manecilla recorre
              marcos en ronda: si encuentra R=1 lo pone en 0 y avanza; si encuentra R=0, ese marco
              se reemplaza. Ofrece comportamiento similar con menor costo operativo.
            </p>

            <pre className="mt-3 overflow-x-auto border border-[#111] bg-[#f7f7f7] p-2 text-sm">
{`Clock (idea)

manecilla -> [R=1][R=0][R=1][R=0]
              ^
si R=1: pone R=0 y avanza
si R=0: reemplaza ese marco`}
            </pre>
          </section>

          <section id="segmentation" className="border-2 border-[#111] bg-white/85 p-4 shadow-[6px_6px_0_0_rgba(17,17,17,0.15)]">
            <h2 className="mt-0 text-2xl font-bold">+-- Segmentación</h2>
            <p>
              Segmentación divide cada proceso por significado lógico (Code, Data, Stack, Heap).
              Cada segmento se ubica de forma independiente y puede llegar en tiempos distintos.
              Facilita protección y compartición, pero sufre fragmentación externa.
            </p>
            <pre className="overflow-x-auto border border-[#111] bg-[#f7f7f7] p-2 text-sm">
{`Proceso P
  - Code  (solo lectura)
  - Data  (globales)
  - Heap  (dinamico)
  - Stack (llamadas)

Tabla de segmentos -> (base, limite, permisos)`}
            </pre>
            <p className="mt-3">
              En tu simulador, la asignacion de segmentos usa una estrategia configurable:
              First Fit, Best Fit, Worst Fit o Next Fit.
            </p>
          </section>

          <section id="compare-models" className="border-2 border-[#111] bg-white/85 p-4 shadow-[6px_6px_0_0_rgba(17,17,17,0.15)]">
            <h2 className="mt-0 text-2xl font-bold">+-- Comparación de modelos</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full border border-[#111] text-sm">
                <thead className="bg-[#f1f1f1]">
                  <tr>
                    <th className="border border-[#111] px-2 py-1 text-left">Modelo</th>
                    <th className="border border-[#111] px-2 py-1 text-left">Ventaja principal</th>
                    <th className="border border-[#111] px-2 py-1 text-left">Costo principal</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-[#111] px-2 py-1">Asignación continua</td>
                    <td className="border border-[#111] px-2 py-1">Simple y rápida</td>
                    <td className="border border-[#111] px-2 py-1">Fragmentación externa</td>
                  </tr>
                  <tr>
                    <td className="border border-[#111] px-2 py-1">Paginación</td>
                    <td className="border border-[#111] px-2 py-1">Sin externa</td>
                    <td className="border border-[#111] px-2 py-1">Tablas + fallos de página</td>
                  </tr>
                  <tr>
                    <td className="border border-[#111] px-2 py-1">Segmentación</td>
                    <td className="border border-[#111] px-2 py-1">Vista lógica del programa</td>
                    <td className="border border-[#111] px-2 py-1">Externa + gestión mas compleja</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section id="thrashing" className="border-2 border-[#111] bg-white/85 p-4 shadow-[6px_6px_0_0_rgba(17,17,17,0.15)]">
            <h2 className="mt-0 text-2xl font-bold">+-- Thrashing y localidad</h2>
            <p>
              Thrashing aparece cuando el sistema pasa más tiempo reemplazando páginas que
              ejecutando trabajo útil. Suele ocurrir con pocos marcos por proceso o con una carga
              de multiprogramación demasiado alta.
            </p>
            <ul className="ml-5 list-disc space-y-1">
              <li>Localidad temporal: datos usados recientemente tienden a reútilizarse.</li>
              <li>Localidad espacial: direcciones cercanas tienden a usarse juntas.</li>
              <li>LRU y Clock explotan estas dos propiedades.</li>
            </ul>
          </section>

          <section id="state-kernellab" className="border-2 border-[#111] bg-white/85 p-4 shadow-[6px_6px_0_0_rgba(17,17,17,0.15)]">
            <h2 className="mt-0 text-2xl font-bold">+-- Estado en Kernel-Lab</h2>
            <ul className="ml-5 list-disc space-y-1">
              <li>Implementado en asignación continua: First Fit, Next Fit, Best Fit, Worst Fit, Buddy System.</li>
              <li>Paginación y reemplazo: Paginación Simple, OPT, FIFO, LRU, NRU, Segunda Oportunidad y Clock.</li>
              <li>Segmentación: división por Code/Data/Heap/Stack con estrategia configurable de ubicación.</li>
            </ul>
          </section>

          <section id="tips" className="border-2 border-[#111] bg-white/85 p-4 shadow-[6px_6px_0_0_rgba(17,17,17,0.15)]">
            <h2 className="mt-0 text-2xl font-bold">+-- Consejos de uso</h2>
            <ul className="mt-2 ml-5 list-disc">
              <li>Empieza con pocos procesos para leer mejor cada paso.</li>
              <li>Usa la comparación para ver diferencias lado a lado entre polítícas.</li>
              <li>Observa en cada paso si cambia mas la externa o la interna.</li>
              <li>En reemplazo de páginas, compara la misma secuencia de referencia entre algoritmos.</li>
            </ul>
          </section>
        </article>
      </div>
    </section>
  );
}