import React, { useState, useEffect, useRef } from 'react';
import { ProtocolStep, CyclerStatus, CyclerHardwarePreset } from '../../types/pcr';
import { 
  Play, 
  Pause, 
  Square, 
  FastForward, 
  RotateCcw, 
  Thermometer, 
  Flame, 
  Activity, 
  Clock, 
  Layers,
  ChevronRight,
  TrendingUp,
  Grid
} from 'lucide-react';

interface SimulationViewProps {
  steps: ProtocolStep[];
  status: CyclerStatus;
  currentBlockTemp: number;
  targetTemp: number;
  currentCycle: number;
  totalCycles: number;
  currentStepIndex: number;
  stepRemainingSeconds: number;
  elapsedSeconds: number;
  totalEstimatedSeconds: number;
  speedMultiplier: number;
  fluorescenceRfu: number;
  amplifiedCopies: number;
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
  onStepForward: () => void;
  onChangeSpeed: (speed: number) => void;
  hardwarePreset: CyclerHardwarePreset;
}

export const SimulationView: React.FC<SimulationViewProps> = ({
  steps,
  status,
  currentBlockTemp,
  targetTemp,
  currentCycle,
  totalCycles,
  currentStepIndex,
  stepRemainingSeconds,
  elapsedSeconds,
  totalEstimatedSeconds,
  speedMultiplier,
  fluorescenceRfu,
  amplifiedCopies,
  onStart,
  onPause,
  onStop,
  onStepForward,
  onChangeSpeed,
  hardwarePreset,
}) => {
  const currentStep = steps[currentStepIndex] || steps[0];

  // Calculate progress percentages
  const progressPercent = totalEstimatedSeconds > 0 
    ? Math.min(100, Math.floor((elapsedSeconds / totalEstimatedSeconds) * 100))
    : 0;

  const remainingSeconds = Math.max(0, totalEstimatedSeconds - elapsedSeconds);
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getStatusColor = () => {
    switch (status) {
      case 'RUNNING': return 'bg-emerald-500 text-emerald-400 border-emerald-500/40 ring-4 ring-emerald-500/20';
      case 'PAUSED': return 'bg-amber-500 text-amber-400 border-amber-500/40 ring-4 ring-amber-500/20';
      case 'COMPLETED': return 'bg-blue-500 text-blue-400 border-blue-500/40';
      case 'ERROR': return 'bg-rose-500 text-rose-400 border-rose-500/40';
      case 'PROGRAMMED': return 'bg-cyan-500 text-cyan-400 border-cyan-500/40';
      default: return 'bg-slate-500 text-slate-400 border-slate-700';
    }
  };

  // Mini 8x12 96-well block simulation
  const wellRows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const wellCols = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  // Temperature color interpolation for wells
  const getWellColor = () => {
    if (status === 'IDLE') return 'bg-slate-800 border-slate-700';
    if (currentBlockTemp >= 90) return 'bg-rose-500/70 border-rose-400';
    if (currentBlockTemp >= 70) return 'bg-amber-500/70 border-amber-400';
    if (currentBlockTemp >= 50) return 'bg-cyan-500/60 border-cyan-400';
    return 'bg-blue-600/70 border-blue-400';
  };

  return (
    <div className="space-y-6">
      {/* Laboratory Instrument Frame */}
      <div className="bg-slate-900 border-2 border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden p-6 relative">
        {/* Chassis Brand Plate */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-3.5 h-3.5 rounded-full bg-cyan-400 shadow-[0_0_10px_#06B6D4]" />
            <div>
              <div className="text-xs uppercase tracking-widest font-mono text-slate-400">
                Instrumento de Laboratorio
              </div>
              <h1 className="text-lg font-bold text-slate-100 tracking-tight">
                Simulador de Termociclador
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-slate-400">Estado:</span>
            <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-slate-950 border border-slate-800 font-mono text-xs font-bold">
              <span className={`w-2.5 h-2.5 rounded-full ${getStatusColor()}`} />
              <span className={status === 'RUNNING' ? 'text-emerald-400 animate-pulse' : 'text-slate-200'}>
                {status}
              </span>
            </div>
          </div>
        </div>

        {/* Central Display Console (Digital LCD Glass Area) */}
        <div className="mt-6 p-6 bg-slate-950 border border-slate-800 rounded-xl relative shadow-inner">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Primary Large Digital Temperature Indicator (Required in Prompt) */}
            <div className="md:col-span-5 text-center md:text-left md:border-r md:border-slate-800/80 md:pr-6">
              <div className="text-xs uppercase font-mono tracking-wider text-slate-400 mb-1 flex items-center justify-center md:justify-start gap-1.5">
                <Thermometer className="w-4 h-4 text-cyan-400" />
                Temperatura del Bloque
              </div>

              {/* GIANT DISPLAY: 95.0 °C */}
              <div className="text-6xl sm:text-7xl font-mono font-bold text-cyan-400 tracking-tight tabular-nums select-none drop-shadow-[0_0_15px_rgba(6,182,212,0.25)]">
                {currentBlockTemp.toFixed(1)}
                <span className="text-3xl text-cyan-500/70 font-sans ml-2">°C</span>
              </div>

              {/* Sub-readout: Target temp & Lid temp */}
              <div className="mt-4 pt-3 border-t border-slate-900 grid grid-cols-2 gap-3 text-xs font-mono">
                <div>
                  <span className="text-slate-400 block text-[11px]">Temperatura objetivo</span>
                  <span className="text-slate-200 font-semibold text-sm tabular-nums">
                    {targetTemp.toFixed(1)} °C
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Tapa calefactada</span>
                  <span className="text-rose-400 font-semibold text-sm tabular-nums">
                    {hardwarePreset.lidTemp.toFixed(1)} °C
                  </span>
                </div>
              </div>
            </div>

            {/* Progress & Time Center Columns (7 cols) */}
            <div className="md:col-span-7 space-y-4">
              {/* Cycle & Step indicators (Required in Prompt) */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-lg">
                  <div className="text-[11px] font-mono text-slate-400">Ciclo de Reacción</div>
                  <div className="text-xl font-mono font-bold text-slate-100 mt-1 tabular-nums">
                    Ciclo {currentCycle} <span className="text-slate-500 font-normal text-sm">/ {totalCycles}</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-lg">
                  <div className="text-[11px] font-mono text-slate-400">Paso en Ejecución</div>
                  <div className="text-xl font-mono font-bold text-slate-100 mt-1 truncate">
                    Paso {currentStep?.order || 1} <span className="text-slate-500 font-normal text-sm">/ {steps.length}</span>
                  </div>
                  <div className="text-[11px] text-cyan-400 capitalize mt-0.5 truncate">
                    {currentStep?.type?.replace('_', ' ') || 'Esperando inicio'}
                  </div>
                </div>
              </div>

              {/* Progress Bar (Required in Prompt: ████████ 54%) */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-1.5">
                  <span className="text-slate-400">Progreso Total del Protocolo</span>
                  <span className="font-bold text-cyan-400 tabular-nums">{progressPercent} %</span>
                </div>
                <div className="w-full h-3.5 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-300 shadow-[0_0_8px_#06B6D4]"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Time displays: Tiempo restante (00:21) | Duración total (42:15) */}
              <div className="grid grid-cols-3 gap-3 pt-2 text-xs font-mono">
                <div>
                  <span className="text-slate-400 block text-[11px]">Tiempo restante</span>
                  <span className="text-base font-bold text-slate-100 tabular-nums">
                    {formatTime(remainingSeconds)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Tiempo transcurrido</span>
                  <span className="text-base font-bold text-slate-300 tabular-nums">
                    {formatTime(elapsedSeconds)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Duración total</span>
                  <span className="text-base font-bold text-slate-400 tabular-nums">
                    {formatTime(totalEstimatedSeconds)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Physical Instrument Controls (Ejecutar, Pausar, Detener, Velocidades) */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800">
          {/* Main Action Buttons (Required in Prompt) */}
          <div className="flex items-center gap-2.5">
            {status === 'RUNNING' ? (
              <button
                onClick={onPause}
                className="px-5 py-2.5 text-xs font-semibold text-amber-300 bg-amber-950/80 hover:bg-amber-900/80 border border-amber-800/80 rounded-lg shadow-sm transition-all flex items-center gap-2"
              >
                <Pause className="w-4 h-4 fill-amber-300" />
                Pausar
              </button>
            ) : (
              <button
                onClick={onStart}
                disabled={steps.length === 0}
                className="px-5 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-all flex items-center gap-2"
              >
                <Play className="w-4 h-4 fill-white" />
                {status === 'PAUSED' ? 'Reanudar' : 'Ejecutar'}
              </button>
            )}

            <button
              onClick={onStop}
              disabled={status === 'IDLE' || status === 'COMPLETED'}
              className="px-4 py-2.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Square className="w-4 h-4 fill-current" />
              Detener
            </button>

            <button
              onClick={onStepForward}
              disabled={status !== 'RUNNING' && status !== 'PAUSED'}
              className="px-3.5 py-2.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Avanzar forzosamente al siguiente paso del protocolo"
            >
              <FastForward className="w-4 h-4" />
              Siguiente paso
            </button>
          </div>

          {/* Speed Selector (Required in Prompt: [1x] [2x] [5x] [10x] [100x]) */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              Velocidad:
            </span>
            <div className="inline-flex rounded-lg bg-slate-950 p-1 border border-slate-800">
              {[1, 2, 5, 10, 100].map((spd) => (
                <button
                  key={spd}
                  onClick={() => onChangeSpeed(spd)}
                  className={`px-2.5 py-1 text-xs font-mono font-medium rounded transition-colors tabular-nums ${
                    speedMultiplier === spd
                      ? 'bg-cyan-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Auxiliary Instrument Diagnostic Views: 96-well block & Amplification Curve */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 96-well Microplate Thermal Block Status */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
              <Grid className="w-4 h-4 text-cyan-400" />
              Bloque Térmico 96 Pocillos (Microplaca)
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              Rampa: {hardwarePreset.rampRateHeating} °C/s
            </span>
          </div>

          {/* Microplate grid */}
          <div className="mt-4 p-3 bg-slate-950 border border-slate-800 rounded-lg flex flex-col items-center justify-center">
            <div className="grid grid-cols-12 gap-1.5 w-full max-w-md">
              {Array.from({ length: 96 }).map((_, idx) => (
                <div
                  key={idx}
                  className={`aspect-square rounded-full border transition-colors duration-300 ${getWellColor()}`}
                  title={`Pocillo ${wellRows[Math.floor(idx / 12)]}${wellCols[idx % 12]}: ${currentBlockTemp.toFixed(1)} °C`}
                />
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between w-full max-w-md text-[10px] font-mono text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> 4°C Hold
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-cyan-500 inline-block" /> 60°C Anneal
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> 72°C Ext
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> 95°C Denat
              </span>
            </div>
          </div>
        </div>

        {/* Molecular Amplification & Fluorescence Curve */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Cinética Molecular y Amplificación
            </div>
            <span className="text-[11px] font-mono text-emerald-400 tabular-nums">
              {amplifiedCopies.toExponential(2)} copias
            </span>
          </div>

          <div className="mt-4 p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-3 font-mono text-xs">
            <div className="flex justify-between items-center py-1 border-b border-slate-900">
              <span className="text-slate-400">Copias teóricas (2^n):</span>
              <span className="text-slate-200 font-semibold tabular-nums">
                2^{currentCycle} ≈ {amplifiedCopies.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-900">
              <span className="text-slate-400">Fluorescencia (RFU):</span>
              <span className="text-cyan-400 font-semibold tabular-nums">
                {fluorescenceRfu.toFixed(1)} RFU
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">Fase de amplificación:</span>
              <span className="text-emerald-400 font-medium">
                {currentCycle < 10 
                  ? 'Fase de Base (Bajo umbral)' 
                  : currentCycle < 28 
                  ? 'Fase Exponencial Activa' 
                  : 'Fase Meseta (Plateau)'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
