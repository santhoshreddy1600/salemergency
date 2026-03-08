import { useEffect, useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LogOut, ArrowLeft, Wifi, WifiOff, Gauge, AlertTriangle,
  MapPin, Radio, Activity, Shield
} from "lucide-react";
import { toast } from "sonner";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix leaflet default marker icons
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
  created_at: string;
}

interface Device {
  id: string;
  device_id: string;
  name: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [latestData, setLatestData] = useState<DeviceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        navigate("/login");
        return;
      }
      setUser(session.user);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        navigate("/login");
        return;
      }
      setUser(session.user);
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) fetchDevices();
  }, [user]);

  useEffect(() => {
    if (!selectedDevice) return;
    fetchLatestData();
    const interval = setInterval(fetchLatestData, 5000);
    return () => clearInterval(interval);
  }, [selectedDevice]);

  // Realtime subscription
  useEffect(() => {
    if (!selectedDevice) return;
    const channel = supabase
      .channel("device-data-realtime")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "device_data",
        filter: `device_id=eq.${selectedDevice}`,
      }, (payload) => {
        setLatestData(payload.new as DeviceData);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedDevice]);

  const fetchDevices = async () => {
    const { data, error } = await supabase.from("devices").select("id, device_id, name");
    if (error) {
      toast.error("Failed to load devices");
    } else {
      setDevices(data || []);
      if (data && data.length > 0) {
        setSelectedDevice(data[0].device_id);
      }
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
    if (!error && data) {
      setLatestData(data);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const isOnline = latestData
    ? (Date.now() - new Date(latestData.created_at).getTime()) < 30000
    : false;

  const isAccident = latestData?.accident === 1;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Activity className="h-5 w-5 text-primary" />
            <span className="font-display text-lg font-bold text-foreground">SAL Dashboard</span>
          </div>
          <div className="flex items-center gap-4">
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

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Accident Alert Banner */}
        {isAccident && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-destructive bg-destructive/10 p-4">
            <AlertTriangle className="h-6 w-6 text-destructive animate-pulse" />
            <span className="font-display text-lg font-bold text-destructive">
              🚨 Accident Detected – Emergency Alert Sent
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
            <Radio className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No data received from device yet.</p>
            <p className="text-sm text-muted-foreground mt-2">Waiting for ESP32 to send data...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Device Status Card */}
            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Device Status</CardTitle>
                {isOnline ? (
                  <Wifi className="h-5 w-5 text-emerald-500" />
                ) : (
                  <WifiOff className="h-5 w-5 text-destructive" />
                )}
              </CardHeader>
              <CardContent>
                <p className="font-display text-2xl font-bold text-foreground">{selectedDevice}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${isOnline ? "bg-emerald-500 animate-pulse" : "bg-destructive"}`} />
                  <span className={`text-sm font-medium ${isOnline ? "text-emerald-500" : "text-destructive"}`}>
                    {isOnline ? "Online" : "Offline"}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Speed Card */}
            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Current Speed</CardTitle>
                <Gauge className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <p className="font-display text-3xl font-bold text-foreground">
                  {latestData.speed} <span className="text-lg text-muted-foreground">km/h</span>
                </p>
              </CardContent>
            </Card>

            {/* Accident Status Card */}
            <Card className={`border-border ${isAccident ? "bg-destructive/10 border-destructive" : "bg-card"}`}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Accident Status</CardTitle>
                <Shield className={`h-5 w-5 ${isAccident ? "text-destructive" : "text-emerald-500"}`} />
              </CardHeader>
              <CardContent>
                <p className={`font-display text-2xl font-bold ${isAccident ? "text-destructive" : "text-emerald-500"}`}>
                  {isAccident ? "DETECTED" : "Safe"}
                </p>
              </CardContent>
            </Card>

            {/* GSM Signal Card */}
            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">GSM Signal</CardTitle>
                <Radio className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <p className="font-display text-3xl font-bold text-foreground">
                  {latestData.gsm_signal} <span className="text-lg text-muted-foreground">/ 5</span>
                </p>
                <div className="flex gap-1 mt-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className={`h-3 w-4 rounded-sm ${i <= latestData.gsm_signal ? "bg-primary" : "bg-muted"}`}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Map Section */}
        {latestData && latestData.latitude !== 0 && latestData.longitude !== 0 && (
          <Card className="bg-card border-border mb-8">
            <CardHeader>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <CardTitle className="text-foreground">Vehicle Location</CardTitle>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Lat: {latestData.latitude}, Lng: {latestData.longitude}
              </p>
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
                      <strong>{selectedDevice}</strong><br />
                      Speed: {latestData.speed} km/h<br />
                      {isAccident && <span style={{ color: "red" }}>⚠️ Accident Detected</span>}
                    </Popup>
                  </Marker>
                </MapContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Last Updated */}
        {latestData && (
          <p className="text-xs text-muted-foreground text-center">
            Last updated: {new Date(latestData.created_at).toLocaleString()} · Auto-refreshes every 5 seconds
          </p>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
