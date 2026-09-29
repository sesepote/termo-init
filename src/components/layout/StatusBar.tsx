import React from 'react';
import { CyclerStatus } from '../../types/pcr';
import { Thermometer, ShieldCheck, Database, Info } from 'lucide-react';

interface StatusBarProps {
  cyclerStatus: CyclerStatus;
  currentTemp: number;
  lidTemp: number;
  protocolName: string;
  onOpenDemoNotice?: () => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  cyclerStatus,
  currentTemp,
  lidTemp,
  protocolName,
  onOpenDemoNotice,
}) => {
  return (
    <footer className="h-9 bg-slate-950 border-t border-slate-800 px-4 flex items-center justify-between text-[11px] font-mono text-slate-400 z-20 shrink-0 select-none">
      {/* Left zone: Instrument telemetry */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <Thermometer className="w-3.5 h-3.5 text-cyan-400" />
          <span>Bloque:</span>
          <span className="font-semibold text-cyan-300 tabular-nums">
            {currentTemp.toFixed(1)} °C
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-1.5">
          <span>Tapa:</span>
          <span className="font-semibold text-slate-300 tabular-nums">
            {lidTemp.toFixed(1)} °C
          </span>
        </div>

        <div className="hidden md:flex items-center gap-1.5 border-l border-slate-800 pl-4 text-slate-400">
          <span>Protocolo:</span>
          <span className="text-slate-200 truncate max-w-[200px]" title={protocolName}>
            {protocolName}
          </span>
        </div>
      </div>

      {/* Right zone: System engine versions & DEMO DATA indicator */}
      <div className="flex items-center gap-3">
        <div className="hidden lg:flex items-center gap-3 text-[10px] text-slate-400">
          <span>Knowledge v1.4</span>
          <span aria-hidden="true">·</span>
          <span>Rules v2.1</span>
          <span aria-hidden="true">·</span>
          <span>Calc v1.2</span>
        </div>

        {/* DEMO DATA Badge (Mandatory Requirement) */}
        <button
          onClick={onOpenDemoNotice}
          className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 hover:text-slate-300 border border-slate-800 hover:border-slate-700 transition-colors text-[10px] font-medium tracking-wide"
          title="Los datos mostrados corresponden a modelos ficticios para entrenamiento pedagógico"
        >
          <Info className="w-3 h-3 text-cyan-400" />
          <span>DEMO DATA</span>
        </button>
      </div>
    </footer>
  );
};
