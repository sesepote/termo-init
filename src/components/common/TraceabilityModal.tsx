import React from 'react';
import { TraceabilitySource } from '../../types/pcr';
import { X, FileText, CheckCircle2, ShieldAlert, Cpu, Sparkles } from 'lucide-react';

interface TraceabilityModalProps {
  item: TraceabilitySource | null;
  onClose: () => void;
}

export const TraceabilityModal: React.FC<TraceabilityModalProps> = ({ item, onClose }) => {
  if (!item) return null;

  const getTypeBadge = () => {
    switch (item.type) {
      case 'CALCULATED':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-cyan-400">
            <Cpu className="w-3.5 h-3.5" />
            CALCULATED (Modelo Bioinformático)
          </span>
        );
      case 'REFERENCE':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            REFERENCE (Protocolo de Referencia)
          </span>
        );
      case 'EXPERIMENTAL':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-amber-400">
            <ShieldAlert className="w-3.5 h-3.5" />
            EXPERIMENTAL (Validación en Laboratorio)
          </span>
        );
      case 'DEMO_DATA':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-slate-400">
            <Sparkles className="w-3.5 h-3.5" />
            DEMO DATA (Dato de Demostración)
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div>
            <div className="text-xs uppercase tracking-wider font-mono text-slate-400 mb-1">
              Trazabilidad y Origen del Dato
            </div>
            <h3 className="text-lg font-semibold text-slate-100">
              {item.parameterName}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="py-4 space-y-4">
          {/* Main readout */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400">Valor Científico Registrado</div>
              <div className="text-2xl font-mono font-bold text-cyan-400 tabular-nums">
                {item.value} {item.unit && <span className="text-sm font-sans font-normal text-slate-400">{item.unit}</span>}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400 mb-1">Clasificación</div>
              {getTypeBadge()}
            </div>
          </div>

          {/* Detailed metadata grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-800/50 border border-slate-700/50 rounded-lg">
              <div className="text-slate-400 mb-0.5">Fuente / Entidad</div>
              <div className="font-medium text-slate-200">{item.sourceName}</div>
            </div>

            <div className="p-3 bg-slate-800/50 border border-slate-700/50 rounded-lg">
              <div className="text-slate-400 mb-0.5">Documento de Procedencia</div>
              <div className="font-medium text-slate-200">{item.document}</div>
            </div>

            {item.manufacturer && (
              <div className="p-3 bg-slate-800/50 border border-slate-700/50 rounded-lg">
                <div className="text-slate-400 mb-0.5">Fabricante / Proveedor</div>
                <div className="font-medium text-slate-200">{item.manufacturer}</div>
              </div>
            )}

            <div className="p-3 bg-slate-800/50 border border-slate-700/50 rounded-lg">
              <div className="text-slate-400 mb-0.5">Fecha y Versión</div>
              <div className="font-mono text-slate-200">{item.date} · Rev {item.version}</div>
            </div>
          </div>

          {/* Method and scientific rule */}
          <div className="p-3.5 bg-slate-800/40 border border-slate-700/40 rounded-lg space-y-2">
            <div>
              <div className="text-xs text-slate-400 font-medium">Método de obtención</div>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                {item.method}
              </p>
            </div>
            {item.ruleId && (
              <div className="pt-2 border-t border-slate-700/50 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Regla Asociada:</span>
                <span className="text-cyan-400 font-semibold">{item.ruleId}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-white bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
