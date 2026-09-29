import React, { useState, useEffect, useMemo } from 'react';
import { ProtocolStep, CyclerStatus, CyclerHardwarePreset, AssayConfig } from '../../types/pcr';
import { NavSection } from '../layout/Sidebar';
import { 
  Play, 
  Pause, 
  Square, 
  FastForward, 
  Thermometer, 
  Flame, 
  Activity, 
  Clock, 
  Cpu, 
  Layers, 
  FileText,
  FolderOpen,
  Settings,
  Calculator,
  Sliders,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Volume2,
  VolumeX,
  Usb,
  Wifi,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  Plus,
  Trash2,
  Save,
  Download,
  Info,
  Beaker,
  Compass,
  Radio,
  Power
} from 'lucide-react';

interface RealCyclerConsoleProps {
  steps: ProtocolStep[];
  assay: AssayConfig;
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
  hardwarePreset: CyclerHardwarePreset;
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
  onStepForward: () => void;
  onChangeSpeed: (speed: number) => void;
  onOpenLid?: () => void;
  onNavigate?: (section: NavSection) => void;
}

// Certified preset protocols for the "File / Open" manager
interface StoredProtocol {
  id: string;
  name: string;
  folder: string;
  description: string;
  cycles: number;
  lidTemp: number;
  volumeUl: number;
  estTimeMin: number;
  steps: { name: string; temp: number; timeSec: number }[];
}

const DEFAULT_STORED_PROTOCOLS: StoredProtocol[] = [
  {
    id: 'sars_cov2',
    name: 'SARS-CoV-2_RT-qPCR.pcr',
    folder: 'Diagnóstico Viral',
    description: 'Protocolo de amplificación N1/N2 según CDC. RT previa y 45 ciclos.',
    cycles: 45,
    lidTemp: 105,
    volumeUl: 20,
    estTimeMin: 58,
    steps: [
      { name: 'Retrotranscripción', temp: 50, timeSec: 900 },
      { name: 'Activación Taq', temp: 95, timeSec: 120 },
      { name: 'Desnaturalización', temp: 95, timeSec: 15 },
      { name: 'Annealing / Ext.', temp: 55, timeSec: 30 },
      { name: 'Hold final', temp: 4, timeSec: 0 }
    ]
  },
  {
    id: 'snp_genotype',
    name: 'SNP_Genotyping_TaqMan.pcr',
    folder: 'Genética',
    description: 'Discriminación alélica con sondas TaqMan MGB.',
    cycles: 40,
    lidTemp: 105,
    volumeUl: 25,
    estTimeMin: 65,
    steps: [
      { name: 'Activación Enzimática', temp: 95, timeSec: 600 },
      { name: 'Desnaturalización', temp: 95, timeSec: 15 },
      { name: 'Annealing / Extensión', temp: 60, timeSec: 60 },
      { name: 'Hold final', temp: 4, timeSec: 0 }
    ]
  },
  {
    id: 'q5_cloning',
    name: 'Q5_HighFidelity_Cloning.pcr',
    folder: 'Biología Molecular',
    description: 'Amplificación de alta fidelidad para clonación en plásmidos (1.8 kb).',
    cycles: 30,
    lidTemp: 105,
    volumeUl: 50,
    estTimeMin: 42,
    steps: [
      { name: 'Predesnaturalización', temp: 98, timeSec: 30 },
      { name: 'Desnaturalización', temp: 98, timeSec: 10 },
      { name: 'Annealing Cebadores', temp: 62, timeSec: 20 },
      { name: 'Extensión Q5', temp: 72, timeSec: 60 },
      { name: 'Extensión Final', temp: 72, timeSec: 120 },
      { name: 'Hold final', temp: 4, timeSec: 0 }
    ]
  },
  {
    id: 'forensic_str',
    name: 'STR_Identifiler_Plus.pcr',
    folder: 'Forense',
    description: 'Perfil de repeticiones cortas en tándem para identificación genética.',
    cycles: 28,
    lidTemp: 105,
    volumeUl: 25,
    estTimeMin: 78,
    steps: [
      { name: 'Activación AmpliTaq Gold', temp: 95, timeSec: 660 },
      { name: 'Desnaturalización', temp: 94, timeSec: 60 },
      { name: 'Annealing STR', temp: 59, timeSec: 60 },
      { name: 'Extensión', temp: 72, timeSec: 60 },
      { name: 'Extensión Final', temp: 60, timeSec: 1800 },
      { name: 'Hold final', temp: 4, timeSec: 0 }
    ]
  },
  {
    id: 'bacterial_16s',
    name: '16S_rRNA_Universal.pcr',
    folder: 'Microbiología',
    description: 'Identificación taxonómica bacteriana con cebadores 27F y 1492R.',
    cycles: 35,
    lidTemp: 105,
    volumeUl: 25,
    estTimeMin: 52,
    steps: [
      { name: 'Lisis e inicio', temp: 95, timeSec: 300 },
      { name: 'Desnaturalización', temp: 95, timeSec: 30 },
      { name: 'Annealing 27F/1492R', temp: 54, timeSec: 40 },
      { name: 'Extensión', temp: 72, timeSec: 90 },
      { name: 'Extensión Final', temp: 72, timeSec: 300 },
      { name: 'Hold final', temp: 4, timeSec: 0 }
    ]
  }
];

