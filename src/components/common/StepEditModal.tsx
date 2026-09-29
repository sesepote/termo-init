import React, { useState, useEffect } from 'react';
import { ProtocolStep, StepType, DataSourceType } from '../../types/pcr';
import { X, Info, Flame, Clock, RefreshCw, BookmarkCheck } from 'lucide-react';

interface StepEditModalProps {
  isOpen: boolean;
  step: ProtocolStep | null;
  onClose: () => void;
  onSave: (step: ProtocolStep) => void;
}

const STEP_REFERENCE_GUIDE: Record<StepType, {
  label: string;
  recommendedRange: string;
  defaultTemp: number;
  defaultDuration: number;
  source: string;
  origin: DataSourceType;
  description: string;
}> = {
  inicial: {
    label: 'Desnaturalización inicial',
    recommendedRange: '94–98 °C (120–600 s)',
    defaultTemp: 95,
    defaultDuration: 180,
    source: 'Protocolo de referencia estándar Taq / Hot-Start',
    origin: 'REFERENCE',
    description: 'Separación completa de cadenas de ADN molde bicatenario y liberación/activación de la ADN polimerasa.',
  },
  desnaturalizacion: {
    label: 'Desnaturalización en ciclo',
    recommendedRange: '94–98 °C (15–45 s)',
    defaultTemp: 95,
    defaultDuration: 30,
    source: 'Cinética de desnaturalización térmica Sambrook & Russell',
    origin: 'REFERENCE',
    description: 'Apertura de la doble hélice para permitir el acceso de los oligonucleótidos cebadores.',
  },
  annealing: {
    label: 'Hibridación / Annealing',
    recommendedRange: '50–65 °C (según Tm de cebadores, 20–45 s)',
    defaultTemp: 60,
    defaultDuration: 30,
    source: 'Calculado por termodinámica de vecino próximo (SantaLucia)',
    origin: 'CALCULATED',
    description: 'Unión complementaria específica de los cebadores forward y reverse a sus dianas molde.',
  },
  extension: {
    label: 'Extensión / Polimerización',
    recommendedRange: '68–74 °C (típicamente 72 °C, 30–120 s/kb)',
    defaultTemp: 72,
    defaultDuration: 45,
    source: 'Kinetics de ADN Polimerasa termofílica',
    origin: 'REFERENCE',
    description: 'Síntesis enzimática 5\'->3\' de la nueva cadena de ADN a partir del extremo 3\'-OH del cebador.',
  },
  extension_final: {
    label: 'Extensión final',
    recommendedRange: '68–74 °C (300–600 s)',
    defaultTemp: 72,
    defaultDuration: 300,
    source: 'Protocolo de fidelidad y poliadenilación terminal',
    origin: 'REFERENCE',
    description: 'Garantiza que todos los amplicones incompletos finalicen su elongación y añade adenina 3\' si procede.',
  },
  hold: {
    label: 'Hold / Conservación',
    recommendedRange: '4–10 °C (Indefinido)',
    defaultTemp: 4,
    defaultDuration: 0,
    source: 'Preservación molecular post-reacción',
    origin: 'REFERENCE',
    description: 'Enfriamiento del bloque térmico para proteger los productos de PCR de nucleasas hasta su retirada.',
  },
};

