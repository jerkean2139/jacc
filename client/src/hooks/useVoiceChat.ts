import { useState, useEffect, useRef, useCallback } from 'react';

// TypeScript declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface VoiceSettings {
  enabled: boolean;
  autoSpeak: boolean;
  speechRate: number;
  speechPitch: number;
  speechVolume: number;
  voiceIndex: number;
  language: string;
}

interface VoiceChatState {
  isListening: boolean;
  isRecording: boolean;
  isSpeaking: boolean;
  transcript: string;
  confidence: number;
  error: string | null;
  isSupported: boolean;
}

export function useVoiceChat() {
  const [state, setState] = useState<VoiceChatState>({
    isListening: false,
    isRecording: false,
    isSpeaking: false,
    transcript: '',
    confidence: 0,
    error: null,
    isSupported: false,
  });

  const [settings, setSettings] = useState<VoiceSettings>({
    enabled: true,
    autoSpeak: true,
    speechRate: 1.0,
    speechPitch: 1.0,
    speechVolume: 0.8,
    voiceIndex: 0,
    language: 'en-US',
  });

  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Initialize speech recognition and synthesis
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const speechSynthesis = window.speechSynthesis;

    if (SpeechRecognition && speechSynthesis) {
      setState(prev => ({ ...prev, isSupported: true }));
      
      // Initialize recognition
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = settings.language;
      recognitionRef.current = recognition;

      // Initialize synthesis
      synthRef.current = speechSynthesis;

      // Load available voices
      const loadVoices = () => {
        const voices = speechSynthesis.getVoices();
        setAvailableVoices(voices);
      };

      loadVoices();
      speechSynthesis.onvoiceschanged = loadVoices;

      // Recognition event handlers
      recognition.onstart = () => {
        setState(prev => ({ ...prev, isListening: true, error: null }));
      };

      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';
        let confidence = 0;

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
            confidence = result[0].confidence;
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        setState(prev => ({
          ...prev,
          transcript: finalTranscript || interimTranscript,
          confidence: confidence || prev.confidence,
        }));
      };

      recognition.onerror = (event) => {
        setState(prev => ({
          ...prev,
          error: `Speech recognition error: ${event.error}`,
          isListening: false,
        }));
      };

      recognition.onend = () => {
        setState(prev => ({ ...prev, isListening: false }));
      };

    } else {
      setState(prev => ({ 
        ...prev, 
        isSupported: false, 
        error: 'Speech recognition not supported in this browser' 
      }));
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, [settings.language]);

  // Start voice recognition
  const startListening = useCallback(() => {
    if (!recognitionRef.current || !settings.enabled) return;

    try {
      setState(prev => ({ ...prev, transcript: '', error: null }));
      recognitionRef.current.start();
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Failed to start voice recognition',
      }));
    }
  }, [settings.enabled]);

  // Stop voice recognition
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  // Speak text using text-to-speech
  const speak = useCallback((text: string, options?: { 
    interrupt?: boolean;
    onStart?: () => void;
    onEnd?: () => void;
  }) => {
    if (!synthRef.current || !settings.enabled) return;

    // Stop current speech if interrupting
    if (options?.interrupt && synthRef.current.speaking) {
      synthRef.current.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Apply voice settings
    utterance.rate = settings.speechRate;
    utterance.pitch = settings.speechPitch;
    utterance.volume = settings.speechVolume;
    utterance.lang = settings.language;

    // Select voice
    if (availableVoices[settings.voiceIndex]) {
      utterance.voice = availableVoices[settings.voiceIndex];
    }

    // Event handlers
    utterance.onstart = () => {
      setState(prev => ({ ...prev, isSpeaking: true }));
      options?.onStart?.();
    };

    utterance.onend = () => {
      setState(prev => ({ ...prev, isSpeaking: false }));
      options?.onEnd?.();
      currentUtteranceRef.current = null;
    };

    utterance.onerror = (event) => {
      setState(prev => ({
        ...prev,
        isSpeaking: false,
        error: `Speech synthesis error: ${event.error}`,
      }));
      currentUtteranceRef.current = null;
    };

    currentUtteranceRef.current = utterance;
    synthRef.current.speak(utterance);
  }, [settings, availableVoices]);

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setState(prev => ({ ...prev, isSpeaking: false }));
    }
  }, []);

  // Update voice settings
  const updateSettings = useCallback((newSettings: Partial<VoiceSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    
    // Update recognition language if changed
    if (newSettings.language && recognitionRef.current) {
      recognitionRef.current.lang = newSettings.language;
    }
  }, []);

  // Auto-speak response if enabled
  const autoSpeakResponse = useCallback((text: string) => {
    if (settings.autoSpeak && settings.enabled) {
      // Clean up text for better speech (remove markdown, etc.)
      const cleanText = text
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
        .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
        .replace(/`(.*?)`/g, '$1') // Remove code formatting
        .replace(/#{1,6}\s/g, '') // Remove headers
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // Convert links to text

      speak(cleanText);
    }
  }, [settings.autoSpeak, settings.enabled, speak]);

  // Toggle listening (voice activation)
  const toggleListening = useCallback(() => {
    if (state.isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [state.isListening, startListening, stopListening]);

  // Clear transcript
  const clearTranscript = useCallback(() => {
    setState(prev => ({ ...prev, transcript: '', confidence: 0 }));
  }, []);

  return {
    // State
    ...state,
    settings,
    availableVoices,

    // Actions
    startListening,
    stopListening,
    toggleListening,
    speak,
    stopSpeaking,
    autoSpeakResponse,
    updateSettings,
    clearTranscript,

    // Utilities
    isVoiceSupported: state.isSupported,
    canSpeak: !!synthRef.current,
    canListen: !!recognitionRef.current,
  };
}

// Voice chat hook with conversation flow
export function useVoiceChatConversation(onMessageSend?: (message: string) => void) {
  const voiceChat = useVoiceChat();
  const [conversationMode, setConversationMode] = useState(false);
  const [pushToTalk, setPushToTalk] = useState(false);
  
  // Handle completed speech input
  useEffect(() => {
    if (voiceChat.transcript && voiceChat.confidence > 0.7 && !voiceChat.isListening) {
      if (conversationMode && onMessageSend) {
        onMessageSend(voiceChat.transcript);
        voiceChat.clearTranscript();
      }
    }
  }, [voiceChat.transcript, voiceChat.confidence, voiceChat.isListening, conversationMode, onMessageSend, voiceChat.clearTranscript]);

  // Start conversation mode
  const startConversation = useCallback(() => {
    setConversationMode(true);
    if (!pushToTalk) {
      voiceChat.startListening();
    }
  }, [pushToTalk, voiceChat.startListening]);

  // End conversation mode
  const endConversation = useCallback(() => {
    setConversationMode(false);
    voiceChat.stopListening();
    voiceChat.stopSpeaking();
  }, [voiceChat.stopListening, voiceChat.stopSpeaking]);

  return {
    ...voiceChat,
    conversationMode,
    pushToTalk,
    setPushToTalk,
    startConversation,
    endConversation,
  };
}