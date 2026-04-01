import { Button } from '../components/ui/Button.tsx'

export default function Home() {
  return <div className="p-10 rounded-xl bg-slate-300 mx-auto my-5 min-w-60 max-w-220 text-2xl">
    <h1 className="text-center font-bold text-3xl text-gray-800 mx-auto font-inconsolata">KernelLab - Visualizador de memoria</h1>
    <p className="text-gray-600 text-base max-w-200 min-w-50 mx-auto my-5 font-inconsolata">MemViz es una innovadora herramienta educativa e interactiva diseñada para mostrarte, paso a paso, cómo operan los algoritmos de planificación de memoria.A través de visualizaciones animadas, podrás comprender desde las técnicas de asignación contigua hasta los complejos sistemas de reemplazo de páginas. Toma el control total de cada simulación: configura el tamaño de la memoria y los procesos, avanza a tu propio ritmo con los controles de reproducción, y compara la eficiencia de dos algoritmos diferentes lado a lado.</p>
    <div className="flex flex-row min-w-50 gap-5 max-w-200 mx-auto">
      <Button variant='primary' className="w-full font-inconsolata shadow-lg">Comenzar simulacion +</Button>
      <Button variant='info' className="w-full font-inconsolata shadow-lg">Ver documentacion</Button>
    </div>
  </div>;
}