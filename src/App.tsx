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
      <nav className="mx-2 my-2 flex flex-col gap-3 border-2 p-4 shadow-md font-inconsolata min-[900px]:relative min-[900px]:flex-row min-[900px]:items-center min-[900px]:gap-6">
        <div className="mr-0 min-w-fit text-center text-2xl font-bold max-[420px]:text-xl min-[900px]:text-3xl min-[1100px]:absolute min-[1100px]:left-4 min-[1100px]:top-1/2 min-[1100px]:-translate-y-1/2">&curren; Kernel-Lab</div>
        <div className="grid w-full grid-cols-2 gap-2 text-center min-[900px]:flex min-[900px]:justify-center min-[900px]:gap-5">
          <Link to="/" className="text-base hover:font-bold min-[900px]:text-xl">[ Inicio ]</Link>
          <Link to="/simulator" className="text-base hover:font-bold min-[900px]:text-xl">[ Simulador ]</Link>
          <Link to="/comparison" className="text-base hover:font-bold min-[900px]:text-xl">[ Comparar ]</Link>
          <Link to="/about" className="text-base hover:font-bold min-[900px]:text-xl">[ Docs ]</Link>
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