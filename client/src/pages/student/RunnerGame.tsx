import { useState, useEffect, useRef, useCallback } from 'react';
import { PracticeQuestion } from '../../types/practice';
import { Trophy, ChevronRight, Pause, Play, Target, Flame, Brain, ArrowLeftRight, CheckCircle2, XCircle } from 'lucide-react';

interface RunnerGameProps {
  questions: PracticeQuestion[];
  onEndSession: (score: number, streak: number) => void;
}

type LaneIndex = -1 | 0 | 1;
type GamePhase = 'approach' | 'decision' | 'feedback' | 'ended';

interface OptionMap {
  text: string;
  lane: LaneIndex;
  isCorrect: boolean;
}

export default function RunnerGame({ questions, onEndSession }: RunnerGameProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<GamePhase>('approach');
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [lane, setLane] = useState<LaneIndex>(0);
  const [optionsMap, setOptionsMap] = useState<OptionMap[]>([]);
  
  // Animation Refs
  const lastTimeRef = useRef<number>();
  const requestRef = useRef<number>();
  const timeElapsedRef = useRef(0);

  // Physics Refs (No React State)
  const speedRef = useRef(0);
  const targetSpeedRef = useRef(40); // Base speed reduced by ~30%
  const distanceRef = useRef(100);
  const playerXRef = useRef(0);
  const bgY1Ref = useRef(0);
  const bgY2Ref = useRef(-100); // Stacked exactly above bg1 (vh)
  
  // Track visual segments (y positions in vh, 0 to 100)
  const trackYRefs = useRef([0, 25, 50, 75, 100]); 

  // DOM Refs
  const playerRef = useRef<HTMLDivElement>(null);
  const bg1Ref = useRef<HTMLImageElement>(null);
  const bg2Ref = useRef<HTMLImageElement>(null);
  const trackLinesRef = useRef<(HTMLDivElement | null)[]>([]);
  const optionsRefs = useRef<(HTMLDivElement | null)[]>([]);

  const currentQ = questions[currentIndex];

  useEffect(() => {
    if (!currentQ || !currentQ.options) return;
    
    const opts = [...currentQ.options].slice(0, 3);
    if (!opts.includes(currentQ.correctAnswer)) {
      opts[2] = currentQ.correctAnswer;
    }
    opts.sort(() => Math.random() - 0.5);
    
    const mapped: OptionMap[] = opts.map((text, i) => ({
      text,
      lane: (i - 1) as LaneIndex,
      isCorrect: text === currentQ.correctAnswer
    }));
    
    setOptionsMap(mapped);
    distanceRef.current = 100;
    setLane(0);
    setPhase('approach');
    targetSpeedRef.current = Math.min(60, 40 + (streak * 1.5)); // Slower, capped scaling
  }, [currentIndex, currentQ]);

  // Input Handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (phase !== 'approach' || isPaused) return;
      if (e.key === 'ArrowLeft') setLane(l => Math.max(l - 1, -1) as LaneIndex);
      if (e.key === 'ArrowRight') setLane(l => Math.min(l + 1, 1) as LaneIndex);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, isPaused]);

  // Main Game Loop
  const loop = useCallback((time: number) => {
    if (isPaused || phase === 'ended') {
      lastTimeRef.current = time;
      requestRef.current = requestAnimationFrame(loop);
      return;
    }

    if (lastTimeRef.current != null) {
      const delta = (time - lastTimeRef.current) / 1000;
      timeElapsedRef.current += delta;

      // 1. Smooth Speed Acceleration (lerp)
      if (phase === 'approach') {
        speedRef.current += (targetSpeedRef.current - speedRef.current) * 0.05;
      } else {
        speedRef.current += (0 - speedRef.current) * 0.1; // Smooth stop
      }

      const moveAmount = speedRef.current * delta;

      // 2. Infinite Loop Background (Two-layer system)
      bgY1Ref.current += moveAmount * 0.3; // Parallax slower than track
      bgY2Ref.current += moveAmount * 0.3;

      // Gapless wrap-around by subtracting exactly the combined height
      if (bgY1Ref.current >= 100) bgY1Ref.current -= 200;
      if (bgY2Ref.current >= 100) bgY2Ref.current -= 200;

      if (bg1Ref.current) bg1Ref.current.style.transform = `translate3d(0, ${bgY1Ref.current}vh, 0)`;
      if (bg2Ref.current) bg2Ref.current.style.transform = `translate3d(0, ${bgY2Ref.current}vh, 0)`;

      // 3. Lane Lines Looping
      trackYRefs.current.forEach((y, i) => {
        let newY = y + moveAmount * 0.8;
        if (newY > 100) newY -= 125; // Recycle to top
        trackYRefs.current[i] = newY;
        if (trackLinesRef.current[i]) {
          trackLinesRef.current[i]!.style.transform = `translate3d(0, ${newY}vh, 0)`;
        }
      });

      // 4. Smooth Player Movement
      const targetLaneX = lane * 30; // vw
      playerXRef.current += (targetLaneX - playerXRef.current) * 0.15; // Smooth sliding
      
      const bob = phase === 'approach' ? Math.sin(timeElapsedRef.current * 8) * 4 : 0;
      
      if (playerRef.current) {
        playerRef.current.style.transform = `translate3d(calc(-50% + ${playerXRef.current}vw), ${bob}px, 0)`;
      }

      // 5. Obstacle Approach
      if (phase === 'approach') {
        distanceRef.current -= moveAmount;
        
        const perspectiveScale = Math.max(0.2, 1 - (distanceRef.current / 100) * 0.8);
        const obstacleY = 80 - (100 - distanceRef.current) * 0.7; // mapped to vh
        
        optionsRefs.current.forEach((el, i) => {
          if (el && optionsMap[i]) {
            el.style.transform = `translate3d(calc(-50% + ${optionsMap[i].lane * 30}vw), -${obstacleY}vh, 0) scale(${perspectiveScale})`;
          }
        });

        // Decision Point
        if (distanceRef.current <= 5) {
          setPhase('decision');
          
          const chosenOption = optionsMap.find(o => o.lane === lane);
          const isCorrect = chosenOption?.isCorrect;
          
          if (isCorrect) {
            setScore(s => s + 10 + (streak * 2));
            setStreak(s => s + 1);
            targetSpeedRef.current = Math.min(60, targetSpeedRef.current + 5);
          } else {
            setScore(s => Math.max(0, s - 5));
            setStreak(0);
            targetSpeedRef.current = Math.max(25, targetSpeedRef.current - 15);
          }

          setTimeout(() => {
            setPhase('feedback');
            setTimeout(() => {
              if (currentIndex < questions.length - 1) {
                setCurrentIndex(i => i + 1);
              } else {
                setPhase('ended');
              }
            }, 1200);
          }, 200);
        }
      }
    }

    lastTimeRef.current = time;
    requestRef.current = requestAnimationFrame(loop);
  }, [isPaused, phase, lane, optionsMap, streak, currentIndex, questions.length]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(requestRef.current!);
  }, [loop]);

  if (phase === 'ended') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-surface-950 p-8 h-full">
        <div className="w-24 h-24 rounded-full bg-primary-500/20 border-2 border-primary-500 flex items-center justify-center mb-6">
          <Trophy className="w-12 h-12 text-primary-400" />
        </div>
        <h2 className="text-3xl font-bold text-surface-50 mb-2">Run Complete!</h2>
        <p className="text-surface-400 mb-8">You finished the track.</p>
        
        <div className="flex gap-6 mb-10">
          <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6 text-center min-w-[140px]">
            <p className="text-xs text-surface-500 font-medium uppercase tracking-wider mb-2">Final Score</p>
            <p className="text-3xl font-bold text-primary-400">{score}</p>
          </div>
          <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6 text-center min-w-[140px]">
            <p className="text-xs text-surface-500 font-medium uppercase tracking-wider mb-2">Max Streak</p>
            <p className="text-3xl font-bold text-accent-400 flex items-center justify-center gap-2">
              <Flame className="w-6 h-6" /> {streak}
            </p>
          </div>
        </div>

        <button 
          onClick={() => onEndSession(score, streak)}
          className="px-8 py-3 bg-surface-800 hover:bg-surface-700 text-surface-100 font-medium rounded-xl transition-colors shadow-lg"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-surface-950 relative selection:bg-transparent">
      
      {/* 2-Layer Infinite Background */}
      <div className="absolute inset-0 overflow-hidden bg-surface-950">
        <img 
          ref={bg1Ref}
          src="/assets/runner_bg.png" 
          className="absolute w-full h-[100vh] object-cover opacity-50 pointer-events-none will-change-transform" 
        />
        <img 
          ref={bg2Ref}
          src="/assets/runner_bg.png" 
          className="absolute w-full h-[100vh] object-cover opacity-50 pointer-events-none will-change-transform" 
        />
      </div>

      {/* Top HUD */}
      <div className="absolute top-0 left-0 right-0 z-20 p-6 flex justify-between items-start pointer-events-none">
        <div className="bg-surface-900/80 backdrop-blur-md border border-surface-700 rounded-2xl p-4 shadow-xl max-w-2xl pointer-events-auto transition-transform duration-300">
          <div className="flex items-center gap-3 text-xs font-bold text-primary-400 uppercase tracking-wider mb-2">
            <Target className="w-4 h-4" /> Question {currentIndex + 1} / {questions.length}
          </div>
          <h2 className="text-xl font-semibold text-surface-50 leading-snug">
            {currentQ?.content}
          </h2>
        </div>

        <div className="flex flex-col gap-3 pointer-events-auto">
          <div className="bg-surface-900/80 backdrop-blur-md border border-surface-700 rounded-xl px-4 py-2 flex items-center gap-3 shadow-lg">
            <span className="text-xs font-semibold text-surface-400 uppercase tracking-wider">Score</span>
            <span className="text-xl font-bold text-primary-400">{score}</span>
          </div>
          <div className="bg-surface-900/80 backdrop-blur-md border border-surface-700 rounded-xl px-4 py-2 flex items-center gap-3 shadow-lg">
            <span className="text-xs font-semibold text-surface-400 uppercase tracking-wider">Streak</span>
            <span className="text-xl font-bold text-accent-400 flex items-center gap-1">
              <Flame className="w-4 h-4" /> {streak}
            </span>
          </div>
        </div>
      </div>

      {/* Main Game Canvas */}
      <div className="flex-1 relative perspective-[1000px] overflow-hidden flex items-end justify-center pb-[15vh]">
        
        {/* Infinite Looping Track Lines */}
        <div className="absolute inset-0 pointer-events-none" style={{ transform: 'rotateX(60deg) scale(2)', transformOrigin: 'bottom' }}>
          {[33, 66].map(x => (
            <div key={x} className="absolute top-0 bottom-0 w-0.5 bg-surface-800" style={{ left: `${x}%` }}>
              {trackYRefs.current.map((_, i) => (
                <div 
                  key={i}
                  ref={el => trackLinesRef.current[i + (x === 33 ? 0 : 5)] = el}
                  className={`absolute w-full h-[20vh] ${x === 33 ? 'bg-primary-500/80 shadow-[0_0_15px_rgba(56,189,248,0.8)]' : 'bg-accent-500/80 shadow-[0_0_15px_rgba(167,139,250,0.8)]'} will-change-transform`}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Incoming Options (Obstacles) */}
        {optionsMap.map((opt, i) => (
          <div
            key={opt.lane}
            ref={el => optionsRefs.current[i] = el}
            className="absolute will-change-transform"
            style={{ left: '50%', zIndex: 10 }}
          >
            <div className={`w-48 p-4 rounded-xl shadow-2xl backdrop-blur-md border-2 text-center transition-colors duration-300 ${
              phase === 'feedback' || phase === 'decision'
                ? opt.isCorrect 
                  ? 'bg-emerald-500/30 border-emerald-400 text-emerald-100 shadow-[0_0_30px_rgba(52,211,153,0.5)]' 
                  : (opt.lane === lane ? 'bg-danger-500/30 border-danger-400 text-danger-100 shadow-[0_0_30px_rgba(248,113,113,0.5)]' : 'bg-surface-800/80 border-surface-700 text-surface-400')
                : 'bg-surface-800/90 border-surface-600 text-surface-200'
            }`}>
              <span className="font-semibold">{opt.text}</span>
            </div>
          </div>
        ))}

        {/* Player Avatar */}
        <div 
          ref={playerRef}
          className="absolute z-20 flex flex-col items-center gap-4 will-change-transform"
          style={{ left: '50%' }}
        >
          {phase === 'feedback' && (
            <div className="absolute -top-16 animate-bounce">
              {optionsMap.find(o => o.lane === lane)?.isCorrect ? (
                <CheckCircle2 className="w-12 h-12 text-emerald-400 drop-shadow-[0_0_20px_rgba(52,211,153,0.8)]" />
              ) : (
                <XCircle className="w-12 h-12 text-danger-400 drop-shadow-[0_0_20px_rgba(248,113,113,0.8)]" />
              )}
            </div>
          )}
          <div className="w-28 h-28 rounded-full flex items-center justify-center relative">
            <img 
              src="/assets/runner_avatar.svg" 
              alt="Avatar" 
              className={`w-full h-full object-contain transition-all duration-300 ${
                phase === 'feedback'
                  ? optionsMap.find(o => o.lane === lane)?.isCorrect 
                    ? 'drop-shadow-[0_0_40px_rgba(52,211,153,1)] scale-110'
                    : 'drop-shadow-[0_0_30px_rgba(248,113,113,1)] grayscale scale-95'
                  : 'drop-shadow-[0_0_20px_rgba(56,189,248,0.5)]'
              }`}
            />
          </div>
          <div className="w-20 h-3 bg-primary-500/20 blur-md rounded-full mt-1" />
        </div>

      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-6 z-20">
        <button 
          onClick={() => setLane(l => Math.max(l - 1, -1) as LaneIndex)}
          disabled={phase !== 'approach' || lane === -1}
          className="w-16 h-16 rounded-full bg-surface-800/80 border border-surface-700 flex items-center justify-center text-surface-200 disabled:opacity-30 active:scale-95 transition-all backdrop-blur-md shadow-lg"
        >
          <ArrowLeftRight className="w-8 h-8 rotate-180" />
        </button>
        <button 
          onClick={() => setIsPaused(!isPaused)}
          className="w-16 h-16 rounded-full bg-surface-800/80 border border-surface-700 flex items-center justify-center text-surface-200 active:scale-95 transition-all backdrop-blur-md shadow-lg"
        >
          {isPaused ? <Play className="w-8 h-8" /> : <Pause className="w-8 h-8" />}
        </button>
        <button 
          onClick={() => setLane(l => Math.min(l + 1, 1) as LaneIndex)}
          disabled={phase !== 'approach' || lane === 1}
          className="w-16 h-16 rounded-full bg-surface-800/80 border border-surface-700 flex items-center justify-center text-surface-200 disabled:opacity-30 active:scale-95 transition-all backdrop-blur-md shadow-lg"
        >
          <ArrowLeftRight className="w-8 h-8" />
        </button>
      </div>

      {/* Pause Overlay */}
      {isPaused && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-surface-900 border border-surface-800 rounded-2xl p-8 text-center max-w-sm w-full shadow-2xl">
            <h2 className="text-2xl font-bold text-surface-50 mb-6">Game Paused</h2>
            <button 
              onClick={() => setIsPaused(false)}
              className="w-full py-3 bg-primary-600 hover:bg-primary-500 text-white font-medium rounded-xl transition-colors mb-3"
            >
              Resume Run
            </button>
            <button 
              onClick={() => onEndSession(score, streak)}
              className="w-full py-3 bg-surface-800 hover:bg-surface-700 text-surface-200 font-medium rounded-xl transition-colors"
            >
              Quit Session
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
