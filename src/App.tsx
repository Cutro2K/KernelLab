import { HashRouter as Router, Routes, Route, Link } from 'react-router-dom';

// Importamos las páginas que creamos
import Home from './pages/Home.tsx';
import Simulator from './pages/Simulator';
import Comparison from './pages/Comparison';
import About from './pages/About';
function App() {
  return (
    <Router>
      {/* Barra de navegación base (usando un poco de Tailwind) */}
      <nav className="flex flex-row @container border-2 mx-2 my-2 p-4 gap-6 shadow-md font-inconsolata">
        <div className="font-bold max-w-full @[1000px]:absolute min-w-fit text-3xl mr-4">&curren; Kernel-Lab</div>
        <div className="w-full text-center">
          <Link to="/" className="hover:font-bold text-xl">[ Inicio ]</Link>
          <Link to="/simulator" className="hover:font-bold text-xl">[ Simulador ]</Link>
          <Link to="/comparison" className="hover:font-bold text-xl">[ Comparar ]</Link>
          <Link to="/about" className="hover:font-bold text-xl">[ Docs ]</Link>
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