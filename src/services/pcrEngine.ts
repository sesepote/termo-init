import { 
  ProtocolStep, 
  AssayConfig, 
  ProtocolValidation, 
  ValidationIssue, 
  CompatibilityReport, 
  EvaluationResult, 
  ParameterComparison 
} from '../types/pcr';
import { DEMO_PRIMERS, DEMO_POLYMERASES, DEMO_BUFFERS, DEMO_CHEMISTRIES } from './knowledgeData';

export function calculateProtocolMetrics(steps: ProtocolStep[]) {
  let totalCycleCount = 1;
  for (const step of steps) {
    if (step.inCycle && step.cycles && step.cycles > 1) {
      totalCycleCount = Math.max(totalCycleCount, step.cycles);
    }
  }

  let totalDurationSec = 0;
  let maxTemp = -Infinity;
  let minTemp = Infinity;

  // Approximate ramp transition time: average ~15s per step transition
  const RAMP_OVERHEAD_PER_STEP = 12;

  for (const step of steps) {
    if (step.temperature > maxTemp) maxTemp = step.temperature;
    if (step.temperature < minTemp) minTemp = step.temperature;

    const stepTime = (step.durationSeconds || 0) + RAMP_OVERHEAD_PER_STEP;
    if (step.inCycle) {
      totalDurationSec += stepTime * totalCycleCount;
    } else {
      totalDurationSec += stepTime;
    }
  }

  if (maxTemp === -Infinity) maxTemp = 95;
  if (minTemp === Infinity) minTemp = 4;

  const minutes = Math.floor(totalDurationSec / 60);
  const seconds = totalDurationSec % 60;

  return {
    totalDurationSec,
    formattedDuration: `${minutes} min ${seconds.toString().padStart(2, '0')} s`,
    maxTemp,
    minTemp,
    totalCycleCount,
    stepCount: steps.length,
  };
}

