import { useState, useRef, useCallback, useEffect } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { Shield, Lock, KeyRound, FileCheck, Terminal } from "lucide-react";

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
const GEAR_LABELS: Record<string, string> = {
  P: "Park",
  R: "Reverse",
  N: "Neutral",
  D: "Drive",
  L: "Low",
};

// ─── Steering Wheel ───
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
    <div className="flex flex-col items-center gap-3">
      <div
        ref={wheelRef}
        className="relative select-none cursor-grab active:cursor-grabbing"
        onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
        onTouchStart={(e) =>
          handleStart(e.touches[0].clientX, e.touches[0].clientY)
        }
      >
        <motion.div
          className="w-44 h-44 sm:w-56 sm:h-56 rounded-full border-[6px] border-[hsl(220,15%,25%)] relative flex items-center justify-center shadow-[0_0_30px_hsl(220,15%,10%,0.8),inset_0_0_20px_hsl(220,15%,8%,0.5)]"
          style={{ rotate: angle }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {/* Outer ring */}
          <div className="absolute inset-0 rounded-full border-[3px] border-[hsl(220,15%,20%)]" />

          {/* Spokes */}
          <div className="absolute w-full h-[6px] bg-gradient-to-r from-transparent via-[hsl(220,15%,28%)] to-transparent rounded-full" />
          <div className="absolute w-[6px] h-full bg-gradient-to-b from-transparent via-[hsl(220,15%,28%)] to-transparent rounded-full" />

          {/* Center hub */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-[hsl(220,18%,16%)] to-[hsl(220,18%,10%)] border-2 border-[hsl(220,15%,22%)] flex items-center justify-center shadow-[inset_0_2px_8px_hsl(0,0%,0%,0.4)]">
            <span className="text-primary font-display font-bold text-xs sm:text-sm tracking-widest">
              SAL
            </span>
          </div>

          {/* Top marker */}
          <div className="absolute top-2 w-3 h-3 rounded-full bg-primary shadow-[0_0_10px_hsl(var(--primary)/0.6)]" />
        </motion.div>
      </div>

      {/* Digital angle display */}
      <div className="bg-[hsl(220,18%,8%)] border border-[hsl(220,15%,18%)] rounded-lg px-4 py-2 text-center min-w-[140px]">
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5">
          Steering Angle
        </p>
        <p className="text-2xl sm:text-3xl font-mono font-bold text-primary tabular-nums">
          {Math.round(angle)}°
        </p>
      </div>
    </div>
  );
};

