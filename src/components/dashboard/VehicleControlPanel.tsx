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

// ─── Compact Steering Wheel (mobile game style) ───
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
          className="w-36 h-36 rounded-full border-[5px] border-[hsl(220,15%,25%)] relative flex items-center justify-center shadow-[0_0_25px_hsl(220,15%,10%,0.8)]"
          style={{ rotate: angle }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <div className="absolute inset-0 rounded-full border-2 border-[hsl(220,15%,20%)]" />
          <div className="absolute w-full h-[4px] bg-gradient-to-r from-transparent via-[hsl(220,15%,28%)] to-transparent rounded-full" />
          <div className="absolute w-[4px] h-full bg-gradient-to-b from-transparent via-[hsl(220,15%,28%)] to-transparent rounded-full" />
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[hsl(220,18%,16%)] to-[hsl(220,18%,10%)] border-2 border-[hsl(220,15%,22%)] flex items-center justify-center">
            <span className="text-primary font-bold text-[10px] tracking-widest">SAL</span>
          </div>
          <div className="absolute top-1.5 w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.6)]" />
        </motion.div>
      </div>
      {/* Angle display */}
      <div className="bg-[hsl(220,18%,8%)] border border-[hsl(220,15%,18%)] rounded-lg px-3 py-1 mt-2 text-center">
        <p className="text-[8px] text-muted-foreground uppercase tracking-widest">Angle</p>
        <p className="text-lg font-mono font-bold text-primary tabular-nums">
          {Math.round(angle)}°
        </p>
      </div>
    </div>
  );
};

// ─── Compact Gear Shifter (horizontal pills) ───
const GearShifter = ({
  gear,
  onGearChange,
}: {
  gear: string;
  onGearChange: (g: string) => void;
}) => (
  <div className="flex items-center gap-1">
    {GEARS.map((g) => (
      <motion.button
        key={g}
        onClick={() => onGearChange(g)}
        className={`relative w-10 h-10 rounded-xl font-mono font-bold text-sm transition-all ${
          gear === g
            ? "text-primary"
            : "text-muted-foreground active:text-foreground"
        }`}
        whileTap={{ scale: 0.9 }}
      >
        {gear === g && (
          <motion.div
            layoutId="gear-pill"
            className="absolute inset-0 rounded-xl border border-primary bg-primary/10 shadow-[0_0_12px_hsl(var(--primary)/0.3)]"
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
        )}
        <span className="relative z-10">{g}</span>
      </motion.button>
    ))}
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
  const size = 100;
  const r = 32;
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
      <svg viewBox={`0 0 ${size} ${size}`} className="w-20 h-20">
        <path
          d={arcPath(startAngle, startAngle + totalArc, r)}
          fill="none"
          stroke="hsl(220, 15%, 14%)"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <path
          d={arcPath(startAngle, startAngle + percentage * totalArc, r)}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <text
          x={cx}
          y={cy - 2}
          textAnchor="middle"
          fill={color}
          fontSize="14"
          fontWeight="800"
          fontFamily="monospace"
        >
          {display}
        </text>
        <text
          x={cx}
          y={cy + 10}
          textAnchor="middle"
          fill="hsl(215, 15%, 55%)"
          fontSize="6"
          letterSpacing="1"
        >
          {unit}
        </text>
      </svg>
      <span className="text-[8px] text-muted-foreground uppercase tracking-widest -mt-1">
        {label}
      </span>
    </div>
  );
};

// ─── Vertical Pedal (touch-friendly tall slider) ───
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
    <div className="flex flex-col items-center gap-1">
      <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-medium">
        {label}
      </span>
      <div
        ref={trackRef}
        className="relative w-14 h-32 rounded-2xl bg-[hsl(220,15%,10%)] border border-[hsl(220,15%,18%)] overflow-hidden cursor-pointer touch-none"
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
          <span className="text-xs font-mono font-bold text-white drop-shadow-md mt-0.5">
            {value}%
          </span>
        </div>
      </div>
    </div>
  );
};

