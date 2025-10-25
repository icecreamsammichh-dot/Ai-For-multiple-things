export type CallState = 'idle' | 'connecting' | 'connected' | 'error' | 'ended';

export interface Transcript {
    speaker: 'user' | 'ai';
    text: string;
    isFinal?: boolean;
}

export type AIStatus = 'idle' | 'listening' | 'thinking' | 'speaking';

export type ViewMode = 'assistant' | 'chatAssistant' | 'photoGenerator' | 'websiteBuilder' | 'emojiMaker' | 'mathHelper' | 'storyWriter' | 'musicGenerator';

export interface ChatMessage {
    role: 'user' | 'model';
    content: string;
    imageUrl?: string;
}

export interface ChatSession {
    id: string;
    title: string;
    messages: ChatMessage[];
    createdAt: number;
}

export type Theme = 'dark' | 'light' | 'cyberpunk';

export type WebsiteCode = {
    html: string;
    css: string;
    javascript: string;
};

export interface AIMemory {
    id: string;
    content: string;
}