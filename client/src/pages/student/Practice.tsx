import { useState, useEffect, useRef } from 'react';
import { PracticeMode, PracticeState, PracticeQuestion } from '../../types/practice';
import { Brain, Flame, Target, BookOpen, Clock, AlertTriangle, ChevronRight, CheckCircle2, RotateCcw, HelpCircle, Trophy, Gamepad2, RefreshCw, Loader2, Database, Upload, FileText } from 'lucide-react';
import RunnerGame from './RunnerGame';
import { ContentSyncService } from '../../services/contentSync';
import { LearningEngine } from '../../services/learningEngine';
import { notesAPI, aiAPI } from '../../api';
import { MOCK_WEAK_TOPICS, MOCK_QUESTIONS } from '../../data/mockData';

export default function PracticePage() {
  const [state, setState] = useState<PracticeState>({
    currentMode: null, activeSession: null, isLoading: false, weakTopics: MOCK_WEAK_TOPICS
  });
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // Setup Modal State
  const [setupMode, setSetupMode] = useState<PracticeMode | null>(null);
  const [configSource, setConfigSource] = useState<string>('mock');
  const [configCount, setConfigCount] = useState<number>(5);

  // Content Sync State
  const [notesList, setNotesList] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncedPool, setSyncedPool] = useState<any>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; docId: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Fetch available notes on mount
  useEffect(() => {
    notesAPI.listForStudent().then(setNotesList).catch(() => setNotesList([]));
  }, []);

  const openSetup = (mode: PracticeMode) => setSetupMode(mode);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setSyncError(null);
    try {
      const res = await aiAPI.uploadPdf(file);
      setUploadedFile({ name: res.filename, docId: res.docId });
      setConfigSource(`upload:${res.docId}`);
    } catch (err: any) {
      setSyncError(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const startSession = async () => {
    if (!setupMode) return;

    let questions: PracticeQuestion[] = [];

    if (configSource === 'mock') {
      // Use mock data directly
      let filtered = MOCK_QUESTIONS.filter(q =>
        (setupMode === 'quiz' || setupMode === 'runner') ? q.type === 'mcq'
        : setupMode === 'flashcards' ? q.type === 'flashcard'
        : setupMode === 'story' ? q.type === 'story_scenario' : true
      );
      questions = filtered.sort(() => Math.random() - 0.5).slice(0, configCount);
    } else if (configSource.startsWith('upload:')) {
      // Upload-based sync: generate tutor content from the uploaded doc, then use as practice
      const docId = configSource.replace('upload:', '');
      setIsSyncing(true);
      setSyncError(null);
      try {
        const tutorRes = await aiAPI.generateTutor(docId);
        // Convert tutor steps to practice questions
        const steps = tutorRes.steps || [];
        questions = steps
          .filter((s: any) => s.type === 'ask' && s.question)
          .map((s: any) => ({
            id: s.id,
            type: 'mcq' as const,
            content: s.question.text,
            options: s.question.options,
            correctAnswer: s.question.correctAnswer,
            explanation: s.question.hint || 'Review the material for more details.',
            difficulty: 'intermediate' as const,
            topicId: 't-0',
            hints: s.question.hint ? [s.question.hint] : undefined,
          }));
        // Also add teach steps as flashcard-style if in flashcard mode
        if (setupMode === 'flashcards') {
          questions = steps
            .filter((s: any) => s.type === 'teach' && s.heading)
            .map((s: any) => ({
              id: s.id,
              type: 'flashcard' as const,
              content: `What is ${s.heading}?`,
              correctAnswer: s.content,
              explanation: s.content,
              difficulty: 'intermediate' as const,
              topicId: 't-0',
            }));
        }
      } catch (err: any) {
        setSyncError(err.message || 'Failed to generate questions from upload');
        setIsSyncing(false);
        return;
      }
      setIsSyncing(false);
    } else {
      // Sync content from selected notes
      setIsSyncing(true);
      setSyncError(null);
      try {
        const pool = await ContentSyncService.sync(configSource);
        setSyncedPool(pool);
        questions = ContentSyncService.getQuestionsForMode(pool, setupMode, configCount);
        if (pool.topics) setState(p => ({ ...p, weakTopics: pool.topics }));
      } catch (err: any) {
        setSyncError(err.message || 'Sync failed');
        setIsSyncing(false);
        return;
      }
      setIsSyncing(false);
    }

    if (questions.length === 0) {
      setSyncError('No questions generated for this mode. Try a different source.');
      return;
    }

    setState(prev => ({
      ...prev, currentMode: setupMode,
      activeSession: {
        id: `sess-${Date.now()}`, mode: setupMode, questions,
        currentQuestionIndex: 0, score: 0, streak: 0,
        startTime: new Date().toISOString(), completed: false,
        timeRemainingMs: setupMode === 'challenge' ? 60000 : undefined
      }
    }));
    setSetupMode(null);
  };

  const endSession = () => {
    setState(prev => ({ ...prev, activeSession: null, currentMode: null }));
    setSelectedAnswer(null); setShowExplanation(false); setShowHint(false);
  };

  const handleAnswer = (answer: string) => {
    if (showExplanation) return;
    setSelectedAnswer(answer);
  };

  const checkAnswer = () => {
    if (!state.activeSession) return;
    const currentQ = state.activeSession.questions[state.activeSession.currentQuestionIndex];
    const isCorrect = selectedAnswer === currentQ.correctAnswer;
    setShowExplanation(true);

    // Log attempt to Learning Intelligence Engine
    LearningEngine.logAttempt(
      currentQ.topicId || 'general',
      currentQ.id,
      isCorrect,
      undefined,
      undefined
    );

    setState(prev => {
      if (!prev.activeSession) return prev;
      return { ...prev, activeSession: {
        ...prev.activeSession,
        score: isCorrect ? prev.activeSession.score + 100 + (prev.activeSession.streak * 10) : prev.activeSession.score,
        streak: isCorrect ? prev.activeSession.streak + 1 : 0,
      }};
    });
  };

  const nextQuestion = () => {
    if (!state.activeSession) return;
    const isLast = state.activeSession.currentQuestionIndex === state.activeSession.questions.length - 1;
    if (isLast) {
      setState(prev => ({ ...prev, activeSession: { ...prev.activeSession!, completed: true } }));
    } else {
      setState(prev => ({
        ...prev, activeSession: { ...prev.activeSession!, currentQuestionIndex: prev.activeSession!.currentQuestionIndex + 1 }
      }));
    }
    setSelectedAnswer(null); setShowExplanation(false); setShowHint(false);
  };

  const renderModeSelector = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-fade-in">
      <ModeCard icon={<Brain className="w-6 h-6 text-primary-400" />} title="Classic Quiz" desc="Standard MCQs tailored to your level." onClick={() => openSetup('quiz')} />
      <ModeCard icon={<BookOpen className="w-6 h-6 text-accent-400" />} title="Flashcards" desc="Active recall for definitions and core concepts." onClick={() => openSetup('flashcards')} />
      <ModeCard icon={<BookOpen className="w-6 h-6 text-emerald-400" />} title="Story Mode" desc="Apply knowledge in scenario-based challenges." onClick={() => openSetup('story')} />
      <ModeCard icon={<Clock className="w-6 h-6 text-amber-400" />} title="Challenge Mode" desc="Beat the clock with rapid fire questions." onClick={() => openSetup('challenge')} />
      <ModeCard icon={<AlertTriangle className="w-6 h-6 text-danger-400" />} title="Weak Areas" desc="Targeted practice on topics you struggle with." onClick={() => openSetup('weak_areas')} />
      <ModeCard icon={<Gamepad2 className="w-6 h-6 text-fuchsia-400" />} title="Runner Game" desc="Lane-runner game to test recall speed." onClick={() => openSetup('runner')} />
    </div>
  );

  const activeSession = state.activeSession;

  // ── No active session: show mode selector ──
  if (!activeSession) {
    return (
      <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-surface-950">
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-5xl mx-auto space-y-10">
            <div>
              <h1 className="text-3xl font-bold text-surface-50">Practice & Mastery</h1>
              <p className="text-surface-400 mt-2">Select a mode to begin your targeted practice session.</p>
            </div>
            {renderModeSelector()}
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-80 border-l border-surface-800 bg-surface-900/30 p-6 flex flex-col hidden lg:flex overflow-y-auto custom-scrollbar">
          <h2 className="text-sm font-semibold text-surface-200 mb-6 flex items-center gap-2">
            <Target className="w-4 h-4 text-primary-400" /> Focus Areas
          </h2>
          <div className="space-y-4">
            {state.weakTopics.map(topic => (
              <div key={topic.id} className="bg-surface-800/50 rounded-xl p-4 border border-surface-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-surface-200">{topic.name}</span>
                  <span className="text-[10px] text-danger-400 font-bold">{topic.strength}%</span>
                </div>
                <div className="w-full h-1.5 bg-surface-950 rounded-full overflow-hidden">
                  <div className="h-full bg-danger-500 rounded-full" style={{ width: `${topic.strength}%` }} />
                </div>
              </div>
            ))}
          </div>

          {/* Cached Sets */}
          {ContentSyncService.listCachedSets().length > 0 && (
            <div className="mt-8">
              <h3 className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5" /> Synced Content
              </h3>
              <div className="space-y-2">
                {ContentSyncService.listCachedSets().map(s => (
                  <div key={s.notesId} className="bg-surface-800/30 rounded-lg p-3 border border-surface-700/50 text-xs">
                    <p className="font-medium text-surface-200 truncate">{s.title}</p>
                    <p className="text-surface-500 mt-1">Synced {new Date(s.syncedAt).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Setup Modal */}
        {setupMode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-surface-900 border border-surface-800 rounded-2xl w-full max-w-md p-8 shadow-2xl">
              <h2 className="text-2xl font-bold text-surface-50 mb-6 capitalize">{setupMode.replace('_', ' ')} Setup</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-2">Source Material</label>
                  <select value={configSource.startsWith('upload:') ? 'upload' : configSource}
                    onChange={e => {
                      if (e.target.value === 'upload') {
                        fileInputRef.current?.click();
                      } else {
                        setConfigSource(e.target.value);
                        setUploadedFile(null);
                      }
                    }}
                    className="w-full bg-surface-950 border border-surface-700 rounded-xl px-4 py-3 text-surface-100 focus:outline-none focus:border-primary-500 transition-colors">
                    <option value="mock">Mock Data (Instant)</option>
                    <option value="upload">📄 Upload PDF</option>
                    {notesList.length > 0 && (
                      <optgroup label="Your Notes (AI Sync)">
                        {notesList.map((n: any) => <option key={n.id} value={n.id}>{n.title}</option>)}
                      </optgroup>
                    )}
                  </select>
                  <input type="file" accept="application/pdf" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                </div>

                {/* Uploaded file indicator */}
                {uploadedFile && (
                  <div className="flex items-center gap-3 p-3 bg-primary-500/10 border border-primary-500/20 rounded-xl">
                    <FileText className="w-5 h-5 text-primary-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-primary-200 truncate">{uploadedFile.name}</p>
                      <p className="text-[10px] text-primary-400">Ready to generate questions</p>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  </div>
                )}
                {isUploading && (
                  <div className="flex items-center gap-3 p-3 bg-surface-800/50 border border-surface-700 rounded-xl">
                    <Loader2 className="w-5 h-5 text-primary-400 animate-spin shrink-0" />
                    <p className="text-sm text-surface-300">Processing PDF...</p>
                  </div>
                )}

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-surface-300">Questions</label>
                    <span className="text-primary-400 font-bold">{configCount}</span>
                  </div>
                  <input type="range" min="3" max="20" step="1" value={configCount}
                    onChange={e => setConfigCount(parseInt(e.target.value))} className="w-full accent-primary-500" />
                  <div className="flex justify-between text-xs text-surface-500 mt-2">
                    <span>Quick (3)</span><span>Standard (10)</span><span>Deep (20)</span>
                  </div>
                </div>
                {syncError && (
                  <div className="p-3 bg-danger-500/10 border border-danger-500/20 rounded-xl text-sm text-danger-400">{syncError}</div>
                )}
              </div>
              <div className="mt-8 flex gap-4">
                <button onClick={() => { setSetupMode(null); setSyncError(null); }}
                  className="flex-1 py-3 bg-surface-800 hover:bg-surface-700 text-surface-200 font-medium rounded-xl transition-colors">
                  Cancel
                </button>
                <button onClick={startSession} disabled={isSyncing || isUploading}
                  className="flex-1 py-3 bg-primary-600 hover:bg-primary-500 text-white font-medium rounded-xl transition-colors shadow-lg shadow-primary-500/20 disabled:opacity-50 flex items-center justify-center gap-2">
                  {isSyncing ? <><Loader2 className="w-4 h-4 animate-spin" /> Syncing...</> : isUploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</> : 'Start Run'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Session completed ──
  if (activeSession.completed) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-surface-950 h-[calc(100vh-64px)]">
        <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-primary-500/20">
          <Trophy className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-surface-50 mb-2">Session Complete!</h2>
        <p className="text-surface-400 mb-8">Great job! Your learning model has been updated.</p>
        <div className="flex gap-6 mb-10">
          <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6 text-center min-w-[140px]">
            <p className="text-xs text-surface-500 font-medium uppercase tracking-wider mb-2">Score</p>
            <p className="text-3xl font-bold text-primary-400">{activeSession.score}</p>
          </div>
          <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6 text-center min-w-[140px]">
            <p className="text-xs text-surface-500 font-medium uppercase tracking-wider mb-2">Max Streak</p>
            <p className="text-3xl font-bold text-accent-400 flex items-center justify-center gap-1">
              <Flame className="w-6 h-6" /> {activeSession.streak}
            </p>
          </div>
        </div>
        <button onClick={endSession}
          className="px-8 py-3 bg-surface-800 hover:bg-surface-700 text-surface-100 font-medium rounded-xl transition-colors">
          Return to Dashboard
        </button>
      </div>
    );
  }

  // ── Runner mode ──
  const currentQ = activeSession.questions[activeSession.currentQuestionIndex];
  const isCorrect = selectedAnswer === currentQ?.correctAnswer;

  if (activeSession.mode === 'runner') {
    return (
      <RunnerGame questions={activeSession.questions}
        onEndSession={(score, streak) => {
          setState(prev => ({ ...prev, activeSession: { ...prev.activeSession!, score, streak, completed: true } }));
        }} />
    );
  }

  // ── Standard quiz/flashcard/story/challenge UI ──
  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-surface-950">
      <div className="flex-1 flex flex-col relative">
        {/* Header */}
        <div className="h-16 px-8 flex items-center justify-between border-b border-surface-800 bg-surface-900/50 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={endSession} className="text-surface-400 hover:text-surface-200"><RotateCcw className="w-5 h-5" /></button>
            <span className="text-sm font-semibold text-surface-200 capitalize">{activeSession.mode.replace('_', ' ')} Mode</span>
          </div>
          <div className="flex items-center gap-6">
            {activeSession.mode === 'challenge' && (
              <div className="flex items-center gap-2 text-danger-400 font-bold bg-danger-500/10 px-3 py-1 rounded-lg">
                <Clock className="w-4 h-4" /> 00:59
              </div>
            )}
            <div className="text-xs font-semibold text-surface-400">
              Question {activeSession.currentQuestionIndex + 1} of {activeSession.questions.length}
            </div>
          </div>
        </div>

        {/* Question Content */}
        <div className="flex-1 overflow-y-auto p-8 flex justify-center custom-scrollbar">
          <div className="w-full max-w-3xl animate-fade-in space-y-8">
            {currentQ.type === 'story_scenario' && currentQ.storyContext && (
              <div className="bg-surface-800/30 border border-surface-700 rounded-2xl p-6">
                <h3 className="text-xs font-bold text-accent-400 uppercase tracking-wider mb-2">Scenario</h3>
                <p className="text-surface-300 text-sm leading-relaxed mb-4">{currentQ.storyContext}</p>
                {currentQ.characterDialogue && (
                  <div className="pl-4 border-l-2 border-accent-500/50 italic text-surface-400 text-sm">{currentQ.characterDialogue}</div>
                )}
              </div>
            )}

            <h2 className="text-xl md:text-2xl font-semibold text-surface-100 leading-snug">{currentQ.content}</h2>

            {!showExplanation && currentQ.hints && (
              <div className="flex justify-end">
                <button onClick={() => setShowHint(true)}
                  className="flex items-center gap-1.5 text-xs font-medium text-surface-400 hover:text-primary-400 transition-colors">
                  <HelpCircle className="w-4 h-4" /> Need a hint?
                </button>
              </div>
            )}
            {showHint && currentQ.hints && !showExplanation && (
              <div className="bg-primary-500/10 border border-primary-500/20 rounded-xl p-4 animate-slide-up">
                <p className="text-sm text-primary-300">💡 Hint: {currentQ.hints[0]}</p>
              </div>
            )}

            {currentQ.type === 'flashcard' ? (
              <div className="pt-8 flex justify-center">
                {!showExplanation ? (
                  <button onClick={() => setShowExplanation(true)}
                    className="px-8 py-4 bg-surface-800 hover:bg-surface-700 border border-surface-600 rounded-xl text-surface-200 font-medium transition-colors">
                    Reveal Answer
                  </button>
                ) : (
                  <div className="w-full text-center space-y-8 animate-fade-in">
                    <p className="text-lg text-emerald-400 font-medium">{currentQ.correctAnswer}</p>
                    <div className="flex gap-4 justify-center">
                      <button onClick={nextQuestion} className="px-6 py-2 bg-danger-500/20 text-danger-400 rounded-lg text-sm font-medium hover:bg-danger-500/30">Hard</button>
                      <button onClick={nextQuestion} className="px-6 py-2 bg-warning-500/20 text-warning-400 rounded-lg text-sm font-medium hover:bg-warning-500/30">Good</button>
                      <button onClick={nextQuestion} className="px-6 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm font-medium hover:bg-emerald-500/30">Easy</button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {currentQ.options?.map((opt, i) => {
                  const isSelected = selectedAnswer === opt;
                  const isCorrectAnswer = opt === currentQ.correctAnswer;
                  let stateClass = 'bg-surface-900 border-surface-800 text-surface-300 hover:border-surface-600';
                  if (showExplanation) {
                    if (isCorrectAnswer) stateClass = 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400';
                    else if (isSelected) stateClass = 'bg-danger-500/10 border-danger-500/50 text-danger-400';
                    else stateClass = 'bg-surface-900 border-surface-800 text-surface-500 opacity-50';
                  } else if (isSelected) {
                    stateClass = 'bg-primary-500/10 border-primary-500/50 text-primary-200';
                  }
                  return (
                    <button key={i} disabled={showExplanation} onClick={() => handleAnswer(opt)}
                      className={`w-full text-left p-5 rounded-xl border-2 transition-all flex items-center justify-between group ${stateClass}`}>
                      <span className="font-medium">{opt}</span>
                      {showExplanation && isCorrectAnswer && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                    </button>
                  );
                })}
              </div>
            )}

            {showExplanation && currentQ.type !== 'flashcard' && (
              <div className="pt-6 animate-slide-up space-y-6">
                <div className={`p-5 rounded-xl border ${isCorrect ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-danger-500/10 border-danger-500/20'}`}>
                  <h4 className={`text-sm font-bold mb-2 flex items-center gap-2 ${isCorrect ? 'text-emerald-400' : 'text-danger-400'}`}>
                    {isCorrect ? '✨ Correct!' : 'Incorrect'}
                  </h4>
                  <p className="text-sm leading-relaxed text-surface-300">{currentQ.explanation}</p>
                </div>
                <div className="flex justify-end">
                  <button onClick={nextQuestion}
                    className="flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-medium transition-colors">
                    Next Question <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {!showExplanation && currentQ.type !== 'flashcard' && selectedAnswer && (
              <div className="pt-6 flex justify-end animate-fade-in">
                <button onClick={checkAnswer}
                  className="flex items-center gap-2 px-8 py-3 bg-accent-600 hover:bg-accent-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-accent-500/20">
                  Check Answer
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-72 border-l border-surface-800 bg-surface-900/30 flex flex-col hidden xl:flex">
        <div className="p-6 border-b border-surface-800">
          <div className="flex items-center gap-2 mb-1"><Flame className="w-5 h-5 text-accent-400" /><h3 className="text-xl font-bold text-surface-100">{activeSession.streak}</h3></div>
          <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider">Current Streak</p>
        </div>
        <div className="p-6 border-b border-surface-800">
          <h3 className="text-xl font-bold text-primary-400 mb-1">{activeSession.score}</h3>
          <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider">Total Score</p>
        </div>
        <div className="p-6">
          <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-4">Progress</p>
          <div className="w-full h-1.5 bg-surface-800 rounded-full overflow-hidden">
            <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${((activeSession.currentQuestionIndex + 1) / activeSession.questions.length) * 100}%` }} />
          </div>
          <p className="text-[10px] text-surface-500 mt-2 text-right">
            {activeSession.currentQuestionIndex + 1}/{activeSession.questions.length}
          </p>
        </div>
      </div>
    </div>
  );
}

function ModeCard({ icon, title, desc, onClick }: { icon: React.ReactNode; title: string; desc: string; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="text-left bg-surface-900 border border-surface-800 rounded-2xl p-6 hover:bg-surface-800 hover:border-surface-600 transition-all group flex flex-col items-start gap-4">
      <div className="w-12 h-12 rounded-xl bg-surface-800 group-hover:scale-110 transition-transform flex items-center justify-center border border-surface-700">{icon}</div>
      <div>
        <h3 className="text-base font-semibold text-surface-100 mb-1">{title}</h3>
        <p className="text-xs text-surface-400 leading-relaxed">{desc}</p>
      </div>
    </button>
  );
}