export const RealCyclerConsole: React.FC<RealCyclerConsoleProps> = ({
  steps,
  assay,
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
  hardwarePreset,
  onStart,
  onPause,
  onStop,
  onStepForward,
  onChangeSpeed,
  onNavigate,
}) => {
  // Screen navigation state matching THCY-1KS-001 (TC1000-S) options
  const [activeScreen, setActiveScreen] = useState<'menu' | 'new' | 'file' | 'incubate' | 'gradient' | 'system' | 'tools' | 'run'>('menu');

  // If a simulation starts while in menu, automatically show the Run Monitor
  useEffect(() => {
    if (status === 'RUNNING' && activeScreen === 'menu') {
      setActiveScreen('run');
    }
  }, [status]);

  // Hardware state
  const [isLidOpen, setIsLidOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [usbConnected, setUsbConnected] = useState(true);
  const [controlMode, setControlMode] = useState<'block' | 'tube'>('tube');
  const [activeWell, setActiveWell] = useState<{ row: string; col: number }>({ row: 'D', col: 6 });
  const [runSubTab, setRunSubTab] = useState<'profile' | 'wells' | 'telemetry'>('profile');

  // Real-time clock for top bar
  const [timeString, setTimeString] = useState('11:42');
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  // 1. "INCUBATE" Feature State (One-Touch Fast Incubation)
  const [incubateTemp, setIncubateTemp] = useState<number>(37.0);
  const [incubateMinutes, setIncubateMinutes] = useState<number>(30);
  const [incubateLidOn, setIncubateLidOn] = useState<boolean>(true);
  const [incubateRunning, setIncubateRunning] = useState<boolean>(false);
  const [incubateRemainingSec, setIncubateRemainingSec] = useState<number>(1800);
  const [incubateCurrentTemp, setIncubateCurrentTemp] = useState<number>(24.5);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (incubateRunning && incubateRemainingSec > 0) {
      timer = setInterval(() => {
        setIncubateRemainingSec(prev => Math.max(0, prev - 1));
        // approach target temp smoothly
        setIncubateCurrentTemp(prev => {
          if (Math.abs(prev - incubateTemp) < 0.2) return incubateTemp;
          return prev < incubateTemp ? prev + 0.4 : prev - 0.4;
        });
      }, 1000 / (speedMultiplier > 5 ? 5 : 1));
    } else if (incubateRemainingSec === 0 && incubateRunning) {
      setIncubateRunning(false);
    }
    return () => clearInterval(timer);
  }, [incubateRunning, incubateRemainingSec, incubateTemp, speedMultiplier]);

  // 2. "GRADIENT" Feature State (12 columns: TC1000-G Model)
  const [gradientLowTemp, setGradientLowTemp] = useState<number>(50.0);
  const [gradientHighTemp, setGradientHighTemp] = useState<number>(62.0);

  // Calculates 12 column temperatures across the block
  const gradientColumns = useMemo(() => {
    const cols = [];
    const diff = gradientHighTemp - gradientLowTemp;
    for (let i = 0; i < 12; i++) {
      // realistic non-linear heat-sink profile
      const frac = i / 11;
      const t = gradientLowTemp + diff * (Math.pow(frac, 0.95));
      cols.push({
        col: i + 1,
        temp: Number(t.toFixed(1))
      });
    }
    return cols;
  }, [gradientLowTemp, gradientHighTemp]);

  // 3. "TOOLS" Feature State (Tm & Annealing Calculator)
  const [primerSeq, setPrimerSeq] = useState<string>('AGCTGATCGATGCTAGCTA');
  const [primerLength, setPrimerLength] = useState<number>(20);
  const [primerGc, setPrimerGc] = useState<number>(50);
  const [saltConcentration, setSaltConcentration] = useState<number>(50); // mM Na+

  // Bioinformatic Calculation of Tm (Nearest-neighbor approximation)
  const calculatedTm = useMemo(() => {
    if (primerSeq && primerSeq.length > 5) {
      const clean = primerSeq.toUpperCase().replace(/[^ATGC]/g, '');
      const aCount = (clean.match(/A/g) || []).length;
      const tCount = (clean.match(/T/g) || []).length;
      const gCount = (clean.match(/G/g) || []).length;
      const cCount = (clean.match(/C/g) || []).length;
      const len = clean.length;
      const gc = ((gCount + cCount) / len) * 100;
      // Formula: Tm = 64.9 + 41 * (yG+zC - 16.4) / (wA+xT+yG+zC)
      const tm = 64.9 + 41 * (gCount + cCount - 16.4) / len;
      return {
        length: len,
        gc: Number(gc.toFixed(1)),
        tm: Number(tm.toFixed(1)),
        optAnneal: Number((tm - 5).toFixed(1))
      };
    }
    // Formula via length & GC
    const tm = 64.9 + 41 * ((primerGc * primerLength / 100) - 16.4) / primerLength;
    return {
      length: primerLength,
      gc: primerGc,
      tm: Number(tm.toFixed(1)),
      optAnneal: Number((tm - 5).toFixed(1))
    };
  }, [primerSeq, primerLength, primerGc, saltConcentration]);

  // 4. "FILE / OPEN" State
  const [selectedProtocol, setSelectedProtocol] = useState<StoredProtocol>(DEFAULT_STORED_PROTOCOLS[0]);
  const [fileFilter, setFileFilter] = useState<string>('todos');

  // 5. "SYSTEM" State
  const [selfTestRunning, setSelfTestRunning] = useState<boolean>(false);
  const [selfTestStep, setSelfTestStep] = useState<string>('');
  const [selfTestPassed, setSelfTestPassed] = useState<boolean | null>(null);

  const handleRunSelfTest = () => {
    setSelfTestRunning(true);
    setSelfTestPassed(null);
    setSelfTestStep('Inicializando sensores Pt1000...');
    setTimeout(() => {
      setSelfTestStep('Comprobando 6 módulos Peltier...');
      setTimeout(() => {
        setSelfTestStep('Test de velocidad de ventiladores dobles...');
        setTimeout(() => {
          setSelfTestStep('Calibración de tapa calefactada 105°C...');
          setTimeout(() => {
            setSelfTestRunning(false);
            setSelfTestPassed(true);
            setSelfTestStep('¡TEST SUPERADO CON ÉXITO! Calibración OK.');
          }, 700);
        }, 600);
      }, 600);
    }, 600);
  };

  // Helper formatting
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercent = totalEstimatedSeconds > 0 
    ? Math.min(100, Math.floor((elapsedSeconds / totalEstimatedSeconds) * 100))
    : 0;

  const remainingSeconds = Math.max(0, totalEstimatedSeconds - elapsedSeconds);
  const currentStep = steps[currentStepIndex] || steps[0];

  const wellRows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const wellCols = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  // Well color based on temperature
  const getWellColor = (temp: number) => {
    if (temp >= 90) return 'bg-rose-500 border-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.6)]';
    if (temp >= 70) return 'bg-amber-500 border-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.6)]';
    if (temp >= 50) return 'bg-cyan-500 border-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.6)]';
    return 'bg-blue-600 border-blue-400 shadow-[0_0_8px_rgba(37,99,235,0.6)]';
  };

  return (
    <div className="space-y-6">
      {/* ======================================================== */}
      {/* 1. PHYSICAL INSTRUMENT CHASSIS: LABBOX THCY-1KS-001 (TC1000) */}
      {/* ======================================================== */}
      <div className="relative bg-gradient-to-b from-slate-900 via-slate-925 to-slate-950 border-4 border-slate-700/80 rounded-3xl shadow-2xl p-4 sm:p-7 overflow-hidden">
        {/* Subtle Brushed Lab Finish Texture */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

        {/* Chassis Top Plate: Brand, Model, Serial, Physical Status LEDs */}
        <div className="relative pb-5 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Labbox Branding Emblem */}
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-600 via-blue-700 to-indigo-900 p-0.5 shadow-md flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Cpu className="w-6 h-6 text-cyan-400 animate-pulse" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-black tracking-widest text-cyan-400 bg-cyan-950/80 border border-cyan-800/80 px-2 py-0.5 rounded">
                  LABBOX · THCY-1KS-001
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  DLAB TC1000 Series · SN: TC1KS-2026-96
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1">
                Termociclador de Laboratorio Real
              </h1>
              <p className="text-xs text-slate-400">
                Bloque 96×0.2 mL · Gradiente Térmico · 6 Peltier Multizona · Pantalla Táctil 7"
              </p>
            </div>
          </div>

          {/* Physical Hardware Status Indicators & Heated Lid Lever */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Hardware LEDs (POWER, RUN, HEATER, ALARM) */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono">
              <span className="flex items-center gap-1 text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" /> PWR
              </span>
              <span className="text-slate-700">|</span>
              <span className="flex items-center gap-1 text-slate-300">
                <span className={`w-2 h-2 rounded-full ${status === 'RUNNING' || incubateRunning ? 'bg-cyan-400 animate-ping' : 'bg-slate-700'}`} /> RUN
              </span>
              <span className="text-slate-700">|</span>
              <span className="flex items-center gap-1 text-slate-300">
                <span className={`w-2 h-2 rounded-full ${!isLidOpen ? 'bg-amber-400 shadow-[0_0_6px_#f59e0b]' : 'bg-slate-700'}`} /> LID
              </span>
            </div>

            {/* Heated Lid Motorized Lever */}
            <button
              onClick={() => setIsLidOpen(!isLidOpen)}
              className={`px-3.5 py-1.5 text-xs font-mono font-bold rounded-lg border transition-all flex items-center gap-1.5 ${
                isLidOpen
                  ? 'bg-amber-950 text-amber-300 border-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                  : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-white hover:border-slate-500'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              {isLidOpen ? 'TAPA ABIERTA (Carga de Tubos)' : 'TAPA CERRADA (105 °C)'}
            </button>
          </div>
        </div>

        {/* Optional Physical Lid Open Alert & View of the 96-well Aluminum Peltier Block */}
        {isLidOpen && (
          <div className="mt-4 p-4 rounded-xl bg-amber-950/40 border border-amber-600/70 text-amber-200 text-xs flex flex-col sm:flex-row items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              <span>
                <strong>Atención:</strong> Tapa térmica abierta. El calentamiento de la tapa está inactivo por seguridad térmica. Puedes cargar y retirar tus microtubos de 0.2 mL del bloque de 96 pocillos.
              </span>
            </div>
            <button
              onClick={() => setIsLidOpen(false)}
              className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded text-xs transition-colors shrink-0"
            >
              Cerrar y asegurar tapa
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* 2. THE AUTHENTIC 7-INCH COLOR TOUCHSCREEN (THCY-1KS-001)  */}
        {/* ======================================================== */}
        <div className="relative mt-5 rounded-2xl bg-gradient-to-b from-slate-950 via-[#070e1c] to-slate-950 border-4 border-slate-800 shadow-[inset_0_4px_25px_rgba(0,0,0,0.95)] p-4 sm:p-6 overflow-hidden">
          
          {/* Subtle screen glass reflections */}
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent pointer-events-none" />

          {/* -------------------------------------------------------- */}
          {/* SCREEN TOP STATUS BAR (Exact TC1000-S touch screen header) */}
          {/* -------------------------------------------------------- */}
          <div className="flex flex-wrap items-center justify-between pb-3.5 mb-5 border-b border-slate-800/90 text-xs font-mono">
            {/* Left: Home button & Screen title */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveScreen('menu')}
                className={`p-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
                  activeScreen === 'menu'
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-700/80 shadow-xs'
                    : 'bg-slate-900 text-slate-400 hover:text-white border-slate-800'
                }`}
                title="Volver a la pantalla principal"
              >
                <Layers className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-[11px] hidden sm:inline">INICIO</span>
              </button>

              <span className="text-slate-600">/</span>

              {/* Current Screen Breadcrumb */}
              <span className="px-2.5 py-1 rounded bg-slate-900/90 border border-slate-800 text-slate-200 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                {activeScreen === 'menu' && 'MENÚ PRINCIPAL'}
                {activeScreen === 'new' && 'NUEVO PROGRAMA PCR'}
                {activeScreen === 'file' && 'GESTOR DE ARCHIVOS'}
                {activeScreen === 'incubate' && 'INCUBACIÓN RÁPIDA'}
                {activeScreen === 'gradient' && 'GRADIENTE TÉRMICO (12 COL)'}
                {activeScreen === 'system' && 'CONFIGURACIÓN DEL SISTEMA'}
                {activeScreen === 'tools' && 'HERRAMIENTAS / CALC. TM'}
                {activeScreen === 'run' && 'MONITOR DE EJECUCIÓN EN VIVO'}
              </span>
            </div>

            {/* Right: Instrument quick sensors (Temp, Lid, USB, Clock) */}
            <div className="flex items-center gap-3 mt-2 sm:mt-0 text-[11px]">
              {/* Block Temp Readout */}
              <span className="flex items-center gap-1 px-2 py-0.5 bg-slate-900/80 border border-slate-800 rounded text-cyan-300 font-bold tabular-nums">
                <Thermometer className="w-3.5 h-3.5 text-cyan-400" />
                {currentBlockTemp.toFixed(1)}°C
              </span>

              {/* Hot Lid Readout */}
              <span className="flex items-center gap-1 px-2 py-0.5 bg-slate-900/80 border border-slate-800 rounded text-rose-300 font-bold tabular-nums">
                <Flame className={`w-3.5 h-3.5 ${!isLidOpen ? 'text-rose-400 animate-pulse' : 'text-slate-600'}`} />
                {isLidOpen ? 'Lid: OFF' : `${hardwarePreset.lidTemp}°C`}
              </span>

              {/* USB status */}
              <button 
                onClick={() => setUsbConnected(!usbConnected)}
                className={`flex items-center gap-1 px-2 py-0.5 border rounded ${
                  usbConnected ? 'bg-cyan-950/70 border-cyan-800 text-cyan-300' : 'bg-slate-900 border-slate-800 text-slate-500'
                }`}
                title={usbConnected ? 'USB Conectado' : 'USB Desconectado'}
              >
                <Usb className="w-3 h-3" />
                <span className="hidden md:inline">{usbConnected ? 'USB OK' : 'NO USB'}</span>
              </button>

              {/* Sound status */}
              <button 
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                title={soundEnabled ? 'Aviso sonoro activado' : 'Mudo'}
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
              </button>

              {/* Clock */}
              <span className="flex items-center gap-1 text-slate-400 font-bold pl-1">
                <Clock className="w-3 h-3 text-slate-500" />
                {timeString}
              </span>
            </div>
          </div>

          {/* ======================================================== */}
          {/* SCREEN CONTENT AREA BASED ON SELECTED OPTION            */}
          {/* ======================================================== */}

          {/* -------------------------------------------------------- */}
          {/* OPTION A: MAIN MENU SCREEN (THE 6 TC1000 / THCY-1KS TILES) */}
          {/* -------------------------------------------------------- */}
          {activeScreen === 'menu' && (
            <div className="space-y-6">
              {/* Instrument Status Ribbon */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl">
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    status === 'RUNNING' ? 'bg-emerald-400 animate-ping' :
                    status === 'PAUSED' ? 'bg-amber-400' : 'bg-cyan-400'
                  }`} />
                  <span className="text-slate-300">
                    ESTADO: <strong className="text-white">{status}</strong>
                  </span>
                  <span className="text-slate-600 hidden sm:inline">|</span>
                  <span className="text-slate-400 hidden sm:inline">
                    Modo Control: <strong className="text-cyan-300 uppercase">{controlMode}</strong>
                  </span>
                </div>

                {status === 'RUNNING' && (
                  <button
                    onClick={() => setActiveScreen('run')}
                    className="flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-mono font-bold transition-all shadow-md animate-pulse"
                  >
                    <span>Ir a Monitor de Carrera</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* The 6 Authentic Main Menu Touch Tiles */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5">
                
                {/* 1. NEW PROGRAM (Nuevo Programa) */}
                <button
                  onClick={() => setActiveScreen('new')}
                  className="group p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-slate-800 hover:border-cyan-500/80 hover:shadow-[0_0_20px_rgba(6,182,212,0.25)] transition-all flex flex-col items-center justify-center text-center cursor-pointer active:scale-95"
                >
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-400/50 flex items-center justify-center text-cyan-300 mb-3 group-hover:scale-110 group-hover:border-cyan-300 transition-all shadow-md">
                    <FileText className="w-7 h-7 sm:w-8 sm:h-8" />
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                    Nuevo
                  </h3>
                  <span className="text-[10px] sm:text-[11px] font-mono text-slate-400 mt-1">
                    Crear programa PCR
                  </span>
                  <span className="mt-2 text-[9px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
                    Etapas y Ciclos
                  </span>
                </button>

                {/* 2. FILE / OPEN (Archivos y Protocolos) */}
                <button
                  onClick={() => setActiveScreen('file')}
                  className="group p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-slate-800 hover:border-blue-500/80 hover:shadow-[0_0_20px_rgba(59,130,246,0.25)] transition-all flex flex-col items-center justify-center text-center cursor-pointer active:scale-95"
                >
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-600/30 border border-blue-400/50 flex items-center justify-center text-blue-300 mb-3 group-hover:scale-110 group-hover:border-blue-300 transition-all shadow-md">
                    <FolderOpen className="w-7 h-7 sm:w-8 sm:h-8" />
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-blue-300 transition-colors">
                    Archivos
                  </h3>
                  <span className="text-[10px] sm:text-[11px] font-mono text-slate-400 mt-1">
                    Gestor de protocolos
                  </span>
                  <span className="mt-2 text-[9px] font-mono px-2 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-800/60">
                    16 Carpetas / USB
                  </span>
                </button>

                {/* 3. INCUBATE (Incubación Rápida "One-Touch") */}
                <button
                  onClick={() => setActiveScreen('incubate')}
                  className="group p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-slate-800 hover:border-emerald-500/80 hover:shadow-[0_0_20px_rgba(16,185,129,0.25)] transition-all flex flex-col items-center justify-center text-center cursor-pointer active:scale-95"
                >
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-600/30 border border-emerald-400/50 flex items-center justify-center text-emerald-300 mb-3 group-hover:scale-110 group-hover:border-emerald-300 transition-all shadow-md">
                    <Beaker className="w-7 h-7 sm:w-8 sm:h-8" />
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                    Incubar
                  </h3>
                  <span className="text-[10px] sm:text-[11px] font-mono text-slate-400 mt-1">
                    Incubación rápida
                  </span>
                  <span className="mt-2 text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
                    37°C · 65°C · 95°C · 4°C
                  </span>
                </button>

                {/* 4. GRADIENT (Gradiente Térmico 12 Columnas) */}
                <button
                  onClick={() => setActiveScreen('gradient')}
                  className="group p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-slate-800 hover:border-amber-500/80 hover:shadow-[0_0_20px_rgba(245,158,11,0.25)] transition-all flex flex-col items-center justify-center text-center cursor-pointer active:scale-95"
                >
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-600/30 border border-amber-400/50 flex items-center justify-center text-amber-300 mb-3 group-hover:scale-110 group-hover:border-amber-300 transition-all shadow-md">
                    <Sliders className="w-7 h-7 sm:w-8 sm:h-8" />
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                    Gradiente
                  </h3>
                  <span className="text-[10px] sm:text-[11px] font-mono text-slate-400 mt-1">
                    Matriz de 12 columnas
                  </span>
                  <span className="mt-2 text-[9px] font-mono px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/60">
                    Rango 1 a 42 °C
                  </span>
                </button>

                {/* 5. SYSTEM (Configuración del Sistema y Autotest) */}
                <button
                  onClick={() => setActiveScreen('system')}
                  className="group p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-slate-800 hover:border-purple-500/80 hover:shadow-[0_0_20px_rgba(168,85,247,0.25)] transition-all flex flex-col items-center justify-center text-center cursor-pointer active:scale-95"
                >
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-fuchsia-600/30 border border-purple-400/50 flex items-center justify-center text-purple-300 mb-3 group-hover:scale-110 group-hover:border-purple-300 transition-all shadow-md">
                    <Settings className="w-7 h-7 sm:w-8 sm:h-8" />
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-purple-300 transition-colors">
                    Sistema
                  </h3>
                  <span className="text-[10px] sm:text-[11px] font-mono text-slate-400 mt-1">
                    Ajustes y autotest
                  </span>
                  <span className="mt-2 text-[9px] font-mono px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800/60">
                    Peltier · Tubo/Bloque
                  </span>
                </button>

                {/* 6. TOOLS (Calculadora Bioinformática de Tm) */}
                <button
                  onClick={() => setActiveScreen('tools')}
                  className="group p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-slate-800 hover:border-cyan-400/80 hover:shadow-[0_0_20px_rgba(34,211,238,0.25)] transition-all flex flex-col items-center justify-center text-center cursor-pointer active:scale-95"
                >
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-teal-500/20 to-cyan-600/30 border border-teal-400/50 flex items-center justify-center text-teal-300 mb-3 group-hover:scale-110 group-hover:border-teal-300 transition-all shadow-md">
                    <Calculator className="w-7 h-7 sm:w-8 sm:h-8" />
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-teal-300 transition-colors">
                    Herramientas
                  </h3>
                  <span className="text-[10px] sm:text-[11px] font-mono text-slate-400 mt-1">
                    Calculadora de Tm
                  </span>
                  <span className="mt-2 text-[9px] font-mono px-2 py-0.5 rounded bg-teal-950/80 text-teal-300 border border-teal-800/60">
                    Oligos · Sal · Anneal
                  </span>
                </button>

              </div>

              {/* Quick Launch & Simulation Shortcuts Bar */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-slate-400">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <Radio className="w-3.5 h-3.5 text-cyan-400" />
                  Presiona cualquier opción táctil para abrir su interfaz de laboratorio
                </span>
                <button
                  onClick={() => setActiveScreen('run')}
                  className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 hover:underline font-bold"
                >
                  Abrir Monitor en Vivo <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* -------------------------------------------------------- */}
          {/* OPTION 1: "NEW" (Nuevo Programa PCR)                    */}
          {/* -------------------------------------------------------- */}
          {activeScreen === 'new' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-cyan-400" />
                    Editor de Protocolo Térmico (Nuevo Archivo)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Definición de etapas térmicas, rampas (hasta 3.0°C/s) y repeticiones de ciclo
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      onStart();
                      setActiveScreen('run');
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold rounded-lg shadow-md flex items-center gap-1.5 transition-all"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    Ejecutar Ahora
                  </button>
                </div>
              </div>

              {/* Step Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
                <table className="w-full text-xs text-left font-mono">
                  <thead>
                    <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 text-[11px]">
                      <th className="py-2.5 px-3">Paso</th>
                      <th className="py-2.5 px-3">Etapa</th>
                      <th className="py-2.5 px-3">Temp (°C)</th>
                      <th className="py-2.5 px-3">Tiempo (seg)</th>
                      <th className="py-2.5 px-3">Ciclo</th>
                      <th className="py-2.5 px-3">Rampa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {steps.map((st, idx) => (
                      <tr key={st.id} className="hover:bg-slate-900/40">
                        <td className="py-2.5 px-3 font-bold text-cyan-400">#{st.order}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-200 capitalize">
                          {st.type.replace('_', ' ')}
                        </td>
                        <td className="py-2.5 px-3 text-white font-bold tabular-nums">
                          {st.temperature} °C
                        </td>
                        <td className="py-2.5 px-3 text-slate-300 tabular-nums">
                          {st.durationSeconds ? `${st.durationSeconds} s` : 'Indefinido'}
                        </td>
                        <td className="py-2.5 px-3 text-slate-400">
                          {st.inCycle ? `${totalCycles} ciclos` : 'Única vez'}
                        </td>
                        <td className="py-2.5 px-3 text-slate-400 tabular-nums">
                          {st.rampRate || 3.0} °C/s
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Protocol Parameters Footer */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                  <span className="text-[10px] text-slate-500 block">Tapa Térmica</span>
                  <span className="text-white font-bold">105.0 °C</span>
                </div>
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                  <span className="text-[10px] text-slate-500 block">Volumen Muestra</span>
                  <span className="text-cyan-400 font-bold">25 µL</span>
                </div>
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                  <span className="text-[10px] text-slate-500 block">Total Ciclos</span>
                  <span className="text-amber-400 font-bold">{totalCycles}</span>
                </div>
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                  <span className="text-[10px] text-slate-500 block">Duración Estimada</span>
                  <span className="text-emerald-400 font-bold">{formatTime(totalEstimatedSeconds)}</span>
                </div>
              </div>
            </div>
          )}

          {/* -------------------------------------------------------- */}
          {/* OPTION 2: "FILE / OPEN" (Gestor de Archivos y Carpetas) */}
          {/* -------------------------------------------------------- */}
          {activeScreen === 'file' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-blue-400" />
                    Gestor de Archivos PCR (TC1000 Storage)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Almacenamiento interno de protocolos (hasta 16 carpetas y 200 archivos)
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                    <Usb className="w-3.5 h-3.5 text-cyan-400" />
                    {usbConnected ? 'USB: Montado (Fat32)' : 'USB: No detectado'}
                  </span>
                </div>
              </div>

              {/* Grid: Folder List & File Details */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Protocols list (7 cols) */}
                <div className="md:col-span-7 space-y-2">
                  {DEFAULT_STORED_PROTOCOLS.map((proto) => {
                    const isSelected = selectedProtocol.id === proto.id;
                    return (
                      <div
                        key={proto.id}
                        onClick={() => setSelectedProtocol(proto)}
                        className={`p-3 rounded-xl border text-xs font-mono cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-blue-950/60 border-blue-400 text-white shadow-sm'
                            : 'bg-slate-950 border-slate-800/80 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold flex items-center gap-2">
                            <FileText className="w-3.5 h-3.5 text-blue-400" />
                            {proto.name}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-cyan-300 border border-slate-800">
                            {proto.folder}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                          {proto.description}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-500">
                          <span>{proto.cycles} ciclos</span>
                          <span>·</span>
                          <span>Vol: {proto.volumeUl} µL</span>
                          <span>·</span>
                          <span>Est: {proto.estTimeMin} min</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Selected Protocol Preview (5 cols) */}
                <div className="md:col-span-5 p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
                  <div className="space-y-3 font-mono text-xs">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                        Detalle del Archivo
                      </span>
                      <span className="text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800/60">
                        Certificado
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[11px] block">Nombre:</span>
                      <strong className="text-white text-sm">{selectedProtocol.name}</strong>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[11px] block">Carpeta:</span>
                      <span className="text-cyan-300">{selectedProtocol.folder}</span>
                    </div>

                    <div className="pt-2 border-t border-slate-900">
                      <span className="text-slate-400 text-[11px] block mb-1">Pasos Programados:</span>
                      <div className="space-y-1">
                        {selectedProtocol.steps.map((st, i) => (
                          <div key={i} className="flex justify-between text-[11px] bg-slate-900/60 px-2 py-1 rounded">
                            <span className="text-slate-300">{st.name}</span>
                            <span className="text-cyan-400 font-bold">{st.temp}°C ({st.timeSec}s)</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-2">
                    <button
                      onClick={() => {
                        onStart();
                        setActiveScreen('run');
                      }}
                      className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold rounded-lg shadow-md flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      Cargar y Correr
                    </button>
                    <button
                      onClick={() => alert(`Archivo ${selectedProtocol.name} exportado a la memoria USB correctamente.`)}
                      className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-lg"
                      title="Exportar a USB"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* -------------------------------------------------------- */}
          {/* OPTION 3: "INCUBATE" (Incubación Rápida "One-Touch")     */}
          {/* -------------------------------------------------------- */}
          {activeScreen === 'incubate' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Beaker className="w-4 h-4 text-emerald-400" />
                    Incubación Rápida "One-Touch" (Modo Isotérmico)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Mantén temperatura constante para digestiones de restricción, inactivación térmica o lisis
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded font-mono text-xs font-bold ${
                    incubateRunning 
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-600 animate-pulse'
                      : 'bg-slate-900 text-slate-400 border border-slate-800'
                  }`}>
                    {incubateRunning ? 'INCUBANDO EN VIVO' : 'EN ESPERA'}
                  </span>
                </div>
              </div>

              {/* Fast Presets Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs">
                <button
                  onClick={() => { setIncubateTemp(37.0); setIncubateMinutes(30); }}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    incubateTemp === 37.0 ? 'bg-emerald-950/70 border-emerald-400 text-white' : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <span className="text-[10px] text-emerald-400 block font-bold">DIGESTIÓN 37°C</span>
                  <span className="text-sm font-bold block mt-0.5">37.0 °C · 30 min</span>
                  <span className="text-[10px] text-slate-400">EcoRI / BamHI</span>
                </button>

                <button
                  onClick={() => { setIncubateTemp(65.0); setIncubateMinutes(20); }}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    incubateTemp === 65.0 ? 'bg-emerald-950/70 border-emerald-400 text-white' : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <span className="text-[10px] text-amber-400 block font-bold">INACTIVACIÓN 65°C</span>
                  <span className="text-sm font-bold block mt-0.5">65.0 °C · 20 min</span>
                  <span className="text-[10px] text-slate-400">Desnaturalizar Enzimas</span>
                </button>

                <button
                  onClick={() => { setIncubateTemp(95.0); setIncubateMinutes(10); }}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    incubateTemp === 95.0 ? 'bg-emerald-950/70 border-emerald-400 text-white' : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <span className="text-[10px] text-rose-400 block font-bold">LISIS CELULAR 95°C</span>
                  <span className="text-sm font-bold block mt-0.5">95.0 °C · 10 min</span>
                  <span className="text-[10px] text-slate-400">Extracción Express</span>
                </button>

                <button
                  onClick={() => { setIncubateTemp(4.0); setIncubateMinutes(999); }}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    incubateTemp === 4.0 ? 'bg-emerald-950/70 border-emerald-400 text-white' : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <span className="text-[10px] text-blue-400 block font-bold">CONSERVACIÓN 4°C</span>
                  <span className="text-sm font-bold block mt-0.5">4.0 °C · Indefinido</span>
                  <span className="text-[10px] text-slate-400">Protección Enzimática</span>
                </button>
              </div>

              {/* Incubation Interactive Controls & Real-time Live Readout */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                {/* Real-time Giant Thermometer HUD (5 cols) */}
                <div className="md:col-span-5 p-5 rounded-2xl bg-slate-950 border border-slate-800 text-center relative overflow-hidden">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                    Temperatura Actual en Bloque
                  </span>
                  <div className="text-6xl sm:text-7xl font-black font-mono tracking-tight text-emerald-300 my-2 select-none tabular-nums">
                    {(incubateRunning ? incubateCurrentTemp : currentBlockTemp).toFixed(1)}
                    <span className="text-2xl text-emerald-500 font-sans ml-1">°C</span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-900 grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2 bg-slate-900/60 rounded">
                      <span className="text-[10px] text-slate-500 block">Objetivo</span>
                      <strong className="text-white">{incubateTemp.toFixed(1)} °C</strong>
                    </div>
                    <div className="p-2 bg-slate-900/60 rounded">
                      <span className="text-[10px] text-slate-500 block">Tiempo Restante</span>
                      <strong className="text-emerald-400">{formatTime(incubateRemainingSec)}</strong>
                    </div>
                  </div>
                </div>

                {/* Sliders & Configuration (7 cols) */}
                <div className="md:col-span-7 space-y-4 font-mono text-xs">
                  {/* Temp Slider */}
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Temperatura de Incubación:</span>
                      <span className="text-emerald-400 font-bold text-sm">{incubateTemp.toFixed(1)} °C</span>
                    </div>
                    <input
                      type="range"
                      min="4.0"
                      max="105.0"
                      step="0.5"
                      value={incubateTemp}
                      disabled={incubateRunning}
                      onChange={(e) => setIncubateTemp(parseFloat(e.target.value))}
                      className="w-full accent-emerald-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>4.0 °C (Mín)</span>
                      <span>37.0 °C</span>
                      <span>65.0 °C</span>
                      <span>105.0 °C (Máx)</span>
                    </div>
                  </div>

                  {/* Duration Slider */}
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Tiempo de Incubación:</span>
                      <span className="text-emerald-400 font-bold text-sm">
                        {incubateMinutes >= 999 ? 'Indefinido (Hold)' : `${incubateMinutes} minutos`}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="120"
                      step="1"
                      value={incubateMinutes > 120 ? 120 : incubateMinutes}
                      disabled={incubateRunning}
                      onChange={(e) => {
                        const m = parseInt(e.target.value);
                        setIncubateMinutes(m);
                        setIncubateRemainingSec(m * 60);
                      }}
                      className="w-full accent-emerald-500 cursor-pointer"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3 pt-2">
                    {incubateRunning ? (
                      <button
                        onClick={() => setIncubateRunning(false)}
                        className="flex-1 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all"
                      >
                        <Pause className="w-4 h-4 fill-white" />
                        Pausar / Detener Incubación
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setIncubateRemainingSec(incubateMinutes * 60);
                          setIncubateRunning(true);
                        }}
                        className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"
                      >
                        <Play className="w-4 h-4 fill-white" />
                        Iniciar Incubación Rápida
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* -------------------------------------------------------- */}
          {/* OPTION 4: "GRADIENT" (Gradiente Térmico 12 Columnas)     */}
          {/* -------------------------------------------------------- */}
          {activeScreen === 'gradient' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-amber-400" />
                    Optimizador de Gradiente Térmico (TC1000-G)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Gradiente multizona para optimizar la temperatura de hibridación en una sola corrida
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="px-2.5 py-1 bg-amber-950 text-amber-300 border border-amber-800/80 rounded font-bold">
                    ΔT Rango: {(gradientHighTemp - gradientLowTemp).toFixed(1)} °C
                  </span>
                </div>
              </div>

              {/* Sliders for Low & High temperature */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Temperatura Mínima (Col 1):</span>
                    <strong className="text-cyan-400 text-sm">{gradientLowTemp.toFixed(1)} °C</strong>
                  </div>
                  <input
                    type="range"
                    min="35.0"
                    max="75.0"
                    step="0.5"
                    value={gradientLowTemp}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      if (v < gradientHighTemp) setGradientLowTemp(v);
                    }}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>

                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Temperatura Máxima (Col 12):</span>
                    <strong className="text-rose-400 text-sm">{gradientHighTemp.toFixed(1)} °C</strong>
                  </div>
                  <input
                    type="range"
                    min="40.0"
                    max="90.0"
                    step="0.5"
                    value={gradientHighTemp}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      if (v > gradientLowTemp) setGradientHighTemp(v);
                    }}
                    className="w-full accent-rose-400 cursor-pointer"
                  />
                </div>
              </div>

              {/* 12 Columns Visual Spectrum Representation */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex justify-between text-xs font-mono text-slate-400">
                  <span>Columna 1 (Extremo Frío)</span>
                  <span>Distribución de Temperatura en las 12 Columnas del Bloque</span>
                  <span>Columna 12 (Extremo Cálido)</span>
                </div>

                <div className="grid grid-cols-12 gap-1.5 sm:gap-2">
                  {gradientColumns.map((col) => (
                    <div
                      key={col.col}
                      className="flex flex-col items-center p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-amber-400 transition-all text-center"
                    >
                      <span className="text-[10px] font-mono text-slate-500 font-bold mb-1">
                        C{col.col}
                      </span>
                      <div 
                        className={`w-full h-12 rounded flex items-center justify-center text-white text-[11px] font-mono font-bold ${getWellColor(col.temp)}`}
                      >
                        {col.temp}°
                      </div>
                      <span className="text-[9px] font-mono text-slate-400 mt-1">
                        {col.temp.toFixed(1)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
                  <span className="text-slate-400">
                    Gradiente uniforme con resolución térmica ±0.1°C por microzona.
                  </span>
                  <button
                    onClick={() => {
                      alert(`Gradiente térmico (${gradientLowTemp}°C a ${gradientHighTemp}°C) aplicado al paso de Hibridación del protocolo activo.`);
                    }}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-lg shadow-md transition-all self-start sm:self-auto"
                  >
                    Aplicar Gradiente a Hibridación (Annealing)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* -------------------------------------------------------- */}
          {/* OPTION 5: "SYSTEM" (Configuración y Autotest)             */}
          {/* -------------------------------------------------------- */}
          {activeScreen === 'system' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Settings className="w-4 h-4 text-purple-400" />
                    Configuración del Instrumento y Diagnóstico
                  </h3>
                  <p className="text-xs text-slate-400">
                    Control de algoritmos térmicos, parámetros de seguridad y autotest del sistema
                  </p>
                </div>

                <span className="text-xs font-mono text-purple-300 bg-purple-950 px-2.5 py-1 rounded border border-purple-800/80">
                  Firmware v2.4.2 · Labbox OS
                </span>
              </div>

              {/* Settings Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
                {/* Control Mode: Block vs Tube Mode */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <span className="text-slate-400 font-bold block">
                    Modo de Control Térmico:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setControlMode('block')}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        controlMode === 'block'
                          ? 'bg-purple-950 border-purple-400 text-white'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      <span className="font-bold block">Block Mode</span>
                      <span className="text-[10px] text-slate-400">
                        Temperatura directa del bloque de aluminio.
                      </span>
                    </button>
                    <button
                      onClick={() => setControlMode('tube')}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        controlMode === 'tube'
                          ? 'bg-purple-950 border-purple-400 text-white'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      <span className="font-bold block">Tube Mode</span>
                      <span className="text-[10px] text-slate-400">
                        Algoritmo compensador del líquido en microtubo 0.2 mL.
                      </span>
                    </button>
                  </div>
                </div>

                {/* Lid Heater Setting */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <span className="text-slate-400 font-bold block">
                    Ajustes de Tapa Térmica Calefactada:
                  </span>
                  <div className="flex justify-between items-center bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-300">Temperatura Objetivo:</span>
                    <span className="text-rose-400 font-bold">{hardwarePreset.lidTemp}.0 °C</span>
                  </div>
                  <div className="flex justify-between items-center bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-300">Apagado automático:</span>
                    <span className="text-emerald-400 font-bold">Si T &lt; 30 °C (Activo)</span>
                  </div>
                </div>

                {/* Sounds & Alerts */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <span className="text-slate-400 font-bold block">
                    Avisador Acústico (Beeper):
                  </span>
                  <div className="flex items-center justify-between bg-slate-900 p-3 rounded-lg border border-slate-800">
                    <span className="text-slate-300">Sonido de fin de ciclo y alarmas:</span>
                    <button
                      onClick={() => setSoundEnabled(!soundEnabled)}
                      className={`px-3 py-1 rounded font-bold transition-all ${
                        soundEnabled ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {soundEnabled ? 'HABILITADO' : 'SILENCIADO'}
                    </button>
                  </div>
                </div>

                {/* Power failure protection */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <span className="text-slate-400 font-bold block">
                    Protección ante Corte Eléctrico:
                  </span>
                  <div className="flex items-center justify-between bg-slate-900 p-3 rounded-lg border border-slate-800">
                    <span className="text-slate-300">Auto-recuperación de corrida:</span>
                    <span className="text-emerald-400 font-bold">ACTIVO (Memoria NVRAM)</span>
                  </div>
                </div>
              </div>

              {/* System Self-Test Action Panel */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-xs">
                <div>
                  <span className="font-bold text-white block">
                    Autodiagnóstico de Hardware (Power-On Self-Test):
                  </span>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Verifica módulos Peltier, sensores termométricos Pt1000, ventiladores y memoria.
                  </p>
                  {selfTestStep && (
                    <div className="mt-2 text-cyan-300 text-[11px] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                      <span>{selfTestStep}</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleRunSelfTest}
                  disabled={selfTestRunning}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-md transition-all self-start sm:self-auto disabled:opacity-50"
                >
                  {selfTestRunning ? 'Ejecutando Test...' : 'Iniciar Autotest'}
                </button>
              </div>
            </div>
          )}

          {/* -------------------------------------------------------- */}
          {/* OPTION 6: "TOOLS" (Calculadora Bioinformática de Tm)      */}
          {/* -------------------------------------------------------- */}
          {activeScreen === 'tools' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-teal-400" />
                    Calculadora Bioinformática de Tm y Cebadores
                  </h3>
                  <p className="text-xs text-slate-400">
                    Cálculo termodinámico de temperatura de fusión (Tm) y temperatura recomendada de hibridación (Ta)
                  </p>
                </div>

                <span className="text-xs font-mono text-teal-300 bg-teal-950 px-2.5 py-1 rounded border border-teal-800/80">
                  Algoritmo Nearest-Neighbor
                </span>
              </div>

              {/* Calculator Inputs & Output */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 font-mono text-xs">
                {/* Inputs (7 cols) */}
                <div className="md:col-span-7 space-y-4">
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                    <label className="text-slate-300 font-bold block">
                      Secuencia del Cebador (5' → 3'):
                    </label>
                    <input
                      type="text"
                      value={primerSeq}
                      onChange={(e) => setPrimerSeq(e.target.value.toUpperCase())}
                      placeholder="Ej: AGCTAGCTAGCTA..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-cyan-300 font-mono tracking-widest text-xs uppercase focus:outline-none focus:border-cyan-400"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>Longitud: {calculatedTm.length} nt</span>
                      <span>Contenido GC: {calculatedTm.gc} %</span>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-300">Concentración Salina [Na+]:</span>
                      <strong className="text-teal-300">{saltConcentration} mM</strong>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="150"
                      value={saltConcentration}
                      onChange={(e) => setSaltConcentration(parseInt(e.target.value))}
                      className="w-full accent-teal-400 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Outputs (5 cols) */}
                <div className="md:col-span-5 p-5 bg-slate-950 border border-slate-800 rounded-xl flex flex-col justify-between">
                  <div className="space-y-4">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block border-b border-slate-900 pb-2">
                      Resultados Termodinámicos
                    </span>

                    <div>
                      <span className="text-[11px] text-slate-400 block">Tm Calculada:</span>
                      <div className="text-4xl font-black text-teal-300 mt-1 tabular-nums">
                        {calculatedTm.tm} <span className="text-xl font-sans text-teal-500">°C</span>
                      </div>
                    </div>

                    <div className="p-3 bg-teal-950/40 border border-teal-800/80 rounded-lg">
                      <span className="text-[10px] text-teal-400 font-bold block uppercase">
                        Temperatura de Annealing Óptima (Ta):
                      </span>
                      <div className="text-2xl font-bold text-white mt-1">
                        {calculatedTm.optAnneal} °C
                      </div>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        Fórmula estándar Ta = Tm - 5 °C
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      alert(`Temperatura de Annealing ajustada a ${calculatedTm.optAnneal}°C en el protocolo activo.`);
                    }}
                    className="mt-4 w-full py-2 bg-teal-600 hover:bg-teal-500 text-slate-950 font-bold rounded-lg shadow-md transition-all text-xs"
                  >
                    Aplicar {calculatedTm.optAnneal}°C al Protocolo
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* -------------------------------------------------------- */}
          {/* OPTION 7: "RUN MONITOR" (Pantalla de Ejecución en Vivo)    */}
          {/* -------------------------------------------------------- */}
          {activeScreen === 'run' && (
            <div className="space-y-5">
              {/* Secondary Navigation inside Run View (Profile vs 96-well block vs Telemetry) */}
              <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-800 gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setRunSubTab('profile')}
                    className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                      runSubTab === 'profile'
                        ? 'bg-cyan-500 text-slate-950 shadow-sm'
                        : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    Curva Térmica
                  </button>
                  <button
                    onClick={() => setRunSubTab('wells')}
                    className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                      runSubTab === 'wells'
                        ? 'bg-cyan-500 text-slate-950 shadow-sm'
                        : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    Matriz 96 Pocillos
                  </button>
                  <button
                    onClick={() => setRunSubTab('telemetry')}
                    className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                      runSubTab === 'telemetry'
                        ? 'bg-cyan-500 text-slate-950 shadow-sm'
                        : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    Cinética Molecular
                  </button>
                </div>

                <div className="flex items-center gap-3 text-xs font-mono">
                  <span className="text-slate-400">Progreso Total:</span>
                  <span className="text-cyan-400 font-bold tabular-nums">{progressPercent}%</span>
                </div>
              </div>

              {/* Main Running Dashboard: LCD HUD (5 cols) + Timing / Cycle (7 cols) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
                {/* Big Digital LCD Temp HUD (5 cols) */}
                <div className="lg:col-span-5 bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 rounded-2xl p-6 text-center lg:text-left relative overflow-hidden shadow-inner">
                  <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                    <span className="flex items-center gap-1.5">
                      <Thermometer className="w-4 h-4 text-cyan-400" />
                      Temp. Bloque en Tiempo Real
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-800/60 font-bold">
                      ± 0.1 °C
                    </span>
                  </div>

                  {/* GIANT LCD Readout */}
                  <div className="text-7xl sm:text-8xl font-black font-mono tracking-tighter text-cyan-300 drop-shadow-[0_0_25px_rgba(6,182,212,0.4)] select-none tabular-nums">
                    {currentBlockTemp.toFixed(1)}
                    <span className="text-3xl text-cyan-500 font-sans ml-2">°C</span>
                  </div>

                  {/* Sub-readouts */}
                  <div className="mt-5 pt-4 border-t border-slate-900 grid grid-cols-3 gap-2 text-xs font-mono text-center">
                    <div className="p-2 bg-black/60 rounded-lg border border-slate-900">
                      <span className="text-[10px] text-slate-500 block">Objetivo</span>
                      <span className="text-base font-bold text-slate-200 tabular-nums">
                        {targetTemp.toFixed(1)}°C
                      </span>
                    </div>
                    <div className="p-2 bg-black/60 rounded-lg border border-slate-900">
                      <span className="text-[10px] text-slate-500 block">Tapa (Lid)</span>
                      <span className="text-base font-bold text-rose-400 tabular-nums">
                        {isLidOpen ? 'OFF' : `${hardwarePreset.lidTemp}°C`}
                      </span>
                    </div>
                    <div className="p-2 bg-black/60 rounded-lg border border-slate-900">
                      <span className="text-[10px] text-slate-500 block">Rampa</span>
                      <span className="text-base font-bold text-cyan-400 tabular-nums">
                        {hardwarePreset.rampRateHeating} °C/s
                      </span>
                    </div>
                  </div>
                </div>

                {/* Cycle & Progress Dashboard (7 cols) */}
                <div className="lg:col-span-7 space-y-4 font-mono text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
                      <div className="text-slate-400 text-xs">Ciclo de Amplificación</div>
                      <div className="text-2xl sm:text-3xl font-bold text-white mt-1 tabular-nums">
                        {currentCycle} <span className="text-slate-600 text-sm">/ {totalCycles}</span>
                      </div>
                      <div className="text-[11px] text-cyan-400 mt-1">
                        {currentCycle >= totalCycles ? 'Ciclo Final' : `Faltan ${totalCycles - currentCycle} ciclos`}
                      </div>
                    </div>

                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
                      <div className="text-slate-400 text-xs">Paso en Proceso</div>
                      <div className="text-2xl sm:text-3xl font-bold text-white mt-1 tabular-nums">
                        Paso {currentStep?.order || 1} <span className="text-slate-600 text-sm">/ {steps.length}</span>
                      </div>
                      <div className="text-[11px] text-emerald-400 uppercase mt-1 truncate">
                        {currentStep?.type?.replace('_', ' ') || 'IDLE'}
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Progreso Total del Protocolo</span>
                      <span className="text-cyan-400 font-bold">{progressPercent} %</span>
                    </div>
                    <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 rounded-full transition-all duration-300 shadow-[0_0_12px_#06B6D4]"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-2 text-[11px] text-slate-400">
                      <div>
                        <span className="text-[9px] text-slate-500 block">Tiempo Restante:</span>
                        <strong className="text-white">{formatTime(remainingSeconds)}</strong>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-500 block">Transcurrido:</span>
                        <strong className="text-slate-300">{formatTime(elapsedSeconds)}</strong>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-500 block">Total Estimado:</span>
                        <strong className="text-slate-400">{formatTime(totalEstimatedSeconds)}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sub-tab 1: Thermal Profile Stages */}
              {runSubTab === 'profile' && (
                <div className="space-y-3 font-mono text-xs">
                  <div className="text-slate-400 text-xs flex justify-between pb-1 border-b border-slate-800">
                    <span>Etapas Térmicas del Protocolo</span>
                    <span className="text-cyan-400">Paso #{currentStepIndex + 1} Activo</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                    {steps.map((st, i) => {
                      const isActive = currentStepIndex === i;
                      return (
                        <div
                          key={st.id}
                          className={`p-3 rounded-xl border transition-all ${
                            isActive
                              ? 'bg-cyan-950/70 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.35)] ring-1 ring-cyan-400'
                              : 'bg-slate-950 border-slate-800 text-slate-400'
                          }`}
                        >
                          <div className="flex justify-between text-[10px] text-slate-500">
                            <span>#{st.order}</span>
                            <span>{st.inCycle ? 'CICLO' : 'HOLD'}</span>
                          </div>
                          <div className="font-bold text-white capitalize mt-1 text-xs truncate">
                            {st.type.replace('_', ' ')}
                          </div>
                          <div className="text-cyan-300 font-bold text-base mt-1 tabular-nums">
                            {st.temperature}°C
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5 tabular-nums">
                            {st.durationSeconds ? `${st.durationSeconds}s` : 'Indef.'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Sub-tab 2: 96-well Microplate Representation */}
              {runSubTab === 'wells' && (
                <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col items-center">
                  <div className="flex justify-between w-full max-w-xl text-xs font-mono text-slate-400 mb-3">
                    <span>Matriz Peltier 8×12 (96 Pocillos)</span>
                    <span className="text-cyan-400">Pocillo: {activeWell.row}{activeWell.col} ({currentBlockTemp.toFixed(1)}°C)</span>
                  </div>
                  
                  {/* Columns */}
                  <div className="grid grid-cols-12 gap-2 w-full max-w-xl mb-1.5 pl-6 font-mono text-[10px] text-slate-500 text-center">
                    {wellCols.map(c => <div key={c}>{c}</div>)}
                  </div>

                  {/* Rows */}
                  <div className="w-full max-w-xl space-y-1.5 font-mono">
                    {wellRows.map((r) => (
                      <div key={r} className="flex items-center gap-2">
                        <span className="w-4 text-[10px] text-slate-500 text-center font-bold">{r}</span>
                        <div className="grid grid-cols-12 gap-2 flex-1">
                          {wellCols.map((c) => {
                            const isSelected = activeWell.row === r && activeWell.col === c;
                            return (
                              <button
                                key={`${r}${c}`}
                                onClick={() => setActiveWell({ row: r, col: c })}
                                className={`aspect-square rounded-full border transition-all duration-200 relative ${getWellColor(currentBlockTemp)} ${
                                  isSelected ? 'ring-2 ring-white scale-110' : 'hover:scale-105'
                                }`}
                              />
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sub-tab 3: Molecular Kinetics Telemetry */}
              {runSubTab === 'telemetry' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                    <span className="text-slate-400 font-bold block border-b border-slate-900 pb-2">
                      Cinética Molecular
                    </span>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">Copias Generadas:</span>
                      <strong className="text-emerald-400 tabular-nums">≈ {amplifiedCopies.toLocaleString()}</strong>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">Fluorescencia RFU:</span>
                      <strong className="text-cyan-400 tabular-nums">{fluorescenceRfu.toFixed(2)} RFU</strong>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                    <span className="text-slate-400 font-bold block border-b border-slate-900 pb-2">
                      Química del Ensayo
                    </span>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">Plantilla:</span>
                      <strong className="text-white truncate max-w-[180px]">{assay.templateName}</strong>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">Tamaño Amplicón:</span>
                      <strong className="text-cyan-300">{assay.ampliconSizeBp} bp</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* ======================================================== */}
        {/* 3. PHYSICAL FRONT CHASSIS CONTROLS & MECHANICAL BUTTONS  */}
        {/* ======================================================== */}
        <div className="mt-6 pt-5 border-t-2 border-slate-800/80 flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
          {/* Main Mechanical Push Buttons */}
          <div className="flex items-center gap-3">
            {status === 'RUNNING' ? (
              <button
                onClick={onPause}
                className="px-6 py-2.5 rounded-xl font-bold text-amber-300 bg-amber-950 hover:bg-amber-900 border-2 border-amber-600 shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all flex items-center gap-2 active:scale-95"
              >
                <Pause className="w-4 h-4 fill-amber-300" />
                PAUSAR
              </button>
            ) : (
              <button
                onClick={() => {
                  onStart();
                  setActiveScreen('run');
                }}
                disabled={steps.length === 0}
                className="px-6 py-2.5 rounded-xl font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 border-2 border-emerald-300 shadow-[0_0_18px_rgba(52,211,153,0.4)] transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                {status === 'PAUSED' ? 'REANUDAR' : 'INICIAR PROTOCOLO'}
              </button>
            )}

            <button
              onClick={onStop}
              disabled={status === 'IDLE' || status === 'COMPLETED'}
              className="px-4 py-2.5 rounded-xl font-bold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 transition-all flex items-center gap-2 disabled:opacity-40"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              ABORTAR
            </button>

            <button
              onClick={onStepForward}
              disabled={status !== 'RUNNING' && status !== 'PAUSED'}
              className="px-3.5 py-2.5 rounded-xl font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 transition-all flex items-center gap-1.5 disabled:opacity-40"
              title="Avanzar forzado al siguiente paso térmico"
            >
              <FastForward className="w-3.5 h-3.5" />
              Saltar paso
            </button>
          </div>

          {/* Clock Rate Multiplier Hardware Dial */}
          <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
            <span className="text-slate-400 px-2 flex items-center gap-1 text-[11px]">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              Velocidad Peltier:
            </span>
            <div className="inline-flex gap-1">
              {[1, 2, 5, 10, 50].map((spd) => (
                <button
                  key={spd}
                  onClick={() => onChangeSpeed(spd)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all tabular-nums ${
                    speedMultiplier === spd
                      ? 'bg-cyan-500 text-slate-950 shadow-[0_0_8px_#06B6D4]'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
