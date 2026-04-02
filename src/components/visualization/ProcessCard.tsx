import { Button } from "../ui/Button";

export function ProcessCard() {
    return (
        <div className="border-2 border-[#111] bg-[#ececec] h-fit p-4">
            <div className="h-1/2">
                <h4 className="text-lg font-bold mb-2">Proceso A</h4>
                <p>Uso de memoria: 120MB</p>
                <p>Fragmentación: 15KB</p>
                <p>Fallos de página: 2</p>
            </div>
            <hr className="mx-5 h-[4px] text-slate-500 my-2" />
            <div className="justify-right pt-5">
                <div className="flex flex-row gap-2 justify-end">
                <Button variant="info" className="mr-2">Editar</Button>
                <Button variant="primary">Eliminar</Button>
                </div>
            </div>
        </div>
    );
}