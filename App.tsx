import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ScreenShareAssistant } from './components/ScreenShareAssistant';
import { PhotoGeneratorView } from './components/PhotoGeneratorView';
import { ChatAssistantView } from './components/ChatAssistantView';
import { WebsiteBuilderView } from './components/WebsiteBuilderView';
import { EmojiMakerView } from './components/EmojiMakerView';
import { MathHelperView } from './components/MathHelperView';
import { StoryWriterView } from './components/StoryWriterView';
import { MusicGeneratorView } from './components/MusicGeneratorView';
import { SettingsPanel } from './components/SettingsPanel';
import type { ViewMode, Theme, AIMemory } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';

const ViewWrapper: React.FC<{
    currentView: ViewMode;
    viewName: ViewMode;
    children: React.ReactNode;
}> = ({ currentView, viewName, children }) => {
    const isVisible = currentView === viewName;
    return (
        <div className={`absolute inset-0 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className="h-full w-full overflow-y-auto">
                {children}
            </div>
        </div>
    );
};

export default function App() {
    const [view, setView] = useState<ViewMode>('chatAssistant');
    const [theme, setTheme] = useLocalStorage<Theme>('theme', 'dark');
    const [userName, setUserName] = useLocalStorage<string>('userName', '');
    const [userAge, setUserAge] = useLocalStorage<string>('userAge', '');
    const [profilePicture, setProfilePicture] = useLocalStorage<string | null>('profilePicture', null);
    const [email, setEmail] = useLocalStorage<string>('userEmail', '');
    const [isVerified, setIsVerified] = useLocalStorage<boolean>('isCreatorVerified', false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [aiMemoryEnabled, setAiMemoryEnabled] = useLocalStorage<boolean>('aiMemoryEnabled', true);
    const [aiMemory, setAiMemory] = useLocalStorage<AIMemory[]>('aiMemory', []);

    useEffect(() => {
        const root = document.documentElement;
        root.classList.remove('theme-dark', 'theme-light', 'theme-cyberpunk');
        root.classList.add(`theme-${theme}`);
    }, [theme]);

    useEffect(() => {
        if (isVerified && userName !== 'Jake Merrill') {
            setUserName('Jake Merrill');
        }
    }, [isVerified, userName, setUserName]);

    return (
        <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] flex flex-col font-sans">
            <Header 
                activeView={view} 
                onViewChange={setView}
                onSettingsClick={() => setIsSettingsOpen(true)}
            />
            
            <main className="flex-grow flex flex-col overflow-hidden relative">
                <ViewWrapper currentView={view} viewName="assistant">
                    <ScreenShareAssistant 
                        userName={userName} 
                        userAge={userAge} 
                        profilePicture={profilePicture}
                        aiMemoryEnabled={aiMemoryEnabled}
                        aiMemory={aiMemory}
                        isVerified={isVerified}
                    />
                </ViewWrapper>
                <ViewWrapper currentView={view} viewName="chatAssistant">
                    <ChatAssistantView 
                        userName={userName} 
                        userAge={userAge} 
                        profilePicture={profilePicture}
                        aiMemoryEnabled={aiMemoryEnabled}
                        aiMemory={aiMemory}
                        onAiMemoryChange={setAiMemory}
                        isVerified={isVerified}
                    />
                </ViewWrapper>
                <ViewWrapper currentView={view} viewName="photoGenerator">
                    <PhotoGeneratorView />
                </ViewWrapper>
                <ViewWrapper currentView={view} viewName="websiteBuilder">
                    <WebsiteBuilderView 
                        userName={userName} 
                        userAge={userAge}
                        aiMemoryEnabled={aiMemoryEnabled}
                        aiMemory={aiMemory}
                        isVerified={isVerified}
                    />
                </ViewWrapper>
                <ViewWrapper currentView={view} viewName="emojiMaker">
                    <EmojiMakerView />
                </ViewWrapper>
                 <ViewWrapper currentView={view} viewName="mathHelper">
                    <MathHelperView />
                </ViewWrapper>
                <ViewWrapper currentView={view} viewName="storyWriter">
                    <StoryWriterView />
                </ViewWrapper>
                <ViewWrapper currentView={view} viewName="musicGenerator">
                    <MusicGeneratorView />
                </ViewWrapper>
            </main>

            {isSettingsOpen && (
                <SettingsPanel 
                    onClose={() => setIsSettingsOpen(false)}
                    currentTheme={theme}
                    onThemeChange={setTheme}
                    userName={userName}
                    onUserNameChange={setUserName}
                    userAge={userAge}
                    onUserAgeChange={setUserAge}
                    profilePicture={profilePicture}
                    onProfilePictureChange={setProfilePicture}
                    aiMemoryEnabled={aiMemoryEnabled}
                    onAiMemoryEnabledChange={setAiMemoryEnabled}
                    aiMemory={aiMemory}
                    onAiMemoryChange={setAiMemory}
                    email={email}
                    onEmailChange={setEmail}
                    isVerified={isVerified}
                    onIsVerifiedChange={setIsVerified}
                />
            )}
        </div>
    );
}