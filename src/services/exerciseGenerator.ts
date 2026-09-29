import { ExerciseItem, ExerciseType, DifficultyLevel, AssayConfig, ProtocolStep } from '../types/pcr';
import { DEMO_PRIMERS, DEMO_POLYMERASES, DEMO_BUFFERS, DEMO_CHEMISTRIES } from './knowledgeData';

export const EXERCISE_TYPES_INFO: {
  type: ExerciseType;
  title: string;
  description: string;
  badge: string;
}[] = [
  {
    type: 'configuracion',
    title: 'Configuración',
    description: 'Introducir un protocolo completo a partir de los requerimientos moleculares del ensayo.',
    badge: 'Protocolo Completo',
  },
  {
    type: 'identificacion',
    title: 'Identificación de errores',
    description: 'Detectar qué pasos o valores son erróneos en un protocolo defectuoso previamente cargado.',
    badge: 'Control de Calidad',
  },
  {
    type: 'correccion',
    title: 'Corrección',
    description: 'Modificar y corregir directamente los parámetros desviados en un protocolo parcialmente incorrecto.',
    badge: 'Optimización',
  },
  {
    type: 'seleccion',
    title: 'Selección',
    description: 'Seleccionar las opciones térmicas y cinéticas correctas entre alternativas técnicas.',
    badge: 'Opción Múltiple',
  },
  {
    type: 'construccion',
    title: 'Construcción',
    description: 'Construir el programa térmico paso a paso a partir de reactivos y datos enzimáticos dados.',
    badge: 'Montaje de Ciclo',
  },
  {
    type: 'diagnostico',
    title: 'Diagnóstico',
    description: 'Analizar el protocolo frente a resultados anómalos simulados (gel de agarosa o curva de fusión).',
    badge: 'Análisis de Resultados',
  },
];

