import React, { useState, useEffect } from 'react';
import { generateVideo } from '../services/geminiService';
import { VideoCameraIcon, SparklesIcon, ArrowPathIcon } from './icons';

// Fix: Removed the conflicting global declaration for `window.aistudio`.
// It was causing a TypeScript error as the type is already declared globally.
export const VideoGeneratorView: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [progressStatus, setProgressStatus] = useState<string>('');
    const [isKeySelected, setIsKeySelected] = useState(false);

    useEffect(() => {
        const checkApiKey = async () => {
            if (window.aistudio) {
                const hasKey = await window.aistudio.hasSelectedApiKey();
                setIsKeySelected(hasKey);
            }
        };
        checkApiKey();
    }, []);

    const handleSelectKey = async () => {
        if (window.aistudio) {
            await window.aistudio.openSelectKey();
            setIsKeySelected(true);
        }
    };
    
    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError('Please enter a prompt.');
            return;
        }

        if (window.aistudio && !(await window.aistudio.hasSelectedApiKey())) {
             setError("Please select an API key to generate videos.");
             setIsKeySelected(false);
             return;
        }
        
        setIsLoading(true);
        setError(null);
        setVideoUrl(null);
        setProgressStatus('');

        try {
            const onProgress = (status: string) => {
                setProgressStatus(status);
            };
            const url = await generateVideo(prompt, onProgress);
            setVideoUrl(url);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(errorMessage);
            if (errorMessage.includes("invalid") || errorMessage.includes("not found")) {
                setIsKeySelected(false);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="text-center text-gray-400">
                    <ArrowPathIcon className="w-10 h-10 mx-auto animate-spin mb-3 text-[var(--color-primary)]" />
                    <p className="text-lg font-semibold">Generating your video...</p>
                    <p className="text-sm mt-2 px-4">{progressStatus}</p>
                </div>
            );
        }
        if (videoUrl) {
            return (
                <video src={videoUrl} controls autoPlay loop className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
            );
        }
        return (
            <div className="text-center text-gray-500">
                <VideoCameraIcon className="w-20 h-20 mx-auto mb-4" />
                <p className="text-xl">Your generated video will appear here</p>
            </div>
        );
    };

    return (
        <div className="flex-grow flex flex-col p-4 gap-4 overflow-y-auto">
            <div className="w-full max-w-4xl mx-auto flex flex-col gap-4">
                {!isKeySelected && (
                     <div className="bg-blue-900/50 border border-blue-700 text-blue-200 p-4 rounded-md text-sm">
                        <p className="font-bold mb-2">API Key Required for Video Generation</p>
                        <p className="mb-3">To use the video generator, you need to select an API key. This feature is resource-intensive and may incur costs.</p>
                        <p className="mb-4">For more information on billing, please see the <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline hover:text-cyan-300">billing documentation</a>.</p>
                        <button
                            onClick={handleSelectKey}
                            className="w-full sm:w-auto flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500"
                        >
                            Select API Key
                        </button>
                    </div>
                )}

                <div className="flex flex-col gap-2">
                    <label htmlFor="video-prompt-input" className="text-sm font-medium text-gray-300">Enter a prompt to generate a video:</label>
                    <textarea
                        id="video-prompt-input"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g., A cinematic shot of a futuristic city at sunset, flying cars whizzing by"
                        className="w-full p-3 rounded-md bg-[var(--color-input-bg)] border border-[var(--color-border)] focus:ring-2 focus:ring-[var(--color-primary)] focus:outline-none transition shadow-inner"
                        rows={3}
                        disabled={isLoading || !isKeySelected}
                    />
                </div>
                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !isKeySelected}
                    className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-[var(--color-primary-text)] bg-[var(--color-primary-accent)] hover:bg-[var(--color-primary)] disabled:bg-gray-600 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-[var(--color-primary)] transition-all"
                >
                    {isLoading ? (
                        <>
                            <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" />
                            Generating...
                        </>
                    ) : (
                        <>
                            <SparklesIcon className="w-5 h-5 mr-2" />
                            Generate Video
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
            
            <div className="flex-grow mt-4 bg-black/30 rounded-xl flex items-center justify-center p-4 border border-[var(--color-border)] aspect-video w-full max-w-4xl mx-auto">
               {renderContent()}
            </div>
        </div>
    );
};