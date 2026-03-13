import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LogOut, ArrowLeft, Wifi, WifiOff, AlertTriangle,
  MapPin, Radio, Activity, Heart, Droplets, Fuel,
  DoorOpen, DoorClosed, Hand, TriangleAlert, Gamepad2, BarChart3
} from "lucide-react";
import VehicleControlPanel from "@/components/dashboard/VehicleControlPanel";
import { toast } from "sonner";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface DeviceData {
  id: string;
  device_id: string;
  speed: number;
  accident: number;
  latitude: number;
  longitude: number;
  gsm_signal: number;
  spo2: number;
  bpm: number;
  fuel: number;
  door_open: number;
  touch1: number;
  touch2: number;
  seatbelt: number;
  created_at: string;
}

interface Device {
  id: string;
  device_id: string;
  name: string;
}

// ──────────── Modern Speed Gauge ────────────
const SpeedGauge = ({ speed }: { speed: number }) => {
  const maxSpeed = 180;
  const clampedSpeed = Math.min(speed, maxSpeed);
  const percentage = clampedSpeed / maxSpeed;

  const cx = 120, cy = 120, r = 95;
  const startAngle = 135, endAngle = 405;
  const totalArc = endAngle - startAngle;
  const needleAngle = startAngle + percentage * totalArc;

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

  const getColor = () => {
    if (speed <= 60) return "hsl(152, 82%, 50%)";
    if (speed <= 100) return "hsl(45, 100%, 55%)";
    if (speed <= 140) return "hsl(25, 100%, 55%)";
    return "hsl(0, 85%, 58%)";
  };

  const getGlowId = () => {
    if (speed <= 60) return "glowGreen";
    if (speed <= 100) return "glowYellow";
    if (speed <= 140) return "glowOrange";
    return "glowRed";
  };

  const ticks = [0, 20, 40, 60, 80, 100, 120, 140, 160, 180];
  const needle = polarToCart(needleAngle, 72);

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 240 200" className="w-full max-w-[240px] sm:max-w-[320px] drop-shadow-lg">
        <defs>
          <filter id="glowGreen"><feGaussianBlur stdDeviation="4" /><feComposite in="SourceGraphic" /></filter>
          <filter id="glowYellow"><feGaussianBlur stdDeviation="4" /><feComposite in="SourceGraphic" /></filter>
          <filter id="glowOrange"><feGaussianBlur stdDeviation="4" /><feComposite in="SourceGraphic" /></filter>
          <filter id="glowRed"><feGaussianBlur stdDeviation="4" /><feComposite in="SourceGraphic" /></filter>
          <filter id="needleGlow"><feGaussianBlur stdDeviation="3" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(220, 18%, 12%)" />
            <stop offset="100%" stopColor="hsl(220, 18%, 6%)" />
          </linearGradient>
          <linearGradient id="activeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(152, 82%, 50%)" />
            <stop offset="40%" stopColor="hsl(45, 100%, 55%)" />
            <stop offset="70%" stopColor="hsl(25, 100%, 55%)" />
            <stop offset="100%" stopColor="hsl(0, 85%, 58%)" />
          </linearGradient>
        </defs>

        <circle cx={cx} cy={cy} r="110" fill="none" stroke="hsl(220, 15%, 14%)" strokeWidth="1" opacity="0.5" />
        <path d={arcPath(startAngle, endAngle, r)} fill="none" stroke="hsl(220, 15%, 14%)" strokeWidth="10" strokeLinecap="round" />
        <path d={arcPath(startAngle, startAngle + percentage * totalArc, r)} fill="none" stroke="url(#activeGrad)" strokeWidth="10" strokeLinecap="round"
          style={{ transition: "all 0.8s cubic-bezier(0.4, 0, 0.2, 1)" }} />
        <path d={arcPath(startAngle, startAngle + percentage * totalArc, r)} fill="none" stroke={getColor()} strokeWidth="10" strokeLinecap="round"
          opacity="0.3" filter={`url(#${getGlowId()})`} style={{ transition: "all 0.8s cubic-bezier(0.4, 0, 0.2, 1)" }} />

        {Array.from({ length: 45 }).map((_, i) => {
          const angle = startAngle + (i / 44) * totalArc;
          const isMajor = i % 5 === 0;
          const inner = polarToCart(angle, isMajor ? 80 : 84);
          const outer = polarToCart(angle, 88);
          return (
            <line key={i} x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y}
              stroke={isMajor ? "hsl(var(--muted-foreground))" : "hsl(220, 15%, 20%)"}
              strokeWidth={isMajor ? 2 : 0.8} strokeLinecap="round" />
          );
        })}

        {ticks.map((tick) => {
          const angle = startAngle + (tick / maxSpeed) * totalArc;
          const pos = polarToCart(angle, 68);
          return (
            <text key={tick} x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="middle"
              fill="hsl(var(--muted-foreground))" fontSize="8" fontWeight="500">{tick}</text>
          );
        })}

        <line x1={cx} y1={cy} x2={needle.x} y2={needle.y} stroke={getColor()} strokeWidth="2.5" strokeLinecap="round"
          filter="url(#needleGlow)" style={{ transition: "all 0.8s cubic-bezier(0.4, 0, 0.2, 1)" }} />
        <circle cx={cx} cy={cy} r="8" fill="hsl(220, 18%, 14%)" stroke={getColor()} strokeWidth="2" />
        <circle cx={cx} cy={cy} r="3" fill={getColor()} />

        <text x={cx} y={cy + 30} textAnchor="middle" fill={getColor()} fontSize="36" fontWeight="800"
          style={{ transition: "fill 0.5s" }}>{speed}</text>
        <text x={cx} y={cy + 45} textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="10" letterSpacing="2">KM/H</text>

        <text x={35} y={185} textAnchor="middle" fill="hsl(152, 82%, 50%)" fontSize="6" fontWeight="600" opacity="0.7">SAFE</text>
        <text x={cx} y={28} textAnchor="middle" fill="hsl(45, 100%, 55%)" fontSize="6" fontWeight="600" opacity="0.7">MODERATE</text>
        <text x={205} y={185} textAnchor="middle" fill="hsl(0, 85%, 58%)" fontSize="6" fontWeight="600" opacity="0.7">DANGER</text>
      </svg>
    </div>
  );
};

