import React, { useState } from 'react';
import { 
  ExerciseItem, 
  ProtocolStep, 
  EvaluationResult, 
  TraceabilitySource 
} from '../../types/pcr';
import { 
  DEMO_PRIMERS, 
  DEMO_POLYMERASES, 
  DEMO_BUFFERS, 
  DEMO_CHEMISTRIES 
} from '../../services/knowledgeData';
import { evaluateExerciseSubmission } from '../../services/pcrEngine';
import { 
  GraduationCap, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft, 
  Clock, 
  Plus, 
  Edit3, 
  Trash2, 
  Copy, 
  ArrowUp, 
  ArrowDown,
  Layers,
  HelpCircle,
  Dna
} from 'lucide-react';
import { StepEditModal } from '../common/StepEditModal';
import { ConfirmModal } from '../common/ConfirmModal';

interface ExerciseRunnerViewProps {
  exercise: ExerciseItem;
  currentIndex: number;
  totalExercises: number;
  onBack: () => void;
  onCompleteExercise: (result: EvaluationResult) => void;
  onInspectTraceability: (item: TraceabilitySource) => void;
}

export const ExerciseRunnerView: React.FC<ExerciseRunnerViewProps> = ({
  exercise,
  currentIndex,
  totalExercises,
  onBack,
  onCompleteExercise,
  onInspectTraceability,
}) => {
  // Protocol state for construction/correction/configuration
  const [userSteps, setUserSteps] = useState<ProtocolStep[]>(
    exercise.initialProtocol ? JSON.parse(JSON.stringify(exercise.initialProtocol)) : [
      {
        id: 'user_st_1',
        order: 1,
        type: 'inicial',
        temperature: 95,
        durationSeconds: 180,
        inCycle: false,
      },
      {
        id: 'user_st_2',
        order: 2,
        type: 'desnaturalizacion',
        temperature: 95,
        durationSeconds: 30,
        cycles: 35,
        inCycle: true,
      },
      {
        id: 'user_st_3',
        order: 3,
        type: 'annealing',
        temperature: 55, // intentional deviation to encourage student editing
        durationSeconds: 30,
        cycles: 35,
        inCycle: true,
      },
      {
        id: 'user_st_4',
        order: 4,
        type: 'extension',
        temperature: 72,
        durationSeconds: 45,
        cycles: 35,
        inCycle: true,
      },
      {
        id: 'user_st_5',
        order: 5,
        type: 'extension_final',
        temperature: 72,
        durationSeconds: 300,
        inCycle: false,
      },
    ]
  );

  // For Identificación de errores: user checked steps
  const [selectedErrorStepIds, setSelectedErrorStepIds] = useState<string[]>([]);

  // For Selección: selected option id
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);

  // Modal states
  const [editingStep, setEditingStep] = useState<ProtocolStep | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deletingStepId, setDeletingStepId] = useState<string | null>(null);

  const fwd = DEMO_PRIMERS.find(p => p.id === exercise.assay.forwardPrimerId);
  const rev = DEMO_PRIMERS.find(p => p.id === exercise.assay.reversePrimerId);
  const poly = DEMO_POLYMERASES.find(p => p.id === exercise.assay.polymeraseId);
  const buf = DEMO_BUFFERS.find(p => p.id === exercise.assay.bufferId);
  const chem = DEMO_CHEMISTRIES.find(p => p.id === exercise.assay.chemistryId);

  // Table row controls
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const next = [...userSteps];
    const tmp = next[index];
    next[index] = next[index - 1];
    next[index - 1] = tmp;
    next.forEach((s, i) => { s.order = i + 1; });
    setUserSteps(next);
  };

  const handleMoveDown = (index: number) => {
    if (index === userSteps.length - 1) return;
    const next = [...userSteps];
    const tmp = next[index];
    next[index] = next[index + 1];
    next[index + 1] = tmp;
    next.forEach((s, i) => { s.order = i + 1; });
    setUserSteps(next);
  };

  const handleDuplicate = (step: ProtocolStep, index: number) => {
    const dup: ProtocolStep = { ...step, id: `step_${Date.now()}` };
    const next = [...userSteps];
    next.splice(index + 1, 0, dup);
    next.forEach((s, i) => { s.order = i + 1; });
    setUserSteps(next);
  };

  const handleSaveModal = (saved: ProtocolStep) => {
    let next = [...userSteps];
    if (editingStep) {
      next = next.map(s => s.id === saved.id ? saved : s);
    } else {
      saved.order = next.length + 1;
      next.push(saved);
    }
    next.forEach((s, i) => { s.order = i + 1; });
    setUserSteps(next);
    setIsEditModalOpen(false);
    setEditingStep(null);
  };

  const handleDeleteConfirm = () => {
    if (!deletingStepId) return;
    const next = userSteps.filter(s => s.id !== deletingStepId);
    next.forEach((s, i) => { s.order = i + 1; });
    setUserSteps(next);
    setDeletingStepId(null);
  };

  // Submission handler
  const handleSubmit = () => {
    if (exercise.type === 'identificacion') {
      // Compare selectedErrorStepIds with exercise.incorrectStepIds
      const expectedIncorrect = exercise.incorrectStepIds || [];
      const correctlyIdentified = selectedErrorStepIds.filter(id => expectedIncorrect.includes(id)).length;
      const falsePositives = selectedErrorStepIds.filter(id => !expectedIncorrect.includes(id)).length;

      let score = 0;
      if (expectedIncorrect.length > 0) {
        const ratio = (correctlyIdentified / expectedIncorrect.length);
        score = Math.max(0, Math.round(ratio * 100 - falsePositives * 20));
      }

      const evalResult: EvaluationResult = {
        score,
        statusText: score >= 90 ? 'CORRECTO' : score >= 60 ? 'PARCIALMENTE CORRECTO' : 'INCORRECTO',
        feedbackSummary: score >= 90
          ? '¡Excelente detección! Identificó con precisión los dos pasos fuera de norma (temperatura de annealing baja y tiempo insuficiente de extensión).'
          : 'Revisión incompleta: algunos pasos marcados eran correctos o se omitieron las desviaciones críticas de temperatura/tiempo.',
        comparisons: [
          {
            parameterName: 'Detección: Paso de Annealing Desviado',
            userValue: selectedErrorStepIds.includes('flt_3') ? 'Marcado como Error (✓)' : 'No marcado (✕)',
            expectedValue: 'Error crítico detectado',
            status: selectedErrorStepIds.includes('flt_3') ? 'correcto' : 'falta',
            ruleId: 'RULE-ANNEALING-004',
            explanation: 'El paso de Annealing a 50 °C se desvía más de 10 °C de la Tm de los cebadores (60 °C), provocando hibridaciones inespecíficas masivas.',
            sourceDoc: 'Consenso Internacional de PCR',
            sourceType: 'CALCULATED',
          },
          {
            parameterName: 'Detección: Extensión Demasiado Breve',
            userValue: selectedErrorStepIds.includes('flt_4') ? 'Marcado como Error (✓)' : 'No marcado (✕)',
            expectedValue: 'Error crítico detectado',
            status: selectedErrorStepIds.includes('flt_4') ? 'correcto' : 'falta',
            ruleId: 'RULE-EXTENSION-002',
            explanation: '10 segundos de extensión es insuficiente para sintetizar un amplicón de 500 pb con polimerasa estándar (velocidad de 60 s/kb, requiere ≥ 30 s).',
            sourceDoc: 'Kinetics de Enzima Taq',
            sourceType: 'REFERENCE',
          },
        ],
        completedAt: new Date().toISOString(),
        exerciseId: exercise.id,
        durationSeconds: 120,
      };

      onCompleteExercise(evalResult);
      return;
    }

    if (exercise.type === 'seleccion') {
      const selectedOpt = exercise.questionOptions?.find(o => o.id === selectedOptionId);
      const isCorrect = !!selectedOpt?.isCorrect;
      const score = isCorrect ? 100 : 35;

      const evalResult: EvaluationResult = {
        score,
        statusText: isCorrect ? 'CORRECTO' : 'INCORRECTO',
        feedbackSummary: isCorrect 
          ? 'Selección exacta. Los parámetros coinciden rigurosamente con la Tm calculada y la cinética de polimerización.'
          : 'Opción incorrecta. La combinación térmica seleccionada compromete la especificidad o la elongación completa.',
        comparisons: [
          {
            parameterName: 'Parámetros del Ciclo Térmico',
            userValue: selectedOpt?.text || 'No seleccionado',
            expectedValue: 'Desnaturalización 95°C (30s) · Annealing 60°C (30s) · Extensión 72°C (45s) [35 ciclos]',
            status: isCorrect ? 'correcto' : 'fuera_rango',
            ruleId: 'RULE-ANNEALING-004',
            explanation: selectedOpt?.explanation || 'Debe seleccionar una opción válida.',
            sourceDoc: 'Consenso Internacional de PCR',
            sourceType: 'REFERENCE',
          },
        ],
        completedAt: new Date().toISOString(),
        exerciseId: exercise.id,
        durationSeconds: 90,
      };

      onCompleteExercise(evalResult);
      return;
    }

    // Default flow (configuracion, correccion, construccion, diagnostico)
    const result = evaluateExerciseSubmission(userSteps, exercise.expectedProtocol, exercise.assay);
    onCompleteExercise(result);
  };

  return (
    <div className="space-y-6">
      {/* Modals */}
      <StepEditModal
        isOpen={isEditModalOpen}
        step={editingStep}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingStep(null);
        }}
        onSave={handleSaveModal}
      />

      <ConfirmModal
        isOpen={!!deletingStepId}
        title="¿Eliminar este paso?"
        message="Esta acción no se puede deshacer. Se eliminará del protocolo de respuesta."
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingStepId(null)}
      />

      {/* Header bar (Required in Prompt) */}
      <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={onBack}
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1.5 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Volver al catálogo de ejercicios
          </button>
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800/80">
              EJERCICIO {currentIndex.toString().padStart(2, '0')} / {totalExercises.toString().padStart(2, '0')}
            </span>
            <span className="text-xs font-mono text-slate-400">
              Tipo: <strong className="text-slate-200 capitalize">{exercise.type}</strong>
            </span>
            <span aria-hidden="true" className="text-slate-700">·</span>
            <span className="text-xs font-mono text-slate-400">
              Dificultad: <strong className="text-cyan-400">Nivel {exercise.difficulty}</strong>
            </span>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          className="px-5 py-2.5 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 self-start sm:self-auto"
        >
          <CheckCircle2 className="w-4 h-4" />
          Comprobar respuesta
        </button>
      </div>

      {/* Assay Components info card (Required in Prompt) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-2.5 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Dna className="w-3.5 h-3.5 text-cyan-400" />
            Información del Ensayo Proporcionado
          </span>
          <span className="text-slate-400 font-normal">
            Amplicón: <strong className="text-slate-200">{exercise.assay.ampliconSizeBp} bp</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
          <div className="p-2.5 bg-slate-950/70 border border-slate-800/80 rounded-lg">
            <div className="text-slate-400 text-[10px] font-mono uppercase">Primer Forward</div>
            <div className="font-semibold text-slate-200 truncate mt-0.5" title={fwd?.name}>
              {fwd?.name || 'Primer A'}
            </div>
            <div className="text-[10px] font-mono text-cyan-400 mt-1">Tm {fwd?.tmCalculated}°C</div>
          </div>

          <div className="p-2.5 bg-slate-950/70 border border-slate-800/80 rounded-lg">
            <div className="text-slate-400 text-[10px] font-mono uppercase">Primer Reverse</div>
            <div className="font-semibold text-slate-200 truncate mt-0.5" title={rev?.name}>
              {rev?.name || 'Primer B'}
            </div>
            <div className="text-[10px] font-mono text-cyan-400 mt-1">Tm {rev?.tmCalculated}°C</div>
          </div>

          <div className="p-2.5 bg-slate-950/70 border border-slate-800/80 rounded-lg">
            <div className="text-slate-400 text-[10px] font-mono uppercase">Polimerasa</div>
            <div className="font-semibold text-slate-200 truncate mt-0.5" title={poly?.name}>
              {poly?.name || 'Taq Recombinante'}
            </div>
            <div className="text-[10px] font-mono text-slate-400 mt-1">{poly?.extensionRateSecPerKb} s/kb</div>
          </div>

          <div className="p-2.5 bg-slate-950/70 border border-slate-800/80 rounded-lg">
            <div className="text-slate-400 text-[10px] font-mono uppercase">Buffer</div>
            <div className="font-semibold text-slate-200 truncate mt-0.5" title={buf?.name}>
              {buf?.name || 'Buffer Taq 10X'}
            </div>
            <div className="text-[10px] font-mono text-slate-400 mt-1">{buf?.mgConcentrationMm} mM Mg2+</div>
          </div>

          <div className="p-2.5 bg-slate-950/70 border border-slate-800/80 rounded-lg">
            <div className="text-slate-400 text-[10px] font-mono uppercase">Química</div>
            <div className="font-semibold text-slate-200 truncate mt-0.5" title={chem?.name}>
              {chem?.name || 'Incolora Agarosa'}
            </div>
            <div className="text-[10px] font-mono text-slate-400 mt-1 capitalize">{chem?.type}</div>
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-slate-800/60 text-xs text-slate-300 leading-relaxed">
          <strong>Enunciado:</strong> {exercise.description}
        </div>
      </div>

      {/* Main Interactive Work Area (Customized per Exercise Type) */}

      {/* TYPE 1: IDENTIFICACIÓN DE ERRORES */}
      {exercise.type === 'identificacion' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-sm font-semibold text-slate-100">
                Identificación de Pasos con Desviación Crítica
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Revise el protocolo y marque la casilla de los pasos que contienen errores técnicos.
              </p>
            </div>
            <span className="text-xs font-mono text-cyan-400">
              {selectedErrorStepIds.length} pasos marcados
            </span>
          </div>

          <div className="space-y-2">
            {userSteps.map((step) => {
              const isChecked = selectedErrorStepIds.includes(step.id);

              return (
                <label
                  key={step.id}
                  className={`w-full flex items-center justify-between p-3.5 rounded-lg border cursor-pointer transition-colors ${
                    isChecked
                      ? 'bg-rose-950/30 border-rose-600/80 text-rose-200'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedErrorStepIds([...selectedErrorStepIds, step.id]);
                        } else {
                          setSelectedErrorStepIds(selectedErrorStepIds.filter(id => id !== step.id));
                        }
                      }}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-rose-500 focus:ring-rose-500"
                    />
                    <div>
                      <div className="font-semibold text-xs flex items-center gap-2">
                        <span>Paso {step.order}:</span>
                        <span className="capitalize">{step.type.replace('_', ' ')}</span>
                        {step.inCycle && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                            Ciclo ({step.cycles}x)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono tabular-nums">
                    <span className="text-slate-300 font-semibold">{step.temperature} °C</span>
                    <span className="text-slate-400">{step.durationSeconds} s</span>
                    <span className={`text-[11px] font-sans font-medium px-2 py-0.5 rounded ${
                      isChecked ? 'bg-rose-900 text-rose-200' : 'text-slate-400'
                    }`}>
                      {isChecked ? 'Marcado como Incorrecto' : 'Paso Aceptado'}
                    </span>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* TYPE 2: SELECCIÓN MÚLTIPLE */}
      {exercise.type === 'seleccion' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="pb-3 border-b border-slate-800">
            <h2 className="text-sm font-semibold text-slate-100">
              Seleccione la Combinación Óptima de Parámetros
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Considere la Tm del par de cebadores ({fwd?.tmCalculated}°C y {rev?.tmCalculated}°C) y la longitud del amplicón ({exercise.assay.ampliconSizeBp} bp).
            </p>
          </div>

          <div className="space-y-3">
            {exercise.questionOptions?.map((opt) => (
              <label
                key={opt.id}
                className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                  selectedOptionId === opt.id
                    ? 'bg-cyan-950/40 border-cyan-500 ring-1 ring-cyan-500'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="option"
                  checked={selectedOptionId === opt.id}
                  onChange={() => setSelectedOptionId(opt.id)}
                  className="mt-1 w-4 h-4 text-cyan-500 bg-slate-900 border-slate-700 focus:ring-cyan-500"
                />
                <span className="text-xs font-medium text-slate-200 leading-relaxed font-mono">
                  {opt.text}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* TYPE 3: DIAGNÓSTICO MOLECULAR (GEL DE AGAROSA SIMULADO) */}
      {exercise.type === 'diagnostico' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-100">
                Simulación de Electroforesis en Gel de Agarosa (1.5%)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Observe el patrón de bandas del resultado y ajuste el protocolo para subsanar el artefacto.
              </p>
            </div>
            <span className="text-xs font-mono text-amber-400">
              Artefacto: {exercise.diagnosticData?.observedProblem}
            </span>
          </div>

          {/* Gel Simulator visual */}
          <div className="p-5 bg-slate-950 border border-slate-800 rounded-xl flex flex-col items-center">
            <div className="text-[11px] font-mono text-slate-400 mb-2">
              Transiluminador UV — Tinción con Bromuro de Etidio / GelRed
            </div>
            <div className="w-80 h-48 bg-slate-900 border-2 border-slate-700 rounded-lg p-3 flex justify-between relative shadow-inner">
              {/* Lane M: Marker */}
              <div className="flex-1 flex flex-col items-center justify-between border-r border-slate-800/80 pr-2">
                <span className="text-[10px] font-mono text-slate-400">M</span>
                <div className="w-full space-y-4 pt-2">
                  <div className="w-8 h-1 bg-cyan-400/90 mx-auto rounded-full" title="1000 bp" />
                  <div className="w-8 h-1 bg-cyan-400/90 mx-auto rounded-full" title="750 bp" />
                  <div className="w-8 h-1.5 bg-cyan-300 mx-auto rounded-full shadow-[0_0_6px_#06B6D4]" title="500 bp (Referencia)" />
                  <div className="w-8 h-1 bg-cyan-400/90 mx-auto rounded-full" title="250 bp" />
                  <div className="w-8 h-1 bg-cyan-400/90 mx-auto rounded-full" title="100 bp" />
                </div>
              </div>

              {/* Lane 1: Sample */}
              <div className="flex-1 flex flex-col items-center justify-between border-r border-slate-800/80 px-2">
                <span className="text-[10px] font-mono text-slate-400">C1</span>
                <div className="w-full space-y-8 pt-6">
                  {/* 500 bp target */}
                  <div className="w-10 h-1.5 bg-cyan-300 mx-auto rounded-full shadow-[0_0_6px_#06B6D4]" title="500 bp Diana" />
                  {/* 180 bp non-specific band! */}
                  <div className="w-9 h-1 bg-amber-400/80 mx-auto rounded-full shadow-[0_0_4px_#F59E0B]" title="180 bp Banda Inespecífica" />
                </div>
              </div>

              {/* Lane 2: Sample replicate */}
              <div className="flex-1 flex flex-col items-center justify-between px-2">
                <span className="text-[10px] font-mono text-slate-400">C2</span>
                <div className="w-full space-y-8 pt-6">
                  <div className="w-10 h-1.5 bg-cyan-300 mx-auto rounded-full shadow-[0_0_6px_#06B6D4]" title="500 bp Diana" />
                  <div className="w-9 h-1 bg-amber-400/80 mx-auto rounded-full shadow-[0_0_4px_#F59E0B]" title="180 bp Banda Inespecífica" />
                </div>
              </div>
            </div>

            <div className="mt-3 text-[11px] text-amber-300 font-mono text-center">
              ⚠ Se aprecia una banda inespecífica parásita de ~180 pb. Edite la tabla inferior para aumentar la astringencia de annealing.
            </div>
          </div>
        </div>
      )}

      {/* TYPE 4 & 5: CONSTRUCCIÓN, CONFIGURACIÓN & CORRECCIÓN */}
      {(exercise.type === 'construccion' || exercise.type === 'configuracion' || exercise.type === 'correccion' || exercise.type === 'diagnostico') && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-sm font-semibold text-slate-100">
                {exercise.type === 'correccion' ? 'Corrija los Errores del Protocolo' : 'Construcción del Programa Térmico'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {exercise.type === 'correccion'
                  ? 'Modifique directamente temperaturas o tiempos pulsando el icono de edición.'
                  : 'Añada y configure los pasos necesarios para completar el ciclo de amplificación.'}
              </p>
            </div>

            <button
              onClick={() => {
                setEditingStep(null);
                setIsEditModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Añadir paso
            </button>
          </div>

          {/* Steps table */}
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
                {userSteps.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500 text-xs font-mono">
                      No hay pasos configurados. Pulse "+ Añadir paso" para comenzar a construir el protocolo.
                    </td>
                  </tr>
                ) : (
                  userSteps.map((step, index) => (
                    <tr
                      key={step.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        step.inCycle ? 'bg-cyan-950/15' : ''
                      }`}
                    >
                      <td className="py-3 px-2.5 text-center font-mono font-semibold text-slate-400">
                        {step.order}
                      </td>
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
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-semibold text-cyan-300 text-sm tabular-nums">
                        {step.temperature} °C
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-200 tabular-nums">
                        {step.durationSeconds ? `${step.durationSeconds} s` : '—'}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-slate-300 tabular-nums">
                        {step.inCycle ? step.cycles || 35 : '—'}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setEditingStep(step);
                              setIsEditModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded transition-colors"
                            title="Editar parámetros"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDuplicate(step, index)}
                            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
                            title="Duplicar"
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
                            disabled={index === userSteps.length - 1}
                            onClick={() => handleMoveDown(index)}
                            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            title="Mover abajo"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingStepId(step.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
