import React from 'react';
import { 
  Home, 
  FlaskConical, 
  SlidersHorizontal, 
  GraduationCap, 
  PlaySquare, 
  BookOpen, 
  History, 
  Settings,
  ChevronRight,
  Cpu
} from 'lucide-react';

export type NavSection = 
  | 'inicio'
  | 'termociclador_real'
  | 'nuevo_ensayo'
  | 'programador'
  | 'ejercicios'
  | 'simulacion'
  | 'conocimiento'
  | 'historial'
  | 'configuracion';

interface SidebarProps {
  currentSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  activeIssuesCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentSection,
  onSelectSection,
  isOpenMobile,
  onCloseMobile,
  activeIssuesCount = 0,
}) => {
  const navItems: {
    id: NavSection;
    label: string;
    description: string;
    icon: React.ElementType;
    badge?: string | number;
  }[] = [
    {
      id: 'inicio',
      label: 'Inicio',
      description: 'Panel general y accesos',
      icon: Home,
    },
    {
      id: 'termociclador_real',
      label: 'Termociclador Real',
      description: 'Labbox THCY-1KS-001',
      icon: Cpu,
      badge: 'Físico',
    },
    {
      id: 'nuevo_ensayo',
      label: 'Nuevo ensayo',
      description: 'Componentes y química',
      icon: FlaskConical,
    },
    {
      id: 'programador',
      label: 'Programador',
      description: 'Edición de protocolo térmico',
      icon: SlidersHorizontal,
      badge: activeIssuesCount > 0 ? `${activeIssuesCount} rev.` : undefined,
    },
    {
      id: 'simulacion',
      label: 'Simulación',
      description: 'Control instrumental digital',
      icon: PlaySquare,
    },
    {
      id: 'ejercicios',
      label: 'Ejercicios',
      description: 'Plataforma de entrenamiento',
      icon: GraduationCap,
    },
    {
      id: 'conocimiento',
      label: 'Conocimiento',
      description: 'Base científica y reglas',
      icon: BookOpen,
    },
    {
      id: 'historial',
      label: 'Historial',
      description: 'Ensayos y evaluaciones',
      icon: History,
    },
    {
      id: 'configuracion',
      label: 'Configuración',
      description: 'Hardware y parámetros',
      icon: Settings,
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Navigation list */}
        <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-mono uppercase tracking-wider text-slate-400">
            Navegación Principal
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentSection === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectSection(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors group ${
                  isActive
                    ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-800/60'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'
                    }`}
                  />
                  <div className="truncate">
                    <div className="text-xs font-semibold text-slate-200 leading-tight">
                      {item.label}
                    </div>
                    <div className="text-[11px] text-slate-400 leading-none mt-0.5 truncate">
                      {item.description}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  {item.badge && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-400 border border-amber-800/60">
                      {item.badge}
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-cyan-400" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Quick Instrument Spec Card */}
        <div className="p-3 m-3 bg-slate-950/80 border border-slate-800 rounded-lg text-xs space-y-1.5 font-mono">
          <div className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">
            Hardware Activo
          </div>
          <div className="text-slate-300 font-medium text-xs truncate">
            Termociclador 96W Fast
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>Rampa:</span>
            <span className="text-cyan-400 tabular-nums font-semibold">5.0 °C/s</span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>Tapa calefactada:</span>
            <span className="text-emerald-400 tabular-nums font-semibold">105.0 °C</span>
          </div>
        </div>
      </aside>
    </>
  );
};
