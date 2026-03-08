import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LogOut, ArrowLeft, Wifi, WifiOff, AlertTriangle,
  MapPin, Radio, Activity, Shield, Heart, Droplets, Fuel
} from "lucide-react";
import { toast } from "sonner";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
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
  created_at: string;
}

interface Device {
  id: string;
  device_id: string;
  name: string;
}

// Speed Gauge SVG Component
const SpeedGauge = ({ speed }: { speed: number }) => {
  const maxSpeed = 160;
  const clampedSpeed = Math.min(speed, maxSpeed);
  const startAngle = -225;
  const endAngle = 45;
  const totalAngle = endAngle - startAngle;
  const needleAngle = startAngle + (clampedSpeed / maxSpeed) * totalAngle;

  const getColor = () => {
    if (speed <= 60) return "hsl(142, 76%, 46%)";
    if (speed <= 100) return "hsl(45, 93%, 47%)";
    return "hsl(0, 84%, 60%)";
  };

  const ticks = [0, 20, 40, 60, 80, 100, 120, 140, 160];

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 140" className="w-full max-w-[280px]">
        {/* Background arc */}
        <path
          d="M 20 130 A 80 80 0 1 1 180 130"
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth="12"
          strokeLinecap="round"
        />
        {/* Green zone 0-60 */}
        <path
          d="M 20 130 A 80 80 0 0 1 33.4 55.7"
          fill="none"
          stroke="hsl(142, 76%, 36%)"
          strokeWidth="12"
          strokeLinecap="round"
          opacity="0.5"
        />
        {/* Yellow zone 60-100 */}
        <path
          d="M 33.4 55.7 A 80 80 0 0 1 100 50"
          fill="none"
          stroke="hsl(45, 93%, 47%)"
          strokeWidth="12"
          opacity="0.5"
        />
        {/* Red zone 100+ */}
        <path
          d="M 100 50 A 80 80 0 0 1 180 130"
          fill="none"
          stroke="hsl(0, 84%, 50%)"
          strokeWidth="12"
          strokeLinecap="round"
          opacity="0.5"
        />
        {/* Tick marks and labels */}
        {ticks.map((tick) => {
          const angle = (startAngle + (tick / maxSpeed) * totalAngle) * (Math.PI / 180);
          const innerR = 65;
          const outerR = 75;
          const labelR = 55;
          const cx = 100 + outerR * Math.cos(angle);
          const cy = 130 + outerR * Math.sin(angle);
          const ix = 100 + innerR * Math.cos(angle);
          const iy = 130 + innerR * Math.sin(angle);
          const lx = 100 + labelR * Math.cos(angle);
          const ly = 130 + labelR * Math.sin(angle);
          return (
            <g key={tick}>
              <line x1={ix} y1={iy} x2={cx} y2={cy} stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" />
              <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fill="hsl(var(--muted-foreground))" fontSize="8" fontFamily="var(--font-display)">
                {tick}
              </text>
            </g>
          );
        })}
        {/* Needle */}
        <line
          x1="100"
          y1="130"
          x2={100 + 60 * Math.cos(needleAngle * (Math.PI / 180))}
          y2={130 + 60 * Math.sin(needleAngle * (Math.PI / 180))}
          stroke={getColor()}
          strokeWidth="3"
          strokeLinecap="round"
          style={{ transition: "all 0.8s ease-out" }}
        />
        {/* Center dot */}
        <circle cx="100" cy="130" r="6" fill={getColor()} />
        <circle cx="100" cy="130" r="3" fill="hsl(var(--background))" />
        {/* Speed text */}
        <text x="100" y="118" textAnchor="middle" fill="hsl(var(--foreground))" fontSize="22" fontWeight="bold" fontFamily="var(--font-display)">
          {speed}
        </text>
        <text x="100" y="108" textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="7">
          km/h
        </text>
      </svg>
    </div>
  );
};

