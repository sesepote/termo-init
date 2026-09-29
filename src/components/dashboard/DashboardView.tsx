import React from 'react';
import { NavSection } from '../layout/Sidebar';
import { ProtocolStep, CyclerStatus } from '../../types/pcr';
import { 
  SlidersHorizontal, 
  GraduationCap, 
  PlaySquare, 
  BookOpen, 
  ArrowRight, 
  Clock, 
  Flame,
  Cpu,
  FlaskConical,
  History,
  Settings,
  Thermometer,
  Activity,
  Layers,
  ChevronRight
} from 'lucide-react';

interface DashboardViewProps {
  onNavigate: (section: NavSection) => void;
  status?: CyclerStatus;
  currentBlockTemp?: number;
  lidTemp?: number;
  elapsedSeconds?: number;
  totalDurationSec?: number;
  currentStep?: ProtocolStep;
  currentStepIndex?: number;
  totalSteps?: number;
  stepRemainingSeconds?: number;
  currentCycle?: number;
  totalCycles?: number;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  status = 'IDLE',
  currentBlockTemp = 25.0,
  lidTemp = 105.0,
  elapsedSeconds = 0,
  totalDurationSec = 0,
  currentStep,
  currentStepIndex = 0,
  totalSteps = 0,
  stepRemainingSeconds = 0,
  currentCycle = 1,
  totalCycles = 35,
}) => {
  const isRunning = status === 'RUNNING';
  const isPaused = status === 'PAUSED';
  const isActive = isRunning || isPaused;

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const remainingSeconds = Math.max(0, totalDurationSec - elapsedSeconds);

  const getStepDisplayName = (step?: ProtocolStep) => {
    if (!step) return 'En reposo';
    switch (step.type) {
      case 'inicial':
        return 'Predesnaturalización';
      case 'desnaturalizacion':
        return 'Desnaturalización';
      case 'annealing':
        return 'Hibridación (Annealing)';
      case 'extension':
        return 'Extensión Taq';
      case 'extension_final':
        return 'Extensión Final';
      case 'hold':
        return 'Conservación (Hold 4°C)';
      default:
        return ((step as any).type || 'Paso').replace('_', ' ');
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900/95 via-slate-950 to-slate-900 border-2 border-slate-800 shadow-2xl p-5 sm:p-8 w-full h-full flex flex-col justify-between">
      
      {/* Ambient background glow & orbital grid lines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b12_1px,transparent_1px),linear-gradient(to_bottom,#1e293b12_1px,transparent_1px)] bg-[size:28px_28px] pointer-events-none" />
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* SVG Orbit Tracks */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
        <defs>
          <linearGradient id="orbit-grad-home" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.4" />
          </linearGradient>
        </defs>
        <circle cx="50%" cy="50%" r="160" fill="none" stroke="url(#orbit-grad-home)" strokeWidth="1" strokeDasharray="4 6" />
        <circle cx="50%" cy="50%" r="240" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="3 8" opacity="0.5" />
        <line x1="50%" y1="6%" x2="50%" y2="94%" stroke="#1e293b" strokeWidth="1" strokeDasharray="2 4" />
        <line x1="6%" y1="50%" x2="94%" y2="50%" stroke="#1e293b" strokeWidth="1" strokeDasharray="2 4" />
      </svg>

      {/* ======================================================== */}
      {/* PARTE SUPERIOR: TELEMETRÍA TÉRMICA Y ESTADO DE EJECUCIÓN */}
      {/* ======================================================== */}
      <div className="relative z-10 pb-4 mb-2 border-b border-slate-800/90">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Temperaturas: Bloque actual y Tapa */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            {/* Bloque Actual */}
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-950/90 border border-slate-800 shadow-inner">
              <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-800/70 flex items-center justify-center text-cyan-400">
                <Thermometer className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block leading-tight">
                  Bloque Térmico
                </span>
                <span className="text-base sm:text-lg font-mono font-bold text-cyan-300 tabular-nums leading-none">
                  {currentBlockTemp.toFixed(1)} <span className="text-xs text-cyan-500 font-normal">°C</span>
                </span>
              </div>
            </div>

            {/* Tapa Calefactada */}
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-950/90 border border-slate-800 shadow-inner">
              <div className="w-8 h-8 rounded-lg bg-rose-950/80 border border-rose-800/70 flex items-center justify-center text-rose-400">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block leading-tight">
                  Tapa Térmica
                </span>
                <span className="text-base sm:text-lg font-mono font-bold text-rose-300 tabular-nums leading-none">
                  {lidTemp.toFixed(1)} <span className="text-xs text-rose-500 font-normal">°C</span>
                </span>
              </div>
            </div>

            {/* Estado General (solo si está activo) */}
            {isActive && (
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs font-mono">
                <span className={`w-2 h-2 rounded-full ${
                  isRunning ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'
                }`} />
                <span className="text-slate-400">Estado:</span>
                <span className={`font-bold ${
                  isRunning ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  {status === 'RUNNING' ? 'EN EJECUCIÓN' : 'EN PAUSA'}
                </span>
              </div>
            )}
          </div>

          {/* Panel de Carrera (si está en ejecución) */}
          {isActive ? (
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 p-2 rounded-xl bg-cyan-950/40 border border-cyan-800/50">
              {/* Fase actual */}
              <div className="px-3 py-1.5 rounded-lg bg-slate-950/80 border border-cyan-800/40">
                <span className="text-[10px] font-mono text-cyan-400 block uppercase leading-tight">
                  Fase en curso
                </span>
                <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                  {getStepDisplayName(currentStep)}
                  {totalSteps > 0 && (
                    <span className="text-slate-400 font-normal text-[11px]">
                      (Paso {currentStepIndex + 1}/{totalSteps} {currentStep?.inCycle ? `· C.${currentCycle}/${totalCycles}` : ''})
                    </span>
                  )}
                </span>
              </div>

              {/* Tiempo restante de fase */}
              <div className="px-3 py-1.5 rounded-lg bg-slate-950/80 border border-cyan-800/40">
                <span className="text-[10px] font-mono text-cyan-400 block uppercase leading-tight">
                  Restante de fase
                </span>
                <span className="text-xs font-mono font-bold text-amber-300 tabular-nums">
                  {stepRemainingSeconds} s
                </span>
              </div>

              {/* Tiempos totales: Lleva / Le queda */}
              <div className="px-3 py-1.5 rounded-lg bg-slate-950/80 border border-cyan-800/40">
                <span className="text-[10px] font-mono text-cyan-400 block uppercase leading-tight">
                  Lleva / Le queda
                </span>
                <span className="text-xs font-mono font-bold text-slate-200 tabular-nums flex items-center gap-1">
                  <Clock className="w-3 h-3 text-cyan-400" />
                  <span className="text-emerald-400">{formatTime(elapsedSeconds)}</span>
                  <span className="text-slate-600">/</span>
                  <span className="text-slate-400">{formatTime(remainingSeconds)}</span>
                </span>
              </div>

              {/* Botón rápido a monitor */}
              <button
                onClick={() => onNavigate('simulacion')}
                className="px-2.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-mono font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
                title="Ver simulación completa"
              >
                <span>Monitor</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          ) : null}

        </div>
      </div>

      {/* ======================================================== */}
      {/* CUERPO CENTRAL: CONSTELACIÓN DE ESFERAS FLOTANTES        */}
      {/* ======================================================== */}
      <div className="relative z-10 flex-1 flex items-center justify-center my-auto min-h-[360px] sm:min-h-[420px]">
          
          {/* ------------------------------------------------------ */}
          {/* ESFERA 0 (CENTRAL): TERMOCICLADOR REAL                 */}
          {/* ------------------------------------------------------ */}
          <div className="relative z-30 flex flex-col items-center">
            {/* Anillos de energía */}
            <div className="absolute -inset-4 sm:-inset-6 rounded-full border border-cyan-500/30 animate-pulse-ring pointer-events-none" />
            <div className="absolute -inset-8 sm:-inset-10 rounded-full border border-blue-500/20 animate-pulse pointer-events-none" />

            <button
              onClick={() => onNavigate('termociclador_real')}
              aria-label="Abrir Termociclador Real"
              className="group relative w-48 h-48 sm:w-60 sm:h-60 rounded-full sphere-3d-center flex flex-col items-center justify-center p-3 text-center transition-all duration-300 hover:scale-105 cursor-pointer focus:outline-none focus:ring-4 focus:ring-cyan-400/40"
            >
              {/* Reflejo 3D */}
              <div className="absolute top-2 left-6 w-24 h-12 sm:w-32 sm:h-16 bg-gradient-to-b from-white/40 to-transparent rounded-full -rotate-12 pointer-events-none" />

              {/* Icono del Chasis Instrumental */}
              <div className="relative mb-1 flex items-center justify-center">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-950/80 border border-cyan-400/80 shadow-lg flex items-center justify-center text-cyan-300 group-hover:scale-110 group-hover:border-cyan-300 transition-all">
                  <Cpu className="w-8 h-8 text-cyan-400 group-hover:text-cyan-200 transition-colors" />
                </div>
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-cyan-500 border-2 border-slate-900" />
                </span>
              </div>

              {/* Etiquetas */}
              <span className="px-2 py-0.5 text-[9px] sm:text-[10px] font-mono font-extrabold uppercase tracking-widest text-cyan-200 bg-cyan-950/90 border border-cyan-500/60 rounded-full mb-1">
                ★ TERMOCICLADOR REAL ★
              </span>
              <h3 className="text-base sm:text-lg font-black tracking-tight text-white drop-shadow-md leading-tight group-hover:text-cyan-100 transition-colors">
                THCY-1KS-001
              </h3>
              <p className="text-[10px] sm:text-[11px] font-mono text-cyan-200/90 font-medium max-w-[140px] sm:max-w-[160px] leading-tight mt-0.5">
                Consola Táctil y Chasis
              </p>

              {/* Botón de acceso */}
              <div className="mt-2.5 flex items-center gap-1.5 px-3.5 py-1 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/40 rounded-full text-[10px] sm:text-[11px] font-bold text-white shadow-md transition-all group-hover:bg-cyan-400 group-hover:text-slate-950">
                <span>Abrir consola</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>

            {/* Sub-cápsula de estado debajo de la esfera central */}
            <div className="mt-3 flex items-center gap-2 px-3 py-1 bg-slate-900/90 border border-slate-700/80 rounded-full shadow-lg text-[11px] font-mono text-slate-300">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>Bloque 96 pocillos</span>
              <span className="text-slate-600">|</span>
              <span className="text-amber-400">Peltier 3.0°C/s</span>
            </div>
          </div>

          {/* ------------------------------------------------------ */}
          {/* ESFERA 1 (NOROESTE): PROGRAMAR PCR                     */}
          {/* ------------------------------------------------------ */}
          <div className="absolute top-2 left-2 sm:top-6 sm:left-12 z-20 animate-float-gentle">
            <button
              onClick={() => onNavigate('programador')}
              className="group relative w-28 h-28 sm:w-36 sm:h-36 rounded-full sphere-3d-cyan flex flex-col items-center justify-center p-2 text-center transition-all duration-300 hover:scale-110 cursor-pointer focus:outline-none focus:ring-4 focus:ring-cyan-400/40"
            >
              <div className="absolute top-1.5 left-4 w-12 h-6 sm:w-16 sm:h-8 bg-gradient-to-b from-white/50 to-transparent rounded-full -rotate-12 pointer-events-none" />
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-slate-950/70 border border-cyan-300/60 flex items-center justify-center text-cyan-200 mb-1 group-hover:scale-110 transition-transform">
                <SlidersHorizontal className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-white tracking-tight leading-tight">
                Programar PCR
              </h4>
              <p className="text-[9px] sm:text-[10px] text-cyan-100 font-medium">
                Crear protocolo
              </p>
              <span className="mt-1 text-[8px] sm:text-[9px] font-mono px-2 py-0.5 bg-black/40 rounded-full text-cyan-200">
                Etapas y rampas
              </span>
            </button>
          </div>

          {/* ------------------------------------------------------ */}
          {/* ESFERA 2 (NORESTE): EJERCICIOS                         */}
          {/* ------------------------------------------------------ */}
          <div className="absolute top-2 right-2 sm:top-6 sm:right-12 z-20 animate-float-alt">
            <button
              onClick={() => onNavigate('ejercicios')}
              className="group relative w-28 h-28 sm:w-36 sm:h-36 rounded-full sphere-3d-blue flex flex-col items-center justify-center p-2 text-center transition-all duration-300 hover:scale-110 cursor-pointer focus:outline-none focus:ring-4 focus:ring-blue-400/40"
            >
              <div className="absolute top-1.5 left-4 w-12 h-6 sm:w-16 sm:h-8 bg-gradient-to-b from-white/50 to-transparent rounded-full -rotate-12 pointer-events-none" />
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-slate-950/70 border border-blue-300/60 flex items-center justify-center text-blue-200 mb-1 group-hover:scale-110 transition-transform">
                <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-white tracking-tight leading-tight">
                Ejercicios
              </h4>
              <p className="text-[9px] sm:text-[10px] text-blue-100 font-medium">
                Entrenamiento
              </p>
              <span className="mt-1 text-[8px] sm:text-[9px] font-mono px-2 py-0.5 bg-black/40 rounded-full text-blue-200">
                6 Modalidades
              </span>
            </button>
          </div>

          {/* ------------------------------------------------------ */}
          {/* ESFERA 3 (SUROESTE): SIMULACIÓN                        */}
          {/* ------------------------------------------------------ */}
          <div className="absolute bottom-2 left-2 sm:bottom-6 sm:left-12 z-20 animate-float-alt">
            <button
              onClick={() => onNavigate('simulacion')}
              className="group relative w-28 h-28 sm:w-36 sm:h-36 rounded-full sphere-3d-emerald flex flex-col items-center justify-center p-2 text-center transition-all duration-300 hover:scale-110 cursor-pointer focus:outline-none focus:ring-4 focus:ring-emerald-400/40"
            >
              <div className="absolute top-1.5 left-4 w-12 h-6 sm:w-16 sm:h-8 bg-gradient-to-b from-white/50 to-transparent rounded-full -rotate-12 pointer-events-none" />
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-slate-950/70 border border-emerald-300/60 flex items-center justify-center text-emerald-200 mb-1 group-hover:scale-110 transition-transform">
                <PlaySquare className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-white tracking-tight leading-tight">
                Simulación
              </h4>
              <p className="text-[9px] sm:text-[10px] text-emerald-100 font-medium">
                Tiempo real
              </p>
              <span className="mt-1 text-[8px] sm:text-[9px] font-mono px-2 py-0.5 bg-black/40 rounded-full text-emerald-200">
                qPCR y Curvas
              </span>
            </button>
          </div>

          {/* ------------------------------------------------------ */}
          {/* ESFERA 4 (SURESTE): CONOCIMIENTO                       */}
          {/* ------------------------------------------------------ */}
          <div className="absolute bottom-2 right-2 sm:bottom-6 sm:right-12 z-20 animate-float-gentle">
            <button
              onClick={() => onNavigate('conocimiento')}
              className="group relative w-28 h-28 sm:w-36 sm:h-36 rounded-full sphere-3d-amber flex flex-col items-center justify-center p-2 text-center transition-all duration-300 hover:scale-110 cursor-pointer focus:outline-none focus:ring-4 focus:ring-amber-400/40"
            >
              <div className="absolute top-1.5 left-4 w-12 h-6 sm:w-16 sm:h-8 bg-gradient-to-b from-white/50 to-transparent rounded-full -rotate-12 pointer-events-none" />
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-slate-950/70 border border-amber-300/60 flex items-center justify-center text-amber-200 mb-1 group-hover:scale-110 transition-transform">
                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-white tracking-tight leading-tight">
                Conocimiento
              </h4>
              <p className="text-[9px] sm:text-[10px] text-amber-100 font-medium">
                Bioinformática
              </p>
              <span className="mt-1 text-[8px] sm:text-[9px] font-mono px-2 py-0.5 bg-black/40 rounded-full text-amber-200">
                Primers y Enzimas
              </span>
            </button>
          </div>

        </div>

        {/* ======================================================== */}
        {/* PARTE INFERIOR (AL FONDO): OPCIONES RESTANTES DEL MENÚ   */}
        {/* ======================================================== */}
        <div className="relative z-10 mt-6 pt-5 border-t border-slate-800/90">
          <div className="flex items-center justify-between mb-3 text-[11px] font-mono uppercase tracking-wider text-slate-400">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              Opciones Adicionales del Sistema
            </span>
            <span className="text-slate-500 hidden sm:inline">
              Acceso a configuración, reactivos e histórico
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            
            {/* Opción 1: Nuevo ensayo (Reactivos y química) */}
            <button
              onClick={() => onNavigate('nuevo_ensayo')}
              className="group p-3.5 rounded-2xl bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/60 transition-all text-left flex items-center justify-between cursor-pointer shadow-sm hover:shadow-cyan-500/10"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-950/70 border border-cyan-800/60 flex items-center justify-center text-cyan-400 group-hover:scale-105 group-hover:border-cyan-400 transition-all">
                  <FlaskConical className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 transition-colors">
                    Nuevo Ensayo
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-tight">
                    Componentes, reactivos y química
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
            </button>

            {/* Opción 2: Historial (Ensayos y evaluaciones) */}
            <button
              onClick={() => onNavigate('historial')}
              className="group p-3.5 rounded-2xl bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-blue-500/60 transition-all text-left flex items-center justify-between cursor-pointer shadow-sm hover:shadow-blue-500/10"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-950/70 border border-blue-800/60 flex items-center justify-center text-blue-400 group-hover:scale-105 group-hover:border-blue-400 transition-all">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200 group-hover:text-blue-300 transition-colors">
                    Historial
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-tight">
                    Ensayos previos y evaluaciones
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
            </button>

            {/* Opción 3: Configuración (Hardware y parámetros) */}
            <button
              onClick={() => onNavigate('configuracion')}
              className="group p-3.5 rounded-2xl bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-purple-500/60 transition-all text-left flex items-center justify-between cursor-pointer shadow-sm hover:shadow-purple-500/10"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-950/70 border border-purple-800/60 flex items-center justify-center text-purple-400 group-hover:scale-105 group-hover:border-purple-400 transition-all">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200 group-hover:text-purple-300 transition-colors">
                    Configuración
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-tight">
                    Hardware, sensores y simulación
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
            </button>

          </div>
        </div>

      </div>
  );
};
