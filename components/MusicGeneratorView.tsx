import React from 'react';
import { MusicalNoteIcon } from './icons';

export const MusicGeneratorView: React.FC = () => {
    return (
        <div className="flex-grow flex flex-col p-4 gap-4 overflow-y-auto">
            <div className="w-full max-w-4xl mx-auto flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                    <label htmlFor="music-prompt-input" className="text-sm font-medium text-gray-500">Describe the music you want to create:</label>
                    <textarea
                        id="music-prompt-input"
                        placeholder="e.g., A relaxing lo-fi beat for studying"
                        className="w-full p-3 rounded-md bg-gray-800 border border-gray-700 focus:ring-2 focus:ring-cyan-700 focus:outline-none transition shadow-inner cursor-not-allowed"
                        rows={2}
                        disabled
                    />
                </div>
                <button
                    disabled
                    className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-gray-600 cursor-not-allowed"
                >
                    Generate Music
                </button>
            </div>
            
            <div className="flex-grow mt-4 bg-black/30 rounded-xl flex items-center justify-center p-4 border border-[var(--color-border)] w-full max-w-4xl mx-auto">
                <div className="text-center text-gray-500">
                    <MusicalNoteIcon className="w-20 h-20 mx-auto mb-4" />
                    <p className="text-2xl font-bold text-gray-400">Music Generator is Coming Soon!</p>
                    <p className="mt-2 max-w-md">This feature is currently under development. Soon, you'll be able to create unique musical pieces right here!</p>
                </div>
            </div>
        </div>
    );
};