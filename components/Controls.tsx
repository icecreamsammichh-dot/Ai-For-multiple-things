import React from 'react';
import type { CallState } from '../types';
import { PhoneIcon, StopCircleIcon, ArrowPathIcon, EyeIcon, EyeSlashIcon, ScreenIcon, ScreenSlashIcon } from './icons';

interface ControlsProps {
  callState: CallState;
  onStart: () => void;
  onStop: () => void;
  isScreenShared: boolean;
  onShareScreen: () => void;
  onStopScreenShare: () => void;
  isScreenVisible: boolean;
  onToggleScreenVisibility: () => void;
}

export const Controls: React.FC<ControlsProps> = ({ 
    callState, 
    onStart, 
    onStop, 
    isScreenShared, 
    onShareScreen, 
    onStopScreenShare, 
    isScreenVisible, 
    onToggleScreenVisibility 
}) => {
  const isBusy = callState === 'connecting';
  const isConnected = callState === 'connected';

  const getCallButtonContent = () => {
    switch (callState) {
      case 'idle':
      case 'ended':
      case 'error':
        return ( <> <PhoneIcon className="w-5 h-5 mr-2" /> Start Call </> );
      case 'connecting':
        return ( <> <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" /> Connecting... </> );
      case 'connected':
        return ( <> <StopCircleIcon className="w-5 h-5 mr-2" /> End Call </> );
    }
  };
  
  const callButtonAction = isConnected ? onStop : onStart;
  const callButtonClasses = `
    flex items-center justify-center px-4 py-2 border border-transparent
    text-sm font-medium rounded-md shadow-sm text-white focus:outline-none focus:ring-2
    focus:ring-offset-2 focus:ring-offset-gray-800 transition-all duration-200 ease-in-out
    ${isBusy ? 'bg-gray-500 cursor-not-allowed' : ''}
    ${isConnected ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' : ''}
    ${!isBusy && !isConnected ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' : ''}
  `;

  return (
    <div className="flex items-center space-x-2">
      {isConnected && !isScreenShared && (
        <button
          type="button"
          onClick={onShareScreen}
          className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500 transition-all"
          title="Share Screen"
        >
          <ScreenIcon className="w-5 h-5 mr-2" />
          Share Screen
        </button>
      )}

      {isConnected && isScreenShared && (
        <>
            <button
              type="button"
              onClick={onStopScreenShare}
              className="flex items-center justify-center p-2 rounded-md transition-colors duration-200 text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-yellow-500"
              title="Stop Sharing Screen"
            >
              <ScreenSlashIcon className="w-5 h-5" />
              <span className="sr-only">Stop Sharing</span>
            </button>
            <button
            type="button"
            onClick={onToggleScreenVisibility}
            className={`flex items-center justify-center p-2 rounded-md transition-colors duration-200 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 ${isScreenVisible ? 'bg-gray-600 hover:bg-gray-500 focus:ring-gray-400' : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'}`}
            title={isScreenVisible ? 'Hide screen from AI' : 'Show screen to AI'}
            >
            {isScreenVisible ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
            <span className="sr-only">{isScreenVisible ? 'Hide screen from AI' : 'Show screen to AI'}</span>
            </button>
        </>
      )}

      <button
        type="button"
        onClick={callButtonAction}
        disabled={isBusy}
        className={`${callButtonClasses}`}
      >
        {getCallButtonContent()}
      </button>
    </div>
  );
};