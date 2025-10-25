import React, { useState, useEffect } from 'react';
import { generateWebsiteCode } from '../services/geminiService';
import type { WebsiteCode, AIMemory } from '../types';
import { LightBulbIcon, SparklesIcon, ArrowPathIcon, ArrowDownTrayIcon } from './icons';

export const WebsiteBuilderView: React.FC<{ 
    userName: string, 
    userAge: string,
    aiMemoryEnabled: boolean,
    aiMemory: AIMemory[],
    isVerified: boolean
}> = ({ 
    userName, 
    userAge,
    aiMemoryEnabled,
    aiMemory,
    isVerified
}) => {
    const [topic, setTopic] = useState('');
    const [code, setCode] = useState<WebsiteCode | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [previewContent, setPreviewContent] = useState('');

    useEffect(() => {
        if (code) {
            const fullHtml = `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Generated Site</title>
                    <style>${code.css}</style>
                </head>
                <body>
                    ${code.html}
                    <script>${code.javascript}</script>
                </body>
                </html>
            `;
            setPreviewContent(fullHtml);
        } else {
            setPreviewContent('');
        }
    }, [code]);

    const handleGenerate = async () => {
        if (!topic.trim()) {
            setError('Please enter a topic.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setCode(null);

        try {
            const result = await generateWebsiteCode(
                userName, 
                userAge, 
                aiMemoryEnabled,
                aiMemory,
                isVerified,
                topic
            );
            setCode(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownload = async () => {
        if (!code) return;
        
        try {
            const JSZip = (await import('jszip')).default;
            const zip = new JSZip();

            zip.file("index.html", code.html);
            zip.file("style.css", code.css);
            zip.file("script.js", code.javascript);
            
            const content = await zip.generateAsync({ type: "blob" });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.download = "ai-generated-website.zip";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (e) {
            console.error("Failed to create or download zip file:", e);
            setError("An error occurred while creating the download file.");
        }
    };

    return (
        <div className="flex-grow flex flex-col p-4 gap-4 overflow-y-auto">
            <div className="w-full max-w-4xl mx-auto flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                    <label htmlFor="topic-input" className="text-sm font-medium text-gray-300">Enter a topic to build a website:</label>
                    <textarea
                        id="topic-input"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="e.g., A portfolio for a freelance photographer"
                        className="w-full p-3 rounded-md bg-[var(--color-input-bg)] border border-[var(--color-border)] focus:ring-2 focus:ring-[var(--color-primary)] focus:outline-none transition shadow-inner"
                        rows={2}
                        disabled={isLoading}
                    />
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                    <button
                        onClick={handleGenerate}
                        disabled={isLoading}
                        className="w-full flex-grow flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-[var(--color-primary-text)] bg-[var(--color-primary-accent)] hover:bg-[var(--color-primary)] disabled:bg-gray-600 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-500 transition-all"
                    >
                        {isLoading ? (
                            <>
                                <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <SparklesIcon className="w-5 h-5 mr-2" />
                                Generate Website
                            </>
                        )}
                    </button>
                    {code && (
                         <button
                            onClick={handleDownload}
                            className="w-full sm:w-auto flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-[var(--color-primary-text)] bg-green-600 hover:bg-green-700 disabled:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-green-500 transition-all"
                        >
                            <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
                            Download Website
                        </button>
                    )}
                </div>


                {error && (
                    <div className="bg-red-900/50 border border-red-700 text-red-200 p-3 rounded-md text-sm">
                        <p className="font-bold">Error</p>
                        <p>{error}</p>
                    </div>
                )}
            </div>
            
            <div className="flex-grow mt-4 bg-black/30 rounded-xl flex flex-col items-center justify-center border border-[var(--color-border)] w-full max-w-6xl mx-auto overflow-hidden">
                {isLoading && (
                    <div className="text-center text-gray-400">
                        <ArrowPathIcon className="w-10 h-10 mx-auto animate-spin mb-3 text-[var(--color-primary)]" />
                        <p className="text-lg">Building your website...</p>
                        <p className="text-sm">This may take a moment.</p>
                    </div>
                )}
                {!isLoading && code && (
                   <iframe
                        srcDoc={previewContent}
                        title="Website Preview"
                        className="w-full h-full bg-white"
                        sandbox="allow-scripts allow-same-origin"
                    />
                )}
                {!isLoading && !code && (
                     <div className="text-center text-gray-500 p-8">
                        <LightBulbIcon className="w-20 h-20 mx-auto mb-4" />
                        <p className="text-xl">Your generated website preview will appear here</p>
                    </div>
                )}
            </div>
        </div>
    );
};