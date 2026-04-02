import { useState } from "react";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { Tooltip } from "../ui/Tooltip";

const RETRO_NEUTRAL_COLORS = [
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

export function ProcessCard() {
    const [isColorModalOpen, setIsColorModalOpen] = useState(false);
    const [processColor, setProcessColor] = useState("#B45309");

    const handleSelectColor = (color: string) => {
        setProcessColor(color);
        setIsColorModalOpen(false);
    };

    // Mock stats for tooltip
    const tooltipContent = (
        <div className="text-xs space-y-1">
            <div className="text-lg"><span className="font-bold">Estado:</span> En espera</div>
            <div className="text-lg"><span className="font-bold">Eficiencia:</span> 92%</div>
            <div className="text-lg"><span className="font-bold">Tiempo esperado:</span> 5 ciclos</div>
            <div className="text-lg"><span className="font-bold">Fragmentación:</span> 2.1%</div>
            <div className="text-lg"><span className="font-bold">Prioridad:</span> Alta</div>
        </div>
    );

    return (
        <>
            <Tooltip content={tooltipContent} position="top">
                <div className="border-2 border-[#111] bg-[#ececec] h-fit p-4 cursor-help">
                    <div>
                        <h4 className="text-lg font-bold mb-2">Proceso A</h4>
                        <p>Tamano: 60KB</p>
                        <p>Llegada: [ 26 ] t</p>
                        <p>Duracion: [ 3 ] ciclos</p>
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
                    <hr className="mx-5 h-[4px] text-slate-500 my-5" />
                    <div className="justify-right">
                        <div className="flex flex-row gap-2 justify-end">
                        <Button variant="info" className="mr-2">Editar</Button>
                        <Button variant="primary">Eliminar</Button>
                        </div>
                    </div>
                </div>
            </Tooltip>

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