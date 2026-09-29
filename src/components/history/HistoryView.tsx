import React, { useState } from 'react';
import { HistoryRecord, ExerciseType, DifficultyLevel } from '../../types/pcr';
import { 
  History, 
  Filter, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  ArrowRight,
  TrendingUp,
  Award,
  Clock,
  RotateCcw
} from 'lucide-react';

interface HistoryViewProps {
  records: HistoryRecord[];
  onSelectRecord: (record: HistoryRecord) => void;
  onOpenStatsTab?: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  records,
  onSelectRecord,
  onOpenStatsTab,
}) => {
  const [filterType, setFilterType] = useState<string>('todos');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('todas');
  const [filterStatus, setFilterStatus] = useState<string>('todos');

  const filteredRecords = records.filter(rec => {
    const matchesType = filterType === 'todos' || rec.exerciseType === filterType;
    const matchesDiff = filterDifficulty === 'todas' || rec.difficulty.toString() === filterDifficulty;
    const matchesStatus = filterStatus === 'todos' || rec.status === filterStatus;
    return matchesType && matchesDiff && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <History className="w-5 h-5 text-cyan-400" />
            Historial de Ejercicios y Ensayos
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Registro cronológico de evaluaciones pedagógicas, puntuaciones obtenidas y diagnósticos.
          </p>
        </div>

        {onOpenStatsTab && (
          <button
            onClick={onOpenStatsTab}
            className="px-3.5 py-1.5 text-xs font-semibold text-cyan-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5 self-start sm:self-auto"
          >
            <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
            Ver Estadísticas y Gráficos
          </button>
        )}
      </div>

      {/* Filters bar (Required in Prompt: Tipo, Dificultad, Fecha, Resultado) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
          <Filter className="w-3.5 h-3.5 text-cyan-400" />
          Filtros:
        </div>

        {/* Tipo */}
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
        >
          <option value="todos">Todos los tipos</option>
          <option value="configuracion">Configuración</option>
          <option value="identificacion">Identificación</option>
          <option value="correccion">Corrección</option>
          <option value="seleccion">Selección</option>
          <option value="construccion">Construcción</option>
          <option value="diagnostico">Diagnóstico</option>
        </select>

        {/* Dificultad */}
        <select
          value={filterDifficulty}
          onChange={(e) => setFilterDifficulty(e.target.value)}
          className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
        >
          <option value="todas">Todas las dificultades</option>
          <option value="1">Nivel 1 (Básico)</option>
          <option value="2">Nivel 2 (Intermedio)</option>
          <option value="3">Nivel 3 (Avanzado)</option>
          <option value="4">Nivel 4 (Experto)</option>
        </select>

        {/* Estado */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
        >
          <option value="todos">Todos los estados</option>
          <option value="Completado">Completado</option>
          <option value="Parcial">Parcial</option>
          <option value="Fallido">Fallido</option>
        </select>

        {(filterType !== 'todos' || filterDifficulty !== 'todas' || filterStatus !== 'todos') && (
          <button
            onClick={() => {
              setFilterType('todos');
              setFilterDifficulty('todas');
              setFilterStatus('todos');
            }}
            className="text-[11px] text-cyan-400 hover:text-cyan-300 ml-auto transition-colors"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Main Table: MIS EJERCICIOS (Required in Prompt) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <h2 className="text-sm font-semibold text-slate-100">
            MIS EJERCICIOS
          </h2>
          <span className="text-xs font-mono text-slate-400">
            {filteredRecords.length} registros encontrados
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                <th className="py-2.5 px-3">Fecha</th>
                <th className="py-2.5 px-3">Ejercicio</th>
                <th className="py-2.5 px-3">Tipo</th>
                <th className="py-2.5 px-3 text-center">Dificultad</th>
                <th className="py-2.5 px-3 text-right">Resultado</th>
                <th className="py-2.5 px-3 text-center">Estado</th>
                <th className="py-2.5 px-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 font-sans">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 font-mono text-xs">
                    No hay registros que coincidan con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 font-mono text-slate-400 text-[11px]">
                      {row.date}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-200">
                      {row.exerciseTitle}
                    </td>
                    <td className="py-3 px-3 text-slate-300 capitalize">
                      {row.exerciseType}
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-medium text-cyan-400">
                      Nivel {row.difficulty}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold tabular-nums">
                      <span className={
                        row.score >= 85 ? 'text-emerald-400' : row.score >= 70 ? 'text-amber-400' : 'text-rose-400'
                      }>
                        {row.score} %
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${
                        row.status === 'Completado'
                          ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                          : row.status === 'Parcial'
                          ? 'bg-amber-950/80 text-amber-400 border border-amber-800/60'
                          : 'bg-rose-950/80 text-rose-400 border border-rose-800/60'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => onSelectRecord(row)}
                        className="px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors"
                      >
                        Ver detalle
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
