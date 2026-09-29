import React from 'react';
import { CyclerStatus } from '../../types/pcr';
import { Activity, Play, Sliders, User, Menu } from 'lucide-react';

interface HeaderProps {
  currentSection: string;
  cyclerStatus: CyclerStatus;
  currentBlockTemp: number;
  onOpenSimulation: () => void;
  onOpenSettings: () => void;
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentSection,
  cyclerStatus,
  currentBlockTemp,
  onOpenSimulation,
  onOpenSettings,
  onToggleSidebar,
}) => {
  const getStatusBadge = () => {
    switch (cyclerStatus) {
      case 'RUNNING':
        return (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono font-medium bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            RUNNING · {currentBlockTemp.toFixed(1)} °C
          </span>
        );
      case 'PAUSED':
        return (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono font-medium bg-amber-950/80 text-amber-400 border border-amber-800/80">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            PAUSED
          </span>
        );
      case 'PROGRAMMED':
        return (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono font-medium bg-cyan-950/80 text-cyan-400 border border-cyan-800/80">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            PROGRAMMED
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono font-medium bg-blue-950/80 text-blue-400 border border-blue-800/80">
            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
            COMPLETED
          </span>
        );
      case 'IDLE':
      default:
        return (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono font-medium bg-slate-800 text-slate-400 border border-slate-700">
            <span className="w-2 h-2 rounded-full bg-slate-500"></span>
            IDLE · 24.5 °C
          </span>
        );
    }
  };

  return (
    <header className="h-14 bg-slate-900 border-b border-slate-800 px-4 md:px-6 flex items-center justify-between z-30 shrink-0">
      {/* Zone 1: Brand title & Mobile toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          title="Menú lateral"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 font-bold text-sm shadow-xs">
            TC
          </div>
          <span className="text-base font-bold tracking-tight text-white whitespace-nowrap">
            Simulador de Termociclador
          </span>
        </div>
      </div>

      {/* Zone 2: Navigation context / Telemetry */}
      <div className="hidden lg:flex items-center gap-4 text-xs font-medium text-slate-400">
        <span className="text-slate-300 font-semibold">{currentSection}</span>
        <span aria-hidden="true" className="text-slate-600">|</span>
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Estado Bloque:</span>
          {getStatusBadge()}
        </div>
      </div>

      {/* Zone 3: Actions */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={onOpenSimulation}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-100 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap"
          title="Abrir consola de simulación"
        >
          <Play className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400" />
          <span className="hidden sm:inline">Consola</span> Simulación
        </button>

        <button
          onClick={onOpenSettings}
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          title="Configuración del Sistema"
        >
          <Sliders className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
          <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400 text-xs font-medium">
            <User className="w-3.5 h-3.5" />
          </div>
          <div className="hidden xl:block text-left text-xs">
            <div className="text-slate-200 font-medium leading-none">Operador Lab</div>
            <div className="text-[10px] text-slate-500 leading-none mt-1">Sesión Activa</div>
          </div>
        </div>
      </div>
    </header>
  );
};
