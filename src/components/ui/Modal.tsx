// src/components/ui/Modal.tsx
import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    // Fondo oscuro
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      {/* Contenedor del Modal */}
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden flex flex-col">
        {/* Cabecera */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>
        
        {/* Contenido */}
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
}