// Fuel Bar Component
const FuelBar = ({ fuel }: { fuel: number }) => {
  const getColor = () => {
    if (fuel <= 20) return "bg-[hsl(0,84%,60%)]";
    if (fuel <= 50) return "bg-[hsl(30,90%,50%)]";
    return "bg-[hsl(142,76%,46%)]";
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Empty</span>
        <span className="font-display font-bold text-foreground text-lg">{fuel}%</span>
        <span className="text-muted-foreground">Full</span>
      </div>
      <div className="h-5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${getColor()}`}
          style={{ width: `${Math.min(fuel, 100)}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>0</span>
        <span>20</span>
        <span>50</span>
        <span>100</span>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [latestData, setLatestData] = useState<DeviceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

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
    const interval = setInterval(fetchLatestData, 5000);
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
    if (error) { toast.error("Failed to load devices"); }
    else {
      setDevices(data || []);
      if (data && data.length > 0) setSelectedDevice(data[0].device_id);
    }
    setLoading(false);
  };

  const fetchLatestData = async () => {
    if (!selectedDevice) return;
    const { data, error } = await supabase
      .from("device_data")
      .select("*")
      .eq("device_id", selectedDevice)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!error && data) setLatestData(data as DeviceData);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const isOnline = latestData ? (Date.now() - new Date(latestData.created_at).getTime()) < 30000 : false;
  const isAccident = latestData?.accident === 1;
  const isBpmAbnormal = latestData ? (latestData.bpm < 50 || latestData.bpm > 120) : false;
  const isSpo2Abnormal = latestData ? latestData.spo2 < 90 && latestData.spo2 > 0 : false;

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
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <span className="font-display text-lg font-bold text-foreground">
              SAL <span className="text-muted-foreground font-normal text-sm">Vehicle Monitor</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            {isOnline && (
              <span className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
                <span className="h-1.5 w-1.5 rounded-full bg-[hsl(142,76%,46%)] animate-pulse" />
                Live
              </span>
            )}
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-1 h-4 w-4" /> Home
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="mr-1 h-4 w-4" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
        {/* Accident Alert Banner */}
        {isAccident && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-destructive bg-destructive/10 p-4 animate-pulse">
            <AlertTriangle className="h-6 w-6 text-destructive flex-shrink-0" />
            <span className="font-display text-lg font-bold text-destructive">
              🚨 Accident Detected – Emergency Alert Sent
            </span>
          </div>
        )}

        {/* Health Alerts */}
        {latestData && (isBpmAbnormal || isSpo2Abnormal) && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-[hsl(30,90%,50%)] bg-[hsl(30,90%,50%,0.1)] p-4">
            <Heart className="h-6 w-6 text-[hsl(30,90%,50%)] flex-shrink-0" />
            <span className="font-display font-bold text-[hsl(30,90%,50%)]">
              ⚠️ Abnormal Health Reading Detected – {isBpmAbnormal ? "BPM" : ""}{isBpmAbnormal && isSpo2Abnormal ? " & " : ""}{isSpo2Abnormal ? "SPO2" : ""} out of range
            </span>
          </div>
        )}

        {/* Device Selector */}
        {devices.length > 1 && (
          <div className="mb-6 flex gap-2 flex-wrap">
            {devices.map((d) => (
              <Button
                key={d.device_id}
                variant={selectedDevice === d.device_id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedDevice(d.device_id)}
              >
                {d.name || d.device_id}
              </Button>
            ))}
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
            <p className="text-sm text-muted-foreground mt-2">ESP32 will send data to the backend function.</p>
          </div>
        ) : (
          <>
            {/* Row 1: Speed Gauge + Health + Fuel */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
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

              {/* Health Monitoring */}
              <Card className="bg-card border-border shadow-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Heart className="h-4 w-4 text-destructive" /> Driver Health
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* SPO2 */}
                  <div className={`rounded-lg p-4 ${isSpo2Abnormal ? "bg-destructive/15 border border-destructive" : "bg-muted/50"}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Droplets className={`h-5 w-5 ${isSpo2Abnormal ? "text-destructive" : "text-primary"}`} />
                        <span className="text-sm text-muted-foreground">SpO2</span>
                      </div>
                      <div className="text-right">
                        <span className={`font-display text-3xl font-bold ${isSpo2Abnormal ? "text-destructive" : "text-foreground"}`}>
                          {latestData.spo2}
                        </span>
                        <span className="text-muted-foreground text-sm ml-1">%</span>
                      </div>
                    </div>
                    <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${isSpo2Abnormal ? "bg-destructive" : "bg-primary"}`}
                        style={{ width: `${Math.min(latestData.spo2, 100)}%` }}
                      />
                    </div>
                  </div>
                  {/* BPM */}
                  <div className={`rounded-lg p-4 ${isBpmAbnormal ? "bg-destructive/15 border border-destructive" : "bg-muted/50"}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Heart className={`h-5 w-5 ${isBpmAbnormal ? "text-destructive animate-pulse" : "text-destructive"}`} />
                        <span className="text-sm text-muted-foreground">Heart Rate</span>
                      </div>
                      <div className="text-right">
                        <span className={`font-display text-3xl font-bold ${isBpmAbnormal ? "text-destructive" : "text-foreground"}`}>
                          {latestData.bpm}
                        </span>
                        <span className="text-muted-foreground text-sm ml-1">BPM</span>
                      </div>
                    </div>
                    <p className={`text-xs mt-2 ${isBpmAbnormal ? "text-destructive" : "text-muted-foreground"}`}>
                      {isBpmAbnormal ? "⚠️ Abnormal range" : "Normal range: 50-120"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Fuel + Device Status */}
              <div className="space-y-6">
                <Card className="bg-card border-border shadow-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Fuel className="h-4 w-4 text-primary" /> Fuel Level
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FuelBar fuel={Number(latestData.fuel)} />
                  </CardContent>
                </Card>

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
                      <span className="font-display font-bold text-foreground">{selectedDevice}</span>
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
                            <div
                              key={i}
                              className={`w-1.5 rounded-sm transition-all ${i <= latestData.gsm_signal ? "bg-primary" : "bg-muted"}`}
                              style={{ height: `${6 + i * 3}px` }}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">{latestData.gsm_signal}/5</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">GPS</span>
                      <span className={`text-sm font-medium ${latestData.latitude !== 0 ? "text-[hsl(142,76%,46%)]" : "text-destructive"}`}>
                        {latestData.latitude !== 0 ? "Connected" : "No Fix"}
                      </span>
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
            </div>

            {/* Row 2: Map */}
            {latestData.latitude !== 0 && latestData.longitude !== 0 && (
              <Card className="bg-card border-border shadow-card mb-6">
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
                  <div className="h-[400px] rounded-lg overflow-hidden border border-border">
                    <MapContainer
                      center={[Number(latestData.latitude), Number(latestData.longitude)]}
                      zoom={15}
                      style={{ height: "100%", width: "100%" }}
                      key={`${latestData.latitude}-${latestData.longitude}`}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <Marker position={[Number(latestData.latitude), Number(latestData.longitude)]}>
                        <Popup>
                          <div className="text-sm">
                            <strong>{selectedDevice}</strong><br />
                            Speed: {latestData.speed} km/h<br />
                            SpO2: {latestData.spo2}% | BPM: {latestData.bpm}<br />
                            Fuel: {latestData.fuel}%<br />
                            {isAccident && <span style={{ color: "red" }}>⚠️ Accident Detected</span>}
                          </div>
                        </Popup>
                      </Marker>
                    </MapContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Last Updated */}
            <p className="text-xs text-muted-foreground text-center">
              Last updated: {new Date(latestData.created_at).toLocaleString()} · Auto-refreshes every 5s
            </p>
          </>
        )}
      </main>
    </div>
  );
};

export default Dashboard;