export function validateProtocol(steps: ProtocolStep[], assay?: AssayConfig): ProtocolValidation {
  const issues: ValidationIssue[] = [];

  let validTemperatures = true;
  let validDurations = true;
  let validCycles = true;
  let validStructure = true;
  let compatibleComponents = true;

  if (steps.length === 0) {
    issues.push({
      level: 'error',
      message: 'El protocolo debe contener al menos un paso.',
      ruleId: 'RULE-STRUCT-EMPTY',
      recommendation: 'Añada los pasos habituales de PCR: Desnaturalización inicial, Ciclo (Desnaturalización, Annealing, Extensión), Extensión final y Hold.',
    });
    return {
      isValid: false,
      issues,
      validTemperatures: false,
      validDurations: false,
      validCycles: false,
      validStructure: false,
      compatibleComponents: true,
    };
  }

  const poly = assay ? DEMO_POLYMERASES.find(p => p.id === assay.polymeraseId) : null;
  const fwd = assay ? DEMO_PRIMERS.find(p => p.id === assay.forwardPrimerId) : null;
  const rev = assay ? DEMO_PRIMERS.find(p => p.id === assay.reversePrimerId) : null;

  // Check structure: does it have cycling steps?
  const cycleSteps = steps.filter(s => s.inCycle);
  if (cycleSteps.length === 0) {
    issues.push({
      level: 'warning',
      message: 'No hay pasos marcados para repetirse en ciclo de amplificación.',
      ruleId: 'RULE-CYCLING-MISSING',
      recommendation: 'Marque los pasos de Desnaturalización, Annealing y Extensión como "Incluir en ciclo".',
    });
    validStructure = false;
  }

  // Check for presence of key step types
  const hasDenat = steps.some(s => s.type === 'desnaturalizacion');
  const hasAnneal = steps.some(s => s.type === 'annealing');
  const hasExt = steps.some(s => s.type === 'extension');

  if (!hasDenat) {
    issues.push({
      level: 'error',
      message: 'Falta el paso de Desnaturalización en el ciclo térmico.',
      ruleId: 'RULE-STRUCT-NO-DENAT',
      recommendation: 'Añada un paso de Desnaturalización a 94–98 °C (típicamente 30 s).',
    });
    validStructure = false;
  }

  if (!hasAnneal) {
    issues.push({
      level: 'error',
      message: 'Falta el paso de Hibridación / Annealing de cebadores.',
      ruleId: 'RULE-STRUCT-NO-ANNEAL',
      recommendation: 'Añada un paso de Annealing acorde a la Tm de los cebadores.',
    });
    validStructure = false;
  }

  if (!hasExt) {
    issues.push({
      level: 'error',
      message: 'Falta el paso de Extensión de la polimerasa.',
      ruleId: 'RULE-STRUCT-NO-EXT',
      recommendation: 'Añada un paso de Extensión a 68–72 °C según la enzima.',
    });
    validStructure = false;
  }

  // Hot-start check
  if (poly && poly.initialActivationSec > 300) {
    const initStep = steps.find(s => s.type === 'inicial');
    if (!initStep || initStep.durationSeconds < 480) {
      issues.push({
        level: 'warning',
        stepOrder: initStep?.order,
        message: `La polimerasa ${poly.name} es Hot-Start químicamente modificada y requiere activación inicial de al menos 10 min (600 s) a 95 °C.`,
        ruleId: 'RULE-HOTSTART-ACTIVATION',
        recommendation: 'Incremente la duración del paso inicial a 600 segundos.',
      });
      validDurations = false;
    }
  }

  // Q5 Denaturation temperature check
  if (poly && poly.recommendedDenatTemp === 98) {
    const denatSteps = steps.filter(s => s.type === 'desnaturalizacion');
    for (const dStep of denatSteps) {
      if (dStep.temperature < 98) {
        issues.push({
          stepOrder: dStep.order,
          level: 'warning',
          message: `La enzima Q5 High-Fidelity requiere una temperatura de desnaturalización de 98 °C (configurada actualmente a ${dStep.temperature} °C).`,
          ruleId: 'RULE-Q5-DENAT-TEMP',
          recommendation: 'Ajuste la temperatura de desnaturalización a 98 °C.',
        });
        validTemperatures = false;
      }
    }
  }

  // Check each individual step
  steps.forEach((step, index) => {
    // Temperature checks
    if (step.type === 'inicial' || step.type === 'desnaturalizacion') {
      if (step.temperature < 92 || step.temperature > 99) {
        issues.push({
          stepOrder: step.order,
          level: 'error',
          message: `El paso ${step.order} (${step.type}) tiene una temperatura de ${step.temperature} °C fuera del rango seguro (94–98 °C).`,
          ruleId: 'RULE-DENAT-001',
          recommendation: 'Configure entre 94 °C y 98 °C.',
        });
        validTemperatures = false;
      }
    }

    if (step.type === 'annealing') {
      // Expected Ta
      const expectedTa = (fwd && rev) ? Math.min(fwd.recommendedAnnealing, rev.recommendedAnnealing) : 60;
      if (Math.abs(step.temperature - expectedTa) > 4.5) {
        issues.push({
          stepOrder: step.order,
          level: step.temperature < expectedTa - 5 || step.temperature > expectedTa + 5 ? 'error' : 'warning',
          message: `El paso ${step.order} (Annealing a ${step.temperature} °C) se desvía de la temperatura recomendada (${expectedTa.toFixed(1)} °C).`,
          ruleId: 'RULE-ANNEALING-004',
          recommendation: `Ajuste la temperatura de hibridación a ${expectedTa.toFixed(0)} °C (rango permitido: ${(expectedTa - 2).toFixed(0)}–${(expectedTa + 2).toFixed(0)} °C).`,
        });
        validTemperatures = false;
      }

      if (step.durationSeconds < 15 || step.durationSeconds > 90) {
        issues.push({
          stepOrder: step.order,
          level: 'warning',
          message: `El tiempo de Annealing (${step.durationSeconds} s) es inusual (rango estándar: 15–60 s).`,
          ruleId: 'RULE-ANNEALING-TIME',
          recommendation: 'Establezca una duración entre 20 y 45 segundos.',
        });
        validDurations = false;
      }
    }

    if (step.type === 'extension') {
      if (step.temperature < 65 || step.temperature > 75) {
        issues.push({
          stepOrder: step.order,
          level: 'error',
          message: `Temperatura de extensión en paso ${step.order} (${step.temperature} °C) fuera del rango enzimático óptimo (68–74 °C).`,
          ruleId: 'RULE-EXTENSION-TEMP',
          recommendation: 'Configure la extensión a 72 °C (o 68 °C para ciertas enzimas Pfu).',
        });
        validTemperatures = false;
      }

      // Check extension time vs amplicon size
      const ampliconBp = assay?.ampliconSizeBp || 500;
      const rateSecPerKb = poly?.extensionRateSecPerKb || 60;
      const minRequiredSec = Math.max(20, Math.ceil((ampliconBp / 1000) * rateSecPerKb));

      if (step.durationSeconds < minRequiredSec - 5) {
        issues.push({
          stepOrder: step.order,
          level: 'error',
          message: `Tiempo de extensión en paso ${step.order} (${step.durationSeconds} s) insuficiente para amplicón de ${ampliconBp} bp con ${poly?.name || 'Taq'} (mínimo requerido: ${minRequiredSec} s).`,
          ruleId: 'RULE-EXTENSION-002',
          recommendation: `Incremente la duración a al menos ${minRequiredSec} segundos.`,
        });
        validDurations = false;
      }
    }

    if (step.type === 'hold') {
      if (step.temperature < 4 || step.temperature > 15) {
        issues.push({
          stepOrder: step.order,
          level: 'warning',
          message: `La temperatura de conservación en paso ${step.order} (${step.temperature} °C) debe ser entre 4 y 10 °C.`,
          ruleId: 'RULE-HOLD-001',
          recommendation: 'Fije la temperatura de hold en 4 °C para conservar la integridad del ADN.',
        });
      }
    }

    // Cycles check
    if (step.inCycle && step.cycles !== undefined) {
      if (step.cycles < 15) {
        issues.push({
          stepOrder: step.order,
          level: 'warning',
          message: `El número de ciclos (${step.cycles}) es muy bajo; podría ser insuficiente para detectar el producto.`,
          ruleId: 'RULE-CYCLES-001',
          recommendation: 'Considere entre 25 y 35 ciclos.',
        });
        validCycles = false;
      } else if (step.cycles > 45) {
        issues.push({
          stepOrder: step.order,
          level: 'warning',
          message: `Número de ciclos excesivo (${step.cycles}); riesgo de productos inespecíficos y degradación de reactivos.`,
          ruleId: 'RULE-CYCLES-001',
          recommendation: 'Mantenga los ciclos entre 30 y 40.',
        });
        validCycles = false;
      }
    }
  });

  const hasErrors = issues.some(i => i.level === 'error');

  return {
    isValid: !hasErrors,
    issues,
    validTemperatures,
    validDurations,
    validCycles,
    validStructure,
    compatibleComponents,
  };
}

