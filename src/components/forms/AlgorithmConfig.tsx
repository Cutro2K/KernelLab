// IMPORTS
import { useState, useEffect } from "react";
import { CONTIGUOUS_ALGORITHMS, NON_CONTIGUOUS_ALGORITHMS, PAGE_REPLACEMENT_ALGORITHMS, ALLOCATIONS} from '../../algorithms/types';

// INTERFACES
interface AlgorithmConfigProps {
    className?: string;
    totalMemory: number;
    onConfigSave: (algorithmData: { algorithm: string; allocationMode: string; replacementAlgorithm: string; pageSize?: number }) => void;
}

interface MemoryConfigProps {
    className?: string;
    onConfigSave: (memoryData: { totalMemory: number; osSize: number }) => void;
}

function SelectRetroNativo({ value, options, onChange }: { value: string, options: string[], onChange: (val: string) => void }) {
    return (
        // relative + inline-block: La magia para que mida exactamente lo mismo que el texto
        <div className="relative inline-block font-mono text-sm">
            
            {/* 1. LA CAJITA VISUAL (Se ajusta dinámicamente) */}
            <div className="flex items-center gap-3 bg-white border-2 border-black px-2 py-1 pointer-events-none">
                <span>[{value}]</span>
                <span className="text-[10px]">▼</span>
            </div>

            {/* 2. EL SELECT REAL (Invisible pero interactivo) */}
            <select 
                value={value}
                onChange={(e) => onChange(e.target.value)}
                // opacity-0 lo oculta, appearance-none saca la flecha fea de windows, inset-0 lo estira sobre la caja
                className="absolute inset-0 w-full h-full opacity-0 appearance-none cursor-pointer"
            >
                {options.map((opt) => (
                    <option key={opt} value={opt}>
                        {opt}
                    </option>
                ))}
            </select>
            
        </div>
    );
}

export function AlgorithmConfig({ className, totalMemory, onConfigSave }: AlgorithmConfigProps) {
    const [allocationMode, setAllocationStrategy] = useState('Contigua');
    const [algorithm, setAlgoritmoSeleccionado] = useState('First Fit');
    const [replacementAlgorithm, setReplacementAlgorithm] = useState('FIFO');
    const [pageSizeExponent, setPageSizeExponent] = useState(4);
    const maxPageSize = Math.max(4, Math.floor(totalMemory / 2));
    const maxPageSizeExponent = Math.max(2, Math.floor(Math.log2(maxPageSize)));
    const pageSize = 2 ** pageSizeExponent;
    const showPageSizeSlider = allocationMode === 'No contigua' && algorithm === 'Paginacion Simple';

    useEffect(() => {
        if (pageSizeExponent > maxPageSizeExponent) {
            setPageSizeExponent(maxPageSizeExponent);
        }
    }, [maxPageSizeExponent, pageSizeExponent]);

    const manejarCambioDisposicion = (nuevoValor: string) => {
        setAllocationStrategy(nuevoValor);
        if (nuevoValor === 'No contigua') {
            setAlgoritmoSeleccionado('Paginacion Simple');
            setReplacementAlgorithm('OPT');
        } else {
            setAlgoritmoSeleccionado('First Fit');
        }
    };

    useEffect(() => {
        onConfigSave({
            algorithm,
            allocationMode,
            replacementAlgorithm,
            pageSize: showPageSizeSlider ? pageSize : undefined,
        });
    }, [algorithm, allocationMode, replacementAlgorithm, pageSize, showPageSizeSlider, onConfigSave]);

    const manejarCambioAlgoritmo = (nuevoValor: string) => {
        setAlgoritmoSeleccionado(nuevoValor);
        if (nuevoValor === 'Paginacion Simple') {
            setReplacementAlgorithm('OPT');
        } else if (nuevoValor === 'Segmentacion') {
            setReplacementAlgorithm('First Fit'); // No aplica
        }
    };
    return (
        <div className={`flex flex-col gap-4 border-2 border-black px-4 py-3 bg-[#ffb6c1]/10 ${className || ''}`}>
            <div className="flex items-center text-slate-500 font-bold text-sm tracking-widest uppercase border-b border-slate-300 pb-1">
                <span className="text-lg leading-none mt-1 mr-2">*</span>
                <span>Configuración de algoritmo</span>
            </div>
            
            <div className="flex flex-col items-start gap-2 min-[640px]:flex-row min-[640px]:items-center min-[640px]:gap-3">
                <label className="font-bold text-sm min-[640px]:min-w-37.5">Tipo de asignacion: </label>
                <SelectRetroNativo 
                    value={allocationMode} 
                    options={ALLOCATIONS as string[]} 
                    onChange={manejarCambioDisposicion} 
                />
            </div>

            <div className="flex flex-col items-start gap-2 min-[640px]:flex-row min-[640px]:items-center min-[640px]:gap-3">
                <label className="font-bold text-sm min-[640px]:min-w-37.5">Sub algoritmo: </label>
                <SelectRetroNativo 
                    value={algorithm} 
                    options={allocationMode === 'Contigua' ? CONTIGUOUS_ALGORITHMS as string[] : NON_CONTIGUOUS_ALGORITHMS as string[]} 
                    onChange={manejarCambioAlgoritmo} 
                />
            </div>

            {allocationMode === 'No contigua' && (
                <div className="flex flex-col items-start gap-2 min-[640px]:flex-row min-[640px]:items-center min-[640px]:gap-3">    
                    <label className="font-bold text-sm min-[640px]:min-w-37.5">Reemplazo de páginas: </label>
                    <SelectRetroNativo 
                        value={replacementAlgorithm} 
                        options={algorithm === 'Paginacion Simple' ? PAGE_REPLACEMENT_ALGORITHMS as string[] : CONTIGUOUS_ALGORITHMS as string[]} 
                        onChange={(val) => setReplacementAlgorithm(val)} 
                    />
                </div>
            )}

            {showPageSizeSlider && (
                <div className="flex flex-col items-start gap-2 text-sm min-[640px]:flex-row min-[640px]:items-center min-[640px]:gap-4">
                    <label className="font-bold min-[640px]:min-w-37.5">Tamaño de página: </label>
                    <input
                        type="range"
                        min="2"
                        max={maxPageSizeExponent}
                        step="1"
                        value={pageSizeExponent}
                        onChange={(e) => setPageSizeExponent(Number(e.target.value))}
                        className="w-full max-w-70 accent-black cursor-pointer"
                    />
                    <span className="font-mono bg-white border border-black px-1">{pageSize}KB</span>
                </div>
            )}
        </div>
    );
}

