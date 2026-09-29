import React, { useState } from 'react';
import { 
  EvaluationResult, 
  ParameterComparison, 
  ProtocolStep, 
  TraceabilitySource 
} from '../../types/pcr';
import { 
  Award, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  HelpCircle, 
  BookOpen, 
  RotateCcw, 
  ArrowRight, 
  CheckSquare, 
  Eye, 
  Dna,
  FileCheck2,
  ChevronRight
} from 'lucide-react';

interface ResultsViewProps {
  result: EvaluationResult;
  expectedProtocol: ProtocolStep[];
  onRetry: () => void;
  onNextExercise: () => void;
  onBackToMenu: () => void;
  onInspectTraceability: (item: TraceabilitySource) => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({
  result,
  expectedProtocol,
  onRetry,
  onNextExercise,
  onBackToMenu,
  onInspectTraceability,
}) => {
  // Currently inspected parameter for explanation
  const [selectedParamIndex, setSelectedParamIndex] = useState<number>(0);
  // Solution drawer toggle
  const [showSolution, setShowSolution] = useState<boolean>(false);

  const activeComparison: ParameterComparison | undefined = result.comparisons[selectedParamIndex] || result.comparisons[0];

  const getStatusBadge = (status: ParameterComparison['status']) => {
    switch (status) {
      case 'correcto':
        return (
          <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Correcto
          </span>
        );
      case 'en_rango':
        return (
          <span className="inline-flex items-center gap-1 text-emerald-300 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Dentro de rango
          </span>
        );
      case 'fuera_rango':
        return (
          <span className="inline-flex items-center gap-1 text-rose-400 font-medium">
            <XCircle className="w-3.5 h-3.5" />
            Fuera de rango
          </span>
        );
      case 'invalido':
        return (
          <span className="inline-flex items-center gap-1 text-rose-500 font-medium">
            <XCircle className="w-3.5 h-3.5" />
            Inválido
          </span>
        );
      case 'falta':
        return (
          <span className="inline-flex items-center gap-1 text-amber-400 font-medium">
            <AlertTriangle className="w-3.5 h-3.5" />
            Falta
          </span>
        );
      case 'no_aplicable':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-slate-500 font-medium">
            — No aplicable
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-0.5">
            Evaluación Pedagógica
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <Award className="w-5 h-5 text-cyan-400" />
            Resultado del Ejercicio
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowSolution(!showSolution)}
            className="px-3.5 py-1.5 text-xs font-medium text-cyan-300 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-800/80 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Eye className="w-3.5 h-3.5" />
            {showSolution ? 'Ocultar solución' : 'Consultar solución esperada'}
          </button>
          <button
            onClick={onRetry}
            className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reintentar
          </button>
          <button
            onClick={onNextExercise}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
          >
            Siguiente ejercicio
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Score Card (Required in Prompt: 87 / 100 PARCIALMENTE CORRECTO) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-slate-400">
              Calificación Final
            </div>
            <div className="flex items-baseline gap-3 mt-1">
              <span className="text-5xl font-mono font-bold text-slate-100 tabular-nums">
                {result.score}
              </span>
              <span className="text-2xl font-mono text-slate-500 font-normal">/ 100</span>
            </div>

            <div className="mt-2 flex items-center gap-2.5">
              <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold tracking-wider border ${
                result.statusText === 'CORRECTO'
                  ? 'bg-emerald-950/90 text-emerald-400 border-emerald-800/80'
                  : result.statusText === 'PARCIALMENTE CORRECTO'
                  ? 'bg-amber-950/90 text-amber-400 border-amber-800/80'
                  : 'bg-rose-950/90 text-rose-400 border-rose-800/80'
              }`}>
                {result.statusText}
              </span>
            </div>

            <p className="text-xs text-slate-300 mt-3 max-w-xl leading-relaxed">
              {result.feedbackSummary}
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs font-mono shrink-0 md:w-64">
            <div className="flex justify-between items-center py-1 border-b border-slate-900">
              <span className="text-slate-400 font-sans">Parámetros Evaluados:</span>
              <span className="text-slate-100 font-semibold">{result.comparisons.length}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-900">
              <span className="text-slate-400 font-sans">Aciertos exactos:</span>
              <span className="text-emerald-400 font-semibold">
                {result.comparisons.filter(c => c.status === 'correcto' || c.status === 'en_rango').length}
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400 font-sans">Desviaciones:</span>
              <span className="text-rose-400 font-semibold">
                {result.comparisons.filter(c => c.status === 'fuera_rango' || c.status === 'falta').length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Solution Panel if toggled (Section 15: VENTANA DE SOLUCIÓN) */}
      {showSolution && (
        <div className="bg-slate-950 border-2 border-cyan-800/60 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <div className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider">
                Solución Esperada de Referencia
              </div>
              <h3 className="text-base font-bold text-slate-100">
                PROTOCOLO ESPERADO
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-400">
              35 ciclos de amplificación
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            {expectedProtocol.map((step) => (
              <div
                key={step.id}
                className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between font-mono text-[11px] mb-1">
                    <span className="font-semibold text-slate-400">Paso {step.order}</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-800 text-cyan-300 border border-slate-700">
                      {step.sourceOrigin || 'REFERENCE'}
                    </span>
                  </div>
                  <div className="font-semibold text-slate-200 capitalize">
                    {step.type.replace('_', ' ')}
                  </div>
                  <div className="text-cyan-400 font-mono text-sm font-bold mt-1 tabular-nums">
                    {step.temperature} °C — {step.durationSeconds ? `${step.durationSeconds} s` : 'Hold'}
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-800 text-[10px] text-slate-400 truncate" title={step.sourceReference}>
                  Fuente: {step.sourceReference || 'Protocolo Estándar'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comparison Table & Scientific Explanation (Required in Prompt) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Comparison Table (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="text-sm font-semibold text-slate-100">
              Análisis Detallado por Parámetro
            </h3>
            <span className="text-[11px] text-slate-400">
              Haga clic en una fila para ver su explicación
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                  <th className="py-2.5 px-3">Parámetro</th>
                  <th className="py-2.5 px-3 text-right">Tu valor</th>
                  <th className="py-2.5 px-3 text-right">Esperado</th>
                  <th className="py-2.5 px-3 text-right">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 font-sans">
                {result.comparisons.map((comp, idx) => {
                  const isSelected = selectedParamIndex === idx;

                  return (
                    <tr
                      key={idx}
                      onClick={() => setSelectedParamIndex(idx)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-cyan-950/40 text-cyan-200' : 'hover:bg-slate-800/50'
                      }`}
                    >
                      <td className="py-3 px-3 font-medium text-slate-200">
                        {comp.parameterName}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-medium tabular-nums">
                        {comp.userValue}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-400 tabular-nums">
                        {comp.expectedValue}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {getStatusBadge(comp.status)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detailed Explanation Panel for Clicked Parameter (5 cols) (Required in Prompt) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="text-xs font-mono uppercase tracking-wider text-slate-400">
              Explicación Científica del Parámetro
            </div>
            {activeComparison && (
              <span className="text-[10px] font-mono text-cyan-400">
                {activeComparison.sourceType}
              </span>
            )}
          </div>

          {activeComparison ? (
            <div className="space-y-4 text-xs">
              <div>
                <h4 className="text-base font-bold text-slate-100 uppercase tracking-wide">
                  {activeComparison.parameterName}
                </h4>
              </div>

              {/* Readouts */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950 border border-slate-800 rounded-lg font-mono">
                <div>
                  <div className="text-[10px] text-slate-400">Tu valor:</div>
                  <div className="text-sm font-bold text-slate-100 tabular-nums mt-0.5">
                    {activeComparison.userValue}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-400">Rango / Esperado:</div>
                  <div className="text-sm font-bold text-emerald-400 tabular-nums mt-0.5">
                    {activeComparison.expectedValue}
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between p-2.5 bg-slate-950/70 border border-slate-800/80 rounded-lg">
                <span className="text-slate-400">Estado de Validación:</span>
                {getStatusBadge(activeComparison.status)}
              </div>

              {/* Detailed Explanation Text */}
              <div className="space-y-1">
                <div className="text-slate-400 font-semibold text-[11px]">
                  Explicación Técnica:
                </div>
                <p className="text-slate-300 leading-relaxed text-xs">
                  {activeComparison.explanation}
                </p>
              </div>

              {/* Rule & Source */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2 text-[11px] font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Regla utilizada:</span>
                  <span className="text-cyan-400 font-semibold">{activeComparison.ruleId}</span>
                </div>
                <div className="flex items-center justify-between pt-1.5 border-t border-slate-900">
                  <span className="text-slate-400">Fuente:</span>
                  <span className="text-slate-200 truncate max-w-[200px]" title={activeComparison.sourceDoc}>
                    {activeComparison.sourceDoc}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-500 text-xs">
              Seleccione un parámetro de la tabla para inspeccionar su explicación.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
