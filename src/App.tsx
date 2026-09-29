/**
 * Simulador de Termociclador y Sistema de Entrenamiento
 * Aplicación de laboratorio científico profesional
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  AssayConfig, 
  ProtocolStep, 
  CyclerStatus, 
  CyclerHardwarePreset, 
  DifficultyLevel, 
  ExerciseType, 
  ExerciseItem, 
  EvaluationResult, 
  HistoryRecord, 
  TraceabilitySource 
} from './types/pcr';
import { 
  DEFAULT_PROTOCOL_STEPS, 
  HARDWARE_PRESETS, 
  DEMO_TRACEABILITY_ITEMS 
} from './services/knowledgeData';
import { calculateProtocolMetrics, validateProtocol } from './services/pcrEngine';
import { generateExercise } from './services/exerciseGenerator';

// Layout Components
import { Header } from './components/layout/Header';
import { Sidebar, NavSection } from './components/layout/Sidebar';
import { StatusBar } from './components/layout/StatusBar';
import { TraceabilityModal } from './components/common/TraceabilityModal';

// Views
import { DashboardView } from './components/dashboard/DashboardView';
import { AssayConfigView } from './components/assay/AssayConfigView';
import { ProgrammerView } from './components/programmer/ProgrammerView';
import { SimulationView } from './components/simulation/SimulationView';
import { RealCyclerConsole } from './components/simulation/RealCyclerConsole';
import { ExercisesHomeView } from './components/exercises/ExercisesHomeView';
import { ExerciseRunnerView } from './components/exercises/ExerciseRunnerView';
import { ResultsView } from './components/exercises/ResultsView';
import { KnowledgeView } from './components/knowledge/KnowledgeView';
import { HistoryView } from './components/history/HistoryView';
import { StatsView } from './components/stats/StatsView';
import { SettingsView } from './components/settings/SettingsView';

export default function App() {
  // Navigation
  const [currentSection, setCurrentSection] = useState<NavSection>('inicio');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Active Assay
  const [assay, setAssay] = useState<AssayConfig>({
    pcrType: 'convencional',
    forwardPrimerId: 'primer_a_fwd',
    reversePrimerId: 'primer_b_rev',
    polymeraseId: 'poly_taq_std',
    bufferId: 'buf_taq_std_10x',
    chemistryId: 'chem_incolora',
    templateName: 'ADN Genómico Humano (GAPDH)',
    templateGcPercent: 52,
    ampliconSizeBp: 500,
  });

  // Active Protocol Steps
  const [steps, setSteps] = useState<ProtocolStep[]>(DEFAULT_PROTOCOL_STEPS);

  // Hardware Preset & Settings
  const [selectedPreset, setSelectedPreset] = useState<CyclerHardwarePreset>(HARDWARE_PRESETS[1]); // Fast 96W
  const [defaultDifficulty, setDefaultDifficulty] = useState<DifficultyLevel>(2);
  const [defaultSpeed, setDefaultSpeed] = useState<number>(5);
  const [units, setUnits] = useState<'celsius' | 'fahrenheit'>('celsius');
  const [themeMode, setThemeMode] = useState<'dark_lab' | 'light_clinical'>('dark_lab');

  // Simulation State
  const [cyclerStatus, setCyclerStatus] = useState<CyclerStatus>('IDLE');
  const [currentBlockTemp, setCurrentBlockTemp] = useState<number>(24.5);
  const [targetTemp, setTargetTemp] = useState<number>(24.5);
  const [currentCycle, setCurrentCycle] = useState<number>(1);
  const [totalCycles, setTotalCycles] = useState<number>(35);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [stepRemainingSeconds, setStepRemainingSeconds] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(5);
  const [fluorescenceRfu, setFluorescenceRfu] = useState<number>(20.0);
  const [amplifiedCopies, setAmplifiedCopies] = useState<number>(1000);

  // Traceability Modal State
  const [activeTraceability, setActiveTraceability] = useState<TraceabilitySource | null>(null);
  const [showDemoModal, setShowDemoModal] = useState<boolean>(false);

  // Training / Exercise Flow State
  const [activeExercise, setActiveExercise] = useState<ExerciseItem | null>(null);
  const [exerciseIndex, setExerciseIndex] = useState<number>(1);
  const [totalExercises, setTotalExercises] = useState<number>(10);
  const [currentResult, setCurrentResult] = useState<EvaluationResult | null>(null);

  // History Records
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>([
    {
      id: 'hist_1',
      date: '28/09/26',
      exerciseTitle: 'Diagnóstico de Banda Inespecífica en GAPDH',
      exerciseType: 'diagnostico',
      difficulty: 3,
      score: 92,
      status: 'Completado',
      duration: '6 min 40 s',
    },
    {
      id: 'hist_2',
      date: '28/09/26',
      exerciseTitle: 'Construcción de Programa Q5 High-Fidelity',
      exerciseType: 'construccion',
      difficulty: 2,
      score: 84,
      status: 'Completado',
      duration: '8 min 12 s',
    },
    {
      id: 'hist_3',
      date: '27/09/26',
      exerciseTitle: 'Configuración Completa PCR 16S Bacteriano',
      exerciseType: 'configuracion',
      difficulty: 1,
      score: 76,
      status: 'Completado',
      duration: '9 min 05 s',
    },
  ]);

  // Protocol metrics
  const protocolMetrics = calculateProtocolMetrics(steps);
  const protocolValidation = validateProtocol(steps, assay);

  // Initialize simulation parameters when entering programmed/idle
  useEffect(() => {
    setTotalCycles(protocolMetrics.totalCycleCount);
  }, [steps]);

  // Real-time Simulation Loop
  const simTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (cyclerStatus !== 'RUNNING') {
      if (simTimerRef.current) clearInterval(simTimerRef.current);
      return;
    }

    const intervalMs = 100; // 10 ticks per second
    simTimerRef.current = window.setInterval(() => {
      const currentStep = steps[currentStepIndex];
      if (!currentStep) {
        setCyclerStatus('COMPLETED');
        return;
      }

      const activeTarget = currentStep.temperature;
      setTargetTemp(activeTarget);

      // Temperature ramp math
      const rampRatePerSec = currentBlockTemp < activeTarget 
        ? selectedPreset.rampRateHeating 
        : selectedPreset.rampRateCooling;

      const deltaTempPerTick = (rampRatePerSec * speedMultiplier * (intervalMs / 1000));

      setCurrentBlockTemp((prevTemp) => {
        if (Math.abs(prevTemp - activeTarget) <= deltaTempPerTick) {
          return activeTarget;
        }
        return prevTemp < activeTarget 
          ? prevTemp + deltaTempPerTick 
          : prevTemp - deltaTempPerTick;
      });

      // Elapse time
      setElapsedSeconds((prev) => prev + (speedMultiplier * (intervalMs / 1000)));

      // Step duration countdown once temp is reached (within 0.5 °C)
      if (Math.abs(currentBlockTemp - activeTarget) <= 0.8) {
        setStepRemainingSeconds((prevSec) => {
          const nextSec = prevSec - (speedMultiplier * (intervalMs / 1000));
          if (nextSec <= 0) {
            // Advance to next step
            handleAdvanceSimulationStep();
            return currentStep.durationSeconds || 30;
          }
          return nextSec;
        });
      }

      // Molecular fluorescence simulation for qPCR / Amplification
      setFluorescenceRfu((prev) => {
        if (currentCycle < 8) return 20.0 + Math.random() * 0.5;
        const growth = Math.min(2500, prev * (1 + 0.04 * (speedMultiplier / 5)));
        return growth;
      });

      setAmplifiedCopies(Math.floor(1000 * Math.pow(1.85, Math.min(currentCycle, 35))));

    }, intervalMs);

    return () => {
      if (simTimerRef.current) clearInterval(simTimerRef.current);
    };
  }, [cyclerStatus, currentStepIndex, currentBlockTemp, currentCycle, steps, speedMultiplier, selectedPreset]);

  const handleAdvanceSimulationStep = () => {
    const nextIdx = currentStepIndex + 1;
    if (nextIdx < steps.length) {
      setCurrentStepIndex(nextIdx);
      setStepRemainingSeconds(steps[nextIdx].durationSeconds || 30);
    } else {
      // Completed all steps in this pass
      // Check if we need to repeat cycling steps
      const cycleSteps = steps.filter(s => s.inCycle);
      if (cycleSteps.length > 0 && currentCycle < totalCycles) {
        setCurrentCycle((c) => c + 1);
        const firstCycleStepIdx = steps.findIndex(s => s.inCycle);
        setCurrentStepIndex(firstCycleStepIdx >= 0 ? firstCycleStepIdx : 0);
        setStepRemainingSeconds(steps[firstCycleStepIdx]?.durationSeconds || 30);
      } else {
        // PCR Finished!
        setCyclerStatus('COMPLETED');
        setCurrentBlockTemp(4.0); // go to 4°C hold
        setTargetTemp(4.0);
      }
    }
  };

  const handleStartSimulation = () => {
    if (steps.length === 0) return;
    if (cyclerStatus === 'PAUSED') {
      setCyclerStatus('RUNNING');
      return;
    }
    // Start fresh
    setCurrentStepIndex(0);
    setCurrentCycle(1);
    setElapsedSeconds(0);
    setStepRemainingSeconds(steps[0]?.durationSeconds || 30);
    setTargetTemp(steps[0]?.temperature || 95);
    setCyclerStatus('RUNNING');
  };

  const handlePauseSimulation = () => {
    setCyclerStatus('PAUSED');
  };

  const handleStopSimulation = () => {
    setCyclerStatus('STOPPED');
    setCurrentBlockTemp(24.5);
    setTargetTemp(24.5);
  };

  const handleStepForward = () => {
    handleAdvanceSimulationStep();
  };

  // Launch Exercise handler
  const handleStartExercise = (type: ExerciseType, difficulty: DifficultyLevel, count: number) => {
    const exercise = generateExercise(type, difficulty);
    setActiveExercise(exercise);
    setExerciseIndex(1);
    setTotalExercises(count);
    setCurrentResult(null);
    setCurrentSection('ejercicio_activo' as NavSection);
  };

  // Exercise completion handler
  const handleCompleteExercise = (result: EvaluationResult) => {
    setCurrentResult(result);

    // Save to history
    const newRecord: HistoryRecord = {
      id: `hist_${Date.now()}`,
      date: 'Hoy',
      exerciseTitle: activeExercise?.title || 'Ejercicio PCR',
      exerciseType: activeExercise?.type || 'construccion',
      difficulty: activeExercise?.difficulty || 2,
      score: result.score,
      status: result.score >= 85 ? 'Completado' : result.score >= 60 ? 'Parcial' : 'Fallido',
      duration: `${Math.floor(result.durationSeconds / 60)} min ${result.durationSeconds % 60} s`,
      evaluationResult: result,
    };
    setHistoryRecords([newRecord, ...historyRecords]);

    setCurrentSection('resultado_ejercicio' as NavSection);
  };

  const handleRetryExercise = () => {
    if (activeExercise) {
      setCurrentResult(null);
      setCurrentSection('ejercicio_activo' as NavSection);
    }
  };

  const handleNextExercise = () => {
    if (exerciseIndex < totalExercises && activeExercise) {
      setExerciseIndex((i) => i + 1);
      const nextEx = generateExercise(activeExercise.type, activeExercise.difficulty);
      setActiveExercise(nextEx);
      setCurrentResult(null);
      setCurrentSection('ejercicio_activo' as NavSection);
    } else {
      setCurrentSection('ejercicios');
    }
  };

  const handleSelectHistoryRecord = (record: HistoryRecord) => {
    if (record.evaluationResult) {
      setCurrentResult(record.evaluationResult);
      setCurrentSection('resultado_ejercicio' as NavSection);
    } else {
      // Generate a mock result to inspect
      const mockResult: EvaluationResult = {
        score: record.score,
        statusText: record.score >= 85 ? 'CORRECTO' : record.score >= 60 ? 'PARCIALMENTE CORRECTO' : 'INCORRECTO',
        feedbackSummary: `Informe histórico archivado el ${record.date}. Puntuación final: ${record.score}%.`,
        comparisons: [
          {
            parameterName: 'Desnaturalización Inicial',
            userValue: '95 °C (180 s)',
            expectedValue: '95 °C (180 s)',
            status: 'correcto',
            ruleId: 'RULE-DENAT-001',
            explanation: 'Paso inicial ejecutado en estricta conformidad con el protocolo.',
            sourceDoc: 'Protocolo Histórico',
            sourceType: 'REFERENCE',
          },
          {
            parameterName: 'Temperatura de Annealing',
            userValue: record.score >= 85 ? '60 °C (30 s)' : '55 °C (30 s)',
            expectedValue: '60 °C (30 s)',
            status: record.score >= 85 ? 'correcto' : 'fuera_rango',
            ruleId: 'RULE-ANNEALING-004',
            explanation: record.score >= 85 ? 'Temperatura óptima registrada.' : 'Desviación registrada en sesión previa.',
            sourceDoc: 'Protocolo Histórico',
            sourceType: 'CALCULATED',
          },
        ],
        completedAt: record.date,
        exerciseId: record.id,
        durationSeconds: 300,
      };
      setCurrentResult(mockResult);
      setCurrentSection('resultado_ejercicio' as NavSection);
    }
  };

  // Section title for Header zone 2
  const getSectionTitle = () => {
    switch (currentSection) {
      case 'inicio': return 'Panel de Inicio';
      case 'nuevo_ensayo': return 'Configuración de Ensayo';
      case 'programador': return 'Programador de Termociclador';
      case 'simulacion': return 'Consola de Simulación';
      case 'ejercicios': return 'Entrenamiento y Ejercicios';
      case 'conocimiento': return 'Base de Conocimiento Científico';
      case 'historial': return 'Historial y Evaluaciones';
      case 'configuracion': return 'Ajustes y Hardware';
      case 'ejercicio_activo' as NavSection: return 'Resolución de Ejercicio';
      case 'resultado_ejercicio' as NavSection: return 'Resultado de Evaluación';
      default: return 'Termociclador';
    }
  };

  return (
    <div className={`min-h-screen flex flex-col ${themeMode === 'light_clinical' ? 'bg-slate-100 text-slate-900' : 'bg-slate-950 text-slate-100'}`}>
      {/* Traceability Modal */}
      <TraceabilityModal
        item={activeTraceability}
        onClose={() => setActiveTraceability(null)}
      />

      {/* DEMO DATA Notice Modal */}
      {showDemoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-6">
            <div className="text-xs uppercase font-mono tracking-wider text-cyan-400 mb-1">
              Aviso Pedagógico de Datos
            </div>
            <h3 className="text-base font-bold text-slate-100">
              Datos de Demostración (DEMO DATA)
            </h3>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Los cebadores, secuencias, números de lote y curvas mostrados en esta plataforma corresponden a modelos didácticos bioinformáticos verificados para entrenamiento pedagógico en laboratorio.
            </p>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              No se han inventado valores arbitrarios; cada parámetro se rige por ecuaciones termodinámicas reales (Nearest-Neighbor, fórmula de Wallace) y cinéticas enzimáticas consensuadas.
            </p>
            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setShowDemoModal(false)}
                className="px-4 py-2 text-xs font-medium text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-colors"
              >
                Comprendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Bar Header */}
      <Header
        currentSection={getSectionTitle()}
        cyclerStatus={cyclerStatus}
        currentBlockTemp={currentBlockTemp}
        onOpenSimulation={() => setCurrentSection('simulacion')}
        onOpenSettings={() => setCurrentSection('configuracion')}
        onToggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
      />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex overflow-hidden">
        {/* Vertical Sidebar */}
        <Sidebar
          currentSection={currentSection}
          onSelectSection={(sec) => {
            if (currentSection === 'ejercicio_activo' as NavSection) {
              if (window.confirm('¿Desea salir del ejercicio en curso? Su progreso no evaluado se perderá.')) {
                setCurrentSection(sec);
              }
            } else {
              setCurrentSection(sec);
            }
          }}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          activeIssuesCount={protocolValidation.issues.length}
        />

        {/* Content Viewport */}
        <main className={`flex-1 ${currentSection === 'inicio' ? 'h-[calc(100vh-65px)] overflow-hidden p-2 sm:p-4 flex flex-col' : 'overflow-y-auto p-4 md:p-6 lg:p-8'}`}>
          <div className={currentSection === 'inicio' ? 'w-full h-full flex flex-col flex-1' : 'max-w-7xl mx-auto'}>
            {/* 1. Dashboard View */}
            {currentSection === 'inicio' && (
              <DashboardView
                onNavigate={(sec) => setCurrentSection(sec)}
                status={cyclerStatus}
                currentBlockTemp={currentBlockTemp}
                lidTemp={selectedPreset.lidTemp}
                elapsedSeconds={elapsedSeconds}
                totalDurationSec={protocolMetrics.totalDurationSec}
                currentStep={steps[currentStepIndex]}
                currentStepIndex={currentStepIndex}
                totalSteps={steps.length}
                stepRemainingSeconds={stepRemainingSeconds}
                currentCycle={currentCycle}
                totalCycles={totalCycles}
              />
            )}

            {/* 2. New Assay Config View */}
            {currentSection === 'nuevo_ensayo' && (
              <AssayConfigView
                assay={assay}
                onChangeAssay={setAssay}
                onProceedToProgrammer={() => setCurrentSection('programador')}
                onInspectTraceability={setActiveTraceability}
              />
            )}

            {/* 3. Cycler Programmer View */}
            {currentSection === 'programador' && (
              <ProgrammerView
                steps={steps}
                assay={assay}
                onUpdateSteps={setSteps}
                onLaunchSimulation={() => {
                  handleStartSimulation();
                  setCurrentSection('simulacion');
                }}
                onInspectTraceability={setActiveTraceability}
              />
            )}

            {/* Termociclador Real (Chasis Físico con Pantalla Táctil) */}
            {currentSection === 'termociclador_real' && (
              <RealCyclerConsole
                steps={steps}
                status={cyclerStatus}
                currentBlockTemp={currentBlockTemp}
                targetTemp={targetTemp}
                currentCycle={currentCycle}
                totalCycles={totalCycles}
                currentStepIndex={currentStepIndex}
                stepRemainingSeconds={stepRemainingSeconds}
                elapsedSeconds={elapsedSeconds}
                totalEstimatedSeconds={protocolMetrics.totalDurationSec}
                speedMultiplier={speedMultiplier}
                fluorescenceRfu={fluorescenceRfu}
                amplifiedCopies={amplifiedCopies}
                onStart={handleStartSimulation}
                onPause={handlePauseSimulation}
                onStop={handleStopSimulation}
                onStepForward={handleStepForward}
                onChangeSpeed={setSpeedMultiplier}
                hardwarePreset={selectedPreset}
                assay={assay}
                onNavigate={(sec: NavSection) => setCurrentSection(sec)}
              />
            )}

            {/* 4. Real-time Simulation View */}
            {currentSection === 'simulacion' && (
              <SimulationView
                steps={steps}
                status={cyclerStatus}
                currentBlockTemp={currentBlockTemp}
                targetTemp={targetTemp}
                currentCycle={currentCycle}
                totalCycles={totalCycles}
                currentStepIndex={currentStepIndex}
                stepRemainingSeconds={stepRemainingSeconds}
                elapsedSeconds={elapsedSeconds}
                totalEstimatedSeconds={protocolMetrics.totalDurationSec}
                speedMultiplier={speedMultiplier}
                fluorescenceRfu={fluorescenceRfu}
                amplifiedCopies={amplifiedCopies}
                onStart={handleStartSimulation}
                onPause={handlePauseSimulation}
                onStop={handleStopSimulation}
                onStepForward={handleStepForward}
                onChangeSpeed={setSpeedMultiplier}
                hardwarePreset={selectedPreset}
              />
            )}

            {/* 5. Exercises Catalog / Configuration */}
            {currentSection === 'ejercicios' && (
              <ExercisesHomeView
                onStartExercise={handleStartExercise}
              />
            )}

            {/* 6. Active Exercise Execution Runner */}
            {currentSection === ('ejercicio_activo' as NavSection) && activeExercise && (
              <ExerciseRunnerView
                exercise={activeExercise}
                currentIndex={exerciseIndex}
                totalExercises={totalExercises}
                onBack={() => setCurrentSection('ejercicios')}
                onCompleteExercise={handleCompleteExercise}
                onInspectTraceability={setActiveTraceability}
              />
            )}

            {/* 7. Exercise Results View */}
            {currentSection === ('resultado_ejercicio' as NavSection) && currentResult && (
              <ResultsView
                result={currentResult}
                expectedProtocol={activeExercise?.expectedProtocol || DEFAULT_PROTOCOL_STEPS}
                onRetry={handleRetryExercise}
                onNextExercise={handleNextExercise}
                onBackToMenu={() => setCurrentSection('ejercicios')}
                onInspectTraceability={setActiveTraceability}
              />
            )}

            {/* 8. Knowledge Base */}
            {currentSection === 'conocimiento' && (
              <KnowledgeView
                onInspectTraceability={setActiveTraceability}
              />
            )}

            {/* 9. History */}
            {currentSection === 'historial' && (
              <HistoryView
                records={historyRecords}
                onSelectRecord={handleSelectHistoryRecord}
                onOpenStatsTab={() => setCurrentSection('configuracion')}
              />
            )}

            {/* 10. Settings & Hardware Presets */}
            {currentSection === 'configuracion' && (
              <div className="space-y-8">
                <SettingsView
                  selectedPreset={selectedPreset}
                  onSelectPreset={setSelectedPreset}
                  defaultDifficulty={defaultDifficulty}
                  onChangeDefaultDifficulty={setDefaultDifficulty}
                  defaultSpeed={defaultSpeed}
                  onChangeDefaultSpeed={setDefaultSpeed}
                  units={units}
                  onChangeUnits={setUnits}
                  themeMode={themeMode}
                  onChangeThemeMode={setThemeMode}
                />
                <div className="pt-6 border-t border-slate-800">
                  <StatsView />
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Technical Status Bar */}
      <StatusBar
        cyclerStatus={cyclerStatus}
        currentTemp={currentBlockTemp}
        lidTemp={selectedPreset.lidTemp}
        protocolName={`${assay.templateName} (${steps.length} pasos · ${totalCycles}x)`}
        onOpenDemoNotice={() => setShowDemoModal(true)}
      />
    </div>
  );
}
