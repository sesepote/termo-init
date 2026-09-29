import React, { useState } from 'react';
import { ExerciseType, DifficultyLevel } from '../../types/pcr';
import { EXERCISE_TYPES_INFO } from '../../services/exerciseGenerator';
import { 
  GraduationCap, 
  Settings2, 
  SlidersHorizontal, 
  CheckSquare, 
  Wrench, 
  ListFilter, 
  Hammer, 
  Microscope,
  ArrowRight,
  Sparkles,
  Cpu
} from 'lucide-react';

interface ExercisesHomeViewProps {
  onStartExercise: (type: ExerciseType, difficulty: DifficultyLevel, count: number) => void;
}

export const ExercisesHomeView: React.FC<ExercisesHomeViewProps> = ({ onStartExercise }) => {
  const [selectedType, setSelectedType] = useState<ExerciseType>('construccion');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(2);
  const [exerciseCount, setExerciseCount] = useState<number>(10);
  const [componentMode, setComponentMode] = useState<'automatico' | 'manual'>('automatico');
  const [seed, setSeed] = useState<string>('AUTO-GEN-2026');

  const getIconForType = (type: ExerciseType) => {
    switch (type) {
      case 'configuracion': return SlidersHorizontal;
      case 'identificacion': return CheckSquare;
      case 'correccion': return Wrench;
      case 'seleccion': return ListFilter;
      case 'construccion': return Hammer;
      case 'diagnostico': return Microscope;
    }
  };

  const handleLaunch = () => {
    onStartExercise(selectedType, difficulty, exerciseCount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-cyan-400" />
          Sistema de Entrenamiento PCR
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Seleccione la modalidad de entrenamiento y configure los parámetros de dificultad pedagógica.
        </p>
      </div>

      {/* 6 Exercise Type Cards (Required in Prompt) */}
      <div>
        <div className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-3">
          1. Modalidades de Ejercicio
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {EXERCISE_TYPES_INFO.map((item) => {
            const Icon = getIconForType(item.type);
            const isSelected = selectedType === item.type;

            return (
              <button
                key={item.type}
                type="button"
                onClick={() => setSelectedType(item.type)}
                className={`p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between group ${
                  isSelected
                    ? 'bg-cyan-950/40 border-cyan-500 shadow-md ring-1 ring-cyan-500/50'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <div className={`p-2 rounded-lg ${
                      isSelected ? 'bg-cyan-900/80 text-cyan-300' : 'bg-slate-800 text-slate-400 group-hover:text-slate-200'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      {item.badge}
                    </span>
                  </div>

                  <h2 className={`text-sm font-semibold mb-1 ${
                    isSelected ? 'text-cyan-300' : 'text-slate-200'
                  }`}>
                    {item.title}
                  </h2>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-4 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className={isSelected ? 'text-cyan-400 font-medium' : 'text-slate-400'}>
                    {isSelected ? '✓ Seleccionado' : 'Seleccionar'}
                  </span>
                  <ArrowRight className={`w-3.5 h-3.5 transition-transform ${
                    isSelected ? 'text-cyan-400 translate-x-1' : 'text-slate-400 group-hover:translate-x-0.5'
                  }`} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Configuration Section (Required in Prompt) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-cyan-400" />
            2. Configuración del Ejercicio
          </div>
          <span className="text-[11px] font-mono text-cyan-400">
            Generación Procedimental
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Tipo de Ejercicio seleccionado */}
          <div>
            <label className="block text-slate-400 mb-1">Tipo de Ejercicio</label>
            <div className="p-2 bg-slate-950 border border-slate-700 rounded-lg font-medium text-slate-200 capitalize">
              {selectedType}
            </div>
          </div>

          {/* Dificultad (1-4) */}
          <div>
            <label className="block text-slate-400 mb-1">Nivel de Dificultad</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(Number(e.target.value) as DifficultyLevel)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-medium focus:outline-none focus:border-cyan-500"
            >
              <option value={1}>1 — Básico (Taq estándar, 500 bp)</option>
              <option value={2}>2 — Intermedio (GAPDH, gradientes)</option>
              <option value={3}>3 — Avanzado (Q5 Alta Fidelidad / Hot-Start)</option>
              <option value={4}>4 — Experto (Plantillas alto GC &gt;65%)</option>
            </select>
          </div>

          {/* Número de ejercicios */}
          <div>
            <label className="block text-slate-400 mb-1">Número de Ejercicios</label>
            <input
              type="number"
              min="1"
              max="25"
              value={exerciseCount}
              onChange={(e) => setExerciseCount(parseInt(e.target.value, 10) || 5)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-cyan-500 tabular-nums"
            />
          </div>

          {/* Componentes */}
          <div>
            <label className="block text-slate-400 mb-1">Componentes de Ensayo</label>
            <select
              value={componentMode}
              onChange={(e) => setComponentMode(e.target.value as 'automatico' | 'manual')}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="automatico">Automático (Banco Certificado)</option>
              <option value="manual">Manual (Ensayo Actual)</option>
            </select>
          </div>
        </div>

        {/* Procedural Generation Seed display */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 gap-3 border-t border-slate-800/80">
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <Cpu className="w-3.5 h-3.5 text-slate-500" />
            <span>Semilla de Generación:</span>
            <span className="text-cyan-400 font-semibold">{seed}</span>
          </div>

          <button
            onClick={handleLaunch}
            className="px-5 py-2.5 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Generar y Comenzar Ejercicio
          </button>
        </div>
      </div>
    </div>
  );
};
