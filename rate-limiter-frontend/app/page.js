'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  LayoutGrid, Layers, RefreshCw, Activity,
  Send, Trash2, Play, Pause, Settings2, Zap,
  CheckCircle2, XCircle, BarChart3
} from 'lucide-react';

// Types - Map to match Java backend enum
const AlgorithmType = {
  FIXED_WINDOW: 'FIXED_WINDOW',
  TOKEN_BUCKET: 'TOKEN_BUCKET',
  LEAKY_BUCKET: 'LEAKY_BUCKET',
  SLIDING_WINDOW: 'SLIDING_WINDOW_LOG'
};

// --- API Helpers ---
const API_BASE = 'http://localhost:8080/api'; // Update this to match your Spring Boot backend URL

const fetchConfig = async (config, algorithm) => {
  try {
    // Map frontend config to backend RateLimitConfig format
    const backendConfig = {
      algorithm: algorithm,
      limit: config.limit,
      windowSizeInSeconds: Math.floor(config.windowSizeMs / 1000), // Convert ms to seconds
      refillRate: config.refillRate || 1,
      capacity: config.capacity || 10
    };

    const response = await fetch(`${API_BASE}/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(backendConfig),
    });

    if (!response.ok) {
      console.error('Failed to configure:', await response.text());
    }
  } catch (e) {
    console.error('Failed to sync config', e);
  }
};

const sendRequest = async (clientId) => {
  try {
    const res = await fetch(`${API_BASE}/request?clientId=${clientId}`, { method: 'POST' });
    const data = await res.json();

    if (res.status === 429 || !data.allowed) {
      return { status: 'BLOCK', data };
    }
    return { status: 'ALLOW', data };
  } catch (e) {
    console.error('Request failed:', e);
    return { status: 'BLOCK' };
  }
};

const fetchMetrics = async () => {
  try {
    const res = await fetch(`${API_BASE}/metrics`);
    const data = await res.json();
    return {
      allowed: data.allowedRequests || 0,
      blocked: data.blockedRequests || 0,
      total: (data.allowedRequests || 0) + (data.blockedRequests || 0),
    };
  } catch (e) {
    console.error('Failed to fetch metrics:', e);
    return null;
  }
};

// --- Sidebar Component ---
const Sidebar = ({ activeAlgo, onSelect }) => {
  const menuItems = [
    { type: AlgorithmType.TOKEN_BUCKET, icon: <Layers size={20} />, label: 'Token Bucket' },
    { type: AlgorithmType.LEAKY_BUCKET, icon: <Activity size={20} />, label: 'Leaky Bucket' },
    { type: AlgorithmType.FIXED_WINDOW, icon: <LayoutGrid size={20} />, label: 'Fixed Window' },
    { type: AlgorithmType.SLIDING_WINDOW, icon: <RefreshCw size={20} />, label: 'Sliding Window' },
  ];

  return (
    <div className="w-64 border-r border-slate-800 flex flex-col bg-slate-950">
      <div className="p-8 flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Activity className="text-white" size={24} />
        </div>
        <span className="text-lg font-bold tracking-tight text-white">RateLimit.io</span>
      </div>

      <nav className="flex-1 px-4 py-4 flex flex-col gap-2">
        <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Algorithms</p>
        {menuItems.map((item) => (
          <button
            key={item.type}
            onClick={() => onSelect(item.type)}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group ${
              activeAlgo === item.type
              ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-inner'
              : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            <span className={`${activeAlgo === item.type ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'}`}>
              {item.icon}
            </span>
            <span className="font-semibold text-sm">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-6 flex flex-col gap-6">
        <AlgorithmDescription activeAlgo={activeAlgo} />
        <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
           <p className="text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Status</p>
           <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
              <span className="text-xs text-slate-300">Simulator Running</span>
           </div>
        </div>
      </div>
    </div>
  );
};

const AlgorithmDescription = ({ activeAlgo }) => {
  const meta = ALGO_METADATA[activeAlgo];

  return (
    <div className="mt-4 p-4 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-md text-white flex flex-col gap-2">
      <h4 className="font-bold text-indigo-400 text-sm flex items-center gap-2">
        {meta.title}
        <span className="text-[10px] font-mono bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">
          Algorithm
        </span>
      </h4>
      <p className="text-xs text-slate-300 leading-snug">
        {meta.description}
      </p>
    </div>
  );
};

// --- Header Component ---
const ALGO_METADATA = {
  [AlgorithmType.FIXED_WINDOW]: {
    title: 'Fixed Window',
    description: 'Resets request count at fixed time intervals (e.g., every 60 seconds). Simple but susceptible to traffic bursts at window boundaries.'
  },
  [AlgorithmType.TOKEN_BUCKET]: {
    title: 'Token Bucket',
    description: 'Tokens are added at a fixed rate. Each request consumes a token. Allows bursts up to the bucket capacity.'
  },
  [AlgorithmType.LEAKY_BUCKET]: {
    title: 'Leaky Bucket',
    description:
      'Requests enter a bucket that leaks at a constant rate. Smooths bursts by enforcing steady outflow.'
  },
  [AlgorithmType.SLIDING_WINDOW]: {
    title: 'Sliding Window Log',
    description: 'Calculates requests within a rolling window of the last N seconds. Most accurate but computationally more intensive.'
  }
};

const Header = ({ activeAlgo, currentTime }) => {
  const meta = ALGO_METADATA[activeAlgo];
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="h-20 px-8 border-b border-slate-800 flex items-center justify-between bg-slate-950/50 backdrop-blur-md z-10">
      <div className="flex flex-col">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          {meta.title}
          <span className="text-[10px] font-mono bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/30">ALGORITHM</span>
        </h1>
      </div>
      <div className="hidden md:flex items-center gap-4 text-xs font-medium">
         <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
           <span className="text-slate-500">System Time:</span>
           <span className="text-white font-mono">
             {mounted ? new Date(currentTime).toLocaleTimeString() : '--:--:--'}
           </span>
         </div>
      </div>
    </header>
  );
};

// --- Dashboard Component ---
const Dashboard = ({ stats }) => {
  const successRate = stats.total > 0 ? (stats.allowed / stats.total) * 100 : 0;

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-slate-900/50 rounded-3xl border border-slate-800 p-5 flex flex-col gap-2">
         <div className="flex items-center justify-between">
           <span className="text-emerald-400"><CheckCircle2 size={24} /></span>
           <span className="text-2xl font-black text-white">{stats.allowed}</span>
         </div>
         <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Allowed</p>
      </div>

      <div className="bg-slate-900/50 rounded-3xl border border-slate-800 p-5 flex flex-col gap-2">
         <div className="flex items-center justify-between">
           <span className="text-rose-400"><XCircle size={24} /></span>
           <span className="text-2xl font-black text-white">{stats.blocked}</span>
         </div>
         <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Blocked</p>
      </div>


    </div>
  );
};

