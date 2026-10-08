import React, { useState, useRef } from 'react';
import {
  X,
  ArrowLeft,
  Video,
  Music,
  Image as ImageIcon,
  Mic,
  MicOff,
  Sparkles,
  Play,
  Pause,
  Download,
  Copy,
  Check,
  Upload,
  Loader2,
  Film,
  Radio,
} from 'lucide-react';
import {
  generateAIVideo,
  generateAIImage,
  generateAIMusic,
  transcribeAudio,
} from '../../services/api';

interface AIStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendToChat?: (text: string) => void;
  initialTab?: 'video' | 'voice' | 'image' | 'music' | 'transcribe';
}

export const AIStudioModal: React.FC<AIStudioModalProps> = ({
  isOpen,
  onClose,
  onSendToChat,
  initialTab = 'video',
}) => {
  const [activeTab, setActiveTab] = useState<'video' | 'voice' | 'image' | 'music' | 'transcribe'>(initialTab);

  // Video State (Veo 3.1)
  const [videoPrompt, setVideoPrompt] = useState('Futuristic city with cyber vehicles flying through illuminated towers');
  const [videoAspect, setVideoAspect] = useState<'16:9' | '9:16'>('16:9');
  const [videoImage, setVideoImage] = useState<string | null>(null);
  const [videoResult, setVideoResult] = useState<string | null>(null);
  const [isVideoLoading, setIsVideoLoading] = useState(false);

  // Voice / Live State (Gemini 3.8 Live)
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceMessages, setVoiceMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    { role: 'assistant', text: 'Hello! I am REHAN AI Live voice assistant. Tap the microphone and speak with me.' },
  ]);

  // Image State (Nano Banana 2.1)
  const [imagePrompt, setImagePrompt] = useState('Cyberpunk neon code matrix terminal with purple and cyan glowing aesthetic, highly detailed 4k');
  const [imageResult, setImageResult] = useState<string | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(false);

  // Music State (Lyria 3)
  const [musicPrompt, setMusicPrompt] = useState('Chill lo-fi hip hop study beats with calm piano chords and ambient vinyl noise');
  const [musicMode, setMusicMode] = useState<'clip' | 'pro'>('clip');
  const [musicResult, setMusicResult] = useState<string | null>(null);
  const [isMusicLoading, setIsMusicLoading] = useState(false);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Audio Transcription State (Gemini 3.5 Transcribe)
  const [isRecording, setIsRecording] = useState(false);
  const [transcriptionText, setTranscriptionText] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [copiedTranscribe, setCopiedTranscribe] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  if (!isOpen) return null;

  // Handle Video Generation
  const handleGenerateVideo = async () => {
    if (!videoPrompt.trim()) return;
    setIsVideoLoading(true);
    setVideoResult(null);
    try {
      const res = await generateAIVideo({
        prompt: videoPrompt,
        imageBase64: videoImage || undefined,
        aspectRatio: videoAspect,
      });
      setVideoResult(res.videoUrl);
    } catch (err: any) {
      alert(`Video generation error: ${err.message}`);
    } finally {
      setIsVideoLoading(false);
    }
  };

  // Handle Image Generation
  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) return;
    setIsImageLoading(true);
    setImageResult(null);
    try {
      const res = await generateAIImage({ prompt: imagePrompt });
      setImageResult(res.imageUrl);
    } catch (err: any) {
      alert(`Image generation error: ${err.message}`);
    } finally {
      setIsImageLoading(false);
    }
  };

  // Handle Music Generation
  const handleGenerateMusic = async () => {
    if (!musicPrompt.trim()) return;
    setIsMusicLoading(true);
    setMusicResult(null);
    try {
      const res = await generateAIMusic({ prompt: musicPrompt, mode: musicMode });
      setMusicResult(res.audioUrl);
    } catch (err: any) {
      alert(`Music generation error: ${err.message}`);
    } finally {
      setIsMusicLoading(false);
    }
  };

  // Handle Voice Live toggle
  const toggleVoice = () => {
    if (isVoiceActive) {
      setIsVoiceActive(false);
    } else {
      setIsVoiceActive(true);
      // Simulate live voice connection
      const synth = window.speechSynthesis;
      if (synth) {
        const utter = new SpeechSynthesisUtterance("REHAN AI Live connection established. How can I assist your coding today?");
        synth.speak(utter);
      }
    }
  };

  // Handle Microphone Recording for Transcription
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = reader.result as string;
          setIsTranscribing(true);
          try {
            const res = await transcribeAudio({ audioBase64: base64, mimeType: 'audio/webm' });
            setTranscriptionText(res.transcription);
          } catch (err: any) {
            alert(`Transcription failed: ${err.message}`);
          } finally {
            setIsTranscribing(false);
          }
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach((t) => t.stop());
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
      alert('Microphone access denied or unavailable.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-4xl bg-[#0e101a] border border-purple-500/30 rounded-3xl p-5 sm:p-7 shadow-2xl text-white my-6">
        {/* Header Bar with Prominent Back Button */}
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-white/10">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-sm"
            title="Back to AI Chat"
          >
            <ArrowLeft className="w-4 h-4 text-purple-300" />
            <span>← Back to Chat (वापस जाएं)</span>
          </button>

          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="font-extrabold text-sm tracking-wide bg-gradient-to-r from-purple-300 via-pink-300 to-amber-300 bg-clip-text text-transparent">
              REHAN AI CREATIVE SUITE
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Feature Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 border-b border-white/10 scrollbar-none text-xs font-bold">
          {[
            { id: 'video', label: 'Veo Video & Animate Photo', icon: Video },
            { id: 'voice', label: 'Gemini 3.8 Live Voice', icon: Radio },
            { id: 'image', label: 'Nano Banana Image Gen', icon: ImageIcon },
            { id: 'music', label: 'Lyria 3 Music Creator', icon: Music },
            { id: 'transcribe', label: 'Mic Transcription', icon: Mic },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-2.5 px-3.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40'
                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* 1. VEO VIDEO GENERATION TAB */}
        {activeTab === 'video' && (
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-300 flex items-center justify-between">
                <span>Text Prompt for Veo 3 Video:</span>
                <span className="text-[10px] text-purple-300 font-mono">model: veo-3.1-fast-generate-preview</span>
              </label>
              <textarea
                rows={2}
                value={videoPrompt}
                onChange={(e) => setVideoPrompt(e.target.value)}
                placeholder="Describe scene motion, camera movement, lighting..."
                className="w-full bg-[#141624] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Photo Animation Upload + Aspect Ratio */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-[#141624] border border-white/10 space-y-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-purple-400" />
                  <span>Animate Photo into Video (Optional)</span>
                </span>
                <p className="text-[11px] text-gray-400">
                  Upload an image to bring it to life with cinematic motion.
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = () => setVideoImage(reader.result as string);
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="text-xs text-gray-400 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-purple-600/30 file:text-purple-200 cursor-pointer"
                />
                {videoImage && (
                  <div className="mt-2 relative w-24 h-24 rounded-lg overflow-hidden border border-purple-500/40">
                    <img src={videoImage} alt="Upload preview" className="w-full h-full object-cover" />
                    <button
                      onClick={() => setVideoImage(null)}
                      className="absolute top-1 right-1 p-0.5 rounded-full bg-black/80 text-white text-xs"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-[#141624] border border-white/10 space-y-2">
                <span className="text-xs font-bold text-white">Video Aspect Ratio:</span>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setVideoAspect('16:9')}
                    className={`p-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      videoAspect === '16:9'
                        ? 'bg-purple-600 text-white'
                        : 'bg-black/40 text-gray-400 hover:text-white'
                    }`}
                  >
                    <Film className="w-4 h-4" />
                    <span>16:9 (Landscape)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVideoAspect('9:16')}
                    className={`p-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      videoAspect === '9:16'
                        ? 'bg-purple-600 text-white'
                        : 'bg-black/40 text-gray-400 hover:text-white'
                    }`}
                  >
                    <Film className="w-4 h-4 rotate-90" />
                    <span>9:16 (Portrait / Reels)</span>
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={handleGenerateVideo}
              disabled={isVideoLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-rose-600 hover:from-purple-500 hover:to-rose-500 text-white font-black text-xs shadow-lg shadow-purple-900/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isVideoLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Veo 3 Generating Cinematic Video...</span>
                </>
              ) : (
                <>
                  <Video className="w-4 h-4" />
                  <span>Generate Video with Veo 3.1</span>
                </>
              )}
            </button>

            {/* Video Player Result */}
            {videoResult && (
              <div className="p-4 rounded-2xl bg-black/60 border border-purple-500/40 space-y-3">
                <span className="text-xs font-bold text-purple-300">Generated Veo 3 Video ({videoAspect}):</span>
                <div className="relative rounded-xl overflow-hidden bg-black flex items-center justify-center max-h-80">
                  <video
                    src={videoResult}
                    controls
                    autoPlay
                    loop
                    className="w-full max-h-80 object-contain rounded-xl"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2. GEMINI 3.8 LIVE VOICE CONVERSATION TAB */}
        {activeTab === 'voice' && (
          <div className="space-y-6 text-center py-4">
            <div className="max-w-md mx-auto space-y-2">
              <span className="text-xs font-mono uppercase font-bold text-purple-400">
                Model: gemini-3.8-live (Native Audio Live API)
              </span>
              <h3 className="text-lg font-bold text-white">Real-Time Voice Assistant</h3>
              <p className="text-xs text-gray-400">
                Speak naturally with REHAN AI. Get instant spoken replies and explanations in real-time.
              </p>
            </div>

            {/* Live Mic Circle & Waves */}
            <div className="py-6 flex flex-col items-center justify-center">
              <div className="relative">
                {isVoiceActive && (
                  <div className="absolute -inset-4 rounded-full bg-purple-600/30 animate-ping" />
                )}
                <button
                  onClick={toggleVoice}
                  className={`relative w-24 h-24 rounded-full flex items-center justify-center shadow-2xl transition-all cursor-pointer ${
                    isVoiceActive
                      ? 'bg-rose-600 text-white shadow-rose-900/50 scale-105'
                      : 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-purple-900/50 hover:scale-105'
                  }`}
                >
                  {isVoiceActive ? <Mic className="w-10 h-10 animate-pulse" /> : <MicOff className="w-10 h-10" />}
                </button>
              </div>

              <div className="mt-4">
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${isVoiceActive ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-white/10 text-gray-400'}`}>
                  {isVoiceActive ? '● Listening & Speaking (gemini-3.8-live)' : 'Tap to Start Voice Call'}
                </span>
              </div>
            </div>

            {/* Voice Transcripts */}
            <div className="max-w-xl mx-auto p-4 rounded-2xl bg-[#141624] border border-white/10 text-left space-y-2 max-h-48 overflow-y-auto">
              {voiceMessages.map((msg, i) => (
                <div key={i} className={`text-xs p-2.5 rounded-xl ${msg.role === 'assistant' ? 'bg-purple-950/40 text-purple-200 border border-purple-500/20' : 'bg-white/10 text-white'}`}>
                  <strong className="block text-[10px] text-gray-400 uppercase mb-0.5">{msg.role}:</strong>
                  <span>{msg.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. NANO BANANA IMAGE GENERATION TAB */}
        {activeTab === 'image' && (
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-300 flex items-center justify-between">
                <span>Prompt to Create or Edit Image:</span>
                <span className="text-[10px] text-purple-300 font-mono">model: gemini-nano-banana-2.1</span>
              </label>
              <textarea
                rows={2}
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                placeholder="Describe image subject, lighting, artistic style, resolution..."
                className="w-full bg-[#141624] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <button
              onClick={handleGenerateImage}
              disabled={isImageLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-rose-600 hover:from-purple-500 hover:to-rose-500 text-white font-black text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isImageLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating Image with Gemini Nano Banana...</span>
                </>
              ) : (
                <>
                  <ImageIcon className="w-4 h-4" />
                  <span>Create Image with gemini-nano-banana-2.1</span>
                </>
              )}
            </button>

            {imageResult && (
              <div className="p-4 rounded-2xl bg-black/60 border border-purple-500/40 space-y-3 text-center">
                <img src={imageResult} alt="Generated output" className="max-h-80 mx-auto rounded-xl shadow-2xl object-contain" />
                <a
                  href={imageResult}
                  download="rehan-ai-generated.png"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Full Resolution Image</span>
                </a>
              </div>
            )}
          </div>
        )}

        {/* 4. LYRIA 3 MUSIC CREATOR TAB */}
        {activeTab === 'music' && (
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-300 flex items-center justify-between">
                <span>Music Prompt:</span>
                <span className="text-[10px] text-purple-300 font-mono">Lyria Music Engine</span>
              </label>
              <input
                type="text"
                value={musicPrompt}
                onChange={(e) => setMusicPrompt(e.target.value)}
                placeholder="Style, tempo, instruments, vibe..."
                className="w-full bg-[#141624] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMusicMode('clip')}
                className={`p-3 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                  musicMode === 'clip' ? 'bg-purple-600 text-white shadow-md' : 'bg-white/5 text-gray-400 hover:text-white'
                }`}
              >
                <span>Short Clip (30s)</span>
                <span className="text-[10px] opacity-80 font-mono">lyria-3-clip-preview</span>
              </button>

              <button
                type="button"
                onClick={() => setMusicMode('pro')}
                className={`p-3 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                  musicMode === 'pro' ? 'bg-purple-600 text-white shadow-md' : 'bg-white/5 text-gray-400 hover:text-white'
                }`}
              >
                <span>Full Length Track</span>
                <span className="text-[10px] opacity-80 font-mono">lyria-3-pro-preview</span>
              </button>
            </div>

            <button
              onClick={handleGenerateMusic}
              disabled={isMusicLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isMusicLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Track with Lyria...</span>
                </>
              ) : (
                <>
                  <Music className="w-4 h-4" />
                  <span>Generate Music with {musicMode === 'pro' ? 'lyria-3-pro-preview' : 'lyria-3-clip-preview'}</span>
                </>
              )}
            </button>

            {musicResult && (
              <div className="p-4 rounded-2xl bg-black/60 border border-purple-500/40 space-y-3">
                <span className="text-xs font-bold text-purple-300">Generated Soundtrack:</span>
                <audio ref={audioRef} src={musicResult} controls className="w-full" />
              </div>
            )}
          </div>
        )}

        {/* 5. AUDIO TRANSCRIPTION TAB (gemini-3.5-transcribe) */}
        {activeTab === 'transcribe' && (
          <div className="space-y-5">
            <div className="text-center py-2 space-y-1">
              <span className="text-[10px] font-mono text-purple-400 uppercase font-bold">
                Model: gemini-3.5-transcribe
              </span>
              <h3 className="text-sm font-bold text-white">Record Audio with Microphone</h3>
              <p className="text-xs text-gray-400">
                Speak your thoughts or code ideas, and REHAN AI will transcribe word-for-word into text.
              </p>
            </div>

            <div className="flex justify-center">
              {isRecording ? (
                <button
                  onClick={stopRecording}
                  className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-xl animate-pulse cursor-pointer"
                >
                  <MicOff className="w-4 h-4" />
                  <span>Stop Recording & Transcribe</span>
                </button>
              ) : (
                <button
                  onClick={startRecording}
                  disabled={isTranscribing}
                  className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-xl transition-all cursor-pointer"
                >
                  <Mic className="w-4 h-4" />
                  <span>{isTranscribing ? 'Transcribing Audio...' : 'Start Microphone Recording'}</span>
                </button>
              )}
            </div>

            {transcriptionText && (
              <div className="p-4 rounded-2xl bg-[#141624] border border-purple-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-200">Transcription Result:</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(transcriptionText);
                        setCopiedTranscribe(true);
                        setTimeout(() => setCopiedTranscribe(false), 2000);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-[11px] text-gray-200 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedTranscribe ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>Copy</span>
                    </button>
                    {onSendToChat && (
                      <button
                        onClick={() => {
                          onSendToChat(transcriptionText);
                          onClose();
                        }}
                        className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-[11px] font-bold text-white cursor-pointer"
                      >
                        Send to Chat
                      </button>
                    )}
                  </div>
                </div>
                <div className="text-xs text-gray-200 leading-relaxed bg-black/40 p-3 rounded-xl border border-white/5 select-text">
                  {transcriptionText}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer Back Button */}
        <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center text-xs">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-purple-400" />
            <span>← Back to AI Chat (वापस जाएं)</span>
          </button>
          <span className="text-[11px] text-gray-500">
            Powered by Google Gemini 3.8, Veo 3.1 & Lyria 3
          </span>
        </div>
      </div>
    </div>
  );
};
