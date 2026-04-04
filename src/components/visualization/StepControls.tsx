import { Button } from '../ui/Button';

// Definimos qué acciones necesita recibir este panel
interface StepControlsProps {
  onPlay: () => void;
  onPause: () => void;
  onStepForward: () => void;
  onStepBackward: () => void;

  onReset: () => void;
  compact?: boolean;
  // Opcional: una variable para saber si está corriendo y deshabilitar botones
  isRunning?: boolean; 
}

export function StepControls({ 
  onPlay, 
  onPause, 
  onStepForward, 
  onStepBackward,
  onReset, 
  compact = false,
  isRunning = false 
}: StepControlsProps) {
  const buttonClassName = compact ? 'px-2 py-1 text-sm leading-none' : '';

  return (
    <div className={`flex flex-wrap items-center bg-transparent rounded-xl w-fit ${compact ? 'gap-1 p-1' : 'gap-3 p-4'}`}>
      
      {/* Botón para avanzar 1 solo paso hacia atras (se deshabilita si está en auto-play) */}
      <Button 
        variant="ghost"
        className={buttonClassName}
        onClick={onStepBackward} 
        disabled={isRunning}
      >
        ◄
      </Button>

      {/* Si está corriendo, mostramos Pausa. Si no, mostramos Play */}
      {!isRunning ? (
        <Button variant="ghost" className={buttonClassName} onClick={onPlay}>
          {compact ? '▶' : '▶ Start'}
        </Button>
      ) : (
        <Button variant="secondary" className={buttonClassName} onClick={onPause}>
          {compact ? '⏸' : '⏸ Pause'}
        </Button>
      )}

      {/* Botón para avanzar 1 solo paso (se deshabilita si está en auto-play) */}
      <Button 
        variant="ghost"
        className={buttonClassName}
        onClick={onStepForward} 
        disabled={isRunning}
      >
        ►
      </Button>

      {/* Un separador visual sutil */}
      <div className={`w-px bg-gray-300 ${compact ? 'mx-1 h-5' : 'mx-2 h-7'}`}></div>

      {/* Botón de reinicio */}
      <Button variant="ghost" className={buttonClassName} onClick={onReset}>
        ↺
      </Button>

    </div>
  );
}