export function MemoryConfig({ className, onConfigSave }: MemoryConfigProps) {
    const [exponente, setExponente] = useState(9);
    const totalMemory = 2 ** exponente;
    const [osSize, setOsSize] = useState(64);

    const manejarCambioExponente = (e : React.ChangeEvent<HTMLInputElement>) => {
        const nuevoExponente = Number(e.target.value);
        setExponente(nuevoExponente);
        if (osSize > 2 ** (nuevoExponente - 1)) {
            setOsSize(2 ** (nuevoExponente - 1));
        }
    };

    useEffect(() => {
        onConfigSave({ totalMemory, osSize });
    }, [totalMemory, osSize, onConfigSave]);


    return (
        <div className={`flex flex-col gap-4 border-2 border-black px-4 py-3 bg-[#ffb6c1]/10 ${className || ''}`}>
            <div className="flex items-center text-slate-500 font-bold text-sm tracking-widest uppercase border-b border-slate-300 pb-1">
                <span className="text-lg leading-none mt-1 mr-2">*</span>
                <span>Configuración de memoria</span>
            </div>
            
            <div className="flex flex-col items-start gap-2 text-sm min-[640px]:flex-row min-[640px]:items-center min-[640px]:gap-4">
                <label className="font-bold min-[640px]:min-w-15">Memoria: </label>
                <input 
                    type="range" 
                    min="6"    
                    max="11"   
                    step="1"   
                    value={exponente}
                    onChange={manejarCambioExponente}
                    className="w-full max-w-70 accent-black cursor-pointer"
                />
                <span className="font-mono bg-white border border-black px-1">{totalMemory}KB</span>
            </div>

            <div className="flex flex-col items-start gap-2 text-sm min-[640px]:flex-row min-[640px]:items-center min-[640px]:gap-4">
                <label className="font-bold min-[640px]:min-w-15">OS: </label>
                <input 
                    type="range"
                    min="32" 
                    max={totalMemory / 2}
                    step="16"
                    value={osSize}
                    onChange={(e) => setOsSize(parseInt(e.target.value))}
                    className="w-full max-w-70 accent-black cursor-pointer"
                />
                <span className="font-mono bg-white border border-black px-1">{osSize}KB</span>
            </div>
        </div>
    );
}