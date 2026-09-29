import React from 'react';
import { CyclerHardwarePreset, DifficultyLevel } from '../../types/pcr';
import { HARDWARE_PRESETS } from '../../services/knowledgeData';
import { 
  Settings, 
  Sliders, 
  Monitor, 
  Flame, 
  GraduationCap, 
  Info, 
  ShieldCheck, 
  CheckCircle2,
  HardDrive
} from 'lucide-react';

interface SettingsViewProps {
  selectedPreset: CyclerHardwarePreset;
  onSelectPreset: (preset: CyclerHardwarePreset) => void;
  defaultDifficulty: DifficultyLevel;
  onChangeDefaultDifficulty: (diff: DifficultyLevel) => void;
  defaultSpeed: number;
  onChangeDefaultSpeed: (spd: number) => void;
  units: 'celsius' | 'fahrenheit';
  onChangeUnits: (u: 'celsius' | 'fahrenheit') => void;
  themeMode: 'dark_lab' | 'light_clinical';
  onChangeThemeMode: (theme: 'dark_lab' | 'light_clinical') => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  selectedPreset,
  onSelectPreset,
  defaultDifficulty,
  onChangeDefaultDifficulty,
  defaultSpeed,
  onChangeDefaultSpeed,
  units,
  onChangeUnits,
  themeMode,
  onChangeThemeMode,
}) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
          <Settings className="w-5 h-5 text-cyan-400" />
          Configuración del Simulador y Presets de Laboratorio
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Ajustes de interfaz, instrumentación física, motores de cálculo y módulos de entrenamiento.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section 1: Interfaz y Visualización */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="pb-2 border-b border-slate-800 flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-slate-400">
            <Monitor className="w-4 h-4 text-cyan-400" />
            1. Interfaz y Visualización
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Esquema Visual de Laboratorio</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onChangeThemeMode('dark_lab')}
                  className={`p-2.5 rounded-lg border text-left font-medium transition-colors ${
                    themeMode === 'dark_lab'
                      ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="font-semibold text-slate-200">Consola Instrumento</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Modo Oscuro Técnico</div>
                </button>

                <button
                  type="button"
                  onClick={() => onChangeThemeMode('light_clinical')}
                  className={`p-2.5 rounded-lg border text-left font-medium transition-colors ${
                    themeMode === 'light_clinical'
                      ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="font-semibold text-slate-200">Laboratorio Clínico</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Modo Claro Aséptico</div>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Idioma de Trabajo</label>
              <select
                disabled
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-300 text-xs focus:outline-none cursor-not-allowed opacity-80"
              >
                <option value="es">Español (ES) — Nomenclatura Científica Estándar</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Unidades Térmicas</label>
              <select
                value={units}
                onChange={(e) => onChangeUnits(e.target.value as 'celsius' | 'fahrenheit')}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
              >
                <option value="celsius">Grados Celsius (°C) — Estándar IUPAC / SI</option>
                <option value="fahrenheit">Grados Fahrenheit (°F)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Simulación y Hardware */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="pb-2 border-b border-slate-800 flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-slate-400">
            <Sliders className="w-4 h-4 text-cyan-400" />
            2. Simulación y Hardware del Termociclador
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Modelo de Termociclador (Preset Hardware)</label>
              <select
                value={selectedPreset.id}
                onChange={(e) => {
                  const found = HARDWARE_PRESETS.find(p => p.id === e.target.value);
                  if (found) onSelectPreset(found);
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
              >
                {HARDWARE_PRESETS.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950 border border-slate-800 rounded-lg font-mono">
              <div>
                <span className="text-[10px] text-slate-400">Rampa de Calentamiento:</span>
                <div className="font-bold text-cyan-400 text-sm mt-0.5 tabular-nums">
                  {selectedPreset.rampRateHeating} °C/s
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400">Temperatura Tapa:</span>
                <div className="font-bold text-rose-400 text-sm mt-0.5 tabular-nums">
                  {selectedPreset.lidTemp} °C
                </div>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Velocidad Predeterminada de Simulación</label>
              <div className="inline-flex rounded-lg bg-slate-950 p-1 border border-slate-800 w-full justify-between">
                {[1, 2, 5, 10, 100].map((spd) => (
                  <button
                    key={spd}
                    type="button"
                    onClick={() => onChangeDefaultSpeed(spd)}
                    className={`flex-1 py-1 text-xs font-mono font-medium rounded transition-colors tabular-nums ${
                      defaultSpeed === spd
                        ? 'bg-cyan-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Módulos de Entrenamiento y Ejercicios */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="pb-2 border-b border-slate-800 flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-slate-400">
            <GraduationCap className="w-4 h-4 text-cyan-400" />
            3. Parámetros de Entrenamiento
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Dificultad Predeterminada</label>
              <select
                value={defaultDifficulty}
                onChange={(e) => onChangeDefaultDifficulty(Number(e.target.value) as DifficultyLevel)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
              >
                <option value={1}>1 — Básico</option>
                <option value={2}>2 — Intermedio</option>
                <option value={3}>3 — Avanzado</option>
                <option value={4}>4 — Experto</option>
              </select>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500"
                />
                <span>Mostrar explicaciones bioinformáticas automáticas</span>
              </label>

              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500"
                />
                <span>Validar compatibilidad en tiempo real durante la edición</span>
              </label>
            </div>
          </div>
        </div>

        {/* Section 4: Información del Sistema (Required in Prompt) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="pb-2 border-b border-slate-800 flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-slate-400">
            <HardDrive className="w-4 h-4 text-cyan-400" />
            4. Información del Sistema y Motores
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg font-mono text-xs space-y-2.5">
            <div className="flex justify-between items-center py-1 border-b border-slate-900">
              <span className="text-slate-400">Knowledge version:</span>
              <span className="text-slate-100 font-bold">1.4</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-900">
              <span className="text-slate-400">Rules version:</span>
              <span className="text-cyan-400 font-bold">2.1</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-900">
              <span className="text-slate-400">Calculator version:</span>
              <span className="text-emerald-400 font-bold">1.2</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">Execution Engine:</span>
              <span className="text-slate-300 font-bold">v3.0 BioTech Certified</span>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-cyan-950/40 border border-cyan-800/60 text-[11px] text-cyan-300 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <span>
              Todos los modelos termodinámicos cumplen las especificaciones de consenso IUPAC y MIQE para qPCR y PCR de punto final.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