// ─── Gear Shifter ───
const GearShifter = ({
  gear,
  onGearChange,
}: {
  gear: string;
  onGearChange: (g: string) => void;
}) => (
  <div className="flex flex-col items-center gap-1">
    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
      Gear
    </p>
    <div className="bg-[hsl(220,18%,8%)] border border-[hsl(220,15%,18%)] rounded-xl p-1.5 flex flex-col gap-1">
      {GEARS.map((g) => (
        <motion.button
          key={g}
          onClick={() => onGearChange(g)}
          className={`relative w-14 sm:w-16 py-2.5 sm:py-3 rounded-lg font-mono font-bold text-sm sm:text-base transition-all ${
            gear === g
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
          whileTap={{ scale: 0.95 }}
        >
          {gear === g && (
            <motion.div
              layoutId="gear-indicator"
              className="absolute inset-0 rounded-lg border border-primary bg-primary/10 shadow-[0_0_15px_hsl(var(--primary)/0.3),inset_0_0_10px_hsl(var(--primary)/0.1)]"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10">{g}</span>
        </motion.button>
      ))}
    </div>
    <div className="bg-[hsl(220,18%,8%)] border border-[hsl(220,15%,18%)] rounded-lg px-3 py-1.5 mt-1 text-center">
      <p className="text-[9px] text-muted-foreground uppercase tracking-widest">
        Current
      </p>
      <p className="text-xs font-medium text-foreground">
        {GEAR_LABELS[gear]}
      </p>
    </div>
  </div>
);

// ─── Circular Gauge ───
const CircularGauge = ({
  value,
  max,
  label,
  unit,
  color,
  size = 160,
}: {
  value: number;
  max: number;
  label: string;
  unit: string;
  color: string;
  size?: number;
}) => {
  const animatedValue = useMotionValue(0);
  const displayValue = useTransform(animatedValue, (v) => Math.round(v));
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const controls = animate(animatedValue, value, {
      duration: 0.6,
      ease: "easeOut",
    });
    const unsub = displayValue.on("change", (v) => setDisplay(v));
    return () => {
      controls.stop();
      unsub();
    };
  }, [value, animatedValue, displayValue]);

  const percentage = Math.min(value / max, 1);
  const r = size * 0.35;
  const cx = size / 2;
  const cy = size / 2;
  const startAngle = 135;
  const totalArc = 270;
  const circumference = (totalArc / 360) * 2 * Math.PI * r;

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
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full" style={{ maxWidth: size }}>
        <defs>
          <filter id={`glow-${label}`}>
            <feGaussianBlur stdDeviation="3" />
            <feComposite in="SourceGraphic" />
          </filter>
        </defs>
        {/* Background arc */}
        <path
          d={arcPath(startAngle, startAngle + totalArc, r)}
          fill="none"
          stroke="hsl(220, 15%, 14%)"
          strokeWidth="8"
          strokeLinecap="round"
        />
        {/* Active arc */}
        <motion.path
          d={arcPath(startAngle, startAngle + percentage * totalArc, r)}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          initial={false}
          animate={{ pathLength: 1 }}
        />
        {/* Glow */}
        <path
          d={arcPath(startAngle, startAngle + percentage * totalArc, r)}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          opacity="0.25"
          filter={`url(#glow-${label})`}
        />
        {/* Center text */}
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          fill={color}
          fontSize={size * 0.18}
          fontWeight="800"
          fontFamily="monospace"
        >
          {display}
        </text>
        <text
          x={cx}
          y={cy + size * 0.1}
          textAnchor="middle"
          fill="hsl(215, 15%, 55%)"
          fontSize={size * 0.07}
          letterSpacing="2"
        >
          {unit}
        </text>
        <text
          x={cx}
          y={size - 10}
          textAnchor="middle"
          fill="hsl(215, 15%, 45%)"
          fontSize={size * 0.065}
          letterSpacing="1"
          style={{ textTransform: "uppercase" }}
        >
          {label}
        </text>
      </svg>
    </div>
  );
};

// ─── Pedal Controls ───
const PedalControl = ({
  label,
  value,
  onChange,
  color,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  color: string;
}) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground uppercase tracking-widest">
        {label}
      </span>
      <span className="text-sm font-mono font-bold" style={{ color }}>
        {value}%
      </span>
    </div>
    <div className="relative">
      <div className="h-6 w-full rounded-full bg-[hsl(220,15%,12%)] border border-[hsl(220,15%,18%)] overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          animate={{ width: `${value}%` }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
    </div>
    {/* Tick marks */}
    <div className="flex justify-between px-0.5">
      {[0, 25, 50, 75, 100].map((t) => (
        <span key={t} className="text-[8px] text-muted-foreground/50">
          {t}
        </span>
      ))}
    </div>
  </div>
);

// ─── Cybersecurity HUD ───
const SecurityHUD = ({
  logs,
  handshakeStatus,
}: {
  logs: string[];
  handshakeStatus: string;
}) => (
  <div className="bg-[hsl(220,18%,6%)] border border-[hsl(150,60%,30%,0.3)] rounded-xl p-3 sm:p-4 space-y-3 font-mono text-xs">
    <div className="flex items-center gap-2 text-[hsl(150,80%,50%)]">
      <Shield className="h-4 w-4" />
      <span className="uppercase tracking-widest text-[10px] font-bold">
        Security HUD
      </span>
    </div>

    <div className="flex items-center gap-2 bg-[hsl(150,60%,15%,0.2)] rounded-lg p-2">
      <Lock className="h-3.5 w-3.5 text-[hsl(150,80%,50%)]" />
      <span className="text-[hsl(150,70%,60%)]">Encrypted Handshake:</span>
      <span
        className={`font-bold ${
          handshakeStatus === "ACTIVE"
            ? "text-[hsl(150,80%,50%)]"
            : "text-[hsl(0,80%,60%)]"
        }`}
      >
        {handshakeStatus}
      </span>
    </div>

    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-[hsl(150,70%,60%)]">
        <Terminal className="h-3 w-3" />
        <span className="text-[9px] uppercase tracking-wider">
          Command Signing Log
        </span>
      </div>
      <div className="max-h-24 overflow-y-auto space-y-0.5 scrollbar-thin">
        {logs.slice(-8).map((log, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-1.5 text-[10px]"
          >
            <FileCheck className="h-2.5 w-2.5 text-[hsl(150,60%,40%)] flex-shrink-0" />
            <span className="text-[hsl(150,50%,55%)] truncate">{log}</span>
          </motion.div>
        ))}
      </div>
    </div>
  </div>
);

// ─── Vehicle Blueprint ───
const VehicleBlueprint = ({ steeringAngle }: { steeringAngle: number }) => {
  const wheelAngle = Math.max(-45, Math.min(45, steeringAngle / 12));

  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
        Vehicle Blueprint
      </p>
      <svg viewBox="0 0 120 200" className="w-24 sm:w-32">
        {/* Car body outline */}
        <rect
          x="25"
          y="30"
          width="70"
          height="140"
          rx="20"
          ry="20"
          fill="none"
          stroke="hsl(215, 15%, 30%)"
          strokeWidth="1.5"
        />
        {/* Windshield */}
        <path
          d="M 35 65 Q 60 55 85 65"
          fill="none"
          stroke="hsl(215, 15%, 25%)"
          strokeWidth="1"
        />
        {/* Rear window */}
        <path
          d="M 35 140 Q 60 150 85 140"
          fill="none"
          stroke="hsl(215, 15%, 25%)"
          strokeWidth="1"
        />
        {/* Center line */}
        <line
          x1="60"
          y1="40"
          x2="60"
          y2="160"
          stroke="hsl(215, 15%, 18%)"
          strokeWidth="0.5"
          strokeDasharray="4 3"
        />

        {/* Front left wheel */}
        <g transform={`translate(22, 55)`}>
          <motion.rect
            x="-5"
            y="-10"
            width="10"
            height="20"
            rx="3"
            fill="hsl(var(--primary))"
            opacity="0.8"
            animate={{ rotate: wheelAngle }}
            style={{ originX: "0px", originY: "0px" }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          />
        </g>
        {/* Front right wheel */}
        <g transform={`translate(98, 55)`}>
          <motion.rect
            x="-5"
            y="-10"
            width="10"
            height="20"
            rx="3"
            fill="hsl(var(--primary))"
            opacity="0.8"
            animate={{ rotate: wheelAngle }}
            style={{ originX: "0px", originY: "0px" }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          />
        </g>
        {/* Rear left wheel */}
        <rect
          x="17"
          y="135"
          width="10"
          height="20"
          rx="3"
          fill="hsl(215, 15%, 35%)"
          opacity="0.6"
        />
        {/* Rear right wheel */}
        <rect
          x="93"
          y="135"
          width="10"
          height="20"
          rx="3"
          fill="hsl(215, 15%, 35%)"
          opacity="0.6"
        />

        {/* Direction indicator */}
        <motion.path
          d="M 55 20 L 60 10 L 65 20"
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="1.5"
          strokeLinecap="round"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 2 }}
        />
      </svg>
    </div>
  );
};

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
    "System initialized — AES-256 handshake",
    "Session key established",
  ]);

  const addSecurityLog = (action: string) => {
    const ts = new Date().toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    setSecurityLogs((prev) => [
      ...prev,
      `[${ts}] SIGNED: ${action}`,
    ]);
  };

  const updateState = useCallback(
    (updates: Partial<VehicleState>) => {
      setVehicleState((prev) => {
        const newState = { ...prev, ...updates, timestamp: Date.now() };

        // Calculate RPM & speed from accelerator/gear
        const accel = updates.accelerator ?? prev.accelerator;
        const brake = updates.brake ?? prev.brake;
        const gear = updates.gear ?? prev.gear;

        let targetRpm = 0;
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
          targetSpeed = 0;
        } else {
          targetRpm = 800;
          targetSpeed = 0;
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

  // Fire onStateChange whenever vehicleState updates
  useEffect(() => {
    onStateChange?.(vehicleState);
  }, [vehicleState, onStateChange]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Title bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
            <KeyRound className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            Vehicle Control
          </h2>
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            Remote command interface • ESP32 compatible
          </p>
        </div>
        <div className="bg-[hsl(150,60%,15%,0.2)] border border-[hsl(150,60%,30%,0.3)] rounded-full px-2.5 py-1 flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[hsl(150,80%,50%)] animate-pulse" />
          <span className="text-[10px] text-[hsl(150,70%,60%)] font-mono">
            ENCRYPTED
          </span>
        </div>
      </div>

      {/* Main controls grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* Left column: Steering + Blueprint */}
        <div className="lg:col-span-5 flex flex-col items-center gap-4 sm:gap-6">
          <div className="bg-[hsl(220,18%,8%)] border border-[hsl(220,15%,16%)] rounded-2xl p-4 sm:p-6 w-full flex flex-col items-center">
            <SteeringWheel
              angle={vehicleState.steeringAngle}
              onAngleChange={(a) => {
                updateState({ steeringAngle: a });
                addSecurityLog(`Steering → ${Math.round(a)}°`);
              }}
            />
          </div>
          <div className="bg-[hsl(220,18%,8%)] border border-[hsl(220,15%,16%)] rounded-2xl p-4 w-full flex justify-center">
            <VehicleBlueprint steeringAngle={vehicleState.steeringAngle} />
          </div>
        </div>

        {/* Center column: Gauges + Pedals */}
        <div className="lg:col-span-4 space-y-4 sm:space-y-6">
          {/* Gauges */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-[hsl(220,18%,8%)] border border-[hsl(220,15%,16%)] rounded-2xl p-3 sm:p-4">
              <CircularGauge
                value={vehicleState.rpm}
                max={8000}
                label="Tachometer"
                unit="RPM"
                color="hsl(0, 84%, 60%)"
                size={140}
              />
            </div>
            <div className="bg-[hsl(220,18%,8%)] border border-[hsl(220,15%,16%)] rounded-2xl p-3 sm:p-4">
              <CircularGauge
                value={vehicleState.speed}
                max={200}
                label="Speedometer"
                unit="KM/H"
                color="hsl(205, 100%, 55%)"
                size={140}
              />
            </div>
          </div>

          {/* Pedals */}
          <div className="bg-[hsl(220,18%,8%)] border border-[hsl(220,15%,16%)] rounded-2xl p-4 sm:p-5 space-y-5">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
              Pedal Controls
            </p>
            <PedalControl
              label="Accelerator"
              value={vehicleState.accelerator}
              onChange={(v) => {
                updateState({ accelerator: v });
                if (v > 0 && v % 20 === 0)
                  addSecurityLog(`Throttle → ${v}%`);
              }}
              color="hsl(150, 80%, 45%)"
            />
            <PedalControl
              label="Brake"
              value={vehicleState.brake}
              onChange={(v) => {
                updateState({ brake: v });
                if (v > 0 && v % 20 === 0)
                  addSecurityLog(`Brake → ${v}%`);
              }}
              color="hsl(0, 84%, 60%)"
            />
          </div>
        </div>

        {/* Right column: Gear + Security */}
        <div className="lg:col-span-3 space-y-4 sm:space-y-6">
          <div className="bg-[hsl(220,18%,8%)] border border-[hsl(220,15%,16%)] rounded-2xl p-4 flex justify-center">
            <GearShifter
              gear={vehicleState.gear}
              onGearChange={(g) => {
                updateState({ gear: g });
                addSecurityLog(`Gear → ${GEAR_LABELS[g]}`);
              }}
            />
          </div>
          <SecurityHUD
            logs={securityLogs}
            handshakeStatus="ACTIVE"
          />
        </div>
      </div>

      {/* JSON Payload preview */}
      <div className="bg-[hsl(220,18%,6%)] border border-[hsl(220,15%,16%)] rounded-xl p-3 sm:p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">
            ESP32 JSON Payload
          </span>
          <button
            onClick={() => {
              navigator.clipboard.writeText(JSON.stringify(vehicleState, null, 2));
            }}
            className="text-[10px] text-primary hover:text-primary/80 font-mono transition-colors"
          >
            Copy
          </button>
        </div>
        <pre className="text-[10px] sm:text-xs text-[hsl(150,50%,55%)] font-mono overflow-x-auto">
          {JSON.stringify(vehicleState, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default VehicleControlPanel;
