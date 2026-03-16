import { useState, useRef, useCallback, useEffect } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { Shield, Lock, Terminal, FileCheck } from "lucide-react";

// ─── Vehicle State ───
export interface VehicleState {
  steeringAngle: number;
  gear: string;
  rpm: number;
  speed: number;
  accelerator: number;
  brake: number;
  timestamp: number;
}

const GEARS = ["P", "R", "N", "D", "L"];

// ─── Realistic Steering Wheel ───
const SteeringWheel = ({
  angle,
  onAngleChange,
}: {
  angle: number;
  onAngleChange: (a: number) => void;
}) => {
  const wheelRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const lastAngleRef = useRef(0);

  const getAngleFromEvent = useCallback(
    (clientX: number, clientY: number) => {
      if (!wheelRef.current) return 0;
      const rect = wheelRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      return Math.atan2(clientY - cy, clientX - cx) * (180 / Math.PI);
    },
    []
  );

  const handleStart = useCallback(
    (clientX: number, clientY: number) => {
      isDragging.current = true;
      lastAngleRef.current = getAngleFromEvent(clientX, clientY);
    },
    [getAngleFromEvent]
  );

  const handleMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!isDragging.current) return;
      const currentAngle = getAngleFromEvent(clientX, clientY);
      let delta = currentAngle - lastAngleRef.current;
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;
      const newAngle = Math.max(-540, Math.min(540, angle + delta));
      onAngleChange(newAngle);
      lastAngleRef.current = currentAngle;
    },
    [angle, getAngleFromEvent, onAngleChange]
  );

  const handleEnd = useCallback(() => {
    isDragging.current = false;
  }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onUp = () => handleEnd();

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [handleMove, handleEnd]);

  const normalizedAngle = Math.round(angle);

  return (
    <div className="flex flex-col items-center">
      <div
        ref={wheelRef}
        className="relative select-none cursor-grab active:cursor-grabbing touch-none"
        onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
        onTouchStart={(e) =>
          handleStart(e.touches[0].clientX, e.touches[0].clientY)
        }
      >
        <motion.div
          className="relative"
          style={{ rotate: angle }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <svg viewBox="0 0 260 260" className="w-44 h-44 sm:w-52 sm:h-52 drop-shadow-[0_0_30px_hsl(0,0%,0%,0.6)]">
            <defs>
              <radialGradient id="wheelBg" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="hsl(220, 12%, 18%)" />
                <stop offset="100%" stopColor="hsl(220, 15%, 10%)" />
              </radialGradient>
              <linearGradient id="rimGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(220, 10%, 30%)" />
                <stop offset="50%" stopColor="hsl(220, 10%, 22%)" />
                <stop offset="100%" stopColor="hsl(220, 10%, 15%)" />
              </linearGradient>
              <linearGradient id="spokeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="hsl(220, 10%, 28%)" />
                <stop offset="100%" stopColor="hsl(220, 12%, 16%)" />
              </linearGradient>
              <linearGradient id="gripLeft" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(20, 15%, 18%)" />
                <stop offset="50%" stopColor="hsl(20, 12%, 22%)" />
                <stop offset="100%" stopColor="hsl(20, 15%, 16%)" />
              </linearGradient>
              <linearGradient id="gripRight" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(20, 15%, 16%)" />
                <stop offset="50%" stopColor="hsl(20, 12%, 22%)" />
                <stop offset="100%" stopColor="hsl(20, 15%, 18%)" />
              </linearGradient>
              <filter id="innerShadow">
                <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur" />
                <feOffset dx="0" dy="2" result="offsetBlur" />
                <feComposite in="SourceGraphic" in2="offsetBlur" operator="over" />
              </filter>
              <filter id="outerGlow">
                <feGaussianBlur stdDeviation="2" />
                <feComposite in="SourceGraphic" />
              </filter>
            </defs>

            {/* Outer rim - thick rubber */}
            <circle cx="130" cy="130" r="120" fill="none" stroke="hsl(220, 10%, 12%)" strokeWidth="22" />
            <circle cx="130" cy="130" r="120" fill="none" stroke="url(#rimGrad)" strokeWidth="18" />
            {/* Rim highlight */}
            <circle cx="130" cy="130" r="120" fill="none" stroke="hsl(220, 10%, 28%)" strokeWidth="1" opacity="0.4" />
            <circle cx="130" cy="130" r="109" fill="none" stroke="hsl(220, 10%, 14%)" strokeWidth="1" opacity="0.6" />

            {/* Leather grip texture - left (9 o'clock) */}
            <path
              d={`M ${130 + 120 * Math.cos(Math.PI * 0.65)} ${130 + 120 * Math.sin(Math.PI * 0.65)} 
                  A 120 120 0 0 1 ${130 + 120 * Math.cos(Math.PI * 1.35)} ${130 + 120 * Math.sin(Math.PI * 1.35)}`}
              fill="none" stroke="url(#gripLeft)" strokeWidth="20" strokeLinecap="butt" opacity="0.7"
            />
            {/* Leather grip texture - right (3 o'clock) */}
            <path
              d={`M ${130 + 120 * Math.cos(-Math.PI * 0.35)} ${130 + 120 * Math.sin(-Math.PI * 0.35)} 
                  A 120 120 0 0 1 ${130 + 120 * Math.cos(Math.PI * 0.35)} ${130 + 120 * Math.sin(Math.PI * 0.35)}`}
              fill="none" stroke="url(#gripRight)" strokeWidth="20" strokeLinecap="butt" opacity="0.7"
            />

            {/* Grip stitching lines */}
            {[...Array(8)].map((_, i) => {
              const a = Math.PI * 0.7 + (i / 7) * Math.PI * 0.6;
              const x1 = 130 + 111 * Math.cos(a);
              const y1 = 130 + 111 * Math.sin(a);
              const x2 = 130 + 129 * Math.cos(a);
              const y2 = 130 + 129 * Math.sin(a);
              return <line key={`sl${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="hsl(30, 20%, 28%)" strokeWidth="0.5" opacity="0.5" />;
            })}
            {[...Array(8)].map((_, i) => {
              const a = -Math.PI * 0.3 + (i / 7) * Math.PI * 0.6;
              const x1 = 130 + 111 * Math.cos(a);
              const y1 = 130 + 111 * Math.sin(a);
              const x2 = 130 + 129 * Math.cos(a);
              const y2 = 130 + 129 * Math.sin(a);
              return <line key={`sr${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="hsl(30, 20%, 28%)" strokeWidth="0.5" opacity="0.5" />;
            })}

            {/* Three spokes */}
            {/* Left spoke */}
            <path d="M 40 145 Q 65 140 85 135 L 85 125 Q 65 120 40 115" fill="url(#spokeGrad)" stroke="hsl(220, 10%, 25%)" strokeWidth="1" />
            {/* Right spoke */}
            <path d="M 220 145 Q 195 140 175 135 L 175 125 Q 195 120 220 115" fill="url(#spokeGrad)" stroke="hsl(220, 10%, 25%)" strokeWidth="1" />
            {/* Bottom spoke */}
            <path d="M 115 220 Q 120 195 125 175 L 135 175 Q 140 195 145 220" fill="url(#spokeGrad)" stroke="hsl(220, 10%, 25%)" strokeWidth="1" />

            {/* Center hub */}
            <circle cx="130" cy="130" r="42" fill="url(#wheelBg)" stroke="hsl(220, 10%, 22%)" strokeWidth="2" />
            <circle cx="130" cy="130" r="40" fill="none" stroke="hsl(220, 10%, 26%)" strokeWidth="0.5" />

            {/* Hub inner bevel */}
            <circle cx="130" cy="130" r="35" fill="hsl(220, 12%, 13%)" stroke="hsl(220, 10%, 18%)" strokeWidth="1" />

            {/* SAL Logo */}
            <text x="130" y="124" textAnchor="middle" fill="hsl(var(--primary))" fontSize="14" fontWeight="800" letterSpacing="3" fontFamily="monospace">SAL</text>
            <line x1="108" y1="130" x2="152" y2="130" stroke="hsl(var(--primary))" strokeWidth="0.5" opacity="0.4" />
            <text x="130" y="142" textAnchor="middle" fill="hsl(215, 15%, 45%)" fontSize="6" letterSpacing="2" fontFamily="monospace">AUTOMOTIVE</text>

            {/* Top center marker (12 o'clock) */}
            <circle cx="130" cy="19" r="4" fill="hsl(var(--primary))" filter="url(#outerGlow)" />
            <circle cx="130" cy="19" r="2.5" fill="hsl(var(--primary))" opacity="0.9" />

            {/* Airbag text */}
            <text x="130" y="160" textAnchor="middle" fill="hsl(215, 15%, 35%)" fontSize="5" letterSpacing="1.5" fontFamily="monospace">AIRBAG</text>
          </svg>
        </motion.div>
      </div>

      {/* Angle display */}
      <div className="bg-card border border-border rounded-xl px-4 py-2 mt-3 text-center shadow-card">
        <p className="text-[9px] text-muted-foreground uppercase tracking-[0.2em] font-medium">Steering Angle</p>
        <p className="text-2xl font-mono font-bold text-primary tabular-nums">
          {normalizedAngle > 0 ? "+" : ""}{normalizedAngle}°
        </p>
        <div className="flex items-center justify-center gap-3 mt-1">
          <span className={`text-[9px] font-mono ${normalizedAngle < -10 ? "text-primary" : "text-muted-foreground"}`}>◄ LEFT</span>
          <div className="w-16 h-1 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              animate={{
                width: `${Math.abs(normalizedAngle) / 540 * 100}%`,
                marginLeft: normalizedAngle >= 0 ? "50%" : `${50 - Math.abs(normalizedAngle) / 540 * 50}%`,
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          </div>
          <span className={`text-[9px] font-mono ${normalizedAngle > 10 ? "text-primary" : "text-muted-foreground"}`}>RIGHT ►</span>
        </div>
      </div>
    </div>
  );
};

// ─── Gear Shifter (vertical gate pattern) ───
const GearShifter = ({
  gear,
  onGearChange,
}: {
  gear: string;
  onGearChange: (g: string) => void;
}) => (
  <div className="bg-card border border-border rounded-2xl p-3 shadow-card">
    <p className="text-[8px] text-muted-foreground uppercase tracking-[0.2em] text-center mb-2 font-medium">Gear</p>
    <div className="flex items-center gap-1.5">
      {GEARS.map((g) => (
        <motion.button
          key={g}
          onClick={() => onGearChange(g)}
          className={`relative w-11 h-11 rounded-xl font-mono font-bold text-sm transition-all ${
            gear === g
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground active:text-foreground"
          }`}
          whileTap={{ scale: 0.9 }}
        >
          {gear === g && (
            <motion.div
              layoutId="gear-pill"
              className="absolute inset-0 rounded-xl border-2 border-primary bg-primary/10 shadow-[0_0_16px_hsl(var(--primary)/0.3)]"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10">{g}</span>
        </motion.button>
      ))}
    </div>
  </div>
);

// ─── Mini Gauge ───
const MiniGauge = ({
  value,
  max,
  label,
  unit,
  color,
}: {
  value: number;
  max: number;
  label: string;
  unit: string;
  color: string;
}) => {
  const animatedValue = useMotionValue(0);
  const displayValue = useTransform(animatedValue, (v) => Math.round(v));
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const controls = animate(animatedValue, value, {
      duration: 0.5,
      ease: "easeOut",
    });
    const unsub = displayValue.on("change", (v) => setDisplay(v));
    return () => {
      controls.stop();
      unsub();
    };
  }, [value, animatedValue, displayValue]);

  const percentage = Math.min(value / max, 1);
  const size = 110;
  const r = 38;
  const cx = size / 2;
  const cy = size / 2;
  const startAngle = 135;
  const totalArc = 270;

  const polarToCart = (angleDeg: number, radius: number) => {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  };

  const arcPath = (startA: number, endA: number, radius: number) => {
    const s = polarToCart(startA, radius);
    const e = polarToCart(endA, radius);
    const large = endA - startA > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${large} 1 ${e.x} ${e.y}`;
  };

  return (
    <div className="flex flex-col items-center">
      <svg viewBox={`0 0 ${size} ${size}`} className="w-24 h-24">
        <path
          d={arcPath(startAngle, startAngle + totalArc, r)}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth="7"
          strokeLinecap="round"
        />
        <path
          d={arcPath(startAngle, startAngle + percentage * totalArc, r)}
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
        />
        <text
          x={cx}
          y={cy - 2}
          textAnchor="middle"
          fill={color}
          fontSize="16"
          fontWeight="800"
          fontFamily="monospace"
        >
          {display}
        </text>
        <text
          x={cx}
          y={cy + 12}
          textAnchor="middle"
          fill="hsl(var(--muted-foreground))"
          fontSize="7"
          letterSpacing="1"
        >
          {unit}
        </text>
      </svg>
      <span className="text-[9px] text-muted-foreground uppercase tracking-[0.15em] font-medium -mt-1">
        {label}
      </span>
    </div>
  );
};

// ─── Vertical Pedal (touch-friendly) ───
const PedalButton = ({
  label,
  value,
  onChange,
  color,
  icon,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  color: string;
  icon: string;
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const calcValue = useCallback((clientY: number) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const pct = 1 - (clientY - rect.top) / rect.height;
    onChange(Math.round(Math.max(0, Math.min(100, pct * 100))));
  }, [onChange]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => { if (isDragging.current) calcValue(e.clientY); };
    const onTouchMove = (e: TouchEvent) => { if (isDragging.current) { e.preventDefault(); calcValue(e.touches[0].clientY); } };
    const onUp = () => { isDragging.current = false; };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [calcValue]);

  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-semibold">
        {label}
      </span>
      <div
        ref={trackRef}
        className="relative w-16 h-36 rounded-2xl bg-card border border-border overflow-hidden cursor-pointer touch-none shadow-card"
        onMouseDown={(e) => { isDragging.current = true; calcValue(e.clientY); }}
        onTouchStart={(e) => { isDragging.current = true; calcValue(e.touches[0].clientY); }}
      >
        <motion.div
          className="absolute bottom-0 w-full rounded-b-2xl"
          style={{ backgroundColor: color }}
          animate={{ height: `${value}%` }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
          <span className="text-2xl">{icon}</span>
          <span className="text-sm font-mono font-bold text-foreground drop-shadow-md mt-1">
            {value}%
          </span>
        </div>
      </div>
    </div>
  );
};

// ─── Vehicle Blueprint ───
const VehicleBlueprint = ({ steeringAngle }: { steeringAngle: number }) => {
  const wheelAngle = Math.max(-45, Math.min(45, steeringAngle / 12));
  return (
    <svg viewBox="0 0 80 130" className="w-16 h-24">
      <rect x="15" y="15" width="50" height="100" rx="14" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" opacity="0.4" />
      <line x1="40" y1="20" x2="40" y2="110" stroke="hsl(var(--border))" strokeWidth="0.5" strokeDasharray="3 2" />
      {/* Front wheels */}
      <g transform="translate(12, 35)">
        <motion.rect x="-3" y="-7" width="7" height="14" rx="2" fill="hsl(var(--primary))" opacity="0.8"
          animate={{ rotate: wheelAngle }} transition={{ type: "spring", stiffness: 200, damping: 20 }} />
      </g>
      <g transform="translate(68, 35)">
        <motion.rect x="-3" y="-7" width="7" height="14" rx="2" fill="hsl(var(--primary))" opacity="0.8"
          animate={{ rotate: wheelAngle }} transition={{ type: "spring", stiffness: 200, damping: 20 }} />
      </g>
      {/* Rear wheels */}
      <rect x="9" y="88" width="7" height="14" rx="2" fill="hsl(var(--muted-foreground))" opacity="0.4" />
      <rect x="64" y="88" width="7" height="14" rx="2" fill="hsl(var(--muted-foreground))" opacity="0.4" />
      {/* Direction arrow */}
      <motion.path d="M 37 10 L 40 4 L 43 10" fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5" strokeLinecap="round"
        animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 2 }} />
    </svg>
  );
};

// ─── Compact Security Badge ───
const SecurityBadge = ({ logs }: { logs: string[] }) => (
  <div className="bg-card border border-[hsl(150,60%,30%,0.2)] rounded-xl px-3 py-2.5">
    <div className="flex items-center gap-1.5 mb-2">
      <Shield className="h-3.5 w-3.5 text-[hsl(150,80%,50%)]" />
      <Lock className="h-2.5 w-2.5 text-[hsl(150,80%,50%)]" />
      <span className="text-[9px] text-[hsl(150,70%,60%)] uppercase tracking-[0.15em] font-bold">
        Encrypted • Active
      </span>
    </div>
    <div className="max-h-20 overflow-y-auto space-y-0.5 scrollbar-thin">
      {logs.slice(-5).map((log, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -5 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-1.5 text-[9px]"
        >
          <FileCheck className="h-2.5 w-2.5 text-[hsl(150,60%,40%)] flex-shrink-0" />
          <span className="text-[hsl(150,50%,55%)] truncate">{log}</span>
        </motion.div>
      ))}
    </div>
  </div>
);

// ─── Main Panel ───
const VehicleControlPanel = ({
  onStateChange,
}: {
  onStateChange?: (state: VehicleState) => void;
}) => {
  const [vehicleState, setVehicleState] = useState<VehicleState>({
    steeringAngle: 0,
    gear: "P",
    rpm: 0,
    speed: 0,
    accelerator: 0,
    brake: 0,
    timestamp: Date.now(),
  });

  const [securityLogs, setSecurityLogs] = useState<string[]>([
    "AES-256 handshake OK",
    "Session key set",
  ]);

  const addLog = (action: string) => {
    const ts = new Date().toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    setSecurityLogs((prev) => [...prev, `[${ts}] ${action}`]);
  };

  const updateState = useCallback(
    (updates: Partial<VehicleState>) => {
      setVehicleState((prev) => {
        const newState = { ...prev, ...updates, timestamp: Date.now() };
        const accel = updates.accelerator ?? prev.accelerator;
        const brake = updates.brake ?? prev.brake;
        const gear = updates.gear ?? prev.gear;

        let targetRpm = 800;
        let targetSpeed = 0;

        if (gear === "D" || gear === "L") {
          targetRpm = Math.max(800, (accel / 100) * 7000 - (brake / 100) * 3000);
          targetSpeed = Math.max(0, (accel / 100) * 180 - (brake / 100) * 120);
          if (gear === "L") {
            targetRpm = Math.min(targetRpm * 1.3, 8000);
            targetSpeed = Math.min(targetSpeed * 0.6, 80);
          }
        } else if (gear === "R") {
          targetRpm = Math.max(800, (accel / 100) * 3000);
          targetSpeed = Math.max(0, (accel / 100) * 30);
        } else if (gear === "N") {
          targetRpm = Math.max(800, (accel / 100) * 5000);
        }

        if (brake > 0 && gear !== "P") {
          targetSpeed = Math.max(0, targetSpeed * (1 - brake / 120));
        }

        newState.rpm = Math.round(targetRpm);
        newState.speed = Math.round(targetSpeed);
        return newState;
      });
    },
    []
  );

  useEffect(() => {
    onStateChange?.(vehicleState);
  }, [vehicleState, onStateChange]);

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      {/* Top bar: Gauges + Blueprint */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex gap-2">
          <MiniGauge value={vehicleState.rpm} max={8000} label="RPM" unit="RPM" color="hsl(0, 84%, 60%)" />
          <MiniGauge value={vehicleState.speed} max={200} label="Speed" unit="KM/H" color="hsl(var(--primary))" />
        </div>
        <VehicleBlueprint steeringAngle={vehicleState.steeringAngle} />
      </div>

      {/* Gear selector */}
      <GearShifter
        gear={vehicleState.gear}
        onGearChange={(g) => {
          updateState({ gear: g });
          addLog(`Gear → ${g}`);
        }}
      />

      {/* Main control area: Brake | Steering | Accelerator */}
      <div className="flex items-center justify-between gap-3">
        <PedalButton
          label="Brake"
          value={vehicleState.brake}
          onChange={(v) => {
            updateState({ brake: v });
            if (v > 0 && v % 25 === 0) addLog(`Brake ${v}%`);
          }}
          color="hsl(0, 84%, 50%)"
          icon="🛑"
        />

        <SteeringWheel
          angle={vehicleState.steeringAngle}
          onAngleChange={(a) => {
            updateState({ steeringAngle: a });
            if (Math.abs(a) % 45 < 5) addLog(`Steer ${Math.round(a)}°`);
          }}
        />

        <PedalButton
          label="Gas"
          value={vehicleState.accelerator}
          onChange={(v) => {
            updateState({ accelerator: v });
            if (v > 0 && v % 25 === 0) addLog(`Throttle ${v}%`);
          }}
          color="hsl(150, 80%, 40%)"
          icon="⚡"
        />
      </div>

      {/* Security log */}
      <SecurityBadge logs={securityLogs} />

      {/* JSON payload */}
      <details className="bg-card border border-border rounded-xl">
        <summary className="px-3 py-2.5 text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-mono cursor-pointer flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Terminal className="h-3 w-3" />
            ESP32 Payload
          </span>
          <button
            onClick={(e) => {
              e.preventDefault();
              navigator.clipboard.writeText(JSON.stringify(vehicleState, null, 2));
            }}
            className="text-[10px] text-primary hover:text-primary/80 font-mono"
          >
            Copy
          </button>
        </summary>
        <pre className="px-3 pb-2.5 text-[10px] text-[hsl(150,50%,55%)] font-mono overflow-x-auto">
          {JSON.stringify(vehicleState, null, 2)}
        </pre>
      </details>
    </div>
  );
};

export default VehicleControlPanel;