// ──────────── Fuel Bar ────────────
const FuelBar = ({ fuel }: { fuel: number }) => {
  const getColor = () => {
    if (fuel <= 20) return "bg-destructive";
    if (fuel <= 50) return "bg-[hsl(30,90%,50%)]";
    return "bg-[hsl(142,76%,46%)]";
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Empty</span>
        <span className="font-bold text-foreground text-lg">{fuel}%</span>
        <span className="text-muted-foreground">Full</span>
      </div>
      <div className="h-5 w-full rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ease-out ${getColor()}`}
          style={{ width: `${Math.min(fuel, 100)}%` }} />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>0</span><span>20</span><span>50</span><span>100</span>
      </div>
    </div>
  );
};

// ──────────── Door Indicator ────────────
const DoorIndicator = ({ isOpen }: { isOpen: boolean }) => (
  <div className={`flex items-center gap-2 sm:gap-3 rounded-xl p-3 sm:p-4 transition-all duration-500 ${
    isOpen 
      ? "bg-destructive/15 border border-destructive shadow-[0_0_20px_hsl(0,85%,58%,0.15)]" 
      : "bg-[hsl(142,76%,46%,0.1)] border border-[hsl(142,76%,46%,0.3)]"
  }`}>
    <div className={`relative h-10 w-10 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center transition-all duration-500 ${
      isOpen ? "bg-destructive/20" : "bg-[hsl(142,76%,46%,0.15)]"
    }`}>
      {isOpen ? (
        <DoorOpen className="h-6 w-6 text-destructive animate-pulse" />
      ) : (
        <DoorClosed className="h-6 w-6 text-[hsl(142,76%,46%)]" />
      )}
      <span className={`absolute -top-1 -right-1 h-3 w-3 rounded-full ${
        isOpen ? "bg-destructive animate-ping" : "bg-[hsl(142,76%,46%)]"
      }`} />
      <span className={`absolute -top-1 -right-1 h-3 w-3 rounded-full ${
        isOpen ? "bg-destructive" : "bg-[hsl(142,76%,46%)]"
      }`} />
    </div>
    <div>
      <p className={`text-sm font-bold ${isOpen ? "text-destructive" : "text-[hsl(142,76%,46%)]"}`}>
        {isOpen ? "DOOR OPEN" : "DOOR CLOSED"}
      </p>
      <p className="text-xs text-muted-foreground">
        {isOpen ? "⚠️ Door is currently open" : "✓ All doors secured"}
      </p>
    </div>
  </div>
);

