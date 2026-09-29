/**
 * PCR Thermal Cycler & Training System Types
 * Professional Scientific Laboratory Simulation
 */

export type PCRType = 
  | 'convencional'
  | 'qpcr_tiempo_real'
  | 'alta_fidelidad'
  | 'touchdown'
  | 'multiplex';

export type StepType = 
  | 'inicial'
  | 'desnaturalizacion'
  | 'annealing'
  | 'extension'
  | 'extension_final'
  | 'hold';

export interface ProtocolStep {
  id: string;
  order: number;
  type: StepType;
  temperature: number; // in °C
  durationSeconds: number; // in seconds (0 for hold indefinite)
  cycles?: number; // number of cycles if in repeated block
  inCycle: boolean; // whether this step belongs to the recurring amplification cycle
  rampRate?: number; // °C/s (default 3.0)
  sourceOrigin?: DataSourceType;
  sourceReference?: string;
  notes?: string;
}

export type DataSourceType = 
  | 'REFERENCE' 
  | 'CALCULATED' 
  | 'EXPERIMENTAL' 
  | 'DEMO_DATA';

export interface TraceabilitySource {
  parameterName: string;
  value: string | number;
  unit?: string;
  type: DataSourceType;
  sourceName: string;
  document: string;
  manufacturer?: string;
  date: string;
  version: string;
  method: string;
  ruleId?: string;
}

export interface Primer {
  id: string;
  name: string;
  direction: 'forward' | 'reverse';
  sequence: string;
  length: number;
  gcPercent: number;
  tmCalculated: number; // °C
  tmOrigin: DataSourceType;
  recommendedAnnealing: number; // °C
  annealingOrigin: DataSourceType;
  sourceDocument: string;
  targetGene: string;
}

export interface Polymerase {
  id: string;
  name: string;
  manufacturer: string;
  extensionRateSecPerKb: number; // seconds per kb
  fidelityRatioVsTaq: number; // e.g. 100x for Q5
  hasProofreading: boolean; // 3' -> 5' exonuclease
  optimalExtensionTemp: number; // 68-72 °C
  initialActivationSec: number; // hot-start requirement (0 if non-hotstart)
  recommendedDenatTemp: number; // 94-98 °C
  sourceOrigin: DataSourceType;
  sourceDocument: string;
}

export interface BufferReagent {
  id: string;
  name: string;
  manufacturer: string;
  mgConcentrationMm: number; // standard 1.5 - 2.0 mM
  hasGcEnhancer: boolean;
  recommendedUse: string;
  sourceOrigin: DataSourceType;
}

export interface ChemistryReagent {
  id: string;
  name: string;
  type: 'incolora' | 'intercalante' | 'sonda' | 'evagreen';
  excitationNm?: number;
  emissionNm?: number;
  description: string;
  sourceOrigin: DataSourceType;
}

export interface AssayConfig {
  pcrType: PCRType;
  forwardPrimerId: string;
  reversePrimerId: string;
  polymeraseId: string;
  bufferId: string;
  chemistryId: string;
  templateName: string;
  templateGcPercent: number;
  ampliconSizeBp: number;
}

export type CompatibilityStatus = 'compatible' | 'revisar' | 'incompatible';

export interface CompatibilityReport {
  overall: CompatibilityStatus;
  items: {
    title: string;
    status: CompatibilityStatus;
    message: string;
    ruleId: string;
  }[];
}

export interface ValidationIssue {
  stepOrder?: number;
  level: 'error' | 'warning' | 'info';
  message: string;
  ruleId: string;
  recommendation?: string;
}

export interface ProtocolValidation {
  isValid: boolean;
  issues: ValidationIssue[];
  validTemperatures: boolean;
  validDurations: boolean;
  validCycles: boolean;
  validStructure: boolean;
  compatibleComponents: boolean;
}

export type CyclerStatus = 
  | 'IDLE' 
  | 'PROGRAMMED' 
  | 'RUNNING' 
  | 'PAUSED' 
  | 'COMPLETED' 
  | 'STOPPED' 
  | 'ERROR';

export interface SimulationState {
  status: CyclerStatus;
  currentStepIndex: number;
  currentCycle: number;
  totalCycles: number;
  currentBlockTemp: number;
  targetTemp: number;
  lidTemp: number;
  isLidHeated: boolean;
  stepRemainingSeconds: number;
  totalElapsedSeconds: number;
  totalEstimatedSeconds: number;
  speedMultiplier: number;
  fluorescenceRfu: number; // for qPCR curve simulation
  amplifiedCopies: number;
}

export type ExerciseType = 
  | 'configuracion'
  | 'identificacion'
  | 'correccion'
  | 'seleccion'
  | 'construccion'
  | 'diagnostico';

export type DifficultyLevel = 1 | 2 | 3 | 4;

export interface ExerciseItem {
  id: string;
  type: ExerciseType;
  difficulty: DifficultyLevel;
  title: string;
  description: string;
  assay: AssayConfig;
  initialProtocol?: ProtocolStep[];
  expectedProtocol: ProtocolStep[];
  incorrectStepIds?: string[]; // for identificacion
  questionOptions?: {
    id: string;
    text: string;
    isCorrect: boolean;
    explanation: string;
  }[]; // for seleccion
  diagnosticData?: {
    observedProblem: string;
    gelElectrophoresis: {
      markerLanes: number[];
      sampleLanes: { lane: number; bandSizesBp: number[]; intensity: 'alta' | 'baja' | 'difusa' | 'inespecifica' }[];
    };
    meltCurvePeakTemp?: number;
    recommendedAdjustment: string;
  };
}

export type ParameterEvaluationStatus = 
  | 'correcto'
  | 'en_rango'
  | 'fuera_rango'
  | 'invalido'
  | 'falta'
  | 'no_aplicable';

export interface ParameterComparison {
  parameterName: string;
  userValue: string;
  expectedValue: string;
  status: ParameterEvaluationStatus;
  ruleId: string;
  explanation: string;
  sourceDoc: string;
  sourceType: DataSourceType;
}

export interface EvaluationResult {
  score: number; // 0 - 100
  statusText: 'CORRECTO' | 'PARCIALMENTE CORRECTO' | 'INCORRECTO';
  feedbackSummary: string;
  comparisons: ParameterComparison[];
  completedAt: string;
  exerciseId: string;
  durationSeconds: number;
}

export interface KnowledgeItem {
  id: string;
  category: 'primers' | 'polimerasas' | 'buffers' | 'quimicas' | 'ensayos' | 'protocolos' | 'reglas' | 'fuentes';
  name: string;
  type: string;
  source: string;
  manufacturer?: string;
  updatedYear: number;
  version: string;
  properties: Record<string, string | number>;
  rulesAssociated: string[];
  referenceProtocols: string[];
  sourceDocument: string;
  notes?: string;
}

export interface HistoryRecord {
  id: string;
  date: string;
  exerciseTitle: string;
  exerciseType: ExerciseType;
  difficulty: DifficultyLevel;
  score: number;
  status: 'Completado' | 'Parcial' | 'Fallido';
  duration: string;
  evaluationResult?: EvaluationResult;
}

export interface CyclerHardwarePreset {
  id: string;
  name: string;
  rampRateHeating: number; // °C/s
  rampRateCooling: number; // °C/s
  format: '96_well' | '384_well' | 'fast_tube';
  lidTemp: number; // °C
}
