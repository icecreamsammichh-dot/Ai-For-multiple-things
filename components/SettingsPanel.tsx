import React, { useRef, useState } from 'react';
import type { Theme, AIMemory } from '../types';
import { XMarkIcon, UserIcon, PlusIcon, PencilIcon, TrashIcon, BadgeCheckIcon } from './icons';

interface SettingsPanelProps {
  onClose: () => void;
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
  userName: string;
  onUserNameChange: (name: string) => void;
  userAge: string;
  onUserAgeChange: (age: string) => void;
  profilePicture: string | null;
  onProfilePictureChange: (pic: string | null) => void;
  aiMemoryEnabled: boolean;
  onAiMemoryEnabledChange: (enabled: boolean) => void;
  aiMemory: AIMemory[];
  onAiMemoryChange: (memory: AIMemory[]) => void;
  email: string;
  onEmailChange: (email: string) => void;
  isVerified: boolean;
  onIsVerifiedChange: (verified: boolean) => void;
}

const THEMES: { id: Theme; name: string }[] = [
    { id: 'dark', name: 'Dark' },
    { id: 'light', name: 'Light' },
    { id: 'cyberpunk', name: 'Cyberpunk' },
];

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ 
    onClose, 
    currentTheme, 
    onThemeChange,
    userName,
    onUserNameChange,
    userAge,
    onUserAgeChange,
    profilePicture,
    onProfilePictureChange,
    aiMemoryEnabled,
    onAiMemoryEnabledChange,
    aiMemory,
    onAiMemoryChange,
    email,
    onEmailChange,
    isVerified,
    onIsVerifiedChange
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newMemory, setNewMemory] = useState('');
  const [editingMemory, setEditingMemory] = useState<{ id: string, content: string } | null>(null);
  const [password, setPassword] = useState('');

  const creatorEmail = 'icecreamsammichh@gmail.com';
  const creatorPassword = '@nbyJ123';

  const handlePictureUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onProfilePictureChange(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newPassword = e.target.value;
      setPassword(newPassword);
      if (newPassword === creatorPassword) {
          onIsVerifiedChange(true);
          onUserNameChange('Jake Merrill');
      } else {
          onIsVerifiedChange(false);
      }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onEmailChange(e.target.value);
      if (e.target.value.toLowerCase() !== creatorEmail) {
          onIsVerifiedChange(false);
          setPassword('');
      }
  };

  const handleSignOut = () => {
      onIsVerifiedChange(false);
      onEmailChange('');
      setPassword('');
  };

  const handleAddMemory = () => {
    if (newMemory.trim()) {
      onAiMemoryChange([...aiMemory, { id: Date.now().toString(), content: newMemory.trim() }]);
      setNewMemory('');
    }
  };

  const handleDeleteMemory = (id: string) => {
    onAiMemoryChange(aiMemory.filter(m => m.id !== id));
  };
  
  const handleUpdateMemory = () => {
      if (editingMemory && editingMemory.content.trim()) {
          onAiMemoryChange(aiMemory.map(m => m.id === editingMemory.id ? { ...m, content: editingMemory.content.trim() } : m));
      }
      setEditingMemory(null);
  };

  const handleClearAllMemory = () => {
      if(window.confirm("Are you sure you want to delete everything the AI has remembered? This action cannot be undone.")) {
          onAiMemoryChange([]);
      }
  };

  return (
    <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
        onClick={onClose}
        aria-modal="true"
        role="dialog"
    >
      <div 
        className="bg-[var(--color-panel-bg)] rounded-xl shadow-2xl border border-[var(--color-border)] w-full max-w-md m-4 p-6 relative transform transition-all flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <button 
          onClick={onClose} 
          className="absolute top-3 right-3 text-gray-400 hover:text-[var(--color-text)] transition-colors"
          aria-label="Close Settings"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-bold text-[var(--color-primary)] mb-6 text-center flex-shrink-0">Settings</h2>

        <div className="space-y-6 overflow-y-auto pr-2 flex-grow">
            <div>
                <label className="block text-sm font-medium mb-2">Profile Picture</label>
                <div className="flex items-center gap-4">
                    <div className="relative w-20 h-20">
                        <div className="w-20 h-20 rounded-full bg-[var(--color-input-bg)] flex items-center justify-center overflow-hidden border-2 border-[var(--color-border)]">
                            {profilePicture ? (
                                <img src={profilePicture} alt="Profile Preview" className="w-full h-full object-cover" />
                            ) : (
                                <UserIcon className="w-10 h-10 text-gray-400" />
                            )}
                        </div>
                        {isVerified && (
                            <span title="Verified Creator">
                                <BadgeCheckIcon className="absolute -bottom-1 -right-1 w-6 h-6 text-blue-400 bg-[var(--color-panel-bg)] rounded-full p-0.5" />
                            </span>
                        )}
                    </div>
                    <div className="flex flex-col gap-2">
                        <input type="file" accept="image/*" ref={fileInputRef} onChange={handlePictureUpload} className="hidden" />
                        <button onClick={() => fileInputRef.current?.click()} className="px-3 py-1 text-sm border border-[var(--color-border)] rounded-md hover:bg-[var(--color-input-bg)]">Upload Image</button>
                        {profilePicture && <button onClick={() => onProfilePictureChange(null)} className="px-3 py-1 text-sm text-red-400 border border-red-400/50 rounded-md hover:bg-red-400/10">Remove</button>}
                    </div>
                </div>
            </div>
            
            {isVerified ? (
                <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-2">Email</label>
                    <div className="flex items-center gap-2">
                        <input
                            type="email"
                            id="email"
                            value={email}
                            readOnly
                            className="w-full p-2 rounded-md bg-[var(--color-input-bg)]/50 border border-[var(--color-border)] focus:outline-none cursor-default"
                        />
                         <button onClick={handleSignOut} className="px-3 py-2 text-sm text-red-400 border border-red-400/50 rounded-md hover:bg-red-400/10 whitespace-nowrap">Sign Out</button>
                    </div>
                    <p className="text-xs text-green-400 mt-1">You are verified as the creator.</p>
                </div>
            ) : (
                <>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium mb-2">Email (Optional)</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={handleEmailChange}
                            placeholder="Enter your email"
                            className="w-full p-2 rounded-md bg-[var(--color-input-bg)] border border-[var(--color-border)] focus:ring-2 focus:ring-[var(--color-primary)] focus:outline-none"
                        />
                    </div>
                    {email.toLowerCase() === creatorEmail && (
                        <div>
                            <label htmlFor="password"  className="block text-sm font-medium mb-2">Password</label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={handlePasswordChange}
                                placeholder="Enter creator password"
                                className="w-full p-2 rounded-md bg-[var(--color-input-bg)] border border-[var(--color-border)] focus:ring-2 focus:ring-[var(--color-primary)] focus:outline-none"
                            />
                        </div>
                    )}
                </>
            )}

            <div>
                <label htmlFor="userName" className="block text-sm font-medium mb-2">Your Name</label>
                <input
                    type="text"
                    id="userName"
                    value={userName}
                    onChange={(e) => onUserNameChange(e.target.value)}
                    placeholder="Enter your name"
                    className={`w-full p-2 rounded-md bg-[var(--color-input-bg)] border border-[var(--color-border)] focus:ring-2 focus:ring-[var(--color-primary)] focus:outline-none ${isVerified ? 'bg-[var(--color-input-bg)]/50 cursor-default' : ''}`}
                    readOnly={isVerified}
                />
                <p className="text-xs text-gray-400 mt-1">The AI will use this name to personalize your conversations.</p>
            </div>

            <div>
                <label htmlFor="userAge" className="block text-sm font-medium mb-2">Your Age (Optional)</label>
                <input
                    type="number"
                    id="userAge"
                    value={userAge}
                    onChange={(e) => onUserAgeChange(e.target.value)}
                    placeholder="Enter your age"
                    className="w-full p-2 rounded-md bg-[var(--color-input-bg)] border border-[var(--color-border)] focus:ring-2 focus:ring-[var(--color-primary)] focus:outline-none"
                />
            </div>
            
            <div>
                <label className="block text-sm font-medium mb-2">Theme</label>
                <div className="grid grid-cols-3 gap-3">
                    {THEMES.map(theme => (
                        <button
                            key={theme.id}
                            onClick={() => onThemeChange(theme.id)}
                            className={`p-3 text-center rounded-md border-2 transition-colors ${currentTheme === theme.id ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10' : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/50'}`}
                        >
                            {theme.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* AI Memory Section */}
            <div className="space-y-4 pt-6 border-t border-[var(--color-border)]">
                <div className="flex justify-between items-center">
                    <label className="text-sm font-medium">AI Memory</label>
                    <label htmlFor="ai-memory-toggle" className="flex items-center cursor-pointer">
                        <div className="relative">
                            <input type="checkbox" id="ai-memory-toggle" className="sr-only" checked={aiMemoryEnabled} onChange={e => onAiMemoryEnabledChange(e.target.checked)} />
                            <div className={`block w-10 h-6 rounded-full transition ${aiMemoryEnabled ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-input-bg)]'}`}></div>
                            <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition transform ${aiMemoryEnabled ? 'translate-x-4' : ''}`}></div>
                        </div>
                    </label>
                </div>
                <p className="text-xs text-gray-400 -mt-2">Allows the AI to remember key facts you tell it across sessions for a more personalized experience.</p>
                
                {aiMemoryEnabled && (
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-300">Remembered Facts:</label>
                        <div className="max-h-32 overflow-y-auto space-y-2 pr-2 border border-[var(--color-border)] rounded-md p-2">
                            {aiMemory.length === 0 && <p className="text-xs text-gray-500 px-1">The AI hasn't remembered anything yet.</p>}
                            {aiMemory.map(mem => (
                                <div key={mem.id} className="group flex items-center justify-between gap-2 bg-[var(--color-input-bg)]/50 p-2 rounded-md">
                                     {editingMemory?.id === mem.id ? (
                                        <input
                                            type="text"
                                            value={editingMemory.content}
                                            onChange={(e) => setEditingMemory({ ...editingMemory, content: e.target.value })}
                                            onBlur={handleUpdateMemory}
                                            onKeyDown={e => e.key === 'Enter' && handleUpdateMemory()}
                                            className="w-full bg-transparent text-xs focus:outline-none border-b border-[var(--color-primary)]"
                                            autoFocus
                                        />
                                    ) : (
                                        <p className="text-xs text-gray-300 flex-grow">{mem.content}</p>
                                    )}
                                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => setEditingMemory({ id: mem.id, content: mem.content })} className="p-1 hover:text-[var(--color-primary)]"><PencilIcon className="w-3 h-3"/></button>
                                        <button onClick={() => handleDeleteMemory(mem.id)} className="p-1 hover:text-red-500"><TrashIcon className="w-3 h-3"/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2">
                             <input
                                type="text"
                                value={newMemory}
                                onChange={(e) => setNewMemory(e.target.value)}
                                placeholder="Add a new fact for the AI to remember"
                                className="w-full p-2 text-xs rounded-md bg-[var(--color-input-bg)] border border-[var(--color-border)] focus:ring-1 focus:ring-[var(--color-primary)] focus:outline-none"
                            />
                            <button onClick={handleAddMemory} className="p-2 rounded-md bg-[var(--color-primary-accent)]/20 hover:bg-[var(--color-primary-accent)]/30 text-[var(--color-primary)]"><PlusIcon className="w-4 h-4"/></button>
                        </div>
                         {aiMemory.length > 0 && (
                            <button onClick={handleClearAllMemory} className="w-full text-center text-xs text-red-400 hover:underline mt-2">Clear All Memories</button>
                        )}
                    </div>
                )}
            </div>
        </div>
        <div className="mt-6 pt-4 border-t border-[var(--color-border)] flex-shrink-0">
            <p className="text-xs text-center text-gray-500">
                <strong>Privacy Guarantee:</strong> Your profile and AI memory are stored only in your browser and are never uploaded or sold. Your data is safe and not shared with anyone.
            </p>
        </div>
      </div>
    </div>
  );
};