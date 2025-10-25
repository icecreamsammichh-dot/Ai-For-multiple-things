import React, { forwardRef } from 'react';
import type { CallState } from '../types';
import { ScreenIcon } from './icons';

interface ScreenShareViewProps {
  callState: CallState;
  isScreenShared: boolean;
  isScreenVisible: boolean;
}

export const ScreenShareView = forwardRef<HTMLVideoElement, ScreenShareViewProps>(({ callState, isScreenShared, isScreenVisible }, ref) => {
  const showVideo = callState === 'connected' && isScreenShared;

  const getOverlayContent = () => {
    if (callState === 'connected' && !isScreenShared) {
        return (
            <>
                <h2 className="text-2xl font-bold mb-2">Call Connected</h2>
                <p className="text-gray-400">Click "Share Screen" in the header when you're ready.</p>
            </>
        )
    }

    switch(callState) {
        case 'idle':
            return (
                <>
                    <h2 className="text-2xl font-bold mb-2">AI Screen Assistant</h2>
                    <p className="text-gray-400 mb-6">Click "Start Call" to begin the audio session.</p>
                    <div className="text-sm text-yellow-200 bg-yellow-900/50 border border-yellow-700 px-4 py-3 rounded-lg max-w-md text-left">
                        <p className="font-bold mb-2 text-yellow-100">How to Share Your Screen:</p>
                        <ul className="list-disc list-inside space-y-1">
                            <li>To let the AI follow you across different tabs and apps, choose <strong>"Entire Screen"</strong> when your browser asks.</li>
                            <li>If you only want the AI to see one specific thing, you can select a single <strong>"Window"</strong> or <strong>"Tab"</strong> instead.</li>
                        </ul>
                    </div>
                </>
            );
        case 'connecting':
            return ( <> <h2 className="text-2xl font-bold mb-2">Starting Call...</h2> <p className="text-gray-400">Connecting to AI...</p> </> );
        case 'ended':
            return ( <> <h2 className="text-2xl font-bold mb-2">Call Ended</h2> <p className="text-gray-400">Thank you!</p> </> );
        case 'error':
            return ( <> <h2 className="text-2xl font-bold mb-2">Connection Error</h2> <p className="text-gray-400">An error occurred. Please try again.</p> </> );
        default:
            return null;
    }
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-black">
      <video ref={ref} autoPlay playsInline muted className={`w-full h-full object-contain transition-opacity duration-300 ${!showVideo ? 'opacity-0' : 'opacity-100'}`} />
      
      {!showVideo && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-70 p-8 text-center">
            <ScreenIcon className="w-16 h-16 text-cyan-500 mb-4" />
            {getOverlayContent()}
        </div>
      )}

      {showVideo && isScreenVisible && (
        <div className="absolute top-3 left-3 bg-red-600/80 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center animate-pulse backdrop-blur-sm border border-red-400">
            <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
            AI IS VIEWING
        </div>
      )}
    </div>
  );
});