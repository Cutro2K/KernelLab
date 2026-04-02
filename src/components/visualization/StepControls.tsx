import { Button } from '../ui/Button';

// Definimos qué acciones necesita recibir este panel
interface StepControlsProps {
  onPlay: () => void;
  onPause: () => void;
  onStepForward: () => void;
  onStepBackward: () => void;

  onReset: () => void;
  // Opcional: una variable para saber si está corriendo y deshabilitar botones
  isRunning?: boolean; 
}

export function StepControls({ 
  onPlay, 
  onPause, 
  onStepForward, 
  onStepBackward,
  onReset, 
  isRunning = false 
}: StepControlsProps) {
  return (
    <div className="flex flex-wrap gap-3 bg-white p-4 rounded-xl w-fit">
      
      {/* Botón para avanzar 1 solo paso hacia atras (se deshabilita si está en auto-play) */}
      <Button 
        variant="ghost"
        onClick={onStepBackward} 
        disabled={isRunning}
      >
        ◄
      </Button>

      {/* Si está corriendo, mostramos Pausa. Si no, mostramos Play */}
      {!isRunning ? (
        <Button variant="ghost" onClick={onPlay}>
          ▶ Start
        </Button>
      ) : (
        <Button variant="secondary" onClick={onPause}>
          ⏸ Pause
        </Button>
      )}

      {/* Botón para avanzar 1 solo paso (se deshabilita si está en auto-play) */}
      <Button 
        variant="ghost"
        onClick={onStepForward} 
        disabled={isRunning}
      >
        ►
      </Button>

      {/* Un separador visual sutil */}
      <div className="w-px bg-gray-300 mx-2"></div>

      {/* Botón de reinicio */}
      <Button variant="ghost" onClick={onReset}>
        ↺
      </Button>

    </div>
  );
}