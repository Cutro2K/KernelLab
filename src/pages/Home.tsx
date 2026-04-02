import { Button } from '../components/ui/Button.tsx';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

export default function Home() {
  return <div className="p-10 mx-auto border-2 min-w-40 max-w-220 text-2xl">
    <h1 className="text-center font-bold text-3xl text-gray-800 mx-auto font-inconsolata">Kernel-Lab - Visualizador de memoria</h1>
    <p className="text-gray-600 text-base max-w-200 min-w-50 mx-auto my-5 font-inconsolata">Kernel-Lab es una innovadora herramienta educativa e interactiva diseñada para mostrarte, paso a paso, cómo operan los algoritmos de planificación de memoria.A través de visualizaciones animadas, podrás comprender desde las técnicas de asignación contigua hasta los complejos sistemas de reemplazo de páginas. Toma el control total de cada simulación: configura el tamaño de la memoria y los procesos, avanza a tu propio ritmo con los controles de reproducción, y compara la eficiencia de dos algoritmos diferentes lado a lado.</p>
    <div className="flex flex-row min-w-50 gap-5 max-w-200 mx-auto">
      <Link className="w-full" to="/simulator">
        <Button variant='primary' className="w-full">Comenzar simulacion +
        </Button>
      </Link>
      <Link className="w-full" to="/about">
        <Button variant='info' className="w-full">Ver documentacion
        </Button>
      </Link>
    </div>
  </div>;
}