// src/components/ui/Modal.tsx
import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
  overlayClassName?: string;
  panelClassName?: string;
  headerClassName?: string;
  bodyClassName?: string;
}

export function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  maxWidth = 'max-w-md',
  overlayClassName = '',
  panelClassName = '',
  headerClassName = '',
  bodyClassName = '',
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 ${overlayClassName}`}>
      <div className={`bg-white rounded-xl shadow-lg w-full ${maxWidth} overflow-hidden flex flex-col ${panelClassName}`}>
        <div className={`flex justify-between items-center p-4 border-b border-gray-200 ${headerClassName}`}>
          <h3 className="text-lg font-bold text-gray-900 font-mono">{title}</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>
        
        <div className={`p-4 ${bodyClassName}`}>
          {children}
        </div>
      </div>
    </div>
  );
}