// ─── Mini Vehicle Blueprint ───
const VehicleBlueprint = ({ steeringAngle }: { steeringAngle: number }) => {
  const wheelAngle = Math.max(-45, Math.min(45, steeringAngle / 12));
  return (
    <svg viewBox="0 0 80 130" className="w-14 h-20">
      <rect x="15" y="15" width="50" height="100" rx="14" fill="none" stroke="hsl(215,15%,30%)" strokeWidth="1.5" />
      <line x1="40" y1="20" x2="40" y2="110" stroke="hsl(215,15%,18%)" strokeWidth="0.5" strokeDasharray="3 2" />
      {/* Front wheels */}
      <g transform={`translate(12, 35)`}>
        <motion.rect x="-3" y="-7" width="7" height="14" rx="2" fill="hsl(var(--primary))" opacity="0.8"
          animate={{ rotate: wheelAngle }} transition={{ type: "spring", stiffness: 200, damping: 20 }} />
      </g>
      <g transform={`translate(68, 35)`}>
        <motion.rect x="-3" y="-7" width="7" height="14" rx="2" fill="hsl(var(--primary))" opacity="0.8"
          animate={{ rotate: wheelAngle }} transition={{ type: "spring", stiffness: 200, damping: 20 }} />
      </g>
      {/* Rear wheels */}
      <rect x="9" y="88" width="7" height="14" rx="2" fill="hsl(215,15%,35%)" opacity="0.6" />
      <rect x="64" y="88" width="7" height="14" rx="2" fill="hsl(215,15%,35%)" opacity="0.6" />
      {/* Direction arrow */}
      <motion.path d="M 37 10 L 40 4 L 43 10" fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5" strokeLinecap="round"
        animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 2 }} />
    </svg>
  );
};

// ─── Compact Security Badge ───
const SecurityBadge = ({ logs }: { logs: string[] }) => (
  <div className="bg-[hsl(220,18%,6%)] border border-[hsl(150,60%,30%,0.2)] rounded-lg px-2.5 py-2">
    <div className="flex items-center gap-1.5 mb-1.5">
      <Shield className="h-3 w-3 text-[hsl(150,80%,50%)]" />
      <Lock className="h-2.5 w-2.5 text-[hsl(150,80%,50%)]" />
      <span className="text-[8px] text-[hsl(150,70%,60%)] uppercase tracking-widest font-bold">
        Encrypted • Active
      </span>
    </div>
    <div className="max-h-16 overflow-y-auto space-y-0.5 scrollbar-thin">
      {logs.slice(-5).map((log, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -5 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-1 text-[8px]"
        >
          <FileCheck className="h-2 w-2 text-[hsl(150,60%,40%)] flex-shrink-0" />
          <span className="text-[hsl(150,50%,55%)] truncate">{log}</span>
        </motion.div>
      ))}
    </div>
  </div>
);

// ─── Main Panel (Mobile Game Controller Layout) ───
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
    <div className="space-y-3">
      {/* Top bar: Security + Gauges */}
      <div className="flex items-start gap-2">
        {/* Gauges */}
        <div className="flex gap-1 flex-1">
          <MiniGauge value={vehicleState.rpm} max={8000} label="RPM" unit="RPM" color="hsl(0, 84%, 60%)" />
          <MiniGauge value={vehicleState.speed} max={200} label="Speed" unit="KM/H" color="hsl(205, 100%, 55%)" />
        </div>
        {/* Blueprint */}
        <VehicleBlueprint steeringAngle={vehicleState.steeringAngle} />
      </div>

      {/* Gear selector (horizontal) */}
      <div className="flex items-center justify-center gap-2 bg-[hsl(220,18%,8%)] border border-[hsl(220,15%,16%)] rounded-xl px-2 py-1.5">
        <span className="text-[8px] text-muted-foreground uppercase tracking-widest mr-1">Gear</span>
        <GearShifter
          gear={vehicleState.gear}
          onGearChange={(g) => {
            updateState({ gear: g });
            addLog(`Gear → ${g}`);
          }}
        />
      </div>

      {/* Main control area: Brake | Steering | Accelerator */}
      <div className="flex items-center justify-between gap-2">
        {/* Brake pedal */}
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

        {/* Steering wheel (center) */}
        <SteeringWheel
          angle={vehicleState.steeringAngle}
          onAngleChange={(a) => {
            updateState({ steeringAngle: a });
            if (Math.abs(a) % 45 < 5) addLog(`Steer ${Math.round(a)}°`);
          }}
        />

        {/* Accelerator pedal */}
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

      {/* JSON payload (collapsible) */}
      <details className="bg-[hsl(220,18%,6%)] border border-[hsl(220,15%,16%)] rounded-lg">
        <summary className="px-3 py-2 text-[9px] text-muted-foreground uppercase tracking-widest font-mono cursor-pointer flex items-center justify-between">
          <span className="flex items-center gap-1">
            <Terminal className="h-3 w-3" />
            ESP32 Payload
          </span>
          <button
            onClick={(e) => {
              e.preventDefault();
              navigator.clipboard.writeText(JSON.stringify(vehicleState, null, 2));
            }}
            className="text-[9px] text-primary hover:text-primary/80 font-mono"
          >
            Copy
          </button>
        </summary>
        <pre className="px-3 pb-2 text-[9px] text-[hsl(150,50%,55%)] font-mono overflow-x-auto">
          {JSON.stringify(vehicleState, null, 2)}
        </pre>
      </details>
    </div>
  );
};

export default VehicleControlPanel;
