import React, { useState } from 'react';
import { solveMathProblem } from '../services/geminiService';
import { CalculatorIcon, SparklesIcon, ArrowPathIcon, ClipboardIcon, CheckIcon } from './icons';

const CodeBlock: React.FC<{ code: string }> = ({ code }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(code).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };
    return (
        <div className="bg-[var(--color-bg)] rounded-md my-2 relative font-mono text-sm">
            <button 
                onClick={handleCopy} 
                className="absolute top-2 right-2 p-1.5 rounded-md bg-[var(--color-input-bg)]/50 hover:bg-[var(--color-input-bg)] text-gray-300 transition-colors"
                title="Copy code"
            >
                {copied ? <CheckIcon className="w-4 h-4 text-green-400" /> : <ClipboardIcon className="w-4 h-4" />}
            </button>
            <pre className="p-4 pt-10 text-gray-200 overflow-x-auto"><code>{code}</code></pre>
        </div>
    );
};

const MessageContent: React.FC<{ content: string }> = ({ content }) => {
    const parts = content.split(/(```(?:\w+)?\n[\s\S]*?\n```)/g);
    return (
        <div className="text-sm leading-relaxed whitespace-pre-wrap">
            {parts.map((part, index) => {
                if (part.startsWith('```')) {
                    const codeMatch = part.match(/```(?:\w+)?\n([\s\S]*?)\n```/);
                    const code = codeMatch ? codeMatch[1] : '';
                    return <CodeBlock key={index} code={code} />;
                }
                return <span key={index}>{part}</span>;
            })}
        </div>
    );
};


export const MathHelperView: React.FC = () => {
    const [problem, setProblem] = useState('');
    const [solution, setSolution] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSolve = async () => {
        if (!problem.trim()) {
            setError('Please enter a math problem.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setSolution(null);

        try {
            const result = await solveMathProblem(problem);
            setSolution(result);
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
                    <label htmlFor="problem-input" className="text-sm font-medium text-gray-300">Enter a math problem:</label>
                    <textarea
                        id="problem-input"
                        value={problem}
                        onChange={(e) => setProblem(e.target.value)}
                        placeholder="e.g., Solve for x: 2x + 10 = 4"
                        className="w-full p-3 rounded-md bg-[var(--color-input-bg)] border border-[var(--color-border)] focus:ring-2 focus:ring-[var(--color-primary)] focus:outline-none transition shadow-inner font-mono"
                        rows={4}
                        disabled={isLoading}
                    />
                </div>
                <button
                    onClick={handleSolve}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-[var(--color-primary-text)] bg-[var(--color-primary-accent)] hover:bg-[var(--color-primary)] disabled:bg-gray-600 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-500 transition-all"
                >
                    {isLoading ? (
                        <>
                            <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" />
                            Solving...
                        </>
                    ) : (
                        <>
                            <SparklesIcon className="w-5 h-5 mr-2" />
                            Get Solution
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
            
            <div className="flex-grow mt-4 bg-[var(--color-panel-bg)] rounded-xl flex flex-col p-4 border border-[var(--color-border)] w-full max-w-4xl mx-auto">
                {isLoading && (
                    <div className="text-center text-gray-400 m-auto">
                        <ArrowPathIcon className="w-10 h-10 mx-auto animate-spin mb-3 text-[var(--color-primary)]" />
                        <p className="text-lg">AI is working on the solution...</p>
                    </div>
                )}
                {!isLoading && solution && (
                   <div className="prose prose-invert prose-sm max-w-none p-4 overflow-y-auto">
                       <MessageContent content={solution} />
                   </div>
                )}
                {!isLoading && !solution && (
                     <div className="text-center text-gray-500 m-auto">
                        <CalculatorIcon className="w-20 h-20 mx-auto mb-4" />
                        <p className="text-xl">The step-by-step solution will appear here</p>
                    </div>
                )}
            </div>
        </div>
    );
};