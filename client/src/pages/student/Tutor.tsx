import { useState, useRef, useEffect } from 'react';
import { aiAPI } from '../../api';
import { 
  Brain, ChevronRight, CheckCircle2, RotateCcw, AlertCircle, 
  Sparkles, Loader2, Volume2, Send, Settings2, FileText, UserCircle2,
  Clock, Plus, Upload, Trash2, Search, BookOpen, GraduationCap
} from 'lucide-react';

// --- MOCK DATA FOR OUTLINE & STEPS ---
const LESSON_OUTLINE = [
  {
    id: 'ch-1',
    title: 'Chapter 1: Cell Biology',
    topics: [
      { id: 't-1', title: 'Cell Membrane Structure', status: 'completed' },
      { id: 't-2', title: 'Active vs Passive Transport', status: 'current' },
      { id: 't-3', title: 'Endocytosis & Exocytosis', status: 'locked' }
    ]
  }
];

type StepType = 'teach' | 'ask' | 'feedback';

interface TutorStep {
  id: string;
  type: StepType;
  heading?: string;
  content: string;
  keyPoints?: string[];
  example?: string;
  question?: {
    type: 'mcq' | 'short_answer';
    text: string;
    options?: string[];
    correctAnswer: string;
    hint: string;
  };
}

const TOPIC_STEPS: TutorStep[] = [
  {
    id: 's-1',
    type: 'teach',
    heading: 'Passive Transport: Diffusion',
    content: "Let's start with passive transport. This is when molecules move across the cell membrane without the cell spending any energy (ATP). They naturally move from an area of high concentration to an area of low concentration.",
    keyPoints: [
      "No cellular energy (ATP) required.",
      "Moves down the concentration gradient (High → Low)."
    ],
    example: "Think of passive transport like riding a bicycle downhill. You don't have to pedal (use energy); gravity does the work for you."
  },
  {
    id: 's-2',
    type: 'ask',
    content: "Let's check your understanding of passive transport.",
    question: {
      type: 'mcq',
      text: "Which of the following is a key characteristic of passive transport?",
      options: [
        "It requires ATP energy",
        "Molecules move from low to high concentration",
        "Molecules move down their concentration gradient",
        "It only happens in plant cells"
      ],
      correctAnswer: "Molecules move down their concentration gradient",
      hint: "Remember the bicycle analogy—you are moving with the natural flow, not fighting against it."
    }
  },
  {
    id: 's-3',
    type: 'teach',
    heading: 'Active Transport',
    content: "Now let's look at active transport. Sometimes a cell needs to move molecules against their natural gradient (from low to high concentration). To do this, the cell must use energy in the form of ATP to pump the molecules across the membrane.",
    keyPoints: [
      "Requires ATP energy.",
      "Moves against the concentration gradient (Low → High).",
      "Often involves specific protein pumps."
    ],
    example: "Active transport is like pedaling a bicycle up a steep hill. It requires significant energy and effort to go against gravity."
  }
];

// MOCK PERSISTENT SESSIONS
const MOCK_SESSIONS = [
  {
    id: 'sess-1',
    title: 'Biology 101: Cell Transport',
    subject: 'Biology',
    lastAccessed: '2 hours ago',
    progress: 33,
    stepIndex: 0,
    source: 'Biology_Chapter4.pdf',
    steps: TOPIC_STEPS
  },
  {
    id: 'sess-2',
    title: 'Thermodynamics Laws',
    subject: 'Physics',
    lastAccessed: 'Yesterday',
    progress: 80,
    stepIndex: 2,
    source: 'Physics_Notes.pdf',
    steps: TOPIC_STEPS
  }
];