// ──────────── Seatbelt Indicator ────────────
const SeatbeltIndicator = ({ isWorn }: { isWorn: boolean }) => (
  <div className={`flex items-center gap-2 sm:gap-3 rounded-xl p-3 sm:p-4 transition-all duration-500 ${
    isWorn
      ? "bg-[hsl(142,76%,46%,0.1)] border border-[hsl(142,76%,46%,0.3)]"
      : "bg-destructive/15 border border-destructive shadow-[0_0_20px_hsl(0,85%,58%,0.15)]"
  }`}>
    <div className={`relative h-10 w-10 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center transition-all duration-500 ${
      isWorn ? "bg-[hsl(142,76%,46%,0.15)]" : "bg-destructive/20"
    }`}>
      <svg viewBox="0 0 24 24" className={`h-6 w-6 ${isWorn ? "text-[hsl(142,76%,46%)]" : "text-destructive animate-pulse"}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a4 4 0 0 1 0 8 4 4 0 0 1 0-8z" />
        <path d="M16 22H8l1-9h6l1 9z" />
        <path d="M7 12l5 4 5-4" />
      </svg>
      <span className={`absolute -top-1 -right-1 h-3 w-3 rounded-full ${
        isWorn ? "bg-[hsl(142,76%,46%)]" : "bg-destructive animate-ping"
      }`} />
      <span className={`absolute -top-1 -right-1 h-3 w-3 rounded-full ${
        isWorn ? "bg-[hsl(142,76%,46%)]" : "bg-destructive"
      }`} />
    </div>
    <div>
      <p className={`text-sm font-bold ${isWorn ? "text-[hsl(142,76%,46%)]" : "text-destructive"}`}>
        {isWorn ? "SEATBELT ON" : "SEATBELT OFF"}
      </p>
      <p className="text-xs text-muted-foreground">
        {isWorn ? "✓ Driver buckled in" : "⚠️ Seatbelt not detected"}
      </p>
    </div>
  </div>
);

// ──────────── Touch Indicator ────────────
const TouchIndicator = ({ touch1, touch2 }: { touch1: number; touch2: number }) => {
  const bothActive = touch1 === 1 && touch2 === 1;
  const oneActive = (touch1 === 1 || touch2 === 1) && !bothActive;
  const noneActive = touch1 === 0 && touch2 === 0;

  const getBgClass = () => {
    if (bothActive) return "bg-[hsl(142,76%,46%,0.1)] border border-[hsl(142,76%,46%,0.3)]";
    if (oneActive) return "bg-[hsl(45,100%,55%,0.1)] border border-[hsl(45,100%,55%,0.3)]";
    return "bg-muted/50 border border-border";
  };

  const getStatusColor = () => {
    if (bothActive) return "text-[hsl(142,76%,46%)]";
    if (oneActive) return "text-[hsl(45,100%,55%)]";
    return "text-muted-foreground";
  };

  return (
    <div className={`rounded-xl p-3 sm:p-4 transition-all duration-500 ${getBgClass()}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
          bothActive ? "bg-[hsl(142,76%,46%,0.2)]" : oneActive ? "bg-[hsl(45,100%,55%,0.2)]" : "bg-muted"
        }`}>
          <Hand className={`h-5 w-5 ${getStatusColor()}`} />
        </div>
        <div>
          <p className={`text-sm font-bold ${getStatusColor()}`}>
            {bothActive ? "STEERING ACTIVE" : oneActive ? "1 TOUCH ACTIVE" : "NO TOUCH"}
          </p>
          <p className="text-xs text-muted-foreground">
            {bothActive ? "✓ Both hands on steering" : oneActive ? "⚠️ Only one hand detected" : "⚠️ Hands off steering"}
          </p>
        </div>
      </div>
      {/* Visual touch pads */}
      <div className="flex justify-center gap-6">
        <div className="flex flex-col items-center gap-1.5">
          <div className={`h-10 w-16 rounded-lg border-2 transition-all duration-500 flex items-center justify-center ${
            touch1 === 1
              ? "border-[hsl(142,76%,46%)] bg-[hsl(142,76%,46%,0.15)] shadow-[0_0_12px_hsl(142,76%,46%,0.3)]"
              : "border-muted bg-muted/30"
          }`}>
            <span className={`text-xs font-bold ${touch1 === 1 ? "text-[hsl(142,76%,46%)]" : "text-muted-foreground"}`}>
              {touch1 === 1 ? "ON" : "OFF"}
            </span>
          </div>
          <span className="text-[10px] text-muted-foreground">Left</span>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <div className={`h-10 w-16 rounded-lg border-2 transition-all duration-500 flex items-center justify-center ${
            touch2 === 1
              ? "border-[hsl(142,76%,46%)] bg-[hsl(142,76%,46%,0.15)] shadow-[0_0_12px_hsl(142,76%,46%,0.3)]"
              : "border-muted bg-muted/30"
          }`}>
            <span className={`text-xs font-bold ${touch2 === 1 ? "text-[hsl(142,76%,46%)]" : "text-muted-foreground"}`}>
              {touch2 === 1 ? "ON" : "OFF"}
            </span>
          </div>
          <span className="text-[10px] text-muted-foreground">Right</span>
        </div>
      </div>
    </div>
  );
};

// ──────────── History Chart ────────────
const HistoryChart = ({ data, dataKey, color, label, unit }: {
  data: { time: string; value: number }[];
  dataKey: string;
  color: string;
  label: string;
  unit: string;
}) => (
  <Card className="bg-card border-border shadow-card">
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{label} (Last 4h)</CardTitle>
    </CardHeader>
    <CardContent>
      {data.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-8">No history data yet</p>
      ) : (
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 16%)" />
            <XAxis dataKey="time" tick={{ fontSize: 9, fill: "hsl(215, 15%, 55%)" }} />
            <YAxis tick={{ fontSize: 9, fill: "hsl(215, 15%, 55%)" }} width={35} />
            <Tooltip
              contentStyle={{ background: "hsl(220, 18%, 10%)", border: "1px solid hsl(220, 15%, 20%)", borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: "hsl(215, 15%, 55%)" }}
              formatter={(value: number) => [`${value} ${unit}`, label]}
            />
            <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </CardContent>
  </Card>
);

// ──────────── Dashboard ────────────
const Dashboard = () => {
  const navigate = useNavigate();
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [latestData, setLatestData] = useState<DeviceData | null>(null);
  const [historyData, setHistoryData] = useState<DeviceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [emergencyLoading, setEmergencyLoading] = useState(false);
  const [emergencyActive, setEmergencyActive] = useState(false);
  const [dashView, setDashView] = useState<"monitor" | "control">("monitor");

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) { navigate("/login"); return; }
      setUser(session.user);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) { navigate("/login"); return; }
      setUser(session.user);
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => { if (user) fetchDevices(); }, [user]);

  useEffect(() => {
    if (!selectedDevice) return;
    fetchLatestData();
    fetchHistory();
    const interval = setInterval(() => { fetchLatestData(); fetchHistory(); }, 5000);
    return () => clearInterval(interval);
  }, [selectedDevice]);

  useEffect(() => {
    if (!selectedDevice) return;
    const channel = supabase
      .channel("device-data-realtime")
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "device_data",
        filter: `device_id=eq.${selectedDevice}`,
      }, (payload) => setLatestData(payload.new as DeviceData))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedDevice]);

  const fetchDevices = async () => {
    const { data, error } = await supabase.from("devices").select("id, device_id, name");
    if (error) toast.error("Failed to load devices");
    else {
      setDevices(data || []);
      if (data && data.length > 0) setSelectedDevice(data[0].device_id);
    }
    setLoading(false);
  };

  const fetchLatestData = async () => {
    if (!selectedDevice) return;
    const { data, error } = await supabase
      .from("device_data").select("*")
      .eq("device_id", selectedDevice)
      .order("created_at", { ascending: false })
      .limit(1).maybeSingle();
    if (!error && data) setLatestData(data as unknown as DeviceData);
  };

  const fetchHistory = async () => {
    if (!selectedDevice) return;
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
    const { data } = await supabase
      .from("device_data").select("*")
      .eq("device_id", selectedDevice)
      .gte("created_at", fourHoursAgo)
      .order("created_at", { ascending: true })
      .limit(500);
    setHistoryData((data as unknown as DeviceData[]) || []);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const handleEmergency = async () => {
    if (!selectedDevice) return;
    setEmergencyLoading(true);
    try {
      const { error } = await supabase.from("device_commands").insert({
        device_id: selectedDevice,
        command: "emergency_hazard_unlock",
      });
      if (error) throw error;
      setEmergencyActive(true);
      toast.success("🚨 Emergency command sent! Hazard lights ON & doors unlocked.");
      setTimeout(() => setEmergencyActive(false), 5000);
    } catch (e: any) {
      toast.error("Failed to send emergency command: " + e.message);
    } finally {
      setEmergencyLoading(false);
    }
  };

  const isOnline = latestData ? (Date.now() - new Date(latestData.created_at).getTime()) < 30000 : false;
  const isAccident = latestData?.accident === 1;
  const isBpmAbnormal = latestData ? (latestData.bpm < 50 || latestData.bpm > 120) : false;
  const isSpo2Abnormal = latestData ? latestData.spo2 < 90 && latestData.spo2 > 0 : false;

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  };
  const sampleData = (key: keyof DeviceData) => {
    const step = Math.max(1, Math.floor(historyData.length / 80));
    return historyData.filter((_, i) => i % step === 0).map((d) => ({
      time: formatTime(d.created_at),
      value: Number(d[key]),
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Activity className="h-8 w-8 text-primary animate-pulse" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between px-3 sm:px-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <span className="text-sm sm:text-lg font-bold text-foreground">
              SAL <span className="text-muted-foreground font-normal text-xs sm:text-sm hidden sm:inline">Vehicle Monitor</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* View Toggle */}
            <div className="flex items-center bg-muted rounded-lg p-0.5">
              <button
                onClick={() => setDashView("monitor")}
                className={`flex items-center gap-1 px-2 py-1.5 rounded-md text-[10px] sm:text-xs font-medium transition-all ${
                  dashView === "monitor"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <BarChart3 className="h-3 w-3" />
                <span className="hidden sm:inline">Monitor</span>
              </button>
              <button
                onClick={() => setDashView("control")}
                className={`flex items-center gap-1 px-2 py-1.5 rounded-md text-[10px] sm:text-xs font-medium transition-all ${
                  dashView === "control"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Gamepad2 className="h-3 w-3" />
                <span className="hidden sm:inline">Control</span>
              </button>
            </div>
            {isOnline && (
              <span className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                <span className="h-1.5 w-1.5 rounded-full bg-[hsl(142,76%,46%)] animate-pulse" />
                Live
              </span>
            )}
            <Link to="/">
              <Button variant="ghost" size="sm" className="h-8 px-2 sm:px-3 text-xs sm:text-sm">
                <ArrowLeft className="mr-0.5 sm:mr-1 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Home</span>
              </Button>
            </Link>
            <Button variant="outline" size="sm" className="h-8 px-2 sm:px-3 text-xs sm:text-sm" onClick={handleLogout}>
              <LogOut className="mr-0.5 sm:mr-1 h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-3 sm:px-6 py-4 sm:py-6">
        {dashView === "control" ? (
          <VehicleControlPanel />
        ) : (
        <>
        {/* Accident Alert */}
        {isAccident && (
          <div className="mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3 rounded-xl border border-destructive bg-destructive/10 p-3 sm:p-4 animate-pulse">
            <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-destructive flex-shrink-0" />
            <span className="text-sm sm:text-lg font-bold text-destructive">
              🚨 Accident Detected – Emergency Alert Sent
            </span>
          </div>
        )}

        {/* Health Alerts */}
        {latestData && (isBpmAbnormal || isSpo2Abnormal) && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-[hsl(30,90%,50%)] bg-[hsl(30,90%,50%,0.1)] p-4">
            <Heart className="h-6 w-6 text-[hsl(30,90%,50%)] flex-shrink-0" />
            <span className="font-bold text-[hsl(30,90%,50%)]">
              ⚠️ Abnormal Health – {isBpmAbnormal ? "BPM" : ""}{isBpmAbnormal && isSpo2Abnormal ? " & " : ""}{isSpo2Abnormal ? "SPO2" : ""}
            </span>
          </div>
        )}

        {/* Device Selector */}
        {devices.length > 1 && (
          <div className="mb-6 flex gap-2 flex-wrap">
            {devices.map((d) => (
              <Button key={d.device_id} variant={selectedDevice === d.device_id ? "default" : "outline"} size="sm"
                onClick={() => setSelectedDevice(d.device_id)}>
                {d.name || d.device_id}
              </Button>
            ))}
          </div>
        )}

        {/* Emergency Button */}
        {selectedDevice && (
          <div className="mb-4 sm:mb-6">
            <button
              onClick={handleEmergency}
              disabled={emergencyLoading}
              className={`w-full rounded-xl p-4 sm:p-5 font-bold text-base sm:text-lg transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3 ${
                emergencyActive
                  ? "bg-destructive text-destructive-foreground shadow-[0_0_30px_hsl(0,85%,58%,0.5)] animate-pulse"
                  : "bg-destructive/90 hover:bg-destructive text-destructive-foreground shadow-[0_0_15px_hsl(0,85%,58%,0.3)] hover:shadow-[0_0_25px_hsl(0,85%,58%,0.5)] active:scale-[0.98]"
              }`}
            >
              <TriangleAlert className={`h-5 w-5 sm:h-6 sm:w-6 ${emergencyActive ? "animate-bounce" : ""}`} />
              {emergencyLoading ? "Sending..." : emergencyActive ? "🚨 EMERGENCY SENT!" : "🚨 EMERGENCY"}
            </button>
            <p className="text-[10px] sm:text-xs text-muted-foreground text-center mt-1.5">
              Activates hazard lights & unlocks doors remotely
            </p>
          </div>
        )}

        {devices.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <Radio className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No devices assigned to your account yet.</p>
            <p className="text-sm text-muted-foreground mt-2">Contact the admin to get a device assigned.</p>
          </div>
        ) : !latestData ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <Radio className="mx-auto h-12 w-12 text-muted-foreground mb-4 animate-pulse" />
            <p className="text-muted-foreground">Waiting for device data...</p>
          </div>
        ) : (
          <>
            {/* Row 1: Speed + Health + Fuel */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
              {/* Speed Gauge */}
              <Card className="bg-card border-border shadow-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" /> Speed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <SpeedGauge speed={Number(latestData.speed)} />
                </CardContent>
              </Card>

              {/* Health */}
              <Card className="bg-card border-border shadow-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Heart className="h-4 w-4 text-destructive" /> Driver Health
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className={`rounded-lg p-4 ${isSpo2Abnormal ? "bg-destructive/15 border border-destructive" : "bg-muted/50"}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Droplets className={`h-5 w-5 ${isSpo2Abnormal ? "text-destructive" : "text-primary"}`} />
                        <span className="text-sm text-muted-foreground">SpO2</span>
                      </div>
                      <div className="text-right">
                        <span className={`text-3xl font-bold ${isSpo2Abnormal ? "text-destructive" : "text-foreground"}`}>{latestData.spo2}</span>
                        <span className="text-muted-foreground text-sm ml-1">%</span>
                      </div>
                    </div>
                    <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${isSpo2Abnormal ? "bg-destructive" : "bg-primary"}`}
                        style={{ width: `${Math.min(latestData.spo2, 100)}%` }} />
                    </div>
                  </div>
                  <div className={`rounded-lg p-4 ${isBpmAbnormal ? "bg-destructive/15 border border-destructive" : "bg-muted/50"}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Heart className={`h-5 w-5 ${isBpmAbnormal ? "text-destructive animate-pulse" : "text-destructive"}`} />
                        <span className="text-sm text-muted-foreground">Heart Rate</span>
                      </div>
                      <div className="text-right">
                        <span className={`text-3xl font-bold ${isBpmAbnormal ? "text-destructive" : "text-foreground"}`}>{latestData.bpm}</span>
                        <span className="text-muted-foreground text-sm ml-1">BPM</span>
                      </div>
                    </div>
                    <p className={`text-xs mt-2 ${isBpmAbnormal ? "text-destructive" : "text-muted-foreground"}`}>
                      {isBpmAbnormal ? "⚠️ Abnormal range" : "Normal range: 50-120"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Fuel + Door + Touch */}
              <div className="space-y-3 sm:space-y-4">
                <Card className="bg-card border-border shadow-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Fuel className="h-4 w-4 text-primary" /> Fuel Level
                    </CardTitle>
                  </CardHeader>
                  <CardContent><FuelBar fuel={Number(latestData.fuel)} /></CardContent>
                </Card>

                <DoorIndicator isOpen={latestData.door_open === 1} />

                <SeatbeltIndicator isWorn={latestData.seatbelt === 1} />

                <TouchIndicator touch1={latestData.touch1} touch2={latestData.touch2} />
              </div>
            </div>

            {/* Row 2: Device Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
              <Card className="bg-card border-border shadow-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    {isOnline ? <Wifi className="h-4 w-4 text-[hsl(142,76%,46%)]" /> : <WifiOff className="h-4 w-4 text-destructive" />}
                    Device Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Device ID</span>
                    <span className="font-bold text-foreground">{selectedDevice}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <span className={`flex items-center gap-1.5 text-sm font-medium ${isOnline ? "text-[hsl(142,76%,46%)]" : "text-destructive"}`}>
                      <span className={`h-2 w-2 rounded-full ${isOnline ? "bg-[hsl(142,76%,46%)] animate-pulse" : "bg-destructive"}`} />
                      {isOnline ? "Online" : "Offline"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">GSM Signal</span>
                    <div className="flex items-center gap-1.5">
                      <div className="flex gap-0.5 items-end">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div key={i} className={`w-1.5 rounded-sm transition-all ${i <= latestData.gsm_signal ? "bg-primary" : "bg-muted"}`}
                            style={{ height: `${6 + i * 3}px` }} />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">{latestData.gsm_signal}/5</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Accident</span>
                    <span className={`text-sm font-bold ${isAccident ? "text-destructive" : "text-[hsl(142,76%,46%)]"}`}>
                      {isAccident ? "DETECTED" : "Safe"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Row 3: History Charts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
              <HistoryChart data={sampleData("speed")} dataKey="value" color="hsl(205, 100%, 55%)" label="Speed" unit="km/h" />
              <HistoryChart data={sampleData("bpm")} dataKey="value" color="hsl(0, 84%, 60%)" label="Heart Rate" unit="BPM" />
              <HistoryChart data={sampleData("spo2")} dataKey="value" color="hsl(152, 82%, 50%)" label="SpO2" unit="%" />
            </div>

            {/* Row 4: Map */}
            {latestData.latitude !== 0 && latestData.longitude !== 0 && (
              <Card className="bg-card border-border shadow-card mb-4 sm:mb-6">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" /> Live Vehicle Location
                    </CardTitle>
                    <span className="text-xs text-muted-foreground">
                      {Number(latestData.latitude).toFixed(4)}°, {Number(latestData.longitude).toFixed(4)}°
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px] sm:h-[400px] rounded-lg overflow-hidden border border-border">
                    <MapContainer
                      center={[Number(latestData.latitude), Number(latestData.longitude)]}
                      zoom={15} style={{ height: "100%", width: "100%" }}
                      key={`${latestData.latitude}-${latestData.longitude}`}>
                      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <Marker position={[Number(latestData.latitude), Number(latestData.longitude)]}>
                        <Popup>
                          <div className="text-sm">
                            <strong>{selectedDevice}</strong><br />
                            Speed: {latestData.speed} km/h<br />
                            SpO2: {latestData.spo2}% | BPM: {latestData.bpm}<br />
                            Fuel: {latestData.fuel}%
                            {isAccident && <><br /><span style={{ color: "red" }}>⚠️ Accident Detected</span></>}
                          </div>
                        </Popup>
                      </Marker>
                    </MapContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            <p className="text-xs text-muted-foreground text-center">
              Last updated: {new Date(latestData.created_at).toLocaleString()} · Auto-refreshes every 5s
            </p>
          </>
        )}
        </>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
