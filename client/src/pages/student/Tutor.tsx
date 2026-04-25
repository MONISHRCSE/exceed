import { useState, useRef } from 'react';
import { TutorState, TutorSession, TutorStep } from '../../types/assistant';
import { aiAPI } from '../../api';
import { Mic, Send, Brain, ChevronRight, CheckCircle2, RotateCcw, AlertCircle, Sparkles, Loader2, Volume2 } from 'lucide-react';

export default function TutorSessionPage() {
  const [state, setState] = useState<TutorState>({
    activeSession: {
      id: 'mock-1',
      studentId: 'me',
      topicId: 'physics-1',
      mode: 'learn',
      difficulty: 'intermediate',
      currentStepIndex: 0,
      score: 0,
      mistakes: [],
      startedAt: new Date().toISOString(),
      steps: [
        {
          id: 'step-1',
          type: 'teach',
          content: "Let's explore Newton's Second Law. It states that the force acting on an object is equal to the mass of that object times its acceleration (F = m * a).",
        },
        {
          id: 'step-2',
          type: 'ask',
          content: 'Based on this, if you double the mass of an object but keep the force the same, what happens to the acceleration?',
          question: {
            id: 'q-1',
            text: 'What happens to acceleration if mass is doubled under constant force?',
            type: 'multiple_choice',
            options: ['It doubles', 'It halves', 'It stays the same'],
            hints: ['Think about the equation F = m * a', 'If m goes up, what must happen to a for F to stay constant?'],
          }
        }
      ]
    },
    isLoading: false,
    isRecording: false,
  });

  const [answer, setAnswer] = useState('');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; message: string } | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const activeSession = state.activeSession;
  if (!activeSession) return <div className="p-8">Loading tutor...</div>;

  const currentStep = activeSession.steps[activeSession.currentStepIndex];

  const playAudio = async () => {
    if (!currentStep.content || isPlayingAudio) return;
    setIsPlayingAudio(true);
    try {
      const res = await aiAPI.tts(currentStep.content);
      if (!res.ok) {
        if (res.status === 400) {
          alert('ElevenLabs API Key missing in backend.');
        } else {
          alert('TTS failed.');
        }
        setIsPlayingAudio(false);
        return;
      }
      
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play();
      }
    } catch (err) {
      console.error(err);
      setIsPlayingAudio(false);
    }
  };

  const handleNext = () => {
    setFeedback(null);
    setAnswer('');
    setSelectedOption(null);
    if (activeSession.currentStepIndex < activeSession.steps.length - 1) {
      setState(s => ({
        ...s,
        activeSession: {
          ...s.activeSession!,
          currentStepIndex: s.activeSession!.currentStepIndex + 1
        }
      }));
    } else {
      // Finished
    }
  };

  const checkAnswer = () => {
    // Mock logic
    const correct = selectedOption === 'It halves' || answer.toLowerCase().includes('half');
    setFeedback({
      isCorrect: correct,
      message: correct ? 'Excellent! Since F is constant, if m increases, a must decrease proportionally.' : 'Not quite. If you increase mass, you need less acceleration to keep the same force. Try again!'
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-surface-950">
      {/* Header */}
      <header className="shrink-0 h-16 border-b border-surface-800 px-8 flex items-center justify-between bg-surface-900/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-500/20 to-primary-500/20 flex items-center justify-center border border-accent-500/30">
            <Brain className="w-5 h-5 text-accent-400" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-surface-50">AI Tutor</h1>
            <p className="text-xs text-surface-400 font-medium">Topic: Physics • Intermediate</p>
          </div>
        </div>
        
        {/* Progress Tracker */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-sm font-medium text-surface-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Score: {activeSession.score}</span>
          </div>
          <div className="w-32 h-1.5 bg-surface-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-accent-500 to-primary-500 transition-all duration-500" 
              style={{ width: `${((activeSession.currentStepIndex + 1) / activeSession.steps.length) * 100}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-surface-400">
            {activeSession.currentStepIndex + 1} / {activeSession.steps.length}
          </span>
        </div>
      </header>

      {/* Learning Flow Container */}
      <div className="flex-1 overflow-y-auto p-8 flex justify-center">
        <div className="w-full max-w-3xl space-y-8 animate-slide-up">
          
          {/* Step Type Badge */}
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
              currentStep.type === 'teach' ? 'bg-primary-500/20 text-primary-400' :
              currentStep.type === 'ask' ? 'bg-amber-500/20 text-amber-400' :
              'bg-emerald-500/20 text-emerald-400'
            }`}>
              {currentStep.type === 'teach' ? '📚 Concept Explanation' : '💡 Check Your Understanding'}
            </span>
          </div>

          {/* AI Content Bubble */}
          <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6 shadow-sm relative">
            <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-accent-500/20 border border-accent-500/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-accent-400" />
            </div>
            
            <div className="flex items-start justify-between gap-4">
              <p className="text-surface-200 text-lg leading-relaxed ml-2">
                {currentStep.content}
              </p>
              <button 
                onClick={playAudio}
                disabled={isPlayingAudio}
                title="Read aloud"
                className="p-2 bg-surface-800 hover:bg-surface-700 rounded-full text-surface-400 hover:text-surface-200 transition-colors shrink-0"
              >
                {isPlayingAudio ? <Loader2 className="w-4 h-4 animate-spin" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>
            <audio ref={audioRef} className="hidden" onEnded={() => setIsPlayingAudio(false)} />
          </div>

          {/* Interaction Area */}
          {currentStep.type === 'ask' && currentStep.question && (
            <div className="space-y-6 pl-4 border-l-2 border-surface-800 ml-4 animate-fade-in">
              {currentStep.question.type === 'multiple_choice' ? (
                <div className="grid gap-3">
                  {currentStep.question.options?.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedOption(opt)}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        selectedOption === opt 
                          ? 'bg-primary-500/10 border-primary-500/50 text-primary-100' 
                          : 'bg-surface-900/50 border-surface-800 text-surface-300 hover:bg-surface-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          selectedOption === opt ? 'border-primary-500 bg-primary-500' : 'border-surface-600'
                        }`}>
                          {selectedOption === opt && <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                        {opt}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Type your answer here..."
                  className="w-full bg-surface-900 border border-surface-800 rounded-xl p-4 text-surface-200 focus:outline-none focus:border-primary-500 transition-colors resize-none h-32"
                />
              )}

              {/* Feedback Alert */}
              {feedback && (
                <div className={`p-4 rounded-xl border flex items-start gap-3 animate-slide-up ${
                  feedback.isCorrect 
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                    : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                }`}>
                  {feedback.isCorrect ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
                  <p className="text-sm leading-relaxed">{feedback.message}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4">
                {feedback?.isCorrect ? (
                  <button 
                    onClick={handleNext}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-medium transition-colors"
                  >
                    Next Concept <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <>
                    <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-surface-800 text-surface-300 hover:text-surface-100 hover:bg-surface-700 transition-colors">
                      <Mic className="w-4 h-4" /> Voice Reply
                    </button>
                    <button 
                      onClick={checkAnswer}
                      disabled={!selectedOption && !answer}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-accent-600 hover:bg-accent-500 text-white font-medium transition-colors disabled:opacity-50"
                    >
                      Check Answer <Send className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {currentStep.type === 'teach' && (
            <div className="flex justify-end pt-8 border-t border-surface-800/50">
              <button 
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-accent-600 text-white font-semibold hover:shadow-lg hover:shadow-primary-500/20 transition-all hover:scale-[1.02]"
              >
                I Understand <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
