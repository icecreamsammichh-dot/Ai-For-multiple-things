import React, { useEffect, useRef } from 'react';
import type { Transcript, AIStatus } from '../types';
import { UserIcon, SparklesIcon, ArrowPathIcon, BadgeCheckIcon } from './icons';

interface TranscriptionPanelProps {
  transcripts: Transcript[];
  aiStatus: AIStatus;
  userName: string;
  profilePicture: string | null;
  isVerified: boolean;
}

const SpeakingVisualizer: React.FC = () => (
    <div className="flex items-center space-x-2 p-2 rounded-md bg-gray-900/50">
        <span className="text-xs font-semibold text-cyan-400">AI is speaking</span>
        <div className="flex items-end h-4 space-x-1">
            <span className="w-1 bg-cyan-400 speaking-bar-1" style={{transformOrigin: 'bottom'}}></span>
            <span className="w-1 bg-cyan-400 speaking-bar-2" style={{transformOrigin: 'bottom'}}></span>
            <span className="w-1 bg-cyan-400 speaking-bar-3" style={{transformOrigin: 'bottom'}}></span>
        </div>
    </div>
);

const AIStatusIndicator: React.FC<{ status: AIStatus }> = ({ status }) => {
    let text: string;
    let color: string;
    let icon: React.ReactNode;

    switch (status) {
        case 'listening':
            text = 'AI is listening...';
            color = 'text-green-400';
            icon = <div className="w-3 h-3 mr-2 rounded-full bg-green-500 animate-pulse"></div>;
            break;
        case 'thinking':
            text = 'AI is thinking...';
            color = 'text-yellow-400';
            icon = <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />;
            break;
        case 'speaking':
            return <SpeakingVisualizer />;
        case 'idle':
        default:
            text = 'AI is idle';
            color = 'text-gray-400';
            icon = <SparklesIcon className="w-4 h-4 mr-2" />;
            break;
    }

    return (
        <div className={`flex items-center text-xs font-semibold p-2 rounded-md bg-gray-900/50 ${color}`}>
            {icon}
            <span>{text}</span>
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

export const TranscriptionPanel: React.FC<TranscriptionPanelProps> = ({ transcripts, aiStatus, userName, profilePicture, isVerified }) => {
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts]);
  
  return (
    <div className="bg-gray-800 rounded-xl shadow-2xl flex flex-col h-full border border-gray-700 overflow-hidden">
      <div className="p-4 border-b border-gray-700 flex justify-between items-center">
        <h3 className="text-lg font-semibold">Conversation</h3>
        <AIStatusIndicator status={aiStatus} />
      </div>
      <div className="flex-grow p-4 overflow-y-auto space-y-4">
        {transcripts.map((t, index) => (
          <div key={index} className={`flex items-start gap-3 ${t.speaker === 'user' ? 'justify-end' : ''}`}>
            {t.speaker === 'ai' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center border border-cyan-500">
                <SparklesIcon className="w-5 h-5 text-cyan-400" />
              </div>
            )}
            <div className={`max-w-xs md:max-w-sm rounded-lg px-4 py-2 ${t.speaker === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-700 text-gray-200 rounded-bl-none'}`}>
              <p className="text-sm">{t.text || '...'}</p>
            </div>
             {t.speaker === 'user' && (
              <div className="relative flex-shrink-0">
                <UserAvatar profilePicture={profilePicture} />
                {isVerified && (
                    <span title="Verified Creator">
                        <BadgeCheckIcon className="absolute -bottom-1 -right-1 w-5 h-5 text-blue-400 bg-gray-800 rounded-full p-px" />
                    </span>
                )}
              </div>
            )}
          </div>
        ))}
        <div ref={endOfMessagesRef} />
      </div>
    </div>
  );
};