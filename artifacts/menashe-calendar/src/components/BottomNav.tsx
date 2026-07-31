import { memo } from "react";
import { useLanguage } from "../context/LanguageContext";

interface BottomNavProps {
  active: string;
  onNavigate: (page: string) => void;
  onChat?: () => void;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function CalendarIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" fill={active ? "rgba(212,168,67,0.15)" : "none"} />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function ClockIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={active ? "rgba(212,168,67,0.15)" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function SiddurIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={active ? "rgba(212,168,67,0.1)" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <line x1="10" y1="8" x2="16" y2="8" />
      <line x1="10" y1="12" x2="14" y2="12" />
    </svg>
  );
}

function ChevronIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ transform: collapsed ? "rotate(180deg)" : "none", transition: "transform 0.2s ease" }}
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function JourneyIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={active ? "rgba(212,168,67,0.15)" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="4" fill={active ? "rgba(212,168,67,0.25)" : "none"} />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}

function MoreIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="5"  cy="12" r="1.5" fill={active ? "currentColor" : "none"} />
      <circle cx="12" cy="12" r="1.5" fill={active ? "currentColor" : "none"} />
      <circle cx="19" cy="12" r="1.5" fill={active ? "currentColor" : "none"} />
    </svg>
  );
}

const BottomNav = memo(function BottomNav({ active, onNavigate, collapsed = false, onToggleCollapsed }: BottomNavProps) {
  const { t } = useLanguage();

  const NAV_ITEMS = [
    { id: "home",     label: t.navHome,     icon: HomeIcon,     ariaLabel: "Home",          handler: () => onNavigate("home") },
    { id: "calendar", label: t.navCalendar, icon: CalendarIcon, ariaLabel: "Calendar",       handler: () => onNavigate("calendar") },
    { id: "zmanim",   label: t.navZmanim,   icon: ClockIcon,    ariaLabel: "Prayer times",   handler: () => onNavigate("zmanim") },
    { id: "siddur",   label: t.navSiddur,   icon: SiddurIcon,   ariaLabel: "Siddur library", handler: () => onNavigate("siddur") },
    { id: "journey",  label: t.navJourney,  icon: JourneyIcon,  ariaLabel: "My Journey",     handler: () => onNavigate("journey") },
    { id: "more",     label: "More",        icon: MoreIcon,     ariaLabel: "More options",   handler: () => onNavigate("more") },
  ];

  return (
    <nav className={`bottom-nav${collapsed ? " collapsed" : ""}`} aria-label="Main navigation" style={{ display: "flex" }}>
      <div className="nav-brand">
        <img src="/logo-benei-menashe.png" alt="" className="nav-brand-logo" />
        <span className="nav-brand-text">Bnei Menashe</span>
        {onToggleCollapsed && (
          <button
            type="button"
            className="nav-collapse-toggle"
            onClick={onToggleCollapsed}
            aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
            title={collapsed ? "Expand navigation" : "Collapse navigation"}
          >
            <ChevronIcon collapsed={collapsed} />
          </button>
        )}
      </div>
      {NAV_ITEMS.map(({ id, label, icon: Icon, ariaLabel, handler }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            type="button"
            className={`nav-item ${isActive ? "active" : ""}`}
            onClick={handler}
            aria-label={ariaLabel}
            aria-current={isActive ? "page" : undefined}
            title={collapsed ? ariaLabel : undefined}
            style={{ background: "none", border: "none", flex: 1 }}
          >
            <Icon active={isActive} />
            <span aria-hidden="true">{label}</span>
          </button>
        );
      })}
    </nav>
  );
});

export default BottomNav;
