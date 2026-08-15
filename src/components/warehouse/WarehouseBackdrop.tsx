/**
 * Subtle futuristic warehouse backdrop: racks, shelves, boxes, barcode strips,
 * a scanner line and a slow-moving forklift silhouette.
 * Purely decorative — very low opacity so readability is never reduced.
 */
export function WarehouseBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* base glow */}
      <div className="absolute inset-0 bg-background" />
      <div className="absolute -top-40 left-1/2 h-[36rem] w-[70rem] -translate-x-1/2 bg-gradient-glow animate-pulse-glow" />
      <div className="absolute bottom-0 right-0 h-[28rem] w-[28rem] rounded-full bg-gradient-glow opacity-60 blur-3xl" />

      {/* perspective floor grid */}
      <svg className="absolute inset-x-0 bottom-0 h-[45%] w-full opacity-[0.16]" preserveAspectRatio="none" viewBox="0 0 100 40">
        <defs>
          <linearGradient id="wm-fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.7 0.16 265)" stopOpacity="0" />
            <stop offset="100%" stopColor="oklch(0.7 0.16 265)" stopOpacity="1" />
          </linearGradient>
        </defs>
        {Array.from({ length: 21 }).map((_, i) => (
          <line key={`v${i}`} x1={50 + (i - 10) * 1.6} y1="0" x2={i * 5} y2="40" stroke="url(#wm-fade)" strokeWidth="0.12" />
        ))}
        {Array.from({ length: 9 }).map((_, i) => {
          const y = 40 - Math.pow(1 - i / 9, 2) * 40;
          return <line key={`h${i}`} x1="0" y1={y} x2="100" y2={y} stroke="url(#wm-fade)" strokeWidth="0.1" />;
        })}
      </svg>

      {/* warehouse racks with boxes */}
      <svg className="absolute left-0 top-24 h-72 w-72 opacity-[0.10] animate-float" viewBox="0 0 120 120" fill="none" stroke="oklch(0.75 0.14 262)" strokeWidth="1.6">
        <RackShape />
      </svg>
      <svg className="absolute right-6 top-1/3 h-80 w-80 opacity-[0.09] animate-float [animation-delay:1.5s]" viewBox="0 0 120 120" fill="none" stroke="oklch(0.78 0.12 250)" strokeWidth="1.6">
        <RackShape />
      </svg>

      {/* stacked packages */}
      <svg className="absolute bottom-16 left-1/4 h-40 w-40 opacity-[0.10]" viewBox="0 0 100 100" fill="none" stroke="oklch(0.8 0.12 255)" strokeWidth="1.6">
        <rect x="10" y="55" width="34" height="30" />
        <path d="M10 65h34M27 55v30" />
        <rect x="50" y="45" width="34" height="40" />
        <path d="M50 58h34M67 45v40" />
        <rect x="28" y="20" width="30" height="26" />
        <path d="M28 30h30M43 20v26" />
      </svg>

      {/* barcode strip */}
      <div className="absolute right-10 bottom-24 flex h-16 items-end gap-[3px] opacity-[0.13]">
        {[7, 3, 11, 4, 9, 2, 13, 5, 8, 3, 12, 6, 10, 4].map((h, i) => (
          <span key={i} className="w-[3px] rounded-sm bg-primary-glow" style={{ height: `${h * 5}px` }} />
        ))}
      </div>

      {/* scanner sweep */}
      <div className="absolute left-0 top-0 h-px w-full bg-gradient-primary opacity-40 animate-scanline" />

      {/* forklift silhouette driving across */}
      <svg className="absolute bottom-6 h-16 w-24 opacity-[0.12] animate-drive" viewBox="0 0 100 60" fill="none" stroke="oklch(0.8 0.14 258)" strokeWidth="2.2">
        <path d="M18 44h34V22H34l-6 10H18z" />
        <path d="M52 44V16h6l10 28" />
        <path d="M70 44V14h4M70 20h12" />
        <circle cx="26" cy="50" r="6" />
        <circle cx="50" cy="50" r="5" />
      </svg>
    </div>
  );
}

function RackShape() {
  return (
    <g>
      <path d="M8 12v96M56 12v96M8 12h48M8 44h48M8 76h48M8 108h48" />
      <rect x="14" y="20" width="16" height="16" />
      <rect x="34" y="24" width="14" height="12" />
      <rect x="14" y="54" width="20" height="18" />
      <rect x="38" y="58" width="12" height="14" />
      <rect x="18" y="88" width="14" height="16" />
      <rect x="36" y="84" width="16" height="20" />
      <path d="M68 12v96M116 12v96M68 12h48M68 44h48M68 76h48M68 108h48" />
      <rect x="74" y="18" width="18" height="20" />
      <rect x="96" y="26" width="14" height="12" />
      <rect x="78" y="52" width="14" height="20" />
    </g>
  );
}
