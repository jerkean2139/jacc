import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  CheckCircle, 
  AlertCircle,
  Play,
  Square,
  Settings
} from 'lucide-react';
import { useVoiceChat } from '@/hooks/useVoiceChat';

interface VoiceTestDemoProps {
  onComplete?: () => void;
  onClose?: () => void;
}

export default function VoiceTestDemo({ onComplete, onClose }: VoiceTestDemoProps) {
  const voiceChat = useVoiceChat();
  const [testStage, setTestStage] = useState<'permission' | 'microphone' | 'speech' | 'complete'>('permission');
  const [microphoneTestResult, setMicrophoneTestResult] = useState<'pending' | 'success' | 'failed'>('pending');
  const [speechTestResult, setSpeechTestResult] = useState<'pending' | 'success' | 'failed'>('pending');
  const [isTestingMicrophone, setIsTestingMicrophone] = useState(false);
  const [isTestingSpeech, setIsTestingSpeech] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [speechLevel, setSpeechLevel] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Test phrases for speech recognition
  const testPhrases = [
    "Calculate rates for restaurant processing fifty thousand monthly",
    "What is interchange plus pricing",
    "Show me terminal options for mobile business"
  ];

  const [currentTestPhrase, setCurrentTestPhrase] = useState(0);

  // Request microphone permission
  const requestMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setPermissionGranted(true);
      setTestStage('microphone');
      
      // Set up audio analysis for visual feedback
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      analyser.fftSize = 256;
      
    } catch (error) {
      console.error('Microphone permission denied:', error);
      setMicrophoneTestResult('failed');
    }
  };

  // Test microphone input levels
  const testMicrophone = () => {
    if (!analyserRef.current) return;
    
    setIsTestingMicrophone(true);
    setMicrophoneTestResult('pending');
    
    const analyser = analyserRef.current;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    
    let maxLevel = 0;
    let testDuration = 0;
    const testInterval = setInterval(() => {
      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      const level = (average / 255) * 100;
      setSpeechLevel(level);
      
      if (level > maxLevel) maxLevel = level;
      testDuration += 100;
      
      // Test for 3 seconds
      if (testDuration >= 3000) {
        clearInterval(testInterval);
        setIsTestingMicrophone(false);
        
        if (maxLevel > 10) { // If we detected some audio input
          setMicrophoneTestResult('success');
          setTimeout(() => setTestStage('speech'), 1000);
        } else {
          setMicrophoneTestResult('failed');
        }
      }
    }, 100);
  };

  // Test speech recognition
  const testSpeechRecognition = () => {
    setIsTestingSpeech(true);
    setSpeechTestResult('pending');
    
    // Start listening for the current test phrase
    voiceChat.startListening();
    
    // Set a timeout for the test
    setTimeout(() => {
      voiceChat.stopListening();
      setIsTestingSpeech(false);
      
      // Check if we got a reasonable transcript
      if (voiceChat.transcript && voiceChat.transcript.length > 5) {
        setSpeechTestResult('success');
        setTimeout(() => setTestStage('complete'), 1000);
      } else {
        setSpeechTestResult('failed');
      }
    }, 10000); // 10 second timeout
  };

  // Test text-to-speech
  const testTextToSpeech = () => {
    const testMessage = "Voice features are working perfectly! You can now use voice commands to interact with JACC during your sales calls.";
    voiceChat.speak(testMessage);
  };

  // Clean up audio resources
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const getStageProgress = () => {
    switch (testStage) {
      case 'permission': return 25;
      case 'microphone': return 50;
      case 'speech': return 75;
      case 'complete': return 100;
      default: return 0;
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Mic className="w-5 h-5" />
              Voice Features Test
            </CardTitle>
            <CardDescription>
              Test your microphone and voice recognition setup
            </CardDescription>
          </div>
          <Badge variant="outline">
            {testStage === 'complete' ? 'Complete' : 'Testing'}
          </Badge>
        </div>
        <Progress value={getStageProgress()} className="w-full" />
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Permission Stage */}
        {testStage === 'permission' && (
          <div className="space-y-4">
            <div className="text-center">
              <Mic className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Microphone Permission Required</h3>
              <p className="text-muted-foreground mb-4">
                JACC needs access to your microphone to enable voice commands and hands-free operation.
              </p>
            </div>
            
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your browser will ask for microphone permission. Click "Allow" to continue with the voice features test.
              </AlertDescription>
            </Alert>
            
            <div className="text-center">
              <Button onClick={requestMicrophonePermission} size="lg">
                <Mic className="w-4 h-4 mr-2" />
                Grant Microphone Access
              </Button>
            </div>
          </div>
        )}

        {/* Microphone Test Stage */}
        {testStage === 'microphone' && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="relative">
                <Mic className={`w-16 h-16 mx-auto mb-4 transition-colors ${
                  isTestingMicrophone ? 'text-green-500 animate-pulse' : 'text-muted-foreground'
                }`} />
                {speechLevel > 0 && (
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 transition-all duration-100"
                        style={{ width: `${Math.min(speechLevel, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
              <h3 className="text-lg font-semibold mb-2">Microphone Test</h3>
              <p className="text-muted-foreground mb-4">
                {isTestingMicrophone 
                  ? "Speak into your microphone now..."
                  : "Test that your microphone is working properly."
                }
              </p>
            </div>

            {microphoneTestResult === 'success' && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Microphone test successful! Audio input detected.
                </AlertDescription>
              </Alert>
            )}

            {microphoneTestResult === 'failed' && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No audio detected. Please check your microphone settings and try again.
                </AlertDescription>
              </Alert>
            )}

            <div className="text-center">
              <Button 
                onClick={testMicrophone} 
                disabled={isTestingMicrophone || microphoneTestResult === 'success'}
                size="lg"
              >
                {isTestingMicrophone ? (
                  <>
                    <Square className="w-4 h-4 mr-2" />
                    Testing... (Speak now)
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Start Microphone Test
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Speech Recognition Test Stage */}
        {testStage === 'speech' && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="relative">
                <Mic className={`w-16 h-16 mx-auto mb-4 transition-colors ${
                  isTestingSpeech ? 'text-blue-500 animate-pulse' : 'text-muted-foreground'
                }`} />
              </div>
              <h3 className="text-lg font-semibold mb-2">Speech Recognition Test</h3>
              <p className="text-muted-foreground mb-4">
                Test voice commands by saying the phrase below clearly into your microphone.
              </p>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold text-blue-700 dark:text-blue-300 mb-2">Say this phrase:</h4>
              <p className="text-lg font-medium text-blue-600 dark:text-blue-400">
                "{testPhrases[currentTestPhrase]}"
              </p>
            </div>

            {voiceChat.transcript && (
              <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                <h4 className="font-semibold text-green-700 dark:text-green-300 mb-2">Recognized:</h4>
                <p className="text-green-600 dark:text-green-400">"{voiceChat.transcript}"</p>
              </div>
            )}

            {speechTestResult === 'success' && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Speech recognition test successful! Voice commands are working.
                </AlertDescription>
              </Alert>
            )}

            {speechTestResult === 'failed' && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Speech recognition test failed. Please try speaking more clearly or check your microphone.
                </AlertDescription>
              </Alert>
            )}

            <div className="text-center space-x-2">
              <Button 
                onClick={testSpeechRecognition} 
                disabled={isTestingSpeech}
                size="lg"
              >
                {isTestingSpeech ? (
                  <>
                    <MicOff className="w-4 h-4 mr-2" />
                    Listening...
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 mr-2" />
                    Start Speech Test
                  </>
                )}
              </Button>
              
              {speechTestResult === 'failed' && (
                <Button 
                  variant="outline"
                  onClick={() => setCurrentTestPhrase((prev) => (prev + 1) % testPhrases.length)}
                >
                  Try Different Phrase
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Complete Stage */}
        {testStage === 'complete' && (
          <div className="space-y-4">
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Voice Features Ready!</h3>
              <p className="text-muted-foreground mb-4">
                Your voice features are working perfectly. You can now use voice commands with JACC.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Mic className="w-4 h-4" />
                    Voice Commands
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Ask questions hands-free during sales calls
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Volume2 className="w-4 h-4" />
                    Text-to-Speech
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  JACC reads responses aloud automatically
                </CardContent>
              </Card>
            </div>

            <div className="text-center">
              <Button onClick={testTextToSpeech} variant="outline" className="mr-2">
                <Volume2 className="w-4 h-4 mr-2" />
                Test Text-to-Speech
              </Button>
              <Button onClick={onComplete} size="lg">
                <CheckCircle className="w-4 h-4 mr-2" />
                Continue Tutorial
              </Button>
            </div>
          </div>
        )}

        {/* Close button */}
        {onClose && (
          <div className="text-center pt-4 border-t">
            <Button variant="ghost" onClick={onClose}>
              Close Voice Test
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}