export function generateExercise(
  type: ExerciseType,
  difficulty: DifficultyLevel,
  seed?: string
): ExerciseItem {
  // Base default assay
  const baseAssay: AssayConfig = {
    pcrType: 'convencional',
    forwardPrimerId: 'primer_a_fwd',
    reversePrimerId: 'primer_b_rev',
    polymeraseId: 'poly_taq_std',
    bufferId: 'buf_taq_std_10x',
    chemistryId: 'chem_incolora',
    templateName: 'ADN Genómico Humano (GAPDH)',
    templateGcPercent: 52,
    ampliconSizeBp: 500,
  };

  const expectedProtocol: ProtocolStep[] = [
    {
      id: 'exp_step_1',
      order: 1,
      type: 'inicial',
      temperature: 95,
      durationSeconds: 180,
      inCycle: false,
      sourceOrigin: 'REFERENCE',
      sourceReference: 'Protocolo Estándar GAPDH BioTech',
      notes: 'Desnaturalización inicial y activación',
    },
    {
      id: 'exp_step_2',
      order: 2,
      type: 'desnaturalizacion',
      temperature: 95,
      durationSeconds: 30,
      cycles: 35,
      inCycle: true,
      sourceOrigin: 'REFERENCE',
      sourceReference: 'Protocolo de referencia',
    },
    {
      id: 'exp_step_3',
      order: 3,
      type: 'annealing',
      temperature: 60,
      durationSeconds: 30,
      cycles: 35,
      inCycle: true,
      sourceOrigin: 'CALCULATED',
      sourceReference: 'Calculado: Tm_media(60.5°C) - 1°C',
    },
    {
      id: 'exp_step_4',
      order: 4,
      type: 'extension',
      temperature: 72,
      durationSeconds: 45,
      cycles: 35,
      inCycle: true,
      sourceOrigin: 'REFERENCE',
      sourceReference: '60 s/kb para amplicón 500 bp',
    },
    {
      id: 'exp_step_5',
      order: 5,
      type: 'extension_final',
      temperature: 72,
      durationSeconds: 300,
      inCycle: false,
      sourceOrigin: 'REFERENCE',
      sourceReference: 'Completado de cadenas 300 s',
    },
    {
      id: 'exp_step_6',
      order: 6,
      type: 'hold',
      temperature: 4,
      durationSeconds: 0,
      inCycle: false,
      sourceOrigin: 'REFERENCE',
      sourceReference: 'Preservación de muestra',
    },
  ];

  if (type === 'configuracion') {
    return {
      id: `ex_cfg_${difficulty}_${Date.now()}`,
      type: 'configuracion',
      difficulty,
      title: `Configuración Completa: Ensayo ${difficulty === 1 ? 'Básico GAPDH' : difficulty === 2 ? '16S Bacteriano' : 'Q5 Alta Fidelidad'}`,
      description: 'Configure en el termociclador todos los pasos del protocolo (inicial, desnaturalización, hibridación, extensión y conservación) según los componentes del ensayo.',
      assay: difficulty >= 3 ? {
        ...baseAssay,
        polymeraseId: 'poly_q5_hifi',
        bufferId: 'buf_q5_reaction_5x',
        pcrType: 'alta_fidelidad',
      } : baseAssay,
      expectedProtocol: difficulty >= 3 ? expectedProtocol.map(s => {
        if (s.type === 'desnaturalizacion') return { ...s, temperature: 98 };
        if (s.type === 'extension') return { ...s, durationSeconds: 20 };
        return s;
      }) : expectedProtocol,
    };
  }

  if (type === 'identificacion') {
    // Protocol with deliberate intentional errors
    const faultyProtocol: ProtocolStep[] = [
      {
        id: 'flt_1',
        order: 1,
        type: 'inicial',
        temperature: 95,
        durationSeconds: 180,
        inCycle: false,
        sourceOrigin: 'REFERENCE',
      },
      {
        id: 'flt_2',
        order: 2,
        type: 'desnaturalizacion',
        temperature: 95,
        durationSeconds: 30,
        cycles: 35,
        inCycle: true,
        sourceOrigin: 'REFERENCE',
      },
      {
        id: 'flt_3',
        order: 3,
        type: 'annealing',
        temperature: 50, // ERROR: Should be ~60 °C (10°C lower causes severe non-specific bands!)
        durationSeconds: 30,
        cycles: 35,
        inCycle: true,
        sourceOrigin: 'EXPERIMENTAL',
      },
      {
        id: 'flt_4',
        order: 4,
        type: 'extension',
        temperature: 72,
        durationSeconds: 10, // ERROR: 10s is far too short for 500 bp with standard Taq (needs at least 30-45s)
        cycles: 35,
        inCycle: true,
        sourceOrigin: 'REFERENCE',
      },
      {
        id: 'flt_5',
        order: 5,
        type: 'extension_final',
        temperature: 72,
        durationSeconds: 300,
        inCycle: false,
        sourceOrigin: 'REFERENCE',
      },
      {
        id: 'flt_6',
        order: 6,
        type: 'hold',
        temperature: 4,
        durationSeconds: 0,
        inCycle: false,
        sourceOrigin: 'REFERENCE',
      },
    ];

    return {
      id: `ex_id_${difficulty}_${Date.now()}`,
      type: 'identificacion',
      difficulty,
      title: 'Identificación de Parámetros Erróneos',
      description: 'El protocolo presentado contiene dos pasos con desviaciones críticas que causan fallo en la amplificación. Marque las casillas de los pasos que contienen errores.',
      assay: baseAssay,
      initialProtocol: faultyProtocol,
      expectedProtocol,
      incorrectStepIds: ['flt_3', 'flt_4'],
    };
  }

  if (type === 'correccion') {
    // Protocol with flawed values that need direct in-place editing
    const flawedProtocol: ProtocolStep[] = [
      {
        id: 'cor_1',
        order: 1,
        type: 'inicial',
        temperature: 95,
        durationSeconds: 180,
        inCycle: false,
      },
      {
        id: 'cor_2',
        order: 2,
        type: 'desnaturalizacion',
        temperature: 95,
        durationSeconds: 30,
        cycles: 35,
        inCycle: true,
      },
      {
        id: 'cor_3',
        order: 3,
        type: 'annealing',
        temperature: 52, // Flawed: needs to be ~60 °C
        durationSeconds: 30,
        cycles: 35,
        inCycle: true,
      },
      {
        id: 'cor_4',
        order: 4,
        type: 'extension',
        temperature: 72,
        durationSeconds: 15, // Flawed: needs to be >= 45s
        cycles: 35,
        inCycle: true,
      },
      {
        id: 'cor_5',
        order: 5,
        type: 'extension_final',
        temperature: 72,
        durationSeconds: 300,
        inCycle: false,
      },
      {
        id: 'cor_6',
        order: 6,
        type: 'hold',
        temperature: 4,
        durationSeconds: 0,
        inCycle: false,
      },
    ];

    return {
      id: `ex_cor_${difficulty}_${Date.now()}`,
      type: 'correccion',
      difficulty,
      title: 'Corrección de Protocolo Defectuoso',
      description: 'Corrige directamente los parámetros de temperatura y duración en los pasos que se encuentren fuera del rango aceptado para los primers y polimerasa dados.',
      assay: baseAssay,
      initialProtocol: flawedProtocol,
      expectedProtocol,
    };
  }

  if (type === 'seleccion') {
    return {
      id: `ex_sel_${difficulty}_${Date.now()}`,
      type: 'seleccion',
      difficulty,
      title: 'Selección de Parámetros Óptimos',
      description: 'Analice las especificaciones técnicas del amplicón de 500 bp y seleccione la combinación térmica de ciclo más apropiada.',
      assay: baseAssay,
      expectedProtocol,
      questionOptions: [
        {
          id: 'opt_a',
          text: 'Desnaturalización 95 °C (30s) · Annealing 60 °C (30s) · Extensión 72 °C (45s) [35 ciclos]',
          isCorrect: true,
          explanation: 'Opción correcta: Annealing a 60 °C coincide con la Tm de los cebadores y 45s de extensión es idóneo para 500 bp a 1 kb/min.',
        },
        {
          id: 'opt_b',
          text: 'Desnaturalización 95 °C (30s) · Annealing 50 °C (30s) · Extensión 72 °C (10s) [35 ciclos]',
          isCorrect: false,
          explanation: 'Incorrecto: 50 °C de hibridación está 10 °C por debajo de la Tm calculada (alta inespecificidad) y 10s no alcanza a polimerizar 500 bp.',
        },
        {
          id: 'opt_c',
          text: 'Desnaturalización 88 °C (30s) · Annealing 65 °C (30s) · Extensión 60 °C (45s) [35 ciclos]',
          isCorrect: false,
          explanation: 'Incorrecto: 88 °C no desnaturaliza eficientemente el ADN genómico bicatenario y la polimerasa rinde deficientemente a 60 °C.',
        },
        {
          id: 'opt_d',
          text: 'Desnaturalización 95 °C (30s) · Annealing 60 °C (30s) · Extensión 95 °C (45s) [55 ciclos]',
          isCorrect: false,
          explanation: "Incorrecto: La extensión no puede realizarse a 95 °C (las hebras no se sintetizan) y 55 ciclos agota los reactivos generando 'smear'.",
        },
      ],
    };
  }

  if (type === 'construccion') {
    return {
      id: `ex_bld_${difficulty}_${Date.now()}`,
      type: 'construccion',
      difficulty,
      title: 'Construcción de Programa a Partir de Componentes',
      description: 'Construya desde cero la tabla del protocolo térmico para amplificar el gen GAPDH (500 bp) utilizando los cebadores y la polimerasa provistos en el panel lateral.',
      assay: baseAssay,
      initialProtocol: [], // empty, user builds from scratch!
      expectedProtocol,
    };
  }

  // Diagnóstico
  return {
    id: `ex_diag_${difficulty}_${Date.now()}`,
    type: 'diagnostico',
    difficulty,
    title: 'Diagnóstico Molecular: Análisis de Electroforesis y Curva de Amplificación',
    description: 'En el ensayo se observa una banda secundaria inespecífica de ~180 bp junto a la banda diana esperada de 500 bp. Diagnostique la causa en el protocolo y ajústelo.',
    assay: baseAssay,
    initialProtocol: [
      {
        id: 'diag_1',
        order: 1,
        type: 'inicial',
        temperature: 95,
        durationSeconds: 180,
        inCycle: false,
      },
      {
        id: 'diag_2',
        order: 2,
        type: 'desnaturalizacion',
        temperature: 95,
        durationSeconds: 30,
        cycles: 35,
        inCycle: true,
      },
      {
        id: 'diag_3',
        order: 3,
        type: 'annealing',
        temperature: 52, // Causative factor: 52°C is too permissive, causing non-specific binding!
        durationSeconds: 30,
        cycles: 35,
        inCycle: true,
      },
      {
        id: 'diag_4',
        order: 4,
        type: 'extension',
        temperature: 72,
        durationSeconds: 45,
        cycles: 35,
        inCycle: true,
      },
      {
        id: 'diag_5',
        order: 5,
        type: 'extension_final',
        temperature: 72,
        durationSeconds: 300,
        inCycle: false,
      },
    ],
    expectedProtocol,
    diagnosticData: {
      observedProblem: 'Aparición de amplicones espurios / bandas inespecíficas por hibridación promiscua de cebadores.',
      gelElectrophoresis: {
        markerLanes: [1000, 750, 500, 250, 100],
        sampleLanes: [
          { lane: 1, bandSizesBp: [500, 180], intensity: 'inespecifica' },
          { lane: 2, bandSizesBp: [500, 180], intensity: 'inespecifica' },
        ],
      },
      meltCurvePeakTemp: 82.5,
      recommendedAdjustment: 'Aumentar la temperatura de hibridación (Annealing) de 52 °C a 60 °C para incrementar la astringencia y eliminar la banda espuria de 180 bp.',
    },
  };
}
