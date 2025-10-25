import React, { useState, useRef, useEffect, useCallback } from 'react';
import { sendMessageStream, generateChatTitle, extractMemorySuggestion } from '../services/geminiService';
import type { ChatMessage, ChatSession, AIMemory } from '../types';
import { SparklesIcon, UserIcon, ArrowPathIcon, ClipboardIcon, CheckIcon, PlusIcon, PencilIcon, TrashIcon, BookmarkIcon, XMarkIcon, PaperClipIcon, BadgeCheckIcon } from './icons';
import { useLocalStorage } from '../hooks/useLocalStorage';

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
            <pre className="p-4 pt-10 text-gray-200 overflow-x-auto"><code className="text-white">{code}</code></pre>
        </div>
    );
};

const MessageContent: React.FC<{ message: ChatMessage }> = ({ message }) => {
    const parts = message.content.split(/(```(?:\w+)?\n[\s\S]*?\n```)/g);
    return (
        <div className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.imageUrl && (
                <div className="mb-2">
                    <img src={message.imageUrl} alt="User upload" className="rounded-lg max-w-full h-auto" style={{maxHeight: '400px'}} />
                </div>
            )}
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

const UserAvatar: React.FC<{ profilePicture: string | null }> = ({ profilePicture }) => (
    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500 overflow-hidden">
        {profilePicture ? (
            <img src={profilePicture} alt="User profile" className="w-full h-full object-cover" />
        ) : (
            <UserIcon className="w-5 h-5 text-blue-400" />
        )}
    </div>
);

interface ChatAssistantViewProps {
    userName: string;
    userAge: string;
    profilePicture: string | null;
    aiMemoryEnabled: boolean;
    aiMemory: AIMemory[];
    onAiMemoryChange: (memory: AIMemory[]) => void;
    isVerified: boolean;
}

export const ChatAssistantView: React.FC<ChatAssistantViewProps> = ({ 
    userName, 
    userAge, 
    profilePicture,
    aiMemoryEnabled,
    aiMemory,
    onAiMemoryChange,
    isVerified
}) => {
    const [sessions, setSessions] = useLocalStorage<ChatSession[]>('chatSessions', []);
    const [activeSessionId, setActiveSessionId] = useLocalStorage<string | null>('activeChatSessionId', null);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
    const [editingTitle, setEditingTitle] = useState('');
    const [memorySuggestion, setMemorySuggestion] = useState<string | null>(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
    const endOfMessagesRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const activeSession = sessions.find(s => s.id === activeSessionId);

    useEffect(() => {
        if (!activeSessionId && sessions.length > 0) {
            setActiveSessionId(sessions[0].id);
        }
        if (sessions.length === 0) {
            setActiveSessionId(null);
        }
    }, [sessions, activeSessionId, setActiveSessionId]);

    useEffect(() => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [activeSession?.messages, memorySuggestion]);

    const createNewChat = () => {
        const newSession: ChatSession = {
            id: Date.now().toString(),
            title: 'New Chat',
            messages: [],
            createdAt: Date.now(),
        };
        setSessions(prev => [newSession, ...prev]);
        setActiveSessionId(newSession.id);
        setInput('');
        setImagePreviewUrl(null);
    };
    
    const deleteSession = (id: string) => {
        setSessions(prev => prev.filter(s => s.id !== id));
        if (activeSessionId === id) {
            setActiveSessionId(sessions.length > 1 ? sessions.find(s => s.id !== id)!.id : null);
        }
    };

    const startEditing = (session: ChatSession) => {
        setEditingSessionId(session.id);
        setEditingTitle(session.title);
    };

    const saveTitle = (id: string) => {
        setSessions(prev => prev.map(s => s.id === id ? { ...s, title: editingTitle } : s));
        setEditingSessionId(null);
    };

    const handleAddMemorySuggestion = () => {
        if (memorySuggestion) {
          onAiMemoryChange([...aiMemory, { id: Date.now().toString(), content: memorySuggestion }]);
          setMemorySuggestion(null);
        }
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setImagePreviewUrl(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!input.trim() && !imagePreviewUrl) || isLoading || !activeSession) return;
        
        setMemorySuggestion(null);

        const userMessage: ChatMessage = { role: 'user', content: input, imageUrl: imagePreviewUrl };
        const updatedMessages = [...activeSession.messages, userMessage];
        setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: updatedMessages } : s));
        
        const currentInput = input;
        const currentImageUrl = imagePreviewUrl;
        setInput('');
        setImagePreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = '';

        setIsLoading(true);

        try {
            const stream = await sendMessageStream(
                userName, 
                userAge, 
                aiMemoryEnabled, 
                aiMemory, 
                isVerified,
                activeSession.messages, 
                currentInput,
                currentImageUrl
            );
            let modelResponse = '';
            
            setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: [...updatedMessages, { role: 'model', content: ''}] } : s));

            for await (const chunk of stream) {
                modelResponse += chunk.text;
                setSessions(prev => prev.map(s => {
                    if (s.id === activeSessionId) {
                        const newMessages = [...s.messages];
                        newMessages[newMessages.length - 1] = { role: 'model', content: modelResponse };
                        return { ...s, messages: newMessages };
                    }
                    return s;
                }));
            }
            
            if (activeSession.messages.length === 0) {
                 const newTitle = await generateChatTitle([userMessage, { role: 'model', content: modelResponse }]);
                 setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, title: newTitle } : s));
            }

            if (aiMemoryEnabled) {
                const suggestion = await extractMemorySuggestion(currentInput);
                if (suggestion && !aiMemory.some(mem => mem.content.includes(suggestion))) {
                    setMemorySuggestion(suggestion);
                }
            }

        } catch (error) {
            console.error(error);
            const errorMessage = { role: 'model' as const, content: 'Sorry, I encountered an error. Please try again.' };
             setSessions(prev => prev.map(s => {
                if (s.id === activeSessionId) {
                    const newMessages = [...s.messages];
                    newMessages[newMessages.length - 1] = errorMessage;
                    return { ...s, messages: newMessages };
                }
                return s;
            }));
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="flex-grow flex h-full overflow-hidden">
            {/* Sidebar */}
            <div className="w-64 bg-[var(--color-bg)] flex flex-col p-2 border-r border-[var(--color-border)]">
                <button onClick={createNewChat} className="flex items-center justify-center gap-2 w-full p-2 mb-2 rounded-md bg-[var(--color-primary-accent)]/20 text-[var(--color-primary)] hover:bg-[var(--color-primary-accent)]/30 transition-colors">
                    <PlusIcon className="w-5 h-5" />
                    New Chat
                </button>
                <div className="flex-grow overflow-y-auto pr-1">
                    {sessions.sort((a,b) => b.createdAt - a.createdAt).map(session => (
                        <div key={session.id} className={`group relative w-full p-2 my-1 rounded-md cursor-pointer ${activeSessionId === session.id ? 'bg-[var(--color-input-bg)]' : 'hover:bg-[var(--color-input-bg)]/50'}`} onClick={() => setActiveSessionId(session.id)}>
                            {editingSessionId === session.id ? (
                                <input
                                    type="text"
                                    value={editingTitle}
                                    onChange={(e) => setEditingTitle(e.target.value)}
                                    onBlur={() => saveTitle(session.id)}
                                    onKeyDown={(e) => e.key === 'Enter' && saveTitle(session.id)}
                                    className="w-full bg-transparent border-b border-[var(--color-primary)] focus:outline-none"
                                    autoFocus
                                />
                            ) : (
                                <p className="truncate text-sm">{session.title}</p>
                            )}
                            <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={(e) => { e.stopPropagation(); startEditing(session);}} className="p-1 hover:text-[var(--color-primary)]"><PencilIcon className="w-4 h-4"/></button>
                                <button onClick={(e) => { e.stopPropagation(); deleteSession(session.id);}} className="p-1 hover:text-red-500"><TrashIcon className="w-4 h-4"/></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-grow flex flex-col bg-[var(--color-panel-bg)] overflow-hidden">
                {activeSession ? (
                    <>
                        <div className="flex-grow p-4 overflow-y-auto space-y-4">
                            {activeSession.messages.map((msg, index) => (
                                <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                                    {msg.role === 'model' && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--color-primary-accent)]/20 flex items-center justify-center border border-[var(--color-primary-accent)]"><SparklesIcon className="w-5 h-5 text-[var(--color-primary)]" /></div>}
                                    <div className={`max-w-xl rounded-lg px-4 py-2 ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-[var(--color-input-bg)] text-[var(--color-text)] rounded-bl-none'}`}>
                                        <MessageContent message={msg} />
                                        {isLoading && msg.role === 'model' && index === activeSession.messages.length - 1 && <span className="inline-block w-2 h-4 bg-[var(--color-text)] animate-pulse ml-1" />}
                                    </div>
                                    {msg.role === 'user' && (
                                        <div className="relative flex-shrink-0">
                                            <UserAvatar profilePicture={profilePicture} />
                                            {isVerified && (
                                                <span title="Verified Creator">
                                                    <BadgeCheckIcon className="absolute -bottom-1 -right-1 w-5 h-5 text-blue-400 bg-[var(--color-panel-bg)] rounded-full p-px" />
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                             {memorySuggestion && (
                                <div className="flex justify-center my-2">
                                    <div className="bg-[var(--color-input-bg)]/80 backdrop-blur-sm border border-[var(--color-border)] rounded-lg p-3 text-sm flex items-center gap-4 shadow-lg">
                                        <BookmarkIcon className="w-6 h-6 text-[var(--color-primary)] flex-shrink-0" />
                                        <div className="flex-grow">
                                            <p className="font-semibold text-gray-200">Remember this?</p>
                                            <p className="text-gray-300">"{memorySuggestion}"</p>
                                        </div>
                                        <button 
                                            onClick={handleAddMemorySuggestion}
                                            className="px-3 py-1 bg-[var(--color-primary-accent)] text-[var(--color-primary-text)] rounded-md hover:bg-[var(--color-primary)] transition-colors text-xs font-bold"
                                        >
                                            Add to Memory
                                        </button>
                                        <button onClick={() => setMemorySuggestion(null)} className="p-1 text-gray-400 hover:text-white transition-colors">
                                            <XMarkIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                            <div ref={endOfMessagesRef} />
                        </div>
                        <div className="p-4 border-t border-[var(--color-border)]">
                            {imagePreviewUrl && (
                                <div className="relative w-24 h-24 mb-2 rounded-md overflow-hidden border border-[var(--color-border)]">
                                    <img src={imagePreviewUrl} alt="Image preview" className="w-full h-full object-cover" />
                                    <button
                                        onClick={removeImage}
                                        className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 hover:bg-black/80 transition-colors"
                                        title="Remove image"
                                    >
                                        <XMarkIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                            <form onSubmit={handleSubmit} className="flex gap-2">
                                <input type="file" accept="image/*" onChange={handleImageSelect} ref={fileInputRef} className="hidden" />
                                <button 
                                    type="button" 
                                    onClick={() => fileInputRef.current?.click()} 
                                    className="p-3 rounded-md bg-[var(--color-input-bg)] border border-[var(--color-border)] hover:bg-[var(--color-border)] text-gray-300 transition"
                                    title="Attach image"
                                    disabled={isLoading}
                                >
                                    <PaperClipIcon className="w-5 h-5" />
                                </button>
                                <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type your message or upload an image..." disabled={isLoading} className="flex-grow p-3 rounded-md bg-[var(--color-input-bg)] border border-[var(--color-border)] focus:ring-2 focus:ring-[var(--color-primary)] focus:outline-none transition shadow-inner" />
                                <button type="submit" disabled={isLoading || (!input.trim() && !imagePreviewUrl)} className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-[var(--color-primary-text)] bg-[var(--color-primary-accent)] hover:bg-[var(--color-primary)] disabled:bg-gray-600 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-[var(--color-primary)]">
                                    {isLoading ? <ArrowPathIcon className="w-5 h-5 animate-spin" /> : 'Send'}
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-grow flex flex-col items-center justify-center text-center p-4">
                        <SparklesIcon className="w-16 h-16 text-gray-500 mb-4" />
                        <h2 className="text-2xl font-bold">Chat Assistant</h2>
                        <p className="text-gray-400">Start a new conversation to begin.</p>
                    </div>
                )}
            </div>
        </div>
    );
};