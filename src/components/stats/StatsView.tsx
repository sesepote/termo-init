import React from 'react';
import { 
  TrendingUp, 
  Award, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  BarChart2, 
  Activity,
  Layers
} from 'lucide-react';

export const StatsView: React.FC = () => {
  // Score trend historical points (SVG sparkline / area)
  const scoreTrendData = [
    { session: 'S1', score: 68 },
    { session: 'S2', score: 72 },
    { session: 'S3', score: 76 },
    { session: 'S4', score: 74 },
    { session: 'S5', score: 82 },
    { session: 'S6', score: 80 },
    { session: 'S7', score: 88 },
    { session: 'S8', score: 85 },
    { session: 'S9', score: 92 },
    { session: 'S10', score: 96 },
  ];

  // Performance by exercise type
  const typePerformance = [
    { type: 'Configuración', avg: 88, count: 5 },
    { type: 'Identificación', avg: 85, count: 6 },
    { type: 'Corrección', avg: 79, count: 4 },
    { type: 'Selección', avg: 94, count: 4 },
    { type: 'Construcción', avg: 82, count: 3 },
    { type: 'Diagnóstico', avg: 80, count: 3 },
  ];

  // Performance by difficulty
  const difficultyPerformance = [
    { level: 'Nivel 1 (Básico)', avg: 94, color: 'bg-emerald-500' },
    { level: 'Nivel 2 (Intermedio)', avg: 86, color: 'bg-cyan-500' },
    { level: 'Nivel 3 (Avanzado)', avg: 78, color: 'bg-amber-500' },
    { level: 'Nivel 4 (Experto)', avg: 72, color: 'bg-rose-500' },
  ];

  // Most frequent mistakes
  const frequentMistakes = [
    { rule: 'RULE-ANNEALING-004', label: 'Desviación de Annealing (Ta vs Tm)', frequency: '38 % de fallos', impact: 'Inespecificidad' },
    { rule: 'RULE-EXTENSION-002', label: 'Tiempo de extensión insuficiente para amplicón', frequency: '26 % de fallos', impact: 'Banda trunca' },
    { rule: 'RULE-CYCLES-001', label: 'Ciclos fuera del rango exponencial (exceso/defecto)', frequency: '18 % de fallos', impact: 'Bajo rendimiento' },
    { rule: 'RULE-DENAT-001', label: 'Temperatura de desnaturalización incorrecta', frequency: '12 % de fallos', impact: 'Sin separación' },
    { rule: 'RULE-HOTSTART-003', label: 'Activación inicial Hot-Start omitida', frequency: '6 % de fallos', impact: 'Enzima inactiva' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-cyan-400" />
          Estadísticas y Análisis de Rendimiento
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Métricas cuantitativas de aprendizaje, evolución de puntuaciones y diagnóstico de errores recurrentes.
        </p>
      </div>

      {/* 4 Cards Required in Prompt */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>Ejercicios realizados</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-mono font-bold text-slate-100 mt-2 tabular-nums">
            25
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            En 10 sesiones evaluadas
          </div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>Puntuación media</span>
            <Award className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-mono font-bold text-cyan-400 mt-2 tabular-nums">
            84 %
          </div>
          <div className="text-[11px] text-emerald-400 mt-1">
            +16% de mejora progresiva
          </div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>Mejor resultado</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-mono font-bold text-emerald-400 mt-2 tabular-nums">
            96 %
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Alcanzado en Nivel 3
          </div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>Tiempo medio</span>
            <Clock className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl font-mono font-bold text-slate-100 mt-2 tabular-nums">
            8 min
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Por ejercicio resuelto
          </div>
        </div>
      </div>

      {/* SVG Score Evolution Chart (Required in Prompt) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">
              Evolución de Puntuación a lo Largo del Tiempo
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Curva de progresión técnica en las últimas 10 sesiones
            </p>
          </div>
          <span className="text-xs font-mono text-cyan-400">
            Tendencia Ascendente (+28 ptos)
          </span>
        </div>

        {/* SVG Chart */}
        <div className="h-48 w-full bg-slate-950 border border-slate-800 rounded-lg p-3 relative flex items-center justify-center">
          <svg viewBox="0 0 600 150" className="w-full h-full select-none overflow-visible">
            {/* Grid horizontal lines */}
            {[100, 80, 60, 40].map((val) => {
              const y = 140 - (val / 100) * 120;
              return (
                <g key={val} className="text-slate-800">
                  <line x1="40" y1={y} x2="580" y2={y} stroke="currentColor" strokeDasharray="2 4" />
                  <text x="32" y={y + 3} textAnchor="end" className="text-[9px] font-mono fill-slate-400">
                    {val}%
                  </text>
                </g>
              );
            })}

            {/* Line and area */}
            {(() => {
              const points = scoreTrendData.map((d, i) => {
                const x = 50 + (i / (scoreTrendData.length - 1)) * 520;
                const y = 140 - (d.score / 100) * 120;
                return { x, y, ...d };
              });

              const pathD = points.reduce((acc, pt, i) => (i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`), '');
              const areaD = `${pathD} L ${points[points.length - 1].x} 140 L ${points[0].x} 140 Z`;

              return (
                <>
                  <path d={areaD} fill="url(#cyanGlow)" opacity="0.25" />
                  <path d={pathD} fill="none" stroke="#06B6D4" strokeWidth="2.5" strokeLinecap="round" />
                  {points.map((pt, idx) => (
                    <g key={idx}>
                      <circle cx={pt.x} cy={pt.y} r="3.5" className="fill-slate-950 stroke-cyan-400 stroke-2" />
                      <text x={pt.x} y={pt.y - 8} textAnchor="middle" className="text-[9px] font-mono fill-slate-200 tabular-nums">
                        {pt.score}%
                      </text>
                    </g>
                  ))}
                  <defs>
                    <linearGradient id="cyanGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.5" />
                      <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                </>
              );
            })()}
          </svg>
        </div>
      </div>

      {/* Two columns: Results by Exercise Type & Difficulty breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Results by Exercise Type */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="pb-2 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-100">
              Resultados por Tipo de Ejercicio
            </h2>
            <span className="text-xs font-mono text-slate-400">Media %</span>
          </div>

          <div className="space-y-3 pt-1">
            {typePerformance.map((item) => (
              <div key={item.type} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-medium">{item.type}</span>
                  <span className="font-mono text-cyan-400 font-bold tabular-nums">
                    {item.avg} % ({item.count} ejer.)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-500 rounded-full"
                    style={{ width: `${item.avg}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Results by Difficulty */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="pb-2 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-100">
              Resultados por Nivel de Dificultad
            </h2>
            <span className="text-xs font-mono text-slate-400">Compensación térmica</span>
          </div>

          <div className="space-y-3 pt-1">
            {difficultyPerformance.map((item) => (
              <div key={item.level} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-medium">{item.level}</span>
                  <span className="font-mono text-slate-200 font-bold tabular-nums">
                    {item.avg} %
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} rounded-full`}
                    style={{ width: `${item.avg}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Errores Más Frecuentes (Required in Prompt) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
        <div className="pb-2 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Patrones y Errores Más Frecuentes
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Análisis bioinformático de desviaciones recurrentes cometidas por el alumno
            </p>
          </div>
          <span className="text-xs font-mono text-amber-400">Foco Pedagógico</span>
        </div>

        <div className="space-y-2 pt-1">
          {frequentMistakes.map((err, idx) => (
            <div
              key={idx}
              className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
            >
              <div>
                <div className="font-semibold text-slate-200 flex items-center gap-2">
                  <span className="font-mono text-cyan-400 text-[11px]">{err.rule}</span>
                  <span>{err.label}</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Efecto biológico: <strong className="text-slate-300">{err.impact}</strong>
                </div>
              </div>

              <span className="font-mono font-bold text-amber-400 px-2 py-0.5 rounded bg-amber-950/80 border border-amber-800/60 self-start sm:self-auto text-[11px]">
                {err.frequency}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
