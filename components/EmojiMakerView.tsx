import React, { useState } from 'react';
import { generateImage } from '../services/geminiService';
import { FaceSmileIcon, SparklesIcon, ArrowPathIcon } from './icons';

export const EmojiMakerView: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError('Please enter a description for your emoji.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setImageUrl(null);

        try {
            const fullPrompt = `A high-quality, vibrant emoji of ${prompt}. The emoji should be in a modern, clean sticker style with a distinct border, suitable for digital use. It must have a transparent background.`;
            const url = await generateImage(fullPrompt);
            setImageUrl(url);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex-grow flex flex-col p-4 gap-4 overflow-y-auto">
            <div className="w-full max-w-4xl mx-auto flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                    <label htmlFor="prompt-input" className="text-sm font-medium text-gray-300">Describe the emoji you want to create:</label>
                    <textarea
                        id="prompt-input"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g., A happy slice of pizza wearing sunglasses"
                        className="w-full p-3 rounded-md bg-[var(--color-input-bg)] border border-[var(--color-border)] focus:ring-2 focus:ring-[var(--color-primary)] focus:outline-none transition shadow-inner"
                        rows={2}
                        disabled={isLoading}
                    />
                </div>
                <button
                    onClick={handleGenerate}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-[var(--color-primary-text)] bg-[var(--color-primary-accent)] hover:bg-[var(--color-primary)] disabled:bg-gray-600 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-500 transition-all"
                >
                    {isLoading ? (
                        <>
                            <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" />
                            Generating...
                        </>
                    ) : (
                        <>
                            <SparklesIcon className="w-5 h-5 mr-2" />
                            Generate Emoji
                        </>
                    )}
                </button>

                {error && (
                    <div className="bg-red-900/50 border border-red-700 text-red-200 p-3 rounded-md text-sm">
                        <p className="font-bold">Error</p>
                        <p>{error}</p>
                    </div>
                )}
            </div>
            
            <div className="flex-grow mt-4 bg-black/30 rounded-xl flex items-center justify-center p-4 border border-[var(--color-border)] aspect-square w-full max-w-md mx-auto">
                {isLoading && (
                    <div className="text-center text-gray-400">
                        <ArrowPathIcon className="w-10 h-10 mx-auto animate-spin mb-3 text-[var(--color-primary)]" />
                        <p className="text-lg">Creating your emoji...</p>
                        <p className="text-sm">This may take a moment.</p>
                    </div>
                )}
                {!isLoading && imageUrl && (
                    <img src={imageUrl} alt={prompt} className="max-w-full max-h-full object-contain" />
                )}
                {!isLoading && !imageUrl && (
                     <div className="text-center text-gray-500">
                        <FaceSmileIcon className="w-20 h-20 mx-auto mb-4" />
                        <p className="text-xl">Your generated emoji will appear here</p>
                    </div>
                )}
            </div>
        </div>
    );
};