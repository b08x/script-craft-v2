
import React, { useState, useEffect, useRef } from 'react';
import { PersonaAnalysisResult } from '../types';
import { analyzeTranscriptForPersona } from '../services/geminiService';
import Button from './common/Button';
import Loader from './common/Loader';
import { MicrophoneIcon, StopIcon, SparklesIcon } from './icons/Icons';

interface AudioAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalysisComplete: (analysis: PersonaAnalysisResult) => void;
}

const AudioAnalysisModal: React.FC<AudioAnalysisModalProps> = ({ isOpen, onClose, onAnalysisComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // FIX: Cast `window` to `any` to access non-standard `SpeechRecognition` and `webkitSpeechRecognition` properties without TypeScript errors.
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      setError("Speech recognition is not supported by your browser. Please try Chrome or Edge.");
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      setTranscript(prev => prev + finalTranscript);
    };

    recognition.onerror = (event: any) => {
      setError(`Speech recognition error: ${event.error}`);
      setIsRecording(false);
    };

    recognition.onend = () => {
      if (isRecording) { // If it stops unexpectedly, restart
        recognition.start();
      }
    };

    recognitionRef.current = recognition;
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) return;

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      setTranscript(''); // Clear previous transcript
      setError(null);
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const handleAnalyze = async () => {
    if (!transcript.trim()) return;
    setIsAnalyzing(true);
    setError(null);
    try {
      const result = await analyzeTranscriptForPersona(transcript);
      onAnalysisComplete(result);
    } catch (e: any) {
      setError(e.message || "An unknown error occurred during analysis.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-bg-primary bg-opacity-75 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
      <div className="bg-bg-secondary rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-divider">
          <h2 className="text-xl font-semibold text-text-primary">Create Persona from Audio</h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary">&times;</button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          {!isSupported ? (
            <div className="text-center p-4 rounded-lg bg-red-900/50 text-red-300">{error}</div>
          ) : (
            <>
              <div className="flex flex-col items-center justify-center space-y-4">
                <button
                    onClick={toggleRecording}
                    className={`w-20 h-20 rounded-full flex items-center justify-center transition-colors ${
                        isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-accent-secondary hover:opacity-90'
                    }`}
                    aria-label={isRecording ? 'Stop recording' : 'Start recording'}
                >
                    {isRecording ? <StopIcon className="w-10 h-10 text-white" /> : <MicrophoneIcon className="w-10 h-10 text-white" />}
                </button>
                <p className="text-text-secondary text-sm">{isRecording ? 'Recording...' : 'Click to start recording'}</p>
              </div>
              
              <div>
                <label htmlFor="transcript" className="block text-sm font-medium text-text-secondary mb-1">
                  Transcript
                </label>
                <textarea
                  id="transcript"
                  rows={8}
                  className="block w-full rounded-md border-0 bg-bg-primary py-2 px-3 text-text-primary shadow-sm ring-1 ring-inset ring-divider placeholder:text-text-secondary focus:ring-2 focus:ring-inset focus:ring-accent-primary sm:text-sm"
                  placeholder="Your speech will appear here..."
                  value={transcript}
                  readOnly={isRecording}
                  onChange={(e) => setTranscript(e.target.value)}
                />
              </div>

              {isAnalyzing && <Loader text="Analyzing transcript with AI..." />}
              {error && !isAnalyzing && (
                  <div className="p-3 rounded-md bg-red-900/50 text-red-300 text-sm">
                      <strong>Error:</strong> {error}
                  </div>
              )}
            </>
          )}
        </div>
        
        <div className="p-6 border-t border-divider mt-auto">
          <div className="flex justify-end gap-4">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button 
                onClick={handleAnalyze} 
                disabled={!transcript.trim() || isAnalyzing || !isSupported}
                leftIcon={<SparklesIcon />}
            >
              {isAnalyzing ? 'Analyzing...' : 'Analyze Transcript'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioAnalysisModal;
