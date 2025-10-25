import React from 'react';
import { XMarkIcon } from './icons';

interface AboutModalProps {
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ onClose }) => {
  return (
    <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
        onClick={onClose}
        aria-modal="true"
        role="dialog"
    >
      <div 
        className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 w-full max-w-md m-4 p-6 relative transform transition-all"
        onClick={e => e.stopPropagation()}
      >
        <button 
          onClick={onClose} 
          className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors"
          aria-label="Close"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>
        <div className="text-center">
            <h2 className="text-2xl font-bold text-cyan-400 mb-2">AI Screen Share Assistant</h2>
            <p className="text-gray-300 mb-4">
                This application allows you to share your screen and have a real-time voice conversation with an AI assistant.
            </p>
            <div className="bg-gray-900/50 rounded-lg p-4">
                <p className="text-sm text-gray-400">Created by</p>
                <p className="text-lg font-semibold text-white">Jake Merrill</p>
            </div>
        </div>
      </div>
    </div>
  );
};