export function evaluateAssayCompatibility(assay: AssayConfig): CompatibilityReport {
  const fwd = DEMO_PRIMERS.find(p => p.id === assay.forwardPrimerId);
  const rev = DEMO_PRIMERS.find(p => p.id === assay.reversePrimerId);
  const poly = DEMO_POLYMERASES.find(p => p.id === assay.polymeraseId);
  const buf = DEMO_BUFFERS.find(p => p.id === assay.bufferId);
  const chem = DEMO_CHEMISTRIES.find(p => p.id === assay.chemistryId);

  const items: CompatibilityReport['items'] = [];

  // Primer Tm compatibility
  if (fwd && rev) {
    const deltaTm = Math.abs(fwd.tmCalculated - rev.tmCalculated);
    if (deltaTm <= 2.0) {
      items.push({
        title: 'Emparejamiento de Cebadores (Delta Tm)',
        status: 'compatible',
        message: `Delta Tm óptimo (${deltaTm.toFixed(1)} °C ≤ 2.0 °C). Fwd: ${fwd.tmCalculated}°C, Rev: ${rev.tmCalculated}°C.`,
        ruleId: 'RULE-TM-DELTA-005',
      });
    } else if (deltaTm <= 4.0) {
      items.push({
        title: 'Emparejamiento de Cebadores (Delta Tm)',
        status: 'revisar',
        message: `Delta Tm moderado (${deltaTm.toFixed(1)} °C). Puede requerir gradiente de annealing para equilibrar rendimiento.`,
        ruleId: 'RULE-TM-DELTA-005',
      });
    } else {
      items.push({
        title: 'Emparejamiento de Cebadores (Delta Tm)',
        status: 'incompatible',
        message: `Delta Tm excesivo (${deltaTm.toFixed(1)} °C > 4.0 °C). Alto riesgo de amplificación asimétrica.`,
        ruleId: 'RULE-TM-DELTA-005',
      });
    }
  }

  // Polymerase vs Buffer compatibility
  if (poly && buf) {
    if (poly.id === 'poly_q5_hifi' && buf.id !== 'buf_q5_reaction_5x') {
      items.push({
        title: 'Polimerasa y Buffer',
        status: 'revisar',
        message: 'La enzima Q5 High-Fidelity funciona óptimamente con su Buffer específico de reacción 5X.',
        ruleId: 'RULE-POLY-BUF-MATCH',
      });
    } else {
      items.push({
        title: 'Polimerasa y Buffer',
        status: 'compatible',
        message: `Buffer ${buf.name} verificado como compatible con ${poly.name}.`,
        ruleId: 'RULE-POLY-BUF-MATCH',
      });
    }
  }

  // Template GC vs Buffer GC enhancer
  if (assay.templateGcPercent > 65) {
    if (buf && !buf.hasGcEnhancer) {
      items.push({
        title: 'Plantilla de Alto GC vs Buffer',
        status: 'revisar',
        message: `La plantilla posee un alto contenido de GC (${assay.templateGcPercent}%). Se sugiere Buffer con suplemento GC Enhancer.`,
        ruleId: 'RULE-GC-TEMPLATE-BUF',
      });
    } else {
      items.push({
        title: 'Plantilla de Alto GC',
        status: 'compatible',
        message: 'Buffer con potenciador GC seleccionado para templado rico en GC.',
        ruleId: 'RULE-GC-TEMPLATE-BUF',
      });
    }
  }

  // Chemistry vs PCR Type
  if (assay.pcrType === 'qpcr_tiempo_real' && chem?.type === 'incolora') {
    items.push({
      title: 'Química vs Tipo de PCR',
      status: 'incompatible',
      message: 'La PCR a tiempo real (qPCR) requiere química fluorimétrica (SYBR Green o Sonda de Hidrólisis TaqMan).',
      ruleId: 'RULE-QPCR-CHEM-REQ',
    });
  } else {
    items.push({
      title: 'Química de Detección',
      status: 'compatible',
      message: `Química ${chem?.name || 'Estándar'} adecuada para el tipo de PCR ${assay.pcrType}.`,
      ruleId: 'RULE-QPCR-CHEM-REQ',
    });
  }

  const hasIncompat = items.some(i => i.status === 'incompatible');
  const hasReview = items.some(i => i.status === 'revisar');

  return {
    overall: hasIncompat ? 'incompatible' : hasReview ? 'revisar' : 'compatible',
    items,
  };
}

