import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';

const AnimatedTaskHub = () => {
  const [taskCount, setTaskCount] = useState(1);
  const [balls, setBalls] = useState([
    { id: 1, name: 'Task 1', stage: 'waiting' },
    { id: 2, name: 'Task 2', stage: 'waiting' },
    { id: 3, name: 'Task 3', stage: 'waiting' },
  ]);

  // Current active ball index running through the sequence
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    // 1. Start rolling the active ball
    setBalls((prev) =>
      prev.map((b, i) => (i === activeIdx ? { ...b, stage: 'rolling' } : b))
    );

    // 2. Move to destination -> turn green & big
    const t1 = setTimeout(() => {
      setBalls((prev) =>
        prev.map((b, i) => (i === activeIdx ? { ...b, stage: 'completed' } : b))
      );
    }, 1200);

    // 3. Trigger bomb pop burst
    const t2 = setTimeout(() => {
      setBalls((prev) =>
        prev.map((b, i) => (i === activeIdx ? { ...b, stage: 'exploding' } : b))
      );
    }, 2200);

    // 4. Reset this ball and pass turn to next ball in line
    const t3 = setTimeout(() => {
      setTaskCount((prev) => {
        const newCount = prev + 3;
        setBalls((prevBalls) =>
          prevBalls.map((b, i) =>
            i === activeIdx
              ? { ...b, name: `Task ${newCount}`, stage: 'waiting' }
              : b
          )
        );
        return prev;
      });

      // Move turn to the next ball in line (0 -> 1 -> 2 -> 0)
      setActiveIdx((prev) => (prev + 1) % 3);
    }, 2800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [activeIdx]);

  return (
    <div className="p-6 sm:p-7 space-y-6 relative overflow-hidden transition-all duration-500">
      {/* ROLLING BALLS SINGLE LINE ARENA */}
      <div className="py-8 relative min-h-[140px] flex items-center justify-center">
        {/* Single Shared Track Line */}
        <div className="absolute w-full h-[2px] bg-slate-800/80 rounded-full" />

        {/* Target Drop Zone on Far Right */}
        <div className="absolute right-2 w-12 h-12 rounded-full border-2 border-dashed border-slate-700/60 flex items-center justify-center text-[9px] text-slate-500 font-bold uppercase tracking-widest bg-slate-950/40">
          Done
        </div>

        {/* Balls render on the same horizontal line */}
        {balls.map((ball, idx) => {
          const isWaiting = ball.stage === 'waiting';
          const isRolling = ball.stage === 'rolling';
          const isCompleted = ball.stage === 'completed';
          const isExploding = ball.stage === 'exploding';

          return (
            <div
              key={`${ball.id}-${idx}`}
              className={`absolute transition-all ease-out duration-1000 flex flex-col items-center justify-center ${
                isWaiting
                  ? '-left-[15%] scale-75 opacity-0'
                  : isRolling
                  ? 'left-[10%] scale-90 opacity-100'
                  : isCompleted
                  ? 'left-[80%] scale-125 opacity-100'
                  : 'left-[80%] scale-150 opacity-0'
              }`}
            >
              {/* 3D Ball Object */}
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xs shadow-xl transition-all duration-500 relative ${
                  isCompleted || isExploding
                    ? 'bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-300 text-white shadow-emerald-500/50 ring-4 ring-emerald-400/40'
                    : 'bg-gradient-to-tr from-indigo-700 via-indigo-500 to-purple-400 text-slate-100 shadow-indigo-500/30'
                }`}
              >
                {/* Rolling Text / Completed Icon */}
                <span
                  className={`transition-transform duration-1000 ${
                    isRolling ? 'rotate-[360deg]' : 'rotate-0'
                  }`}
                >
                  {isCompleted || isExploding ? (
                    <Check className="w-6 h-6 text-white animate-bounce" />
                  ) : (
                    ball.name
                  )}
                </span>

                {/* Bomb Pop Burst Particles */}
                {isExploding && (
                  <>
                    <span className="absolute -top-4 -left-4 w-3.5 h-3.5 bg-emerald-400 rounded-full animate-ping" />
                    <span className="absolute -bottom-4 -right-4 w-3.5 h-3.5 bg-teal-300 rounded-full animate-ping" />
                    <span className="absolute -top-4 -right-4 w-2.5 h-2.5 bg-emerald-300 rounded-full animate-ping" />
                    <span className="absolute -bottom-4 -left-4 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
                  </>
                )}
              </div>

              {/* Rolling Drop Shadow */}
              <div
                className={`h-1.5 rounded-full bg-black/70 blur-xs transition-all duration-500 mt-1 ${
                  isCompleted ? 'w-12 bg-emerald-500/40' : 'w-8'
                }`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AnimatedTaskHub;