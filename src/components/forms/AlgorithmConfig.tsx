import { useState } from "react";
interface ConfigProps {
    className?: string;
}

export function AlgorithmConfig({ className }: ConfigProps) {
    const [AllocationStrategySeleccionada, setAllocationStrategy] = useState('best-fit');

    const manejarCambioDisposicion = (e : React.ChangeEvent<HTMLSelectElement>) => {
        setAllocationStrategy(e.target.value);
    };

    const [algoritmoSeleccionado, setAlgoritmoSeleccionado] = useState('best-fit');

    const manejarCambioAlgoritmo = (e : React.ChangeEvent<HTMLSelectElement>) => {
        setAlgoritmoSeleccionado(e.target.value);
    };
    return (
        <div className={`flex flex-col gap-2 border-2 border-black px-2 py-2 bg-[#ffb6c1]/10 ${className || ''}`}>
            <div className="flex items-center text-slate-500 font-bold text-sm tracking-widest uppercase">
                <span className="text-lg leading-none mt-1">*</span>
                <span>Configuración de algoritmo</span>
            </div>
            <div>
                <label className="font-bold">Tipo de asignacion de memoria: </label>
                <select 
                value={AllocationStrategySeleccionada} 
                onChange={manejarCambioDisposicion}
                className="bg-transparent focus:outline-none cursor-pointer"
                >
                    <option value="contiguous">[Contiguo]</option>
                    <option value="paged">[Paginado]</option>
                    <option value="segmented">[Segmentado]</option>
                    <option value="buddy">[Buddy System]</option>
                </select>
            </div>
            <div>
                <label className="font-bold">Sub algoritmo: </label>
                <select 
                value={algoritmoSeleccionado} 
                onChange={manejarCambioAlgoritmo}
                className="bg-transparent focus:outline-none cursor-pointer"
                >
                    <option value="first-fit">[First Fit]</option>
                    <option value="best-fit">[Best Fit]</option>
                    <option value="worst-fit">[Worst Fit]</option>
                    <option value="next-fit">[Next Fit]</option>
                </select>
            </div>
        </div>
    );
}

export function MemoryConfig({ className }: ConfigProps) {
    const [memoria, setMemoria] = useState(512);
    const [osSize, setOsSize] = useState(64);
    return (
        <div className={`flex flex-col gap-2 border-2 border-black px-2 py-2 bg-[#ffb6c1]/10 ${className || ''}`}>
            <div className="flex items-center text-slate-500 font-bold text-sm tracking-widest uppercase">
                <span className="text-lg leading-none mt-1">*</span>
                <span>Configuración de memoria</span>
            </div>
            <div className="flex flex-row gap-2">
                <label className="font-bold">Memoria: </label>
                <input 
                type="range"
                min="128" 
                max="1024"
                step="32"
                value={memoria}
                onChange={(e) => setMemoria(parseInt(e.target.value))}
                />
                <span>{memoria}KB</span>
            </div>
            <div className="flex flex-row gap-2">
                <label className="font-bold">OS: </label>
                <input 
                type="range"
                min="32" 
                max="512"
                step="16"
                value={osSize}
                onChange={(e) => setOsSize(parseInt(e.target.value))}
                />
                <span>{osSize}KB</span>
            </div>
        </div>
    );
}