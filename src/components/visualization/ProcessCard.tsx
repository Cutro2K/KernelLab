import { useState } from "react";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { Tooltip } from "../ui/Tooltip";
import warningIcon from "../../assets/warning.svg";
import { useComparisonStore } from "../../store/simulationStore";

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

export function ProcessCard({id, name, color, codeSize, stackSize, dataSize, heapSize, arrivalTime, duration, onDelete}: {id?: string, name?: string, color?: string, codeSize?: number, stackSize?: number, dataSize?: number, heapSize?: number, arrivalTime?: number, duration?: number, onDelete?: (id: string) => void}) {
    const removeComparisonProcess = useComparisonStore((state) => state.removeProcess);
    const [isColorModalOpen, setIsColorModalOpen] = useState(false);
    const [processColor, setProcessColor] = useState(color || "#B45309");
    const [editIsOpen, setEditIsOpen] = useState(false);
    const [segmentCode, setSegmentCode] = useState(codeSize || 120);
    const [segmentData, setSegmentData] = useState(dataSize || 250);
    const [segmentStack, setSegmentStack] = useState(stackSize || 64);
    const [segmentHeap, setSegmentHeap] = useState(heapSize || 250);

    const totalSize = segmentCode + segmentData + segmentStack + segmentHeap;

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

    // Mock stats for tooltip
    const tooltipContent = (
        <div className="text-xs space-y-1">
            <div className="text-lg">ID: {id}</div>
            <div className="text-lg"><span className="font-bold">Estado:</span> En espera</div>
            <div className="text-lg"><span className="font-bold">Eficiencia:</span> 92%</div>
            <div className="text-lg"><span className="font-bold">Tiempo esperado:</span> 5 ciclos</div>
            <div className="text-lg"><span className="font-bold">Fragmentación:</span> 2.1%</div>
            <div className="text-lg"><span className="font-bold">Prioridad:</span> Alta</div>
        </div>
    );

    return (
        <>
            <Tooltip content={tooltipContent}>
                <div className="border-2 border-[#111] bg-[#ececec] h-fit p-4 cursor-help">
                    <div>
                        <h4 className="text-lg font-bold mb-2">{name}</h4>
                        <p>Tamano: {totalSize}KB</p>
                        <p>Llegada: {arrivalTime} t</p>
                        <p>Duracion: {duration} ciclos</p>
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
                        <Button variant="info" className="mr-2" onClick={() => setEditIsOpen(true)}>
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
                    onClose={() => setEditIsOpen(false)}
                    title="EDITAR PROCESO"
                    maxWidth="max-w-4xl"
                    overlayClassName="bg-black/70 backdrop-blur-sm"
                    panelClassName="rounded-none border-2 border-[#111] bg-[#efefef] shadow-[10px_10px_0_rgba(0,0,0,0.45)]"
                    headerClassName="border-b-2 border-[#111] bg-[#d4d4d4]"
                    bodyClassName="bg-[#efefef]"
                >
                    <form className="border-2 border-[#111] bg-[#f5f5f5] p-4" onSubmit={(event) => event.preventDefault()}>
                        <div className="mb-4 flex items-start justify-between gap-4 border-b-2 border-[#111] pb-3">
                            <div className="text-center items-center justify-center">
                                <h3 className="mx-auto">{name}</h3>
                            </div>
                            <div className="min-w-40 gap-5 border-2 flex flex-row border-[#111] bg-white px-3 py-2 text-right">
                                <Tooltip content="El proceso es mas grande que el espacio disponible">
                                    <img className="w-[40px] h-[40px] my-auto" src={warningIcon} alt="Warning"/>
                                </Tooltip>
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
                            <Button variant="secondary" type="button" onClick={() => setEditIsOpen(false)}>
                                Cancelar
                            </Button>
                            <Button variant="primary" type="submit">
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