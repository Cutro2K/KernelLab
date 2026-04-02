// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

// Importamos las páginas que creamos
import Home from './pages/Home.tsx';
import Simulator from './pages/Simulator';
import Comparison from './pages/Comparison';
import About from './pages/About';
import settingsIcon from "./assets/settings.svg";

function App() {
  return (
    <Router>
      {/* Barra de navegación base (usando un poco de Tailwind) */}
      <nav className="flex flex-row border-2 mx-2 my-2 p-4 gap-6 shadow-md font-inconsolata">
        <div className="font-bold max-w-full min-w-fit text-xl mr-4">&curren; Kernel-Lab</div>
        <div className="w-full text-center">
          <Link to="/" className="hover:font-bold">[ Inicio ]</Link>
          <Link to="/simulator" className="hover:font-bold">[ Simulador ]</Link>
          <Link to="/comparison" className="hover:font-bold">[ Comparar ]</Link>
          <Link to="/about" className="hover:font-bold">[ Docs ]</Link>
        </div>
        <div className="flex min-w-[120px] justify-end gap-2 flex-row text-right max-w-full">
          <img className="w-[25px]" src={settingsIcon} alt="Settings" />
        </div>
      </nav>

      {/* El contenedor principal donde React Router inyecta las páginas */}
      <main className="min-h-screen py-5 px-2">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/simulator" element={<Simulator />} />
          <Route path="/comparison" element={<Comparison />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;