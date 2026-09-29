import React, { useState } from 'react';
import { KnowledgeItem, TraceabilitySource } from '../../types/pcr';
import { DEMO_KNOWLEDGE_BASE } from '../../services/knowledgeData';
import { 
  BookOpen, 
  Search, 
  Dna, 
  Sparkles, 
  ExternalLink, 
  Filter, 
  Info,
  Calendar,
  Layers,
  ChevronRight,
  ShieldCheck,
  Cpu
} from 'lucide-react';

interface KnowledgeViewProps {
  onInspectTraceability: (item: TraceabilitySource) => void;
}

type KnowledgeCategory = 
  | 'todos'
  | 'primers'
  | 'polimerasas'
  | 'buffers'
  | 'quimicas'
  | 'ensayos'
  | 'protocolos'
  | 'reglas'
  | 'fuentes';

export const KnowledgeView: React.FC<KnowledgeViewProps> = ({ onInspectTraceability }) => {
  const [activeCategory, setActiveCategory] = useState<KnowledgeCategory>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedItemId, setSelectedItemId] = useState<string>(DEMO_KNOWLEDGE_BASE[0].id);

  const categories: { id: KnowledgeCategory; label: string }[] = [
    { id: 'todos', label: 'Todos' },
    { id: 'primers', label: 'Primers' },
    { id: 'polimerasas', label: 'Polimerasas' },
    { id: 'buffers', label: 'Buffers' },
    { id: 'quimicas', label: 'Químicas' },
    { id: 'ensayos', label: 'Ensayos' },
    { id: 'protocolos', label: 'Protocolos' },
    { id: 'reglas', label: 'Reglas' },
    { id: 'fuentes', label: 'Fuentes' },
  ];

  const filteredItems = DEMO_KNOWLEDGE_BASE.filter(item => {
    const matchesCat = activeCategory === 'todos' || item.category === activeCategory;
    const matchesQuery = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.source.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  const selectedItem: KnowledgeItem | undefined = DEMO_KNOWLEDGE_BASE.find(i => i.id === selectedItemId) || filteredItems[0];

  const handleOpenTraceability = (item: KnowledgeItem) => {
    const trace: TraceabilitySource = {
      parameterName: item.name,
      value: item.properties['Temperatura de desnaturalización'] || item.properties['Fórmula base'] || '1.0X',
      unit: '',
      type: item.category === 'reglas' ? 'CALCULATED' : 'REFERENCE',
      sourceName: item.source,
      document: item.sourceDocument,
      manufacturer: item.manufacturer,
      date: `${item.updatedYear}-01-15`,
      version: item.version,
      method: `Información técnica catalogada bajo la especificación ${item.version}.`,
      ruleId: item.rulesAssociated[0],
    };
    onInspectTraceability(trace);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            Base de Conocimiento Científico
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Registro estructurado de cinéticas enzimáticas, reactivos moleculares, reglas bioinformáticas y fuentes bibliográficas.
          </p>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar reactivo, regla o autor..."
            className="w-full sm:w-64 bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Secondary Subnavigation Categories (Required in Prompt) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* 2-Column Layout: Table List (left) & Detail Inspector (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Table List (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-mono text-slate-400">
            <span>Catálogo ({filteredItems.length} entradas)</span>
            <span className="text-cyan-400">DEMO DATA</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                  <th className="py-2.5 px-3">Nombre</th>
                  <th className="py-2.5 px-3">Tipo</th>
                  <th className="py-2.5 px-3">Fuente</th>
                  <th className="py-2.5 px-3 text-right">Actualización</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 font-sans">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500 font-mono text-xs">
                      No se encontraron resultados para la búsqueda.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    const isSelected = selectedItem?.id === item.id;

                    return (
                      <tr
                        key={item.id}
                        onClick={() => setSelectedItemId(item.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-cyan-950/40 text-cyan-200' : 'hover:bg-slate-800/50 text-slate-300'
                        }`}
                      >
                        <td className="py-3 px-3 font-semibold text-slate-100">
                          {item.name}
                        </td>
                        <td className="py-3 px-3 text-slate-400 truncate max-w-[150px]" title={item.type}>
                          {item.type}
                        </td>
                        <td className="py-3 px-3 text-slate-400 truncate max-w-[140px]" title={item.source}>
                          {item.source}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-400 tabular-nums">
                          {item.updatedYear}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail View (5 cols) (Required in Prompt) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          {selectedItem ? (
            <div className="space-y-4 text-xs">
              {/* Header */}
              <div className="border-b border-slate-800 pb-3 flex items-start justify-between">
                <div>
                  <div className="text-[10px] font-mono uppercase text-slate-400">
                    Ficha Técnica · Cat. {selectedItem.category}
                  </div>
                  <h3 className="text-base font-bold text-slate-100 mt-0.5">
                    {selectedItem.name}
                  </h3>
                  <div className="text-slate-400 mt-1">{selectedItem.type}</div>
                </div>

                <button
                  onClick={() => handleOpenTraceability(selectedItem)}
                  className="px-2.5 py-1 text-[11px] font-mono text-cyan-300 bg-slate-950 hover:bg-slate-800 border border-cyan-800/80 rounded transition-colors flex items-center gap-1 shrink-0"
                  title="Auditar origen y trazabilidad del registro"
                >
                  <Cpu className="w-3 h-3 text-cyan-400" />
                  Trazabilidad
                </button>
              </div>

              {/* Physicochemical Properties Grid */}
              <div>
                <div className="text-slate-400 font-semibold mb-2 font-mono text-[11px] uppercase tracking-wider">
                  Propiedades Fisicoquímicas y Cinéticas
                </div>
                <div className="space-y-1.5 p-3 bg-slate-950 border border-slate-800 rounded-lg">
                  {Object.entries(selectedItem.properties).map(([key, val]) => (
                    <div key={key} className="flex justify-between items-baseline py-1 border-b border-slate-900 last:border-0">
                      <span className="text-slate-400">{key}:</span>
                      <span className="font-mono font-medium text-slate-200 text-right ml-2 tabular-nums">
                        {String(val)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Associated Rules */}
              {selectedItem.rulesAssociated.length > 0 && (
                <div>
                  <div className="text-slate-400 font-semibold mb-1.5 font-mono text-[11px] uppercase tracking-wider">
                    Reglas Asociadas
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedItem.rulesAssociated.map((ruleId) => (
                      <span
                        key={ruleId}
                        className="px-2 py-0.5 rounded text-[11px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800/60"
                      >
                        {ruleId}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Reference Protocols */}
              {selectedItem.referenceProtocols.length > 0 && (
                <div>
                  <div className="text-slate-400 font-semibold mb-1.5 font-mono text-[11px] uppercase tracking-wider">
                    Protocolos de Referencia
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedItem.referenceProtocols.map((proto) => (
                      <span
                        key={proto}
                        className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-slate-300 border border-slate-700"
                      >
                        {proto}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Citations, Sources, Version & Date */}
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg space-y-2 text-[11px]">
                <div className="flex justify-between items-center text-slate-400">
                  <span>Documento Fuente:</span>
                  <span className="text-slate-200 font-medium truncate max-w-[200px]" title={selectedItem.sourceDocument}>
                    {selectedItem.sourceDocument}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-400 border-t border-slate-900 pt-1.5">
                  <span>Versión y Fecha:</span>
                  <span className="font-mono text-slate-300">
                    v{selectedItem.version} · {selectedItem.updatedYear}
                  </span>
                </div>
                {selectedItem.manufacturer && (
                  <div className="flex justify-between items-center text-slate-400 border-t border-slate-900 pt-1.5">
                    <span>Fabricante / Fabricación:</span>
                    <span className="text-slate-200 font-medium">
                      {selectedItem.manufacturer}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-500 text-xs">
              Seleccione un elemento de la lista para ver sus especificaciones.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
