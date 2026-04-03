import { useEffect, useState } from "react";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { Tooltip } from "../ui/Tooltip";
import warningIcon from "../../assets/warning.svg";
import { useComparisonStore, useSimulationStore } from "../../store/simulationStore";

export const RETRO_NEUTRAL_COLORS = [
    "#A8A29E", // stone
    "#78716C", // warm gray
    "#9CA3AF", // gray
    "#6B7280", // slate gray
    "#4B5563", // charcoal
    "#B45309", // retro amber
    "#7C2D12", // oxide brown
    "#0F766E", // muted teal
    "#166534", // moss green
    "#1D4ED8", // muted blue
];
    // Aquí deberías llamar a tu función de eliminación del proceso en el estado global

export function ProcessCard({id, name, color, codeSize, stackSize, dataSize, heapSize, arrivalTime, duration, stackArrivalTime, dataArrivalTime, heapArrivalTime, codeArrivalTime, onDelete}: {id?: string, name?: string, color?: string, codeSize?: number, stackSize?: number, dataSize?: number, heapSize?: number, arrivalTime?: number, duration?: number, stackArrivalTime?: number, dataArrivalTime?: number, heapArrivalTime?: number, codeArrivalTime?: number, onDelete?: (id: string) => void}) {
    const removeComparisonProcess = useComparisonStore((state) => state.removeProcess);
    const simulationConfig = useSimulationStore((state) => state.configParams);
    const comparisonConfig1 = useComparisonStore((state) => state.configParams1);
    const comparisonConfig2 = useComparisonStore((state) => state.configParams2);
    const [isColorModalOpen, setIsColorModalOpen] = useState(false);
    const [processColor, setProcessColor] = useState(color || "#B45309");
    const [editIsOpen, setEditIsOpen] = useState(false);
    const [segmentCode, setSegmentCode] = useState(codeSize || 120);
    const [segmentData, setSegmentData] = useState(dataSize || 250);
    const [segmentStack, setSegmentStack] = useState(stackSize || 64);
    const [segmentHeap, setSegmentHeap] = useState(heapSize || 250);
    const [arrivalValue, setArrivalValue] = useState(arrivalTime || 0);
    const [durationValue, setDurationValue] = useState(duration || 0);
    const [stackArrivalValue, setStackArrivalValue] = useState(stackArrivalTime || 0);
    const [dataArrivalValue, setDataArrivalValue] = useState(dataArrivalTime || 0);
    const [heapArrivalValue, setHeapArrivalValue] = useState(heapArrivalTime || 0);
    const [codeArrivalValue, setCodeArrivalValue] = useState(codeArrivalTime || 0);

    const committedTotalSize = (codeSize ?? 0) + (dataSize ?? 0) + (stackSize ?? 0) + (heapSize ?? 0);
    const totalSize = segmentCode + segmentData + segmentStack + segmentHeap;
    const availableMemoryCandidates = [
        simulationConfig,
        comparisonConfig1,
        comparisonConfig2,
    ]
        .filter((config): config is NonNullable<typeof config> => config !== null)
        .map((config) => Math.max(0, config.totalMemory - (config.osSize ?? 0)));
    const availableMemory = availableMemoryCandidates.length > 0 ? Math.min(...availableMemoryCandidates) : null;
    const showSizeWarning = availableMemory !== null && totalSize > availableMemory;

    const toPercent = (value: number) => {
        if (totalSize === 0) return 0;
        return Math.round((value / totalSize) * 100);
    };

    const segmentItems = [
        { label: "Codigo", value: segmentCode, percent: toPercent(segmentCode), bg: "bg-[#8B5CF6]" },
        { label: "Datos", value: segmentData, percent: toPercent(segmentData), bg: "bg-[#2563EB]" },
        { label: "Stack", value: segmentStack, percent: toPercent(segmentStack), bg: "bg-[#0F766E]" },
        { label: "Heap", value: segmentHeap, percent: toPercent(segmentHeap), bg: "bg-[#A16207]" },
    ];

    const MIN_VISIBLE_PERCENT = 6;
    const BASE_MAP_HEIGHT_REM = 27.5; // h-110

    const adjustedSegments = segmentItems.map((segment) => ({
        ...segment,
        boostedPercent: Math.max(segment.percent, MIN_VISIBLE_PERCENT),
    }));

    const boostedTotalPercent = adjustedSegments.reduce((sum, segment) => sum + segment.boostedPercent, 0);
    const mapHeightRem = BASE_MAP_HEIGHT_REM * Math.max(1, boostedTotalPercent / 100);

    const handleSelectColor = (color: string) => {
        setProcessColor(color);
        setIsColorModalOpen(false);
    };

    const resetDraftFromProps = () => {
        setProcessColor(color || "#B45309");
        setSegmentCode(codeSize || 120);
        setSegmentData(dataSize || 250);
        setSegmentStack(stackSize || 64);
        setSegmentHeap(heapSize || 250);
        setArrivalValue(arrivalTime || 0);
        setDurationValue(duration || 0);
        setStackArrivalValue(stackArrivalTime || 0);
        setDataArrivalValue(dataArrivalTime || 0);
        setHeapArrivalValue(heapArrivalTime || 0);
        setCodeArrivalValue(codeArrivalTime || 0);
    };

    const closeEditModal = () => {
        resetDraftFromProps();
        setEditIsOpen(false);
    };

    useEffect(() => {
        if (editIsOpen) {
            return;
        }
        resetDraftFromProps();
    }, [
        editIsOpen,
        color,
        codeSize,
        dataSize,
        stackSize,
        heapSize,
        arrivalTime,
        duration,
        stackArrivalTime,
        dataArrivalTime,
        heapArrivalTime,
        codeArrivalTime,
    ]);

    const handleArrivalTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const nextValue = Math.max(0, Number(event.target.value) || 0);
        setArrivalValue(nextValue);
    };

    const handleDurationChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const nextValue = Math.max(0, Number(event.target.value) || 0);
        setDurationValue(nextValue);
    };

    const handleStackArrivalTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const nextValue = Math.max(0, Number(event.target.value) || 0);
        setStackArrivalValue(nextValue);
    };

    const handleDataArrivalTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const nextValue = Math.max(0, Number(event.target.value) || 0);
        setDataArrivalValue(nextValue);
    };

    const handleHeapArrivalTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const nextValue = Math.max(0, Number(event.target.value) || 0);
        setHeapArrivalValue(nextValue);
    };

    const handleCodeArrivalTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const nextValue = Math.max(0, Number(event.target.value) || 0);
        setCodeArrivalValue(nextValue);
    };

    const applyProcessEdits = () => {
        if (!id) {
            setEditIsOpen(false);
            return;
        }

        const updatedProcessData = {
            codeSize: segmentCode,
            dataSize: segmentData,
            stackSize: segmentStack,
            heapSize: segmentHeap,
            size: totalSize,
            arrivalTime: arrivalValue,
            duration: durationValue,
            codeArrivalTime: codeArrivalValue,
            dataArrivalTime: dataArrivalValue,
            stackArrivalTime: stackArrivalValue,
            heapArrivalTime: heapArrivalValue,
            color: processColor,
        };

        useComparisonStore.setState((state) => {
            if (!state.processes) return state;

            return {
                ...state,
                processes: state.processes.map((process) =>
                    process.id === id ? { ...process, ...updatedProcessData } : process,
                ),
            };
        });

        useSimulationStore.setState((state) => {
            if (!state.processes) return state;

            return {
                ...state,
                processes: state.processes.map((process) =>
                    process.id === id ? { ...process, ...updatedProcessData } : process,
                ),
            };
        });

        setEditIsOpen(false);
    };

    const committedUtilization = availableMemory && availableMemory > 0
        ? Math.round((committedTotalSize / availableMemory) * 100)
        : null;

    const tooltipContent = (
        <div className="text-xs space-y-1">
            <div className="text-lg">ID: {id}</div>
            <div className="text-lg">Código: {codeSize ?? 0}KB</div>
            <div className="text-lg">Datos: {dataSize ?? 0}KB</div>
            <div className="text-lg">Stack: {stackSize ?? 0}KB</div>
            <div className="text-lg">Heap: {heapSize ?? 0}KB</div>
            {availableMemory !== null && (
                <div className="text-lg">Memoria útil: {availableMemory}KB</div>
            )}
            {committedUtilization !== null && (
                <div className="text-lg">Uso sobre memoria útil: {committedUtilization}%</div>
            )}
        </div>
    );

    return (
        <>
            <Tooltip content={tooltipContent}>
                <div className="border-2 border-[#111] bg-[#ececec] h-fit p-4 cursor-help">
                    <div>
                        <h4 className="text-lg font-bold mb-2">{name}</h4>
                        <p>Tamano: {committedTotalSize}KB</p>
                        <p>Llegada: {arrivalTime ?? 0} t</p>
                        <p>Duracion: {duration ?? 0} ciclos</p>
                        <div className="flex items-center gap-2">
                            <p>Color:</p>
                            <button
                                type="button"
                                onClick={() => setIsColorModalOpen(true)}
                                className="h-6 w-6 border-2 border-[#111] shadow-[2px_2px_0_rgba(0,0,0,0.3)] transition-transform hover:scale-105"
                                style={{ backgroundColor: processColor }}
                                aria-label="Cambiar color del proceso"
                                title="Cambiar color"
                            />
                        </div>
                    </div>
                    <hr className="mx-5 h-1 text-slate-500 my-5" />
                    <div className="justify-right">
                        <div className="flex flex-row gap-2 justify-end">
                        <Button variant="info" className="mr-2" onClick={() => {
                            resetDraftFromProps();
                            setEditIsOpen(true);
                        }}>
                            Editar
                        </Button>
                        <Button onClick={() => id && (onDelete ? onDelete(id.toString()) : removeComparisonProcess(id.toString()))} variant="primary">Eliminar</Button>
                        </div>
                    </div>
                </div>
            </Tooltip>
            {editIsOpen && (
                <Modal
                    isOpen={editIsOpen}
                    onClose={closeEditModal}
                    title="EDITAR PROCESO"
                    maxWidth="max-w-4xl"
                    overlayClassName="bg-black/70 backdrop-blur-sm"
                    panelClassName="rounded-none border-2 border-[#111] bg-[#efefef] shadow-[10px_10px_0_rgba(0,0,0,0.45)]"
                    headerClassName="border-b-2 border-[#111] bg-[#d4d4d4]"
                    bodyClassName="bg-[#efefef]"
                >
                    <form
                        className="border-2 border-[#111] bg-[#f5f5f5] p-4"
                        onSubmit={(event) => {
                            event.preventDefault();
                            if (showSizeWarning) {
                                return;
                            }
                            applyProcessEdits();
                        }}
                    >
                        <div className="mb-4 flex items-start justify-between gap-4 border-b-2 border-[#111] pb-3">
                            <div className="text-center items-center justify-center">
                                <h3 className="mx-auto">{name}</h3>
                            </div>
                            <div className="min-w-40 gap-5 border-2 flex flex-row border-[#111] bg-white px-3 py-2 text-right">
                                {showSizeWarning && (
                                    <Tooltip content={`El proceso (${totalSize}KB) supera la memoria util (${availableMemory}KB)`}>
                                        <img className="w-10 h-10 my-auto" src={warningIcon} alt="Warning"/>
                                    </Tooltip>
                                )}
                                <div className="flex flex-col">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#4b5563]">Tamaño total</p>
                                    <p className="text-xl font-black">{totalSize} KB</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-3">
                                <SegmentInput label="Código" value={segmentCode} onChange={setSegmentCode} />
                                <SegmentInput label="Datos" value={segmentData} onChange={setSegmentData} />
                                <SegmentInput label="Stack" value={segmentStack} onChange={setSegmentStack} />
                                <SegmentInput label="Heap" value={segmentHeap} onChange={setSegmentHeap} />
                                <p>OPCIONES PARA ASIGNACION CONTIGUA</p>
                                <div className="flex text-sm flex-row">
                                    <label className="w-2/3">Tiempo de llegada</label>
                                    <div className="w-1/2 gap-2 flex flex-row justify-center">
                                    <input
                                        type="number"
                                        value={arrivalValue}
                                        onChange={handleArrivalTimeChange}
                                        className="border-2 border-[#111] bg-white w-3/5 text-right"
                                    />
                                    <p className="text-xs my-auto mr-2">Ciclo</p>
                                    </div>
                                </div>
                                <div className="flex text-sm flex-row">
                                    <label className="w-2/3">Duración</label>
                                    <div className="w-1/2 gap-2 flex flex-row justify-center">
                                    <input
                                        type="number"
                                        value={durationValue}
                                        onChange={handleDurationChange}
                                        className="border-2 border-[#111] bg-white w-3/5 text-right"
                                    />
                                    <p className="text-xs my-auto">Ciclos</p>
                                    </div>
                                </div>
                                <hr/>
                                <p>OPCIONES PARA ASIGNACION NO CONTIGUA</p>
                                <div className="flex text-sm flex-row">
                                    <label className="w-2/3">Tiempo de llegada Codigo</label>
                                    <div className="w-1/2 gap-2 flex flex-row justify-center">
                                    <input
                                        type="number"
                                        value={codeArrivalValue}
                                        onChange={handleCodeArrivalTimeChange}
                                        className="border-2 border-[#111] bg-white w-3/5 text-right"
                                    />
                                    <p className="text-xs my-auto mr-2">Ciclo</p>
                                    </div>
                                </div>
                                <div className="flex text-sm flex-row">
                                    <label className="w-2/3">Tiempo de llegada Stack</label>
                                    <div className="w-1/2 gap-2 flex flex-row justify-center">
                                    <input
                                        type="number"
                                        value={stackArrivalValue}
                                        onChange={handleStackArrivalTimeChange}
                                        className="border-2 border-[#111] bg-white w-3/5 text-right"
                                    />
                                    <p className="text-xs my-auto">Ciclo</p>
                                    </div>
                                </div>
                                <div className="flex text-sm flex-row">
                                    <label className="w-2/3">Tiempo de llegada Heap</label>
                                    <div className="w-1/2 gap-2 flex flex-row justify-center">
                                    <input
                                        type="number"
                                        value={heapArrivalValue}
                                        onChange={handleHeapArrivalTimeChange}
                                        className="border-2 border-[#111] bg-white w-3/5 text-right"
                                    />
                                    <p className="text-xs my-auto">Ciclo</p>
                                    </div>
                                </div>
                                <div className="flex text-sm flex-row">
                                    <label className="w-2/3">Tiempo de llegada Datos</label>
                                    <div className="w-1/2 gap-2 flex flex-row justify-center">
                                    <input
                                        type="number"
                                        value={dataArrivalValue}
                                        onChange={handleDataArrivalTimeChange}
                                        className="border-2 border-[#111] bg-white w-3/5 text-right"
                                    />
                                    <p className="text-xs my-auto">Ciclo</p>
                                    </div>
                                </div>
                            </div>
                            

                            <div className="border-2 border-[#111] bg-white p-3">
                                <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-[#4b5563]">Mapa de segmentos</p>
                                <div className="h-110 border-2 border-[#111] bg-[#f8f8f8]" style={{ height: `${mapHeightRem}rem` }}>
                                    {adjustedSegments.map((segment) => (
                                        <div
                                            key={segment.label}
                                            className={`flex items-center justify-center border-b border-[#111] text-xs font-black text-white last:border-b-0 ${segment.bg}`}
                                            style={{ height: `${(segment.boostedPercent / boostedTotalPercent) * 100}%` }}
                                        >
                                            {segment.label}: {segment.value} KB ({segment.percent}%)
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 flex justify-end gap-2 border-t-2 border-[#111] pt-3">
                            <Button variant="secondary" type="button" onClick={closeEditModal}>
                                Cancelar
                            </Button>
                            <Button variant="primary" type="submit" disabled={showSizeWarning}>
                                Guardar
                            </Button>
                        </div>
                    </form>
                </Modal>
            )}

            <Modal
                isOpen={isColorModalOpen}
                onClose={() => setIsColorModalOpen(false)}
                title="Seleccionar color del proceso"
            >
                <div className="grid grid-cols-5 gap-3">
                    {RETRO_NEUTRAL_COLORS.map((color) => (
                        <button
                            key={color}
                            type="button"
                            onClick={() => handleSelectColor(color)}
                            className={`h-10 w-10 border-2 border-[#111] shadow-[2px_2px_0_rgba(0,0,0,0.2)] ${
                                processColor === color ? "ring-2 ring-[#111] ring-offset-2" : ""
                            }`}
                            style={{ backgroundColor: color }}
                            aria-label={`Seleccionar ${color}`}
                            title={color}
                        />
                    ))}
                </div>
            </Modal>
        </>
    );
}

type SegmentInputProps = {
    label: string;
    value: number;
    onChange: (value: number) => void;
};

function SegmentInput({ label, value, onChange }: SegmentInputProps) {
    return (
        <label className="flex items-center justify-between gap-3 border-2 border-[#111] bg-white px-3 py-2 text-sm font-bold">
            <span className="text-base">● {label}</span>
            <div className="flex items-center gap-2">
                <input
                    type="number"
                    min={0}
                    value={value}
                    onChange={(event) => onChange(Math.max(0, Number(event.target.value) || 0))}
                    className="w-24 border-2 border-[#111] bg-[#fafafa] px-2 py-1 text-right focus:outline-none"
                />
                <span className="text-xs uppercase tracking-wider text-[#4b5563]">KB</span>
            </div>
        </label>
    );
}