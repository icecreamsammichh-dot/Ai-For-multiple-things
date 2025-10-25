import React, { useState, useRef, useCallback, useEffect } from 'react';
import { LiveServerMessage } from '@google/genai';
import { Controls } from './Controls';
import { ScreenShareView } from './ScreenShareView';
import { TranscriptionPanel } from './TranscriptionPanel';
import { connectToGemini } from '../services/geminiService';
import { createBlob, decode, decodeAudioData } from '../utils/audio';
import type { CallState, Transcript, AIStatus, AIMemory } from '../types';
import { blobToBase64 } from '../utils/media';
import { AboutModal } from './AboutModal';
import { InformationCircleIcon } from './icons';

const FRAME_RATE = 5; // Send 5 frames per second
const JPEG_QUALITY = 0.85;

export function ScreenShareAssistant({ 
    userName, 
    userAge,
    profilePicture,
    aiMemoryEnabled,
    aiMemory,
    isVerified
}: { 
    userName: string, 
    userAge: string,
    profilePicture: string | null,
    aiMemoryEnabled: boolean,
    aiMemory: AIMemory[],
    isVerified: boolean
}) {
  const [callState, setCallState] = useState<CallState>('idle');
  const [isScreenShared, setIsScreenShared] = useState(false);
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [aiStatus, setAiStatus] = useState<AIStatus>('idle');
  const [isScreenVisibleToAI, setIsScreenVisibleToAI] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sessionPromiseRef = useRef<ReturnType<typeof connectToGemini> | null>(null);
  const isScreenVisibleRef = useRef(isScreenVisibleToAI);

  useEffect(() => {
    isScreenVisibleRef.current = isScreenVisibleToAI;
  }, [isScreenVisibleToAI]);

  const audioContextRefs = useRef<{
    input: AudioContext | null,
    output: AudioContext | null,
    nextStartTime: number,
    playingSources: Set<AudioBufferSourceNode>
  }>({ input: null, output: null, nextStartTime: 0, playingSources: new Set() });

  const mediaRefs = useRef<{
    displayStream: MediaStream | null;
    audioStream: MediaStream | null;
    scriptProcessor: ScriptProcessorNode | null;
    mediaStreamSource: MediaStreamAudioSourceNode | null;
    frameInterval: number | null;
  }>({ displayStream: null, audioStream: null, scriptProcessor: null, mediaStreamSource: null, frameInterval: null });
  
  const transcriptionRefs = useRef<{
    currentUserTurn: string;
    currentModelTurn: string;
  }>({currentUserTurn: '', currentModelTurn: ''});

  const handleStopScreenShare = useCallback(() => {
    if (mediaRefs.current.frameInterval) {
        clearInterval(mediaRefs.current.frameInterval);
        mediaRefs.current.frameInterval = null;
    }
    mediaRefs.current.displayStream?.getTracks().forEach(track => track.stop());
    mediaRefs.current.displayStream = null;
    if(videoRef.current) videoRef.current.srcObject = null;
    setIsScreenShared(false);
    setIsScreenVisibleToAI(false);
  }, []);

  const handleStopCall = useCallback(() => {
    if (sessionPromiseRef.current) {
        sessionPromiseRef.current.then(session => session.close());
        sessionPromiseRef.current = null;
    }
    
    handleStopScreenShare();

    mediaRefs.current.audioStream?.getTracks().forEach(track => track.stop());

    if(mediaRefs.current.scriptProcessor){
        mediaRefs.current.scriptProcessor.disconnect();
        mediaRefs.current.scriptProcessor.onaudioprocess = null;
        mediaRefs.current.scriptProcessor = null;
    }
    if(mediaRefs.current.mediaStreamSource) {
        mediaRefs.current.mediaStreamSource.disconnect();
        mediaRefs.current.mediaStreamSource = null;
    }

    audioContextRefs.current.input?.close();
    audioContextRefs.current.output?.close();
    audioContextRefs.current = { input: null, output: null, nextStartTime: 0, playingSources: new Set() };

    setCallState('ended');
    setAiStatus('idle');
    setIsAboutModalOpen(false);
  }, [handleStopScreenShare]);

  const onGeminiMessage = useCallback(async (message: LiveServerMessage) => {
    // First message from AI for its turn, switch from thinking to speaking
    if (aiStatus === 'thinking' && (message.serverContent?.outputTranscription || message.serverContent?.modelTurn)) {
        setAiStatus('speaking');
    }

    if (message.serverContent?.outputTranscription) {
        const text = message.serverContent.outputTranscription.text;
        transcriptionRefs.current.currentModelTurn += text;
        setTranscripts(prev => {
            const last = prev[prev.length - 1];
            if (last?.speaker === 'ai') {
                return [...prev.slice(0, -1), { ...last, text: transcriptionRefs.current.currentModelTurn }];
            }
            return [...prev, { speaker: 'ai', text: transcriptionRefs.current.currentModelTurn, isFinal: false }];
        });
    }

    if (message.serverContent?.inputTranscription) {
        const text = message.serverContent.inputTranscription.text;
        transcriptionRefs.current.currentUserTurn += text;
        setTranscripts(prev => {
            const last = prev[prev.length - 1];
            if (last?.speaker === 'user') {
                return [...prev.slice(0, -1), { ...last, text: transcriptionRefs.current.currentUserTurn }];
            }
            return [...prev, { speaker: 'user', text: transcriptionRefs.current.currentUserTurn, isFinal: false }];
        });
    }

    if (message.serverContent?.turnComplete) {
        if(transcriptionRefs.current.currentUserTurn.trim()){
            setTranscripts(prev => {
                const last = prev[prev.length - 1];
                if (last?.speaker === 'user') {
                    return [...prev.slice(0, -1), { ...last, text: transcriptionRefs.current.currentUserTurn, isFinal: true }];
                }
                return prev;
            });
        }
        if(transcriptionRefs.current.currentModelTurn.trim()){
            setTranscripts(prev => {
                const last = prev[prev.length - 1];
                if (last?.speaker === 'ai') {
                    return [...prev.slice(0, -1), { ...last, text: transcriptionRefs.current.currentModelTurn, isFinal: true }];
                }
                return prev;
            });
        }
        transcriptionRefs.current.currentUserTurn = '';
        transcriptionRefs.current.currentModelTurn = '';
        setAiStatus('thinking');
    }

    const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
    if (base64Audio && audioContextRefs.current.output) {
      const outputCtx = audioContextRefs.current.output;
      audioContextRefs.current.nextStartTime = Math.max(audioContextRefs.current.nextStartTime, outputCtx.currentTime);

      const audioBuffer = await decodeAudioData(decode(base64Audio), outputCtx, 24000, 1);
      const source = outputCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(outputCtx.destination);
      
      source.addEventListener('ended', () => {
        audioContextRefs.current.playingSources.delete(source);
        if (audioContextRefs.current.playingSources.size === 0 && aiStatus !== 'thinking') {
          setAiStatus('listening');
        }
      });
      
      source.start(audioContextRefs.current.nextStartTime);
      audioContextRefs.current.nextStartTime += audioBuffer.duration;
      audioContextRefs.current.playingSources.add(source);
    }

    if (message.serverContent?.interrupted) {
        for (const source of audioContextRefs.current.playingSources.values()) {
            source.stop();
            audioContextRefs.current.playingSources.delete(source);
        }
        audioContextRefs.current.nextStartTime = 0;
        setAiStatus('listening');
    }
  }, [aiStatus]);

  const onGeminiError = useCallback((e: ErrorEvent) => {
    console.error("Gemini connection error", e);
    setCallState('error');
    handleStopCall();
  }, [handleStopCall]);
  
  const onGeminiClose = useCallback(() => {
    console.log("Gemini connection closed.");
  }, []);

  const handleToggleScreenVisibility = () => {
    setIsScreenVisibleToAI(prev => !prev);
  };

  const handleShareScreen = async () => {
    try {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({
            video: { frameRate: { ideal: 30, max: 30 } },
            audio: false,
        });
        mediaRefs.current.displayStream = displayStream;
        if (videoRef.current) {
            videoRef.current.srcObject = displayStream;
        }
        setIsScreenShared(true);
        setIsScreenVisibleToAI(true); 

        displayStream.getVideoTracks()[0].addEventListener('ended', () => {
            handleStopScreenShare();
        });

        mediaRefs.current.frameInterval = window.setInterval(() => {
            if (isScreenVisibleRef.current && videoRef.current && canvasRef.current && sessionPromiseRef.current) {
                const video = videoRef.current;
                const canvas = canvasRef.current;
                const ctx = canvas.getContext('2d');
                if(!ctx) return;

                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

                canvas.toBlob(
                    async (blob) => {
                        if (blob && sessionPromiseRef.current) {
                            const base64Data = await blobToBase64(blob);
                            sessionPromiseRef.current!.then((session) => {
                                session.sendRealtimeInput({ media: { data: base64Data, mimeType: 'image/jpeg' } });
                            });
                        }
                    },
                    'image/jpeg',
                    JPEG_QUALITY
                );
            }
        }, 1000 / FRAME_RATE);

    } catch (error) {
        console.error('Error starting screen share:', error);
    }
  };

  const handleStartCall = async () => {
    setCallState('connecting');
    setTranscripts([]);
    transcriptionRefs.current = { currentUserTurn: '', currentModelTurn: '' };
    setIsScreenShared(false);
    setIsScreenVisibleToAI(false);

    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRefs.current.audioStream = audioStream;

      audioContextRefs.current.input = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRefs.current.output = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      sessionPromiseRef.current = connectToGemini(
          userName, 
          userAge,
          aiMemoryEnabled,
          aiMemory,
          isVerified,
          onGeminiMessage, 
          onGeminiError, 
          onGeminiClose
      );
      
      sessionPromiseRef.current.then(() => {
        setCallState('connected');
        setAiStatus('listening');

        const inputCtx = audioContextRefs.current.input!;
        mediaRefs.current.mediaStreamSource = inputCtx.createMediaStreamSource(audioStream);
        mediaRefs.current.scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
        
        mediaRefs.current.scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
          const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
          const pcmBlob = createBlob(inputData);
          if (sessionPromiseRef.current) {
            sessionPromiseRef.current.then((session) => {
              session.sendRealtimeInput({ media: pcmBlob });
            });
          }
        };

        mediaRefs.current.mediaStreamSource.connect(mediaRefs.current.scriptProcessor);
        mediaRefs.current.scriptProcessor.connect(inputCtx.destination);
      }).catch(err => {
        console.error("Failed to connect to Gemini", err);
        setCallState('error');
        handleStopCall();
      });

    } catch (error) {
      console.error('Error starting audio or call:', error);
      setCallState('error');
      handleStopCall();
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg)]">
      <header className="bg-[var(--color-panel-bg)]/50 backdrop-blur-sm shadow-lg p-4 flex items-center justify-between z-10 border-b border-[var(--color-border)]">
        <h1 className="text-xl font-bold text-[var(--color-primary)]">Screen Share Assistant</h1>
        <div className="flex items-center gap-4">
             <button
                onClick={() => setIsAboutModalOpen(true)}
                className="text-gray-400 hover:text-[var(--color-primary)] transition-colors duration-200"
                aria-label="About this application"
                title="About this application"
             >
                 <InformationCircleIcon className="w-6 h-6" />
             </button>
             <div className="w-auto">
                 <Controls
                    callState={callState}
                    onStart={handleStartCall}
                    onStop={handleStopCall}
                    isScreenShared={isScreenShared}
                    onShareScreen={handleShareScreen}
                    onStopScreenShare={handleStopScreenShare}
                    isScreenVisible={isScreenVisibleToAI}
                    onToggleScreenVisibility={handleToggleScreenVisibility}
                 />
            </div>
        </div>
      </header>

      <main className="flex-grow flex flex-col md:flex-row p-4 gap-4 overflow-hidden">
        <div className="flex-grow flex flex-col bg-[var(--color-panel-bg)] rounded-xl shadow-2xl overflow-hidden border border-[var(--color-border)]">
            <ScreenShareView ref={videoRef} callState={callState} isScreenShared={isScreenShared} isScreenVisible={isScreenVisibleToAI} />
            <canvas ref={canvasRef} className="hidden"></canvas>
        </div>
        <div className="w-full md:w-96 flex-shrink-0">
            <TranscriptionPanel 
                transcripts={transcripts} 
                aiStatus={aiStatus}
                userName={userName}
                profilePicture={profilePicture}
                isVerified={isVerified}
            />
        </div>
      </main>
      {isAboutModalOpen && <AboutModal onClose={() => setIsAboutModalOpen(false)} />}
    </div>
  );
}