export const StepEditModal: React.FC<StepEditModalProps> = ({
  isOpen,
  step,
  onClose,
  onSave,
}) => {
  const [type, setType] = useState<StepType>('desnaturalizacion');
  const [temperature, setTemperature] = useState<number>(95);
  const [durationSeconds, setDurationSeconds] = useState<number>(30);
  const [cycles, setCycles] = useState<number>(35);
  const [inCycle, setInCycle] = useState<boolean>(true);
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (step) {
      setType(step.type);
      setTemperature(step.temperature);
      setDurationSeconds(step.durationSeconds);
      setCycles(step.cycles || 35);
      setInCycle(step.inCycle);
      setNotes(step.notes || '');
    } else {
      setType('desnaturalizacion');
      setTemperature(95);
      setDurationSeconds(30);
      setCycles(35);
      setInCycle(true);
      setNotes('');
    }
  }, [step, isOpen]);

  if (!isOpen) return null;

  const currentRef = STEP_REFERENCE_GUIDE[type];

  const handleTypeChange = (newType: StepType) => {
    setType(newType);
    const refData = STEP_REFERENCE_GUIDE[newType];
    setTemperature(refData.defaultTemp);
    setDurationSeconds(refData.defaultDuration);
    if (newType === 'inicial' || newType === 'extension_final' || newType === 'hold') {
      setInCycle(false);
    } else {
      setInCycle(true);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedStep: ProtocolStep = {
      id: step ? step.id : `step_${Date.now()}`,
      order: step ? step.order : 1,
      type,
      temperature: Number(temperature),
      durationSeconds: type === 'hold' ? 0 : Number(durationSeconds),
      cycles: inCycle ? Number(cycles) : undefined,
      inCycle,
      sourceOrigin: currentRef.origin,
      sourceReference: currentRef.source,
      notes,
    };
    onSave(updatedStep);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-semibold text-slate-100">
              {step ? `Editar Paso #${step.order}` : 'Añadir Nuevo Paso'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Configuración de temperatura, duración e inclusión en ciclos
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="py-4 space-y-4">
          {/* Tipo de paso */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Tipo de paso
            </label>
            <select
              value={type}
              onChange={(e) => handleTypeChange(e.target.value as StepType)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 transition-colors"
            >
              <option value="inicial">Desnaturalización inicial</option>
              <option value="desnaturalizacion">Desnaturalización en ciclo</option>
              <option value="annealing">Hibridación / Annealing</option>
              <option value="extension">Extensión / Elongación</option>
              <option value="extension_final">Extensión final</option>
              <option value="hold">Hold / Conservación</option>
            </select>
          </div>

          {/* Temperature & Duration Inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-rose-400" />
                Temperatura (°C)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="105"
                  required
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono font-medium text-slate-100 focus:outline-none focus:border-cyan-500 transition-colors tabular-nums"
                />
                <span className="absolute right-3 top-2.5 text-xs font-mono text-slate-400">°C</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                Duración (segundos)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="1"
                  min="0"
                  max="7200"
                  disabled={type === 'hold'}
                  value={type === 'hold' ? 0 : durationSeconds}
                  onChange={(e) => setDurationSeconds(parseInt(e.target.value, 10) || 0)}
                  className={`w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono font-medium text-slate-100 focus:outline-none focus:border-cyan-500 transition-colors tabular-nums ${
                    type === 'hold' ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                />
                <span className="absolute right-3 top-2.5 text-xs font-mono text-slate-400">
                  {type === 'hold' ? 'Indef.' : 'seg'}
                </span>
              </div>
            </div>
          </div>

          {/* Cycling options */}
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={inCycle}
                  onChange={(e) => setInCycle(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-900"
                />
                <span>Incluir en ciclo de amplificación repetido</span>
              </label>
              {inCycle && (
                <span className="text-xs font-mono text-cyan-400">Paso Cíclico</span>
              )}
            </div>

            {inCycle && (
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400 flex items-center gap-1.5">
                  <RefreshCw className="w-3 h-3 text-cyan-400" />
                  Número total de ciclos:
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={cycles}
                    onChange={(e) => setCycles(parseInt(e.target.value, 10) || 35)}
                    className="w-20 bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs font-mono font-medium text-slate-100 text-right focus:outline-none focus:border-cyan-500 tabular-nums"
                  />
                  <span className="text-xs text-slate-400">ciclos</span>
                </div>
              </div>
            )}
          </div>

          {/* Reference Info Card (Required by prompt) */}
          <div className="p-3.5 bg-slate-800/40 border border-slate-700/60 rounded-lg text-xs space-y-2">
            <div className="flex items-center justify-between font-mono">
              <span className="text-slate-400 uppercase tracking-wider text-[11px] flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-cyan-400" />
                Información de referencia
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-cyan-300 border border-cyan-800/50">
                {currentRef.origin}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <span className="text-slate-400 block text-[11px]">Rango recomendado:</span>
                <span className="font-mono text-slate-200 font-medium">{currentRef.recommendedRange}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Fuente:</span>
                <span className="text-slate-300 truncate block" title={currentRef.source}>{currentRef.source}</span>
              </div>
            </div>

            <p className="text-slate-400 text-[11px] leading-relaxed pt-1 border-t border-slate-700/40">
              {currentRef.description}
            </p>
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <BookmarkCheck className="w-3.5 h-3.5" />
              Guardar cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