// --- Visualizer Component ---
const Visualizer = ({ algorithm, history, currentTime, config, tokens, waterLevel, fixedWindowStart, fixedWindowHistory }) => {
  const DISPLAY_MS = 10000;
  const [lastBlockedId, setLastBlockedId] = useState(null);

  const [animatedWaterLevel, setAnimatedWaterLevel] = useState(waterLevel);

  const filteredHistory = useMemo(() => {
    const start = currentTime - DISPLAY_MS;
    return history.filter(r => r.algorithm === algorithm && r.timestamp >= start);
  }, [history, algorithm, currentTime, DISPLAY_MS]);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const latest = history[0];
    if (latest && latest.status === 'BLOCK' && latest.algorithm === algorithm) {
      setLastBlockedId(latest.id);
      const timer = setTimeout(() => setLastBlockedId(null), 400);
      return () => clearTimeout(timer);
    }
  }, [history, algorithm]);

useEffect(() => {
  if (algorithm !== AlgorithmType.LEAKY_BUCKET) return;

  setAnimatedWaterLevel(prev =>
    waterLevel > prev ? waterLevel : prev
  );
}, [waterLevel, algorithm]);


  useEffect(() => {
    if (algorithm !== AlgorithmType.LEAKY_BUCKET) return;

    let rafId;
    let lastTime = performance.now();

    const leakRatePerSec = config.refillRate || 1;

    const animate = (now) => {
      const deltaMs = now - lastTime;
      lastTime = now;

      const leaked = (deltaMs / 1000) * leakRatePerSec;

      setAnimatedWaterLevel(prev => {
        const next = prev - leaked;
        return next > 0 ? next : 0;
      });

      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(rafId);
  }, [algorithm, config.refillRate]);

  if (!mounted) {
    return (
      <div className="w-full h-full flex items-center justify-center text-slate-600 text-sm">
        Initializing visualizer…
      </div>
    );
  }


  // Leaky Bucket View
  if (algorithm === AlgorithmType.LEAKY_BUCKET) {
    const cap = config.capacity || 10;
    const fillPct = Math.min(100, (animatedWaterLevel / cap) * 100);

    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-gradient-to-b from-transparent to-slate-900/20 relative">
        <div className={`absolute inset-0 pointer-events-none transition-all duration-300 z-0 ${lastBlockedId ? 'bg-rose-500/15' : 'bg-transparent'}`} />

        <div className="relative w-48 h-64 z-10">
          {/* Bucket */}
          <div className={`relative w-full h-full border-4 transition-all duration-200 ${
            lastBlockedId ? 'border-rose-500 scale-105' : 'border-slate-700'
          } rounded-b-[4rem] rounded-t-lg bg-slate-800/10 overflow-hidden`}>

            {/* Water */}
            <div
              className="absolute bottom-0 left-0 w-full bg-blue-500/40 transition-all duration-300 ease-linear"
              style={{ height: `${fillPct}%` }}
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-blue-400/60 animate-pulse" />
            </div>

            {/* Overflow */}
            {lastBlockedId && (
              <div className="absolute top-0 left-0 w-full h-4 bg-rose-500/40 animate-pulse" />
            )}
          </div>

          {/* Leak */}
          <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
            <div className={`w-1 h-12 bg-blue-400/40 rounded-full ${
              animatedWaterLevel > 0.1 ? 'opacity-100' : 'opacity-0'
            } transition-opacity`} />
            <div className="flex gap-1">
              {waterLevel > 0 &&
                [1, 2, 3].map(i => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                ))}
            </div>
          </div>

          {/* Overflow label */}
          <div className={`absolute -top-10 left-1/2 -translate-x-1/2 transition-all duration-300 ${
            lastBlockedId ? 'opacity-100 scale-110' : 'opacity-0 scale-50'
          }`}>
            <span className="bg-rose-500 text-white text-[9px] font-black px-3 py-1 rounded-full shadow-lg">
              OVERFLOW
            </span>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center z-10">
          <span className={`text-4xl font-black tabular-nums ${
            lastBlockedId ? 'text-rose-400' : 'text-blue-400'
          }`}>
            {Math.ceil(animatedWaterLevel)}/{cap}
          </span>
          <span className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">
            Bucket Fill Level
          </span>
        </div>
      </div>
    );
  }

  // Token Bucket View
  if (algorithm === AlgorithmType.TOKEN_BUCKET) {
    const maxCapacity = config.capacity || 10;
    const percentage = (tokens / maxCapacity) * 100;

    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-gradient-to-b from-transparent to-slate-900/20 relative">
        <div
          className={`absolute inset-0 pointer-events-none transition-opacity duration-300 z-0 ${
            lastBlockedId ? 'bg-rose-500/10' : 'bg-transparent'
          }`}
        />

        <div className="relative w-48 h-64 border-4 border-slate-700 rounded-b-3xl rounded-t-lg bg-slate-800/20 overflow-hidden shadow-2xl z-10">
          <div
            className={`absolute top-4 left-1/2 -translate-x-1/2 transition-all duration-300 ${
              lastBlockedId ? 'opacity-100 scale-125' : 'opacity-0 scale-50'
            }`}
          >
            <div className="bg-rose-500 text-white text-[10px] font-black px-2 py-1 rounded-full shadow-lg shadow-rose-500/50">
              BLOCKED
            </div>
          </div>

          <div
            className="absolute bottom-0 left-0 w-full bg-indigo-500/40 transition-all duration-700 ease-in-out"
            style={{ height: `${percentage}%` }}
          >
             <div className="absolute top-0 left-0 w-full h-2 bg-indigo-400/60 animate-pulse"></div>
          </div>

          <div className="absolute inset-0 p-4 grid grid-cols-4 gap-2 content-end">
            {Array.from({ length: Math.floor(tokens) }).map((_, i) => (
              <div
                key={i}
                className="w-6 h-6 bg-indigo-400 rounded-full shadow-lg shadow-indigo-500/50 border border-white/20"
              ></div>
            ))}
          </div>

          <div className="absolute right-2 top-0 bottom-0 flex flex-col justify-between py-4 text-[10px] text-slate-500 font-mono">
             <span>{maxCapacity}</span>
             <span>{Math.floor(maxCapacity/2)}</span>
             <span>0</span>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center z-10">
           <span className={`text-4xl font-black transition-colors duration-300 ${lastBlockedId ? 'text-rose-400' : 'text-white'}`}>
            {tokens.toFixed(0)}
           </span>
           <span className="text-slate-500 text-sm font-bold uppercase tracking-widest">Available Tokens</span>
        </div>
      </div>
    );
  }