export default function TutorSessionPage() {
  // Main view state
  const [viewMode, setViewMode] = useState<'dashboard' | 'session'>('dashboard');
  const [sessions, setSessions] = useState(MOCK_SESSIONS);
  
  // Active session state
  const [activeSession, setActiveSession] = useState<any>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [showAvatar, setShowAvatar] = useState(true);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Interaction State
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [textAnswer, setTextAnswer] = useState('');
  const [feedbackState, setFeedbackState] = useState<{ isCorrect: boolean; message: string } | null>(null);
  const [showHint, setShowHint] = useState(false);

  const currentStep = activeSession?.steps ? activeSession.steps[stepIndex] : null;

  // Sync state to "persistence" when stepIndex changes
  useEffect(() => {
    if (activeSession && activeSession.steps) {
      setSessions(prev => prev.map(s => 
        s.id === activeSession.id ? { ...s, stepIndex, progress: Math.round(((stepIndex) / activeSession.steps.length) * 100), lastAccessed: 'Just now' } : s
      ));
    }
  }, [stepIndex]);

  // Auto-play audio when teaching step appears
  useEffect(() => {
    if (currentStep && currentStep.type === 'teach' && showAvatar && viewMode === 'session') {
      playAudio(currentStep.content);
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlayingAudio(false);
      }
    };
  }, [stepIndex, showAvatar, viewMode]);

  const playAudio = async (textToSpeak?: string) => {
    const text = textToSpeak || currentStep?.content;
    if (!text || isPlayingAudio) return;
    
    setIsPlayingAudio(true);
    try {
      const res = await aiAPI.tts(text);
      if (!res.ok) {
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
    if (activeSession && activeSession.steps && stepIndex < activeSession.steps.length - 1) {
      setStepIndex(stepIndex + 1);
      setSelectedOption(null);
      setTextAnswer('');
      setFeedbackState(null);
      setShowHint(false);
    }
  };

  const checkAnswer = () => {
    if (!currentStep?.question) return;
    
    const isCorrect = currentStep.question.type === 'mcq' 
      ? selectedOption === currentStep.question.correctAnswer
      : textAnswer.toLowerCase().includes('down') && textAnswer.toLowerCase().includes('gradient'); // Mock evaluation

    setFeedbackState({
      isCorrect,
      message: isCorrect 
        ? "Excellent! You nailed it. Let's move on to the next concept." 
        : "Not quite. Remember that passive transport moves from high to low concentration. Try again!"
    });

    if (isCorrect && showAvatar) {
      playAudio("Excellent! You nailed it. Let's move on to the next concept.");
    } else if (!isCorrect && showAvatar) {
      playAudio("Not quite. Let me give you a hint. Remember the bicycle analogy.");
    }
  };

  const startNewSession = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    try {
      const res = await aiAPI.uploadPdf(file);
      
      // Generate tutor lesson plan from the document
      const tutorRes = await aiAPI.generateTutor(res.docId);
      
      const newSess = {
        id: `sess-${Date.now()}`,
        title: `Learning: ${res.filename.replace('.pdf', '')}`,
        subject: 'Uploaded Document',
        lastAccessed: 'Just now',
        progress: 0,
        stepIndex: 0,
        source: res.filename,
        docId: res.docId,
        steps: tutorRes.steps
      };
      setSessions([newSess, ...sessions]);
      resumeSession(newSess);
    } catch (err) {
      console.error(err);
      alert('Failed to process document for tutoring.');
    } finally {
      setIsUploading(false);
    }
  };

  const resumeSession = (session: any) => {
    setActiveSession(session);
    setStepIndex(session.stepIndex);
    setViewMode('session');
    setSelectedOption(null);
    setTextAnswer('');
    setFeedbackState(null);
    setShowHint(false);
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSessions(prev => prev.filter(s => s.id !== id));
  };

  if (viewMode === 'dashboard') {
    return (
      <div className="flex flex-col h-[calc(100vh-64px)] overflow-y-auto bg-surface-950 p-8 custom-scrollbar">
        <div className="max-w-6xl mx-auto w-full space-y-10">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-surface-50 flex items-center gap-3">
                <GraduationCap className="w-8 h-8 text-primary-400" />
                AI Tutor Sessions
              </h1>
              <p className="text-surface-400 mt-2">Resume your learning journeys or start a new interactive session.</p>
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto">
              <input 
                type="file" 
                accept="application/pdf" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={startNewSession} 
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-medium transition-colors w-full md:w-auto disabled:opacity-50"
              >
                {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                Upload PDF to Learn
              </button>
            </div>
          </div>

          <div className="bg-surface-900 border border-surface-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-surface-800 flex items-center justify-between bg-surface-900/50">
              <div className="flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-surface-400" />
                <h3 className="font-semibold text-surface-200">Recent Sessions</h3>
              </div>
              <div className="relative">
                <Search className="w-4 h-4 text-surface-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="Search sessions..." 
                  className="pl-9 pr-4 py-1.5 bg-surface-950 border border-surface-700 rounded-lg text-sm text-surface-200 focus:outline-none focus:border-primary-500 w-48 transition-colors"
                />
              </div>
            </div>

            <div className="divide-y divide-surface-800">
              {sessions.length === 0 ? (
                <div className="p-12 text-center text-surface-500">
                  <Brain className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>No active tutoring sessions. Upload a document to start learning!</p>
                </div>
              ) : (
                sessions.map((sess) => (
                  <div 
                    key={sess.id}
                    onClick={() => resumeSession(sess)}
                    className="p-5 flex items-center justify-between hover:bg-surface-800/50 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-5 w-2/3">
                      <div className="w-12 h-12 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center shrink-0">
                        <GraduationCap className="w-6 h-6 text-primary-400" />
                      </div>
                      <div className="w-full">
                        <h4 className="text-base font-semibold text-surface-100 mb-1 group-hover:text-primary-400 transition-colors">{sess.title}</h4>
                        <div className="flex items-center gap-3 text-xs text-surface-400">
                          <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {sess.subject}</span>
                          <span className="w-1 h-1 rounded-full bg-surface-700" />
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {sess.lastAccessed}</span>
                          <span className="w-1 h-1 rounded-full bg-surface-700" />
                          <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> {sess.source}</span>
                        </div>
                        <div className="mt-3 flex items-center gap-3 w-full max-w-sm">
                          <div className="h-1.5 bg-surface-950 rounded-full flex-1 overflow-hidden border border-surface-800">
                            <div className="h-full bg-primary-500 rounded-full" style={{ width: `${sess.progress}%` }} />
                          </div>
                          <span className="text-[10px] font-bold text-surface-500 w-8">{sess.progress}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button 
                        onClick={(e) => deleteSession(e, sess.id)}
                        className="p-2 text-surface-500 hover:text-danger-400 hover:bg-danger-400/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        title="Archive Session"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button className="px-5 py-2 bg-surface-800 group-hover:bg-primary-600 text-surface-200 group-hover:text-white rounded-lg text-sm font-medium transition-all shadow-sm group-hover:shadow-primary-500/20 flex items-center gap-2">
                        Resume <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentStep) return null;

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-surface-950">
      
      {/* LEFT PANEL: Lesson Outline */}
      <div className="w-72 border-r border-surface-800 bg-surface-900/30 flex flex-col hidden lg:flex shrink-0">
        <div className="p-5 border-b border-surface-800">
          <button 
            onClick={() => setViewMode('dashboard')}
            className="flex items-center gap-2 text-xs font-semibold text-surface-400 hover:text-surface-200 mb-4 transition-colors"
          >
            <ChevronRight className="w-4 h-4 rotate-180" /> Back to Sessions
          </button>
          <h2 className="text-sm font-bold text-surface-50 uppercase tracking-wider">Lesson Outline</h2>
          <div className="w-full bg-surface-800 h-1.5 rounded-full mt-4 overflow-hidden">
            <div className="bg-primary-500 h-full transition-all" style={{ width: `${activeSession.progress}%` }} />
          </div>
          <p className="text-[10px] text-surface-400 mt-2 font-medium text-right">{activeSession.progress}% Completed</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
          {LESSON_OUTLINE.map(chapter => (
            <div key={chapter.id}>
              <h3 className="text-xs font-bold text-surface-500 uppercase tracking-wider mb-3 pl-2">
                {chapter.title}
              </h3>
              <div className="space-y-1">
                {chapter.topics.map(topic => (
                  <button 
                    key={topic.id}
                    className={`w-full flex items-center justify-between p-2.5 rounded-lg text-sm transition-colors text-left ${
                      topic.status === 'current' 
                        ? 'bg-primary-500/10 border border-primary-500/20 text-primary-300' 
                        : topic.status === 'completed'
                          ? 'text-surface-300 hover:bg-surface-800/50'
                          : 'text-surface-500 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <span className="truncate pr-3 font-medium">{topic.title}</span>
                    {topic.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                    {topic.status === 'current' && <div className="w-2 h-2 rounded-full bg-primary-500 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CENTER PANEL: Tutor Session */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        
        {/* Avatar Area (Top) */}
        {showAvatar && (
          <div className="h-48 border-b border-surface-800 bg-gradient-to-b from-surface-900 to-surface-950 flex items-center justify-center relative shrink-0">
            {isPlayingAudio && (
              <>
                <div className="absolute w-32 h-32 rounded-full border border-primary-500/20 animate-ping" style={{ animationDuration: '3s' }} />
                <div className="absolute w-40 h-40 rounded-full border border-accent-500/10 animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }} />
              </>
            )}
            
            <div className={`relative z-10 w-24 h-24 rounded-full border-4 flex items-center justify-center transition-all duration-500 shadow-2xl ${
              isPlayingAudio 
                ? 'border-primary-500/50 bg-gradient-to-br from-primary-600/20 to-accent-600/20 shadow-primary-500/20' 
                : 'border-surface-700 bg-surface-800 shadow-surface-900/50'
            }`}>
              <Brain className={`w-10 h-10 ${isPlayingAudio ? 'text-primary-400 animate-pulse' : 'text-surface-400'}`} />
              
              {isPlayingAudio && (
                <div className="absolute -bottom-2 flex gap-1 items-center justify-center w-full">
                  <div className="w-1.5 h-3 bg-primary-400 rounded-full animate-bounce" style={{ animationDuration: '0.6s' }} />
                  <div className="w-1.5 h-4 bg-accent-400 rounded-full animate-bounce" style={{ animationDuration: '0.4s', animationDelay: '0.1s' }} />
                  <div className="w-1.5 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDuration: '0.7s', animationDelay: '0.2s' }} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Content Display (Middle) */}
        <div className="flex-1 overflow-y-auto p-8 flex justify-center custom-scrollbar">
          <div className="w-full max-w-2xl space-y-8 pb-20">
            
            <div className="flex items-center gap-3 animate-fade-in">
              <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                currentStep.type === 'teach' ? 'bg-primary-500/20 text-primary-400' : 'bg-amber-500/20 text-amber-400'
              }`}>
                {currentStep.type === 'teach' ? '📚 Explaining Concept' : '💡 Knowledge Check'}
              </span>
            </div>

            {currentStep.heading && (
              <h2 className="text-2xl font-bold text-surface-50 animate-slide-up leading-snug">
                {currentStep.heading}
              </h2>
            )}

            <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6 shadow-sm animate-slide-up">
              <p className="text-surface-200 text-lg leading-relaxed">
                {currentStep.content}
              </p>
            </div>

            {/* Key Points & Example */}
            {currentStep.type === 'teach' && currentStep.keyPoints && (
              <div className="space-y-4 animate-slide-up" style={{ animationDelay: '100ms' }}>
                <div className="bg-surface-950 rounded-xl p-5 border border-surface-800/50">
                  <h4 className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-3">Key Takeaways</h4>
                  <ul className="space-y-2">
                    {currentStep.keyPoints.map((kp, i) => (
                      <li key={i} className="flex gap-2 text-[15px] text-surface-300">
                        <span className="text-primary-500 mt-0.5">•</span> {kp}
                      </li>
                    ))}
                  </ul>
                </div>

                {currentStep.example && (
                  <div className="bg-accent-500/5 border border-accent-500/20 rounded-xl p-5">
                    <h4 className="text-xs font-semibold text-accent-400/80 uppercase tracking-wider mb-2">💡 Analogy</h4>
                    <p className="text-[15px] text-accent-100/90 leading-relaxed">
                      {currentStep.example}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Assessment Area */}
            {currentStep.type === 'ask' && currentStep.question && (
              <div className="space-y-6 pt-4 animate-slide-up" style={{ animationDelay: '100ms' }}>
                <h3 className="text-lg font-medium text-surface-100">{currentStep.question.text}</h3>
                
                {currentStep.question.type === 'mcq' ? (
                  <div className="grid gap-3">
                    {currentStep.question.options?.map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => !feedbackState?.isCorrect && setSelectedOption(opt)}
                        disabled={feedbackState?.isCorrect}
                        className={`p-4 rounded-xl border text-left transition-all flex items-center justify-between group ${
                          feedbackState?.isCorrect && opt === currentStep.question!.correctAnswer
                            ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                            : selectedOption === opt 
                              ? 'bg-primary-500/10 border-primary-500/50 text-primary-200' 
                              : 'bg-surface-900 border-surface-800 text-surface-300 hover:border-surface-600'
                        }`}
                      >
                        <span className="font-medium">{opt}</span>
                        {feedbackState?.isCorrect && opt === currentStep.question!.correctAnswer && <CheckCircle2 className="w-5 h-5" />}
                      </button>
                    ))}
                  </div>
                ) : (
                  <textarea
                    value={textAnswer}
                    onChange={(e) => setTextAnswer(e.target.value)}
                    disabled={feedbackState?.isCorrect}
                    placeholder="Type your answer here..."
                    className="w-full bg-surface-900 border border-surface-800 rounded-xl p-4 text-surface-200 focus:outline-none focus:border-primary-500 transition-colors resize-none h-32"
                  />
                )}

                {/* Feedback Panel */}
                {feedbackState && (
                  <div className={`p-5 rounded-xl border flex items-start gap-3 animate-slide-up ${
                    feedbackState.isCorrect 
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                      : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                  }`}>
                    {feedbackState.isCorrect ? <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />}
                    <p className="text-[15px] leading-relaxed">{feedbackState.message}</p>
                  </div>
                )}
                
                {/* Hint Panel */}
                {!feedbackState?.isCorrect && showHint && (
                  <div className="p-5 rounded-xl border bg-primary-500/5 border-primary-500/20 text-primary-300 animate-slide-up">
                    <p className="text-[15px] leading-relaxed"><strong>Hint:</strong> {currentStep.question.hint}</p>
                  </div>
                )}
              </div>
            )}
            
            <div className="h-10" />
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-surface-950/90 backdrop-blur-md border-t border-surface-800 flex items-center justify-between">
          <div className="flex gap-2">
            <button 
              onClick={() => playAudio()}
              className="p-3 bg-surface-800 hover:bg-surface-700 text-surface-300 rounded-xl transition-colors tooltip-trigger"
              title="Repeat Audio"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            <button 
              className="p-3 bg-surface-800 hover:bg-surface-700 text-surface-300 rounded-xl transition-colors tooltip-trigger"
              title="Slow Down"
            >
              <Volume2 className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setShowAvatar(!showAvatar)}
              className={`p-3 rounded-xl transition-colors tooltip-trigger ${showAvatar ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30' : 'bg-surface-800 hover:bg-surface-700 text-surface-300'}`}
              title="Toggle Avatar"
            >
              <UserCircle2 className="w-5 h-5" />
            </button>
          </div>

          <div className="flex gap-3">
            {currentStep.type === 'ask' && !feedbackState?.isCorrect ? (
              <>
                <button 
                  onClick={() => setShowHint(true)}
                  disabled={showHint}
                  className="px-5 py-2.5 rounded-xl bg-surface-800 text-surface-300 hover:bg-surface-700 hover:text-surface-100 font-medium transition-colors disabled:opacity-50"
                >
                  Need a hint?
                </button>
                <button 
                  onClick={checkAnswer}
                  disabled={!selectedOption && !textAnswer}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-accent-600 hover:bg-accent-500 text-white font-medium shadow-lg shadow-accent-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Check Answer <CheckCircle2 className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button 
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-medium shadow-lg shadow-primary-500/20 transition-all hover:scale-105"
              >
                {activeSession && activeSession.steps && stepIndex < activeSession.steps.length - 1 ? 'Next Concept' : 'Finish Lesson'} <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <audio ref={audioRef} className="hidden" onEnded={() => setIsPlayingAudio(false)} />
      </div>

      {/* RIGHT PANEL: Context & Notes */}
      <div className="w-72 border-l border-surface-800 bg-surface-900/30 flex flex-col hidden xl:flex shrink-0">
        <div className="p-5 border-b border-surface-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-surface-50 uppercase tracking-wider">Contextual Notes</h2>
          <Settings2 className="w-4 h-4 text-surface-400" />
        </div>
        
        <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
          <div>
            <h3 className="text-[10px] font-bold text-surface-500 uppercase tracking-wider mb-3">Linked Documents</h3>
            <div className="p-3 bg-surface-800/50 border border-primary-500/30 rounded-xl flex items-start gap-3">
              <FileText className="w-4 h-4 text-primary-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium text-surface-200 leading-tight truncate w-48" title={activeSession.source}>
                  {activeSession.source}
                </p>
                <p className="text-[10px] text-surface-500 mt-1">Source for current topic</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-[10px] font-bold text-surface-500 uppercase tracking-wider mb-3">Ask AI</h3>
            <div className="bg-surface-800/50 rounded-xl p-3 border border-surface-700">
              <p className="text-xs text-surface-400 mb-3 leading-relaxed">
                Interrupt the tutor to ask a question or request a different explanation.
              </p>
              <div className="flex bg-surface-900 rounded-lg p-1 border border-surface-700">
                <input 
                  type="text" 
                  placeholder="Ask something..." 
                  className="w-full bg-transparent border-none text-xs text-surface-200 px-2 focus:ring-0" 
                />
                <button className="p-1.5 bg-primary-500 text-white rounded-md hover:bg-primary-600">
                  <Send className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