export function evaluateExerciseSubmission(
  userSteps: ProtocolStep[],
  expectedSteps: ProtocolStep[],
  assay: AssayConfig
): EvaluationResult {
  const comparisons: ParameterComparison[] = [];
  let scorePoints = 0;
  const maxPoints = 100;

  // 1. Initial Denaturation
  const userInit = userSteps.find(s => s.type === 'inicial');
  const expInit = expectedSteps.find(s => s.type === 'inicial');
  if (expInit) {
    if (!userInit) {
      comparisons.push({
        parameterName: 'Paso Inicial de Desnaturalización',
        userValue: 'No configurado',
        expectedValue: `${expInit.temperature} °C — ${expInit.durationSeconds} s`,
        status: 'falta',
        ruleId: 'RULE-DENAT-001',
        explanation: 'Es indispensable incluir un paso de desnaturalización inicial para separar las cadenas genómicas y activar la enzima.',
        sourceDoc: 'Protocolo de referencia Sambrook & Russell',
        sourceType: 'REFERENCE',
      });
    } else {
      const tempDiff = Math.abs(userInit.temperature - expInit.temperature);
      const timeDiff = Math.abs(userInit.durationSeconds - expInit.durationSeconds);
      if (tempDiff === 0 && timeDiff <= 30) {
        scorePoints += 15;
        comparisons.push({
          parameterName: 'Temperatura y Tiempo Inicial',
          userValue: `${userInit.temperature} °C (${userInit.durationSeconds} s)`,
          expectedValue: `${expInit.temperature} °C (${expInit.durationSeconds} s)`,
          status: 'correcto',
          ruleId: 'RULE-DENAT-001',
          explanation: 'La temperatura y duración inicial son exactas para permitir la separación y hot-start adecuado.',
          sourceDoc: expInit.sourceReference || 'Protocolo de referencia estándar',
          sourceType: 'REFERENCE',
        });
      } else if (tempDiff <= 2 && timeDiff <= 60) {
        scorePoints += 12;
        comparisons.push({
          parameterName: 'Temperatura y Tiempo Inicial',
          userValue: `${userInit.temperature} °C (${userInit.durationSeconds} s)`,
          expectedValue: `${expInit.temperature} °C (${expInit.durationSeconds} s)`,
          status: 'en_rango',
          ruleId: 'RULE-DENAT-001',
          explanation: 'El valor se encuentra dentro del rango aceptado para la polimerasa utilizada.',
          sourceDoc: expInit.sourceReference || 'Protocolo de referencia estándar',
          sourceType: 'REFERENCE',
        });
      } else {
        scorePoints += 5;
        comparisons.push({
          parameterName: 'Temperatura y Tiempo Inicial',
          userValue: `${userInit.temperature} °C (${userInit.durationSeconds} s)`,
          expectedValue: `${expInit.temperature} °C (${expInit.durationSeconds} s)`,
          status: 'fuera_rango',
          ruleId: 'RULE-DENAT-001',
          explanation: 'La temperatura o tiempo inicial configurado difiere sensiblemente del protocolo óptimo.',
          sourceDoc: expInit.sourceReference || 'Protocolo de referencia estándar',
          sourceType: 'REFERENCE',
        });
      }
    }
  }

  // 2. Denaturation Step in cycle
  const userDenat = userSteps.find(s => s.type === 'desnaturalizacion');
  const expDenat = expectedSteps.find(s => s.type === 'desnaturalizacion');
  if (expDenat) {
    if (!userDenat) {
      comparisons.push({
        parameterName: 'Desnaturalización en Ciclo',
        userValue: 'Falta',
        expectedValue: `${expDenat.temperature} °C — ${expDenat.durationSeconds} s`,
        status: 'falta',
        ruleId: 'RULE-DENAT-001',
        explanation: 'El ciclo de amplificación requiere un paso periódico de desnaturalización térmica.',
        sourceDoc: 'Protocolo de referencia estándar',
        sourceType: 'REFERENCE',
      });
    } else {
      const tempDiff = Math.abs(userDenat.temperature - expDenat.temperature);
      if (tempDiff === 0 && Math.abs(userDenat.durationSeconds - expDenat.durationSeconds) <= 15) {
        scorePoints += 20;
        comparisons.push({
          parameterName: 'Desnaturalización en Ciclo',
          userValue: `${userDenat.temperature} °C (${userDenat.durationSeconds} s)`,
          expectedValue: `${expDenat.temperature} °C (${expDenat.durationSeconds} s)`,
          status: 'correcto',
          ruleId: 'RULE-DENAT-001',
          explanation: 'Paso de desnaturalización perfectamente calibrado.',
          sourceDoc: 'Protocolo de referencia',
          sourceType: 'REFERENCE',
        });
      } else if (tempDiff <= 2) {
        scorePoints += 15;
        comparisons.push({
          parameterName: 'Desnaturalización en Ciclo',
          userValue: `${userDenat.temperature} °C (${userDenat.durationSeconds} s)`,
          expectedValue: `${expDenat.temperature} °C (${expDenat.durationSeconds} s)`,
          status: 'en_rango',
          ruleId: 'RULE-DENAT-001',
          explanation: 'Valor dentro del margen operacional para esta enzima.',
          sourceDoc: 'Protocolo de referencia',
          sourceType: 'REFERENCE',
        });
      } else {
        comparisons.push({
          parameterName: 'Desnaturalización en Ciclo',
          userValue: `${userDenat.temperature} °C`,
          expectedValue: `${expDenat.temperature} °C`,
          status: 'fuera_rango',
          ruleId: 'RULE-DENAT-001',
          explanation: 'La temperatura introducida está fuera del rango aceptado para la polimerasa en este ciclo.',
          sourceDoc: 'Ficha técnica enzimática',
          sourceType: 'REFERENCE',
        });
      }
    }
  }

  // 3. Annealing Step
  const userAnneal = userSteps.find(s => s.type === 'annealing');
  const expAnneal = expectedSteps.find(s => s.type === 'annealing');
  if (expAnneal) {
    if (!userAnneal) {
      comparisons.push({
        parameterName: 'Annealing / Hibridación',
        userValue: 'Falta',
        expectedValue: `${expAnneal.temperature} °C — ${expAnneal.durationSeconds} s`,
        status: 'falta',
        ruleId: 'RULE-ANNEALING-004',
        explanation: 'Sin el paso de annealing los cebadores no pueden hibridar con el molde.',
        sourceDoc: 'Consenso Internacional de PCR',
        sourceType: 'CALCULATED',
      });
    } else {
      const tempDiff = Math.abs(userAnneal.temperature - expAnneal.temperature);
      if (tempDiff <= 1.0 && Math.abs(userAnneal.durationSeconds - expAnneal.durationSeconds) <= 10) {
        scorePoints += 25;
        comparisons.push({
          parameterName: 'Annealing / Hibridación',
          userValue: `${userAnneal.temperature} °C (${userAnneal.durationSeconds} s)`,
          expectedValue: `${expAnneal.temperature} °C (${expAnneal.durationSeconds} s)`,
          status: 'correcto',
          ruleId: 'RULE-ANNEALING-004',
          explanation: 'Temperatura de annealing calculada con precisión respecto a la Tm de los cebadores.',
          sourceDoc: 'Calculado a partir de Tm y regla RULE-ANNEALING-004',
          sourceType: 'CALCULATED',
        });
      } else if (tempDiff <= 2.5) {
        scorePoints += 18;
        comparisons.push({
          parameterName: 'Annealing / Hibridación',
          userValue: `${userAnneal.temperature} °C (${userAnneal.durationSeconds} s)`,
          expectedValue: `${expAnneal.temperature} °C (Rango: ${expAnneal.temperature - 2}–${expAnneal.temperature + 2} °C)`,
          status: 'en_rango',
          ruleId: 'RULE-ANNEALING-004',
          explanation: 'La temperatura introducida está dentro del rango aceptado para las condiciones seleccionadas.',
          sourceDoc: 'Protocolo de referencia X',
          sourceType: 'CALCULATED',
        });
      } else {
        scorePoints += 5;
        comparisons.push({
          parameterName: 'Annealing / Hibridación',
          userValue: `${userAnneal.temperature} °C`,
          expectedValue: `${expAnneal.temperature - 2}–${expAnneal.temperature + 2} °C`,
          status: 'fuera_rango',
          ruleId: 'RULE-ANNEALING-004',
          explanation: userAnneal.temperature < expAnneal.temperature 
            ? 'Temperatura demasiado baja: favorece hibridaciones inespecíficas y dímeros de cebador.'
            : 'Temperatura excesiva: los cebadores se desprenden antes de que la polimerasa inicie la síntesis.',
          sourceDoc: 'Protocolo de referencia X',
          sourceType: 'CALCULATED',
        });
      }
    }
  }

  // 4. Extension Step
  const userExt = userSteps.find(s => s.type === 'extension');
  const expExt = expectedSteps.find(s => s.type === 'extension');
  if (expExt) {
    if (!userExt) {
      comparisons.push({
        parameterName: 'Extensión en Ciclo',
        userValue: 'Falta',
        expectedValue: `${expExt.temperature} °C — ${expExt.durationSeconds} s`,
        status: 'falta',
        ruleId: 'RULE-EXTENSION-002',
        explanation: 'Falta el paso de polimerización de la nueva cadena complementaria.',
        sourceDoc: 'Ficha técnica de polimerasa',
        sourceType: 'REFERENCE',
      });
    } else {
      const tempDiff = Math.abs(userExt.temperature - expExt.temperature);
      const timeDiff = Math.abs(userExt.durationSeconds - expExt.durationSeconds);
      if (tempDiff === 0 && timeDiff <= 15) {
        scorePoints += 25;
        comparisons.push({
          parameterName: 'Extensión en Ciclo',
          userValue: `${userExt.temperature} °C (${userExt.durationSeconds} s)`,
          expectedValue: `${expExt.temperature} °C (${expExt.durationSeconds} s)`,
          status: 'correcto',
          ruleId: 'RULE-EXTENSION-002',
          explanation: 'Tiempo y temperatura de extensión acordes con la procesividad de la polimerasa y la longitud del amplicón.',
          sourceDoc: 'Kinetics enzimáticos experimentales',
          sourceType: 'REFERENCE',
        });
      } else if (tempDiff <= 2 && userExt.durationSeconds >= expExt.durationSeconds - 10) {
        scorePoints += 18;
        comparisons.push({
          parameterName: 'Extensión en Ciclo',
          userValue: `${userExt.temperature} °C (${userExt.durationSeconds} s)`,
          expectedValue: `${expExt.temperature} °C (${expExt.durationSeconds} s)`,
          status: 'en_rango',
          ruleId: 'RULE-EXTENSION-002',
          explanation: 'Parámetros de extensión en rango aceptable.',
          sourceDoc: 'Kinetics enzimáticos experimentales',
          sourceType: 'REFERENCE',
        });
      } else {
        scorePoints += 5;
        comparisons.push({
          parameterName: 'Extensión en Ciclo',
          userValue: `${userExt.temperature} °C (${userExt.durationSeconds} s)`,
          expectedValue: `${expExt.temperature} °C (${expExt.durationSeconds} s)`,
          status: 'fuera_rango',
          ruleId: 'RULE-EXTENSION-002',
          explanation: userExt.durationSeconds < expExt.durationSeconds
            ? 'Tiempo de extensión insuficiente para completar la síntesis de todo el amplicón.'
            : 'Temperatura fuera del intervalo de máxima actividad enzimática.',
          sourceDoc: 'Kinetics enzimáticos experimentales',
          sourceType: 'REFERENCE',
        });
      }
    }
  }

  // 5. Cycles count
  const userCycleCount = userSteps.find(s => s.inCycle)?.cycles || 1;
  const expCycleCount = expectedSteps.find(s => s.inCycle)?.cycles || 35;
  const cycleDiff = Math.abs(userCycleCount - expCycleCount);
  if (cycleDiff === 0) {
    scorePoints += 15;
    comparisons.push({
      parameterName: 'Número de Ciclos',
      userValue: `${userCycleCount}`,
      expectedValue: `${expCycleCount}`,
      status: 'correcto',
      ruleId: 'RULE-CYCLES-001',
      explanation: 'Número de ciclos exacto para alcanzar rendimiento en fase exponencial sin saturación.',
      sourceDoc: 'Compendio Sambrook & Russell',
      sourceType: 'REFERENCE',
    });
  } else if (cycleDiff <= 5) {
    scorePoints += 10;
    comparisons.push({
      parameterName: 'Número de Ciclos',
      userValue: `${userCycleCount}`,
      expectedValue: `${expCycleCount}`,
      status: 'en_rango',
      ruleId: 'RULE-CYCLES-001',
      explanation: 'Número de ciclos dentro de la ventana de detección estándar (30–38).',
      sourceDoc: 'Compendio Sambrook & Russell',
      sourceType: 'REFERENCE',
    });
  } else {
    comparisons.push({
      parameterName: 'Número de Ciclos',
      userValue: `${userCycleCount}`,
      expectedValue: `${expCycleCount}`,
      status: 'fuera_rango',
      ruleId: 'RULE-CYCLES-001',
      explanation: userCycleCount < 20 
        ? 'Muy pocos ciclos para generar producto visible.' 
        : 'Demasiados ciclos: genera inespecificidades y agota dNTPs.',
      sourceDoc: 'Compendio Sambrook & Russell',
      sourceType: 'REFERENCE',
    });
  }

  const finalScore = Math.min(maxPoints, Math.max(0, scorePoints));

  let statusText: 'CORRECTO' | 'PARCIALMENTE CORRECTO' | 'INCORRECTO' = 'PARCIALMENTE CORRECTO';
  if (finalScore >= 90) {
    statusText = 'CORRECTO';
  } else if (finalScore < 60) {
    statusText = 'INCORRECTO';
  }

  let feedbackSummary = '';
  if (statusText === 'CORRECTO') {
    feedbackSummary = '¡Excelente diseño del protocolo! Todos los parámetros críticos (temperaturas, cinéticas y ciclos) están en los rangos teóricos y empíricos óptimos.';
  } else if (statusText === 'PARCIALMENTE CORRECTO') {
    feedbackSummary = 'Protocolo funcional pero con discrepancias en parámetros clave (consulte la tabla comparativa para identificar temperaturas o tiempos a corregir).';
  } else {
    feedbackSummary = 'El protocolo presenta deficiencias térmicas o temporales graves que impedirían una amplificación reproducible y específica.';
  }

  return {
    score: finalScore,
    statusText,
    feedbackSummary,
    comparisons,
    completedAt: new Date().toISOString(),
    exerciseId: 'eval_' + Date.now(),
    durationSeconds: 180,
  };
}
