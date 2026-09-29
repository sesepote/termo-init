import React, { useState } from 'react';
import { ProtocolStep, AssayConfig, ProtocolValidation, TraceabilitySource } from '../../types/pcr';
import { calculateProtocolMetrics, validateProtocol } from '../../services/pcrEngine';
import { 
  Plus, 
  Trash2, 
  Copy, 
  ArrowUp, 
  ArrowDown, 
  Edit3, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Play, 
  RotateCcw, 
  Thermometer, 
  Clock, 
  RefreshCw, 
  Layers, 
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { StepEditModal } from '../common/StepEditModal';
import { ConfirmModal } from '../common/ConfirmModal';

interface ProgrammerViewProps {
  steps: ProtocolStep[];
  assay: AssayConfig;
  onUpdateSteps: (newSteps: ProtocolStep[]) => void;
  onLaunchSimulation: () => void;
  onInspectTraceability: (item: TraceabilitySource) => void;
}

export const ProgrammerView: React.FC<ProgrammerViewProps> = ({
  steps,
  assay,
  onUpdateSteps,
  onLaunchSimulation,
  onInspectTraceability,
}) => {
  const [editingStep, setEditingStep] = useState<ProtocolStep | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeletingStepId, setIsDeletingStepId] = useState<string | null>(null);

  const metrics = calculateProtocolMetrics(steps);
  const validation: ProtocolValidation = validateProtocol(steps, assay);

  // Row operations
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newSteps = [...steps];
    const temp = newSteps[index];
    newSteps[index] = newSteps[index - 1];
    newSteps[index - 1] = temp;
    // Re-assign order numbers
    newSteps.forEach((s, idx) => { s.order = idx + 1; });
    onUpdateSteps(newSteps);
  };

  const handleMoveDown = (index: number) => {
    if (index === steps.length - 1) return;
    const newSteps = [...steps];
    const temp = newSteps[index];
    newSteps[index] = newSteps[index + 1];
    newSteps[index + 1] = temp;
    newSteps.forEach((s, idx) => { s.order = idx + 1; });
    onUpdateSteps(newSteps);
  };

  const handleDuplicate = (step: ProtocolStep, index: number) => {
    const duplicated: ProtocolStep = {
      ...step,
      id: `step_${Date.now()}_dup`,
      notes: step.notes ? `${step.notes} (Copia)` : 'Paso duplicado',
    };
    const newSteps = [...steps];
    newSteps.splice(index + 1, 0, duplicated);
    newSteps.forEach((s, idx) => { s.order = idx + 1; });
    onUpdateSteps(newSteps);
  };

  const handleOpenEdit = (step: ProtocolStep) => {
    setEditingStep(step);
    setIsEditModalOpen(true);
  };

  const handleOpenAdd = () => {
    setEditingStep(null);
    setIsEditModalOpen(true);
  };

  const handleSaveStepModal = (savedStep: ProtocolStep) => {
    let newSteps = [...steps];
    if (editingStep) {
      newSteps = newSteps.map(s => s.id === savedStep.id ? savedStep : s);
    } else {
      savedStep.order = newSteps.length + 1;
      newSteps.push(savedStep);
    }
    newSteps.forEach((s, idx) => { s.order = idx + 1; });
    onUpdateSteps(newSteps);
    setIsEditModalOpen(false);
    setEditingStep(null);
  };

  const handleConfirmDelete = () => {
    if (!isDeletingStepId) return;
    const newSteps = steps.filter(s => s.id !== isDeletingStepId);
    newSteps.forEach((s, idx) => { s.order = idx + 1; });
    onUpdateSteps(newSteps);
    setIsDeletingStepId(null);
  };

  // SVG Thermal Profile curve generator
  const renderThermalProfileSVG = () => {
    if (steps.length === 0) return null;

    const width = 640;
    const height = 160;
    const padding = { top: 20, right: 30, bottom: 30, left: 45 };

    const minT = 0;
    const maxT = 105;

    const getY = (t: number) => {
      const clamped = Math.max(minT, Math.min(maxT, t));
      return height - padding.bottom - ((clamped - minT) / (maxT - minT)) * (height - padding.top - padding.bottom);
    };

    // Calculate segments
    const plotWidth = width - padding.left - padding.right;
    const segmentWidth = plotWidth / steps.length;

    let pathD = `M ${padding.left} ${getY(25)}`; // start at ambient
    const points: { x: number; y: number; step: ProtocolStep; midX: number }[] = [];

    steps.forEach((step, idx) => {
      const startX = padding.left + idx * segmentWidth;
      const endX = startX + segmentWidth;
      const stepY = getY(step.temperature);

      // ramp up to temp in first 25% of step width, hold for 75%
      const rampX = startX + segmentWidth * 0.25;
      pathD += ` L ${rampX} ${stepY} L ${endX} ${stepY}`;

      points.push({
        x: rampX,
        y: stepY,
        step,
        midX: (rampX + endX) / 2,
      });
    });

    // Detect cycle region (min and max x of inCycle steps)
    const cycleIndices = steps
      .map((s, idx) => (s.inCycle ? idx : -1))
      .filter(idx => idx !== -1);

    let cycleBracket = null;
    if (cycleIndices.length > 0) {
      const firstCycleIdx = Math.min(...cycleIndices);
      const lastCycleIdx = Math.max(...cycleIndices);
      const cycleStartX = padding.left + firstCycleIdx * segmentWidth + 5;
      const cycleEndX = padding.left + (lastCycleIdx + 1) * segmentWidth - 5;

      cycleBracket = (
        <g className="text-cyan-400">
          <path
            d={`M ${cycleStartX} 14 L ${cycleStartX} 8 L ${cycleEndX} 8 L ${cycleEndX} 14`}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="4 2"
          />
          <text
            x={(cycleStartX + cycleEndX) / 2}
            y="6"
            textAnchor="middle"
            className="text-[10px] font-mono fill-cyan-400 font-semibold"
          >
            {metrics.totalCycleCount} Ciclos
          </text>
        </g>
      );
    }

    return (
      <div className="relative w-full overflow-hidden bg-slate-950 border border-slate-800 rounded-lg p-3">
        <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between pb-2 border-b border-slate-900">
          <span>Perfil Térmico Programado</span>
          <span className="text-cyan-400">Rampa y mesetas térmicas</span>
        </div>

        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible select-none pt-2"
        >
          {/* Temperature Horizontal Reference Grid Lines */}
          {[95, 72, 60, 4].map(t => {
            const y = getY(t);
            return (
              <g key={t} className="text-slate-800">
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeDasharray="2 4"
                />
                <text
                  x={padding.left - 6}
                  y={y + 3}
                  textAnchor="end"
                  className="text-[9px] font-mono fill-slate-400"
                >
                  {t}°C
                </text>
              </g>
            );
          })}

          {/* Cycle bracket indicator */}
          {cycleBracket}

          {/* Ramp Profile Curve */}
          <path
            d={pathD}
            fill="none"
            stroke="#06B6D4"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data labels for each step */}
          {points.map((pt, idx) => (
            <g key={idx}>
              <circle
                cx={pt.midX}
                cy={pt.y}
                r="3.5"
                className="fill-slate-950 stroke-cyan-400 stroke-2"
              />
              <text
                x={pt.midX}
                y={pt.y > 60 ? pt.y - 8 : pt.y + 14}
                textAnchor="middle"
                className="text-[10px] font-mono fill-slate-200 font-semibold"
              >
                {pt.step.temperature}°C
              </text>
              <text
                x={pt.midX}
                y={height - 8}
                textAnchor="middle"
                className="text-[9px] font-mono fill-slate-400"
              >
                #{pt.step.order} {pt.step.durationSeconds ? `${pt.step.durationSeconds}s` : '∞'}
              </text>
            </g>
          ))}
        </svg>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Step Edit & Confirm Modals */}
      <StepEditModal
        isOpen={isEditModalOpen}
        step={editingStep}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingStep(null);
        }}
        onSave={handleSaveStepModal}
      />

      <ConfirmModal
        isOpen={!!isDeletingStepId}
        title="¿Eliminar este paso?"
        message="Esta acción no se puede deshacer. El paso será removido del ciclo de termociclado."
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeletingStepId(null)}
      />

      {/* Header & Top Action Bar */}
      <div className="border-b border-slate-800 pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <Thermometer className="w-5 h-5 text-cyan-400" />
            Programador del Termociclador
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Configuración de rampas térmicas, tiempos de permanencia y número de ciclos.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onLaunchSimulation()}
            disabled={!validation.isValid}
            className={`px-4 py-2 text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center gap-2 ${
              validation.isValid
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
            title={validation.isValid ? 'Iniciar simulación' : 'Corrija los errores del protocolo antes de simular'}
          >
            <Play className="w-4 h-4 fill-current" />
            Ejecutar Simulación
          </button>
        </div>
      </div>

      {/* SVG Interactive Thermal Profile Ramp */}
      {renderThermalProfileSVG()}

      {/* Main Grid: Protocol Table (left) & Lateral Summary / Validation (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Panel de Protocolo (8 cols) */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div>
              <h2 className="text-sm font-semibold text-slate-100">
                Pasos del Protocolo de Termociclado
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Tabla editable con control individual por fila
              </p>
            </div>
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              Añadir paso
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                  <th className="py-2.5 px-2.5 w-10 text-center">#</th>
                  <th className="py-2.5 px-3">Tipo de paso</th>
                  <th className="py-2.5 px-3 text-right">Temperatura</th>
                  <th className="py-2.5 px-3 text-right">Tiempo</th>
                  <th className="py-2.5 px-3 text-center">Ciclos</th>
                  <th className="py-2.5 px-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 font-sans">
                {steps.map((step, index) => (
                  <tr
                    key={step.id}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      step.inCycle ? 'bg-cyan-950/15' : ''
                    }`}
                  >
                    {/* Order # */}
                    <td className="py-3 px-2.5 text-center font-mono font-semibold text-slate-400">
                      {step.order}
                    </td>

                    {/* Step Type */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-200 capitalize">
                          {step.type.replace('_', ' ')}
                        </span>
                        {step.inCycle && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/50">
                            Ciclo
                          </span>
                        )}
                      </div>
                      {step.notes && (
                        <div className="text-[10px] text-slate-400 truncate max-w-xs mt-0.5">
                          {step.notes}
                        </div>
                      )}
                    </td>

                    {/* Temperature */}
                    <td className="py-3 px-3 text-right font-mono font-semibold text-cyan-300 text-sm tabular-nums">
                      {step.temperature} °C
                    </td>

                    {/* Duration */}
                    <td className="py-3 px-3 text-right font-mono text-slate-200 tabular-nums">
                      {step.durationSeconds ? `${step.durationSeconds} s` : '—'}
                    </td>

                    {/* Cycles */}
                    <td className="py-3 px-3 text-center font-mono text-slate-300 tabular-nums">
                      {step.inCycle ? step.cycles || metrics.totalCycleCount : '—'}
                    </td>

                    {/* Controls per row: Edit, Duplicate, Move up, Move down, Delete */}
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(step)}
                          className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded transition-colors"
                          title="Editar parámetros"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDuplicate(step, index)}
                          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
                          title="Duplicar paso"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          disabled={index === 0}
                          onClick={() => handleMoveUp(index)}
                          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          title="Mover arriba"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          disabled={index === steps.length - 1}
                          onClick={() => handleMoveDown(index)}
                          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          title="Mover abajo"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setIsDeletingStepId(step.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded transition-colors"
                          title="Eliminar paso"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Panel Lateral: Resumen del Protocolo y Validación (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Resumen del Protocolo (Required in Prompt) */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="text-xs uppercase tracking-wider font-mono text-slate-400 pb-2 border-b border-slate-800 flex items-center justify-between">
              <span>Resumen del Protocolo</span>
              <Layers className="w-4 h-4 text-cyan-400" />
            </div>

            <div className="mt-3 space-y-2.5 text-xs font-mono">
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-400 font-sans">Pasos:</span>
                <span className="text-slate-100 font-semibold tabular-nums">{metrics.stepCount}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-400 font-sans">Ciclos:</span>
                <span className="text-cyan-400 font-semibold tabular-nums">{metrics.totalCycleCount}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-400 font-sans">Duración estimada:</span>
                <span className="text-slate-100 font-semibold">{metrics.formattedDuration}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-400 font-sans">Temperatura máxima:</span>
                <span className="text-rose-400 font-semibold tabular-nums">{metrics.maxTemp} °C</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400 font-sans">Temperatura mínima:</span>
                <span className="text-blue-400 font-semibold tabular-nums">{metrics.minTemp} °C</span>
              </div>
            </div>
          </div>

          {/* Validación (Required in Prompt) */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="text-xs uppercase tracking-wider font-mono text-slate-400 pb-2 border-b border-slate-800 flex items-center justify-between">
              <span>Validación Bioinformática</span>
              {validation.isValid ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              )}
            </div>

            {/* Checklist */}
            <div className="mt-3 space-y-2 text-xs">
              <div className="flex items-center gap-2">
                {validation.validTemperatures ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span className={validation.validTemperatures ? 'text-slate-300' : 'text-rose-300'}>
                  Temperaturas válidas
                </span>
              </div>

              <div className="flex items-center gap-2">
                {validation.validDurations ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span className={validation.validDurations ? 'text-slate-300' : 'text-rose-300'}>
                  Tiempos válidos
                </span>
              </div>

              <div className="flex items-center gap-2">
                {validation.validCycles ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                )}
                <span className={validation.validCycles ? 'text-slate-300' : 'text-amber-300'}>
                  Número de ciclos válido
                </span>
              </div>

              <div className="flex items-center gap-2">
                {validation.validStructure ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span className={validation.validStructure ? 'text-slate-300' : 'text-rose-300'}>
                  Estructura válida
                </span>
              </div>

              <div className="flex items-center gap-2">
                {validation.compatibleComponents ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                )}
                <span className={validation.compatibleComponents ? 'text-slate-300' : 'text-amber-300'}>
                  Componentes compatibles
                </span>
              </div>
            </div>

            {/* Detailed Issues Display */}
            {validation.issues.length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-800 space-y-2">
                <div className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {validation.issues.length} {validation.issues.length === 1 ? 'problema encontrado' : 'problemas encontrados'}
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {validation.issues.map((issue, idx) => (
                    <div
                      key={idx}
                      className={`p-2 rounded text-[11px] border leading-relaxed ${
                        issue.level === 'error'
                          ? 'bg-rose-950/40 border-rose-800/60 text-rose-200'
                          : 'bg-amber-950/40 border-amber-800/60 text-amber-200'
                      }`}
                    >
                      <div className="font-medium">• {issue.message}</div>
                      {issue.recommendation && (
                        <div className="text-[10px] text-slate-400 mt-1 pl-2">
                          Sugerencia: {issue.recommendation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
