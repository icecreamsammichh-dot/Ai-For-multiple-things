import React, { useState } from 'react';
import { writeStory } from '../services/geminiService';
import { BookOpenIcon, SparklesIcon, ArrowPathIcon } from './icons';

const GENRES = ['Fantasy', 'Sci-Fi', 'Mystery', 'Horror', 'Romance', 'Comedy', 'Adventure'];
const LENGTHS = ['Short (200 words)', 'Medium (500 words)', 'Long (1000 words)'];

export const StoryWriterView: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [genre, setGenre] = useState(GENRES[0]);
    const [length, setLength] = useState(LENGTHS[0]);
    const [story, setStory] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError('Please enter a story prompt.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setStory(null);

        try {
            const result = await writeStory(prompt, genre, length.split(' ')[0]);
            setStory(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex-grow flex flex-col p-4 gap-4 overflow-y-auto">
            <div className="w-full max-w-4xl mx-auto flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                         <label htmlFor="genre-select" className="block text-sm font-medium text-gray-300 mb-2">Genre</label>
                         <select id="genre-select" value={genre} onChange={e => setGenre(e.target.value)} disabled={isLoading} className="w-full p-3 rounded-md bg-[var(--color-input-bg)] border border-[var(--color-border)] focus:ring-2 focus:ring-[var(--color-primary)] focus:outline-none transition">
                            {GENRES.map(g => <option key={g}>{g}</option>)}
                         </select>
                    </div>
                     <div>
                         <label htmlFor="length-select" className="block text-sm font-medium text-gray-300 mb-2">Length</label>
                         <select id="length-select" value={length} onChange={e => setLength(e.target.value)} disabled={isLoading} className="w-full p-3 rounded-md bg-[var(--color-input-bg)] border border-[var(--color-border)] focus:ring-2 focus:ring-[var(--color-primary)] focus:outline-none transition">
                            {LENGTHS.map(l => <option key={l}>{l}</option>)}
                         </select>
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <label htmlFor="story-prompt-input" className="text-sm font-medium text-gray-300">Enter your story prompt:</label>
                    <textarea
                        id="story-prompt-input"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g., A detective who is also a ghost tries to solve their own murder."
                        className="w-full p-3 rounded-md bg-[var(--color-input-bg)] border border-[var(--color-border)] focus:ring-2 focus:ring-[var(--color-primary)] focus:outline-none transition shadow-inner"
                        rows={3}
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
                            Writing...
                        </>
                    ) : (
                        <>
                            <SparklesIcon className="w-5 h-5 mr-2" />
                            Write Story
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
            
            <div className="flex-grow mt-4 bg-[var(--color-panel-bg)] rounded-xl flex flex-col p-2 border border-[var(--color-border)] w-full max-w-4xl mx-auto">
                {isLoading && (
                    <div className="text-center text-gray-400 m-auto">
                        <ArrowPathIcon className="w-10 h-10 mx-auto animate-spin mb-3 text-[var(--color-primary)]" />
                        <p className="text-lg">The AI is crafting your story...</p>
                    </div>
                )}
                {!isLoading && story && (
                   <div className="p-4 overflow-y-auto text-gray-300 leading-relaxed whitespace-pre-wrap">
                       {story}
                   </div>
                )}
                {!isLoading && !story && (
                     <div className="text-center text-gray-500 m-auto p-4">
                        <BookOpenIcon className="w-20 h-20 mx-auto mb-4" />
                        <p className="text-xl">Your generated story will appear here</p>
                    </div>
                )}
            </div>
        </div>
    );
};