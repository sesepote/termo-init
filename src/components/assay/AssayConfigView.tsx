import React from 'react';
import { AssayConfig, PCRType, CompatibilityReport, TraceabilitySource } from '../../types/pcr';
import { 
  DEMO_PRIMERS, 
  DEMO_POLYMERASES, 
  DEMO_BUFFERS, 
  DEMO_CHEMISTRIES, 
  DEMO_TRACEABILITY_ITEMS 
} from '../../services/knowledgeData';
import { evaluateAssayCompatibility } from '../../services/pcrEngine';
import { 
  FlaskConical, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Info, 
  ArrowRight,
  Sparkles,
  Dna
} from 'lucide-react';

interface AssayConfigViewProps {
  assay: AssayConfig;
  onChangeAssay: (assay: AssayConfig) => void;
  onProceedToProgrammer: () => void;
  onInspectTraceability: (item: TraceabilitySource) => void;
}

export const AssayConfigView: React.FC<AssayConfigViewProps> = ({
  assay,
  onChangeAssay,
  onProceedToProgrammer,
  onInspectTraceability,
}) => {
  const compatibilityReport: CompatibilityReport = evaluateAssayCompatibility(assay);

  const selectedFwd = DEMO_PRIMERS.find(p => p.id === assay.forwardPrimerId);
  const selectedRev = DEMO_PRIMERS.find(p => p.id === assay.reversePrimerId);
  const selectedPoly = DEMO_POLYMERASES.find(p => p.id === assay.polymeraseId);
  const selectedBuf = DEMO_BUFFERS.find(p => p.id === assay.bufferId);
  const selectedChem = DEMO_CHEMISTRIES.find(p => p.id === assay.chemistryId);

  const handleFieldChange = <K extends keyof AssayConfig>(field: K, value: AssayConfig[K]) => {
    onChangeAssay({
      ...assay,
      [field]: value,
    });
  };

  const getCompStatusBadge = (status: 'compatible' | 'revisar' | 'incompatible') => {
    switch (status) {
      case 'compatible':
        return (
          <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Compatible
          </span>
        );
      case 'revisar':
        return (
          <span className="inline-flex items-center gap-1 text-amber-400 font-medium">
            <AlertTriangle className="w-3.5 h-3.5" />
            Revisar
          </span>
        );
      case 'incompatible':
        return (
          <span className="inline-flex items-center gap-1 text-rose-400 font-medium">
            <XCircle className="w-3.5 h-3.5" />
            Incompatible
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-cyan-400" />
            Nuevo Ensayo PCR
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Selección y verificación fisicoquímica de reactivos moleculares antes de programar el termociclador.
          </p>
        </div>

        <button
          onClick={onProceedToProgrammer}
          className="px-4 py-2 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5 self-start sm:self-auto"
        >
          Continuar a Programador
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Two Column Layout (Required in Prompt) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Columna Izquierda: Formulario (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="text-xs uppercase tracking-wider font-mono text-slate-400 pb-2 border-b border-slate-800">
            Parámetros y Componentes del Ensayo
          </div>

          {/* Tipo de PCR */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Tipo de PCR
            </label>
            <select
              value={assay.pcrType}
              onChange={(e) => handleFieldChange('pcrType', e.target.value as PCRType)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
            >
              <option value="convencional">PCR convencional (Punto Final)</option>
              <option value="qpcr_tiempo_real">qPCR a Tiempo Real (Cuantitativa)</option>
              <option value="alta_fidelidad">PCR de Alta Fidelidad (Clonación / NGS)</option>
              <option value="touchdown">PCR Touchdown (Cebadores complejos)</option>
              <option value="multiplex">PCR Multiplex (Múltiples dianas)</option>
            </select>
          </div>

          {/* Primer Forward & Reverse */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center justify-between">
                <span>Primer Forward</span>
                {selectedFwd && (
                  <span className="text-[10px] font-mono text-cyan-400">
                    Tm {selectedFwd.tmCalculated}°C
                  </span>
                )}
              </label>
              <select
                value={assay.forwardPrimerId}
                onChange={(e) => handleFieldChange('forwardPrimerId', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              >
                {DEMO_PRIMERS.filter(p => p.direction === 'forward').map(primer => (
                  <option key={primer.id} value={primer.id}>
                    {primer.name} ({primer.targetGene})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center justify-between">
                <span>Primer Reverse</span>
                {selectedRev && (
                  <span className="text-[10px] font-mono text-cyan-400">
                    Tm {selectedRev.tmCalculated}°C
                  </span>
                )}
              </label>
              <select
                value={assay.reversePrimerId}
                onChange={(e) => handleFieldChange('reversePrimerId', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              >
                {DEMO_PRIMERS.filter(p => p.direction === 'reverse').map(primer => (
                  <option key={primer.id} value={primer.id}>
                    {primer.name} ({primer.targetGene})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Polimerasa */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Polimerasa
            </label>
            <select
              value={assay.polymeraseId}
              onChange={(e) => handleFieldChange('polymeraseId', e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
            >
              {DEMO_POLYMERASES.map(poly => (
                <option key={poly.id} value={poly.id}>
                  {poly.name} ({poly.hasProofreading ? 'Proofreading 3\'->5\'' : 'Estándar'})
                </option>
              ))}
            </select>
          </div>

          {/* Buffer & Química */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Buffer de Reacción
              </label>
              <select
                value={assay.bufferId}
                onChange={(e) => handleFieldChange('bufferId', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              >
                {DEMO_BUFFERS.map(buf => (
                  <option key={buf.id} value={buf.id}>
                    {buf.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Química de Detección
              </label>
              <select
                value={assay.chemistryId}
                onChange={(e) => handleFieldChange('chemistryId', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              >
                {DEMO_CHEMISTRIES.map(chem => (
                  <option key={chem.id} value={chem.id}>
                    {chem.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Plantilla y Objetivo (Required in Prompt) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Plantilla de ADN (Molde)
              </label>
              <input
                type="text"
                value={assay.templateName}
                onChange={(e) => handleFieldChange('templateName', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                placeholder="p.ej. ADN Genómico Humano, Plásmido pUC19..."
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center justify-between">
                <span>Longitud del Amplicón (bp)</span>
                <span className="text-[10px] font-mono text-slate-400">Pares de bases</span>
              </label>
              <input
                type="number"
                min="50"
                max="10000"
                step="10"
                value={assay.ampliconSizeBp}
                onChange={(e) => handleFieldChange('ampliconSizeBp', parseInt(e.target.value, 10) || 500)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500 tabular-nums"
              />
            </div>
          </div>
        </div>

        {/* Columna Derecha: Resumen del ensayo, Compatibilidad e Información Científica (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Card: Resumen del ensayo */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="text-xs uppercase tracking-wider font-mono text-slate-400 pb-2 border-b border-slate-800">
              Resumen del Ensayo
            </div>

            <div className="mt-3 space-y-2.5 text-xs">
              <div className="flex justify-between items-baseline py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Tipo de PCR:</span>
                <span className="font-semibold text-slate-200 capitalize">{assay.pcrType.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between items-baseline py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Primer Forward:</span>
                <span className="font-medium text-slate-200 truncate max-w-[200px]" title={selectedFwd?.name}>
                  {selectedFwd?.name || 'No seleccionado'}
                </span>
              </div>
              <div className="flex justify-between items-baseline py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Primer Reverse:</span>
                <span className="font-medium text-slate-200 truncate max-w-[200px]" title={selectedRev?.name}>
                  {selectedRev?.name || 'No seleccionado'}
                </span>
              </div>
              <div className="flex justify-between items-baseline py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Polimerasa:</span>
                <span className="font-medium text-slate-200 truncate max-w-[200px]" title={selectedPoly?.name}>
                  {selectedPoly?.name || 'No seleccionado'}
                </span>
              </div>
              <div className="flex justify-between items-baseline py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Buffer:</span>
                <span className="font-medium text-slate-200 truncate max-w-[200px]" title={selectedBuf?.name}>
                  {selectedBuf?.name || 'No seleccionado'}
                </span>
              </div>
              <div className="flex justify-between items-baseline py-1">
                <span className="text-slate-400">Química:</span>
                <span className="font-medium text-slate-200 truncate max-w-[200px]" title={selectedChem?.name}>
                  {selectedChem?.name || 'No seleccionado'}
                </span>
              </div>
            </div>

            {/* Compatibilidad (Required in Prompt) */}
            <div className="mt-4 pt-3 border-t border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-300">
                  Compatibilidad del Sistema
                </span>
                {getCompStatusBadge(compatibilityReport.overall)}
              </div>

              <div className="space-y-1.5 mt-2">
                {compatibilityReport.items.map((item, idx) => (
                  <div key={idx} className="p-2 bg-slate-950/70 border border-slate-800 rounded text-[11px]">
                    <div className="flex items-center justify-between font-medium text-slate-300">
                      <span>{item.title}</span>
                      {getCompStatusBadge(item.status)}
                    </div>
                    <p className="text-slate-400 text-[10px] mt-0.5 leading-normal">
                      {item.message}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Card: Información Científica con Procedencia (Required in Prompt) */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs uppercase tracking-wider font-mono text-slate-400">
                Información Científica y Procedencia
              </span>
              <span className="text-[10px] font-mono text-cyan-400">Trazabilidad</span>
            </div>

            <p className="text-[11px] text-slate-400 mt-2 mb-3">
              Cada parámetro indica su origen riguroso. Pulse cualquier tarjeta para auditar la trazabilidad:
            </p>

            {/* 3 Origin items explicitly required in prompt */}
            <div className="space-y-2 text-xs">
              {/* Item 1: Tm (Calculado) */}
              <button
                type="button"
                onClick={() => onInspectTraceability(DEMO_TRACEABILITY_ITEMS['tm_primer_a'])}
                className="w-full text-left p-2.5 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-800/80 rounded-lg transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-300">Tm Primer Forward</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                    Calculado
                  </span>
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-lg font-mono font-bold text-cyan-400 tabular-nums">
                    60.2 °C
                  </span>
                  <span className="text-[10px] text-slate-400 group-hover:text-cyan-300 transition-colors">
                    Ver modelo bioinformático →
                  </span>
                </div>
              </button>

              {/* Item 2: Temperatura recomendada (Referencia) */}
              <button
                type="button"
                onClick={() => onInspectTraceability(DEMO_TRACEABILITY_ITEMS['ta_recommended'])}
                className="w-full text-left p-2.5 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-800/80 rounded-lg transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-300">Temperatura recomendada</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                    Referencia
                  </span>
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-lg font-mono font-bold text-emerald-400 tabular-nums">
                    60 °C
                  </span>
                  <span className="text-[10px] text-slate-400 group-hover:text-emerald-300 transition-colors">
                    Ver protocolo de referencia →
                  </span>
                </div>
              </button>

              {/* Item 3: Rango operativo (Fuente experimental) */}
              <button
                type="button"
                onClick={() => onInspectTraceability(DEMO_TRACEABILITY_ITEMS['ta_range'])}
                className="w-full text-left p-2.5 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-800/80 rounded-lg transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-300">Rango operativo</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-950 text-amber-300 border border-amber-800/60">
                    Fuente experimental
                  </span>
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-lg font-mono font-bold text-amber-400 tabular-nums">
                    58–62 °C
                  </span>
                  <span className="text-[10px] text-slate-400 group-hover:text-amber-300 transition-colors">
                    Ver cuaderno de laboratorio →
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