// Timeline View (Fixed & Sliding)
const windowSize = config.windowSizeMs;
const isFixed = algorithm === AlgorithmType.FIXED_WINDOW;


return (
  <div className="w-full h-full p-8 flex flex-col justify-center">
    <div className="relative h-48 w-full border-y border-slate-800 bg-slate-900/40 rounded-xl overflow-hidden">

      {/* Time grid */}
      {Array.from({ length: 11 }).map((_, i) => (
        <div
          key={i}
          className="absolute top-0 bottom-0 w-px bg-slate-800/50"
          style={{ right: `${(i / 10) * 100}%` }}
        >
          <span className="absolute -top-6 left-0 -translate-x-1/2 text-[10px] font-mono text-slate-600">
            -{i}s
          </span>
        </div>
      ))}

      {/* NOW marker */}
      <div className="absolute top-0 bottom-0 right-0 w-1 bg-indigo-500/50 z-30 shadow-[0_0_15px_rgba(99,102,241,0.5)]">
        <div className="absolute -bottom-6 right-0 translate-x-1/2 text-[10px] font-bold text-indigo-400 uppercase tracking-tighter">
          Now
        </div>
      </div>

      <div className="absolute inset-0 z-10 transition-all duration-100 linear">
        {isFixed ? (
          <>

            {/* ALL FIXED WINDOWS */}
            {[...(fixedWindowHistory || []), ...(fixedWindowStart !== null ? [fixedWindowStart] : [])].map((winStart, index, arr) => {
              if (winStart === null) return null;

              const elapsed = currentTime - winStart;
              const remaining = Math.max(0, windowSize - elapsed);

              const right = ((currentTime - (winStart + windowSize)) / DISPLAY_MS) * 100;
              const width = (windowSize / DISPLAY_MS) * 100;

              if (right > 110) return null; // allow natural scroll-out

              return (
                <div
                  key={winStart + '-' + index}
                  className={`absolute top-2 bottom-2 rounded-lg border p-2 ${
                    index === arr.length - 1
                      ? 'bg-indigo-500/20 border-indigo-400 shadow-lg shadow-indigo-500/30' // neon current
                      : 'bg-slate-800/30 border-slate-600/40' // previous windows
                  }`}
                  style={{ right: `${right}%`, width: `${width}%` }}
                >
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-tighter">
                    Window
                  </span>
                  {remaining > 0 && index === arr.length - 1 && (
                    <div className="absolute bottom-2 right-2 text-[10px] text-slate-500">
                      remaining ~ {Math.ceil(remaining / 1000)}s
                    </div>
                  )}
                </div>
              );
            })}
          </>
        ) : (
          <>
            {/* MOVING BACKGROUND WINDOWS (Sliding) */}
            {mounted && (() => {
              const windows = [];
              const offset = currentTime % windowSize;
              const start = currentTime - DISPLAY_MS - offset;

              for (let t = start; t < currentTime + windowSize; t += windowSize) {
                const right = ((currentTime - (t + windowSize)) / DISPLAY_MS) * 100;
                const width = (windowSize / DISPLAY_MS) * 100;

                if (right > 100 || right + width < 0) continue;

                windows.push(
                  <div
                    key={t}
                    className="absolute top-2 bottom-2 bg-slate-800/15 rounded-lg border border-slate-700/20 p-2"
                    style={{ right: `${right}%`, width: `${width}%` }}
                  >
                    <span className="absolute top-2 text-[10px] font-mono text-slate-600 uppercase tracking-tighter">
                      Window
                    </span>
                  </div>
                );
              }
              return windows;
            })()}

            {/* ACTIVE SLIDING WINDOW */}
            <div
              className="absolute top-2 bottom-2 border-2 border-dashed border-indigo-500/40 bg-indigo-500/5 rounded-xl flex items-start p-2"
              style={{ right: 0, width: `${(windowSize / DISPLAY_MS) * 100}%` }}
            >
              <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-tighter">
                Window
              </span>
            </div>
          </>
        )}
      </div>

      {/* REQUEST DOTS */}
      <div className="absolute inset-0 z-20">
        {filteredHistory.map(req => {
          const rightPos =
            ((currentTime - req.timestamp) / DISPLAY_MS) * 100;

          return (
            <div
              key={req.id}
              className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 shadow-lg transition-transform hover:scale-150 ${
                req.status === 'ALLOW'
                  ? 'bg-emerald-500 border-emerald-300 shadow-emerald-500/40'
                  : 'bg-rose-500 border-rose-300 shadow-rose-500/40'
              }`}
              style={{
                right: `${rightPos}%`,
                transform: 'translate(50%, -50%)'
              }}

            >
              {/* BLOCKED RED LINE */}
              {req.status === 'BLOCK' && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 h-12 w-px bg-rose-500/60 mt-1"></div>
              )}

              {/* Ping animation for new requests */}
              {currentTime - req.timestamp < 100 && (
                <div
                  className={`absolute inset-0 rounded-full animate-ping opacity-75 ${
                    req.status === 'ALLOW' ? 'bg-emerald-400' : 'bg-rose-400'
                  }`}
                ></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  </div>
);


};

// --- Controls Component ---
const Controls = ({ config, setConfig, onSend, onReset, autoSend, setAutoSend, algorithm }) => {
  return (
    <div className="h-full bg-slate-900/50 rounded-3xl border border-slate-800 backdrop-blur-sm p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-slate-300 font-bold flex items-center gap-2">
          <Settings2 size={18} className="text-indigo-400" />
          Configuration & Actions
        </h3>
        <div className="flex gap-2">
           <button
             onClick={onReset}
             className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-all"
             title="Reset Simulation"
           >
             <Trash2 size={18} />
           </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Limit (Req/Window)</label>
          <input
            type="number"
            value={config.limit}
            onChange={(e) => setConfig({ ...config, limit: parseInt(e.target.value) || 1 })}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>

        {algorithm !== AlgorithmType.TOKEN_BUCKET ? (
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Window (ms)</label>
            <input
              type="number"
              step="500"
              value={config.windowSizeMs}
              onChange={(e) => setConfig({ ...config, windowSizeMs: parseInt(e.target.value) || 1000 })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>
        ) : (
          <>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Refill Rate (Tokens/s)</label>
              <input
                type="number"
                value={config.refillRate}
                onChange={(e) => setConfig({ ...config, refillRate: parseInt(e.target.value) || 1 })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Capacity</label>
              <input
                type="number"
                value={config.capacity}
                onChange={(e) => setConfig({ ...config, capacity: parseInt(e.target.value) || 1 })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
          </>
        )}

        <div className="flex items-end gap-2 col-span-2">
          <button
            onClick={() => onSend(1)}
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-10 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
          >
            <Send size={18} />
            Hit
          </button>

          <button
            onClick={() => onSend(10)}
            className="flex-1 bg-slate-800 hover:bg-slate-700 text-indigo-400 font-bold h-10 rounded-xl flex items-center justify-center gap-2 border border-slate-700 active:scale-95 transition-all"
          >
            <Zap size={18} />
            Burst (10x)
          </button>

          <button
            onClick={() => setAutoSend(!autoSend)}
            className={`flex-1 h-10 rounded-xl flex items-center justify-center gap-2 font-bold transition-all border ${
              autoSend
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            {autoSend ? <Pause size={18} /> : <Play size={18} />}
            {autoSend ? 'Auto: ON' : 'Auto: OFF'}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- LogPanel Component ---
const LogPanel = ({ history }) => {
  if (history.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 opacity-20 select-none">
        <div className="w-16 h-16 border-2 border-dashed border-slate-600 rounded-full mb-4"></div>
        <p className="text-sm font-semibold uppercase tracking-widest">Waiting for traffic...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-2">
      <div className="flex flex-col gap-1.5">
        {history.map((req) => (
          <div
            key={req.id}
            className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
              req.status === 'ALLOW'
              ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-100'
              : 'bg-rose-500/5 border-rose-500/10 text-rose-100'
            }`}
          >
            <div className={`w-2 h-2 rounded-full shrink-0 ${req.status === 'ALLOW' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
            <div className="flex-1 flex flex-col min-w-0">
               <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono tracking-tight truncate">
                    {req.status === 'ALLOW' ? '200 OK' : '429 TOO MANY REQUESTS'}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    {new Date(req.timestamp).toLocaleTimeString()}
                  </span>
               </div>
               <p className="text-[10px] text-slate-500 font-mono truncate uppercase">
                 Req-ID: {req.id.split('-')[0]}
               </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Main App Component ---
export default function App() {
  const [activeAlgo, setActiveAlgo] = useState(AlgorithmType.SLIDING_WINDOW);
  const [config, setConfig] = useState({
    limit: 5,
    windowSizeMs: 5000,
    refillRate: 1,
    capacity: 10,
  });
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({ allowed: 0, blocked: 0, total: 0 });
  const [autoSend, setAutoSend] = useState(false);
  const [tokens, setTokens] = useState(10);
  const [waterLevel, setWaterLevel] = useState(0);

  const [fixedWindowStart, setFixedWindowStart] = useState(null);
  const [fixedWindowHistory, setFixedWindowHistory] = useState([]);

  const lastRefillRef = useRef(Date.now());
  const timerRef = useRef(null);

  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    setCurrentTime(Date.now());
  }, []);

  // Sync config with backend
  useEffect(() => {
    fetchConfig(config, activeAlgo);
  }, [config, activeAlgo]);

  // Poll metrics
  useEffect(() => {
    const interval = setInterval(async () => {
      const newStats = await fetchMetrics();
      if (newStats) setStats(newStats);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Animation loop
  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      setCurrentTime(now);

      if (activeAlgo === AlgorithmType.TOKEN_BUCKET && config.refillRate) {
        const delta = (now - lastRefillRef.current) / 1000;
        if (delta > 0) {
          setTokens((prev) =>
            Math.min(config.capacity || 10, prev + delta * config.refillRate)
          );
          lastRefillRef.current = now;
        }
      }

      timerRef.current = requestAnimationFrame(tick);
    };

    timerRef.current = requestAnimationFrame(tick);
    return () => {
      if (timerRef.current) cancelAnimationFrame(timerRef.current);
    };
  }, [activeAlgo, config.refillRate, config.capacity]);

  const handleRequest = useCallback(
    async (count = 1) => {
      for (let i = 0; i < count; i++) {
        const now = Date.now();

        // 🔑 FIXED WINDOW CREATION RULE
        if (activeAlgo === AlgorithmType.FIXED_WINDOW) {
          if (
            fixedWindowStart === null ||
            now - fixedWindowStart >= config.windowSizeMs
          ) {
            if (fixedWindowStart !== null) {
              setFixedWindowHistory(prev => [...prev, fixedWindowStart]);
            }
            setFixedWindowStart(now);
          }
        }

        const result = await sendRequest('client-1');

        if (
          activeAlgo === AlgorithmType.LEAKY_BUCKET &&
          result?.data?.metadata
        ) {
          setWaterLevel(result.data.metadata.currentSize);
        }

        const record = {
          id: crypto.randomUUID(),
          timestamp: now,
          status: result.status,
          algorithm: activeAlgo,
        };

        setHistory((prev) => [record, ...prev].slice(0, 200));

        if (
          activeAlgo === AlgorithmType.TOKEN_BUCKET &&
          result.status === 'ALLOW'
        ) {
          setTokens((prev) => Math.max(0, prev - 1));
        }
      }
    },
    [activeAlgo, fixedWindowStart, config.windowSizeMs]
  );


  const resetEngine = () => {
    setHistory([]);
    setTokens(config.capacity || 10);
    setWaterLevel(0);
    setFixedWindowStart(null);
    lastRefillRef.current = Date.now();
  };

  useEffect(() => {
    let interval;
    if (autoSend) interval = setInterval(() => handleRequest(1), 800);
    return () => clearInterval(interval);
  }, [autoSend, handleRequest]);

  return (
    <div className="flex h-screen w-full bg-slate-950 overflow-hidden font-sans selection:bg-indigo-500/30">
      <Sidebar activeAlgo={activeAlgo} onSelect={setActiveAlgo} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header activeAlgo={activeAlgo} currentTime={currentTime} />

        <main className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden">

          <div className="lg:col-span-8 flex flex-col gap-6 overflow-hidden">
            <div className="flex-1 bg-slate-900/50 rounded-3xl border border-slate-800 backdrop-blur-sm relative overflow-hidden flex flex-col">
              <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/40">
                <span className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Real-time Visualization</span>
                <div className="flex items-center gap-3">
                   <div className="flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                     <span className="text-xs text-emerald-400 font-medium uppercase">Active</span>
                   </div>
                </div>
              </div>
              <div className="flex-1 relative overflow-hidden">
                <Visualizer
                  algorithm={activeAlgo}
                  history={history}
                  currentTime={currentTime}
                  config={config}
                  tokens={tokens}
                  waterLevel={waterLevel}
                  fixedWindowStart={fixedWindowStart}
                  fixedWindowHistory={fixedWindowHistory}
                />

              </div>
            </div>

            <div className="h-48">
              <Controls
                config={config}
                setConfig={setConfig}
                onSend={handleRequest}
                onReset={resetEngine}
                autoSend={autoSend}
                setAutoSend={setAutoSend}
                algorithm={activeAlgo}
              />
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-6 overflow-hidden">
            <Dashboard stats={stats} />
            <div className="flex-1 bg-slate-900/50 rounded-3xl border border-slate-800 backdrop-blur-sm overflow-hidden flex flex-col">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <h3 className="font-semibold text-slate-300">Request Logs</h3>
                <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded-full">{history.length} events</span>
              </div>
              <LogPanel history={history} />
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
