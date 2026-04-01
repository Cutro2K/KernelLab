// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

// Importamos las páginas que creamos
import Home from './pages/Home.tsx';
import Simulator from './pages/Simulator';
import Comparison from './pages/Comparison';
import About from './pages/About';

function App() {
  return (
    <Router>
      {/* Barra de navegación base (usando un poco de Tailwind) */}
      <nav className="bg-slate-800 text-white p-4 flex gap-6 shadow-md font-inconsolata">
        <div className="font-bold text-xl mr-4">🔬 Kernel-Lab</div>
        <Link to="/" className="hover:text-blue-400 transition-colors">Inicio</Link>
        <Link to="/simulator" className="hover:text-blue-400 transition-colors">Simulador</Link>
        <Link to="/comparison" className="hover:text-blue-400 transition-colors">Comparar</Link>
        <Link to="/about" className="hover:text-blue-400 transition-colors">Docs</Link>
      </nav>

      {/* El contenedor principal donde React Router inyecta las páginas */}
      <main className="min-h-screen bg-slate-200 py-5">
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