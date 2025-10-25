import React from 'react';
import type { ViewMode } from '../types';
import { 
    ComputerDesktopIcon, CameraIcon, ChatBubbleLeftRightIcon, LightBulbIcon, Cog6ToothIcon, 
    FaceSmileIcon, CalculatorIcon, BookOpenIcon, MusicalNoteIcon 
} from './icons';

interface HeaderProps {
    activeView: ViewMode;
    onViewChange: (view: ViewMode) => void;
    onSettingsClick: () => void;
}

const NavButton: React.FC<{
    isActive: boolean;
    onClick: () => void;
    children: React.ReactNode;
    ariaLabel: string;
}> = ({ isActive, onClick, children, ariaLabel }) => {
    const baseClasses = "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200";
    const activeClasses = "bg-[var(--color-primary-accent)]/20 text-[var(--color-primary)]";
    const inactiveClasses = "text-gray-400 hover:bg-[var(--color-panel-bg)] hover:text-white";
    return (
        <button
            onClick={onClick}
            className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
            aria-label={ariaLabel}
            aria-current={isActive ? 'page' : undefined}
        >
            {children}
        </button>
    )
};

export const Header: React.FC<HeaderProps> = ({ activeView, onViewChange, onSettingsClick }) => {
    return (
      <header className="bg-[var(--color-panel-bg)]/50 backdrop-blur-sm shadow-lg p-3 flex items-center justify-between z-20 border-b border-[var(--color-border)]/50 flex-wrap">
        <h1 className="text-xl font-bold text-[var(--color-primary)] px-4 hidden lg:block">AI Creative Suite</h1>
        <nav className="flex items-center gap-1 sm:gap-2 p-1 bg-[var(--color-bg)]/50 rounded-lg border border-[var(--color-border)] flex-wrap justify-center">
            <NavButton
                isActive={activeView === 'chatAssistant'}
                onClick={() => onViewChange('chatAssistant')}
                ariaLabel="Switch to Chat Assistant"
            >
                <ChatBubbleLeftRightIcon className="w-5 h-5" />
                <span className="hidden sm:inline">Chat</span>
            </NavButton>
             <NavButton
                isActive={activeView === 'assistant'}
                onClick={() => onViewChange('assistant')}
                ariaLabel="Switch to Screen Share Assistant"
            >
                <ComputerDesktopIcon className="w-5 h-5" />
                <span className="hidden sm:inline">Assistant</span>
            </NavButton>
            <NavButton
                isActive={activeView === 'websiteBuilder'}
                onClick={() => onViewChange('websiteBuilder')}
                ariaLabel="Switch to Website Builder"
            >
                <LightBulbIcon className="w-5 h-5" />
                <span className="hidden sm:inline">Web Builder</span>
            </NavButton>
            <NavButton
                isActive={activeView === 'photoGenerator'}
                onClick={() => onViewChange('photoGenerator')}
                ariaLabel="Switch to Photo Generator"
            >
                <CameraIcon className="w-5 h-5" />
                <span className="hidden sm:inline">Photo Gen</span>
            </NavButton>
            <NavButton
                isActive={activeView === 'emojiMaker'}
                onClick={() => onViewChange('emojiMaker')}
                ariaLabel="Switch to Emoji Maker"
            >
                <FaceSmileIcon className="w-5 h-5" />
                <span className="hidden sm:inline">Emoji Maker</span>
            </NavButton>
            <NavButton
                isActive={activeView === 'mathHelper'}
                onClick={() => onViewChange('mathHelper')}
                ariaLabel="Switch to Math Helper"
            >
                <CalculatorIcon className="w-5 h-5" />
                <span className="hidden sm:inline">Math Helper</span>
            </NavButton>
            <NavButton
                isActive={activeView === 'storyWriter'}
                onClick={() => onViewChange('storyWriter')}
                ariaLabel="Switch to Story Writer"
            >
                <BookOpenIcon className="w-5 h-5" />
                <span className="hidden sm:inline">Story Writer</span>
            </NavButton>
            <NavButton
                isActive={activeView === 'musicGenerator'}
                onClick={() => onViewChange('musicGenerator')}
                ariaLabel="Switch to Music Generator"
            >
                <MusicalNoteIcon className="w-5 h-5" />
                <span className="hidden sm:inline">Music Gen</span>
            </NavButton>
        </nav>
        <div className="px-4">
            <button 
                onClick={onSettingsClick} 
                className="p-2 rounded-full text-gray-400 hover:bg-[var(--color-panel-bg)] hover:text-white transition-colors"
                aria-label="Open Settings"
                title="Settings"
            >
                <Cog6ToothIcon className="w-6 h-6" />
            </button>
        </div>
      </header>
    );
};