import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, Users, Shield, ArrowLeft, Plus, Radio, Trash2, UserPlus, Copy } from "lucide-react";
import { toast } from "sonner";

interface Member {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  interest: string;
  message: string | null;
  created_at: string;
}

interface Device {
  id: string;
  device_id: string;
  name: string;
  owner_user_id: string | null;
  api_key: string | null;
  created_at: string;
}

interface Profile {
  user_id: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
}

// A device is "online" if it sent data within the last 2 minutes
const ONLINE_THRESHOLD_MS = 2 * 60 * 1000;

const Admin = () => {
  const navigate = useNavigate();
  const [members, setMembers] = useState<Member[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<"members" | "devices" | "owners">("devices");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [expandedApiDevice, setExpandedApiDevice] = useState<string | null>(null);
  const [showOwnerForm, setShowOwnerForm] = useState(false);

  // Device creation form
  const [newDeviceId, setNewDeviceId] = useState("");
  const [newDeviceName, setNewDeviceName] = useState("");
  const [newDeviceOwnerEmail, setNewDeviceOwnerEmail] = useState("");
  const [creating, setCreating] = useState(false);

  // Product Owner creation form
  const [ownerUsername, setOwnerUsername] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");
  const [ownerFullName, setOwnerFullName] = useState("");
  const [creatingOwner, setCreatingOwner] = useState(false);

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/login");
      return;
    }
    const { data } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!data) {
      toast.error("Access denied. Admin only.");
      navigate("/");
      return;
    }
    setIsAdmin(true);
    fetchMembers();
    fetchDevices();
    fetchProfiles();
  };

  const fetchMembers = async () => {
    const { data, error } = await supabase.from("members").select("*").order("created_at", { ascending: false });
    if (error) toast.error("Failed to load members");
    else setMembers(data || []);
    setLoading(false);
  };

  const fetchDevices = async () => {
    const { data, error } = await supabase.from("devices").select("*").order("created_at", { ascending: false });
    if (error) toast.error("Failed to load devices");
    else setDevices(data || []);
  };

  const fetchProfiles = async () => {
    const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (!error) setProfiles(data || []);
  };

  const handleCreateOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerUsername.trim() || !ownerPassword.trim()) {
      toast.error("Username and password are required");
      return;
    }
    if (ownerPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setCreatingOwner(true);

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-product-owner`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          username: ownerUsername.trim(),
          password: ownerPassword,
          full_name: ownerFullName.trim() || ownerUsername.trim(),
        }),
      }
    );

    const result = await response.json();
    if (!response.ok) {
      toast.error(result.error || "Failed to create product owner");
    } else {
      toast.success(`Product owner "${ownerUsername}" created successfully!`);
      setOwnerUsername("");
      setOwnerPassword("");
      setOwnerFullName("");
      setShowOwnerForm(false);
      fetchProfiles();
    }
    setCreatingOwner(false);
  };

  const handleCreateDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeviceId.trim() || !newDeviceName.trim()) {
      toast.error("Device ID and password are required");
      return;
    }
    if (newDeviceName.trim().length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setCreating(true);

    // Step 1: Create a product owner account with Device ID as username
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-product-owner`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          username: newDeviceId.trim(),
          password: newDeviceName.trim(),
          full_name: newDeviceId.trim(),
        }),
      }
    );

    const result = await response.json();
    if (!response.ok) {
      toast.error(result.error || "Failed to create owner account");
      setCreating(false);
      return;
    }

    const ownerUserId = result.user_id;

    // Step 2: Create the device and assign to the new owner
    const { error } = await supabase.from("devices").insert({
      device_id: newDeviceId.trim(),
      name: newDeviceId.trim(),
      owner_user_id: ownerUserId,
    });

    if (error) {
      toast.error(error.message.includes("duplicate") ? "Device ID already exists" : error.message);
    } else {
      toast.success(`Device "${newDeviceId}" created with login credentials!`);
      setNewDeviceId("");
      setNewDeviceName("");
      setNewDeviceOwnerEmail("");
      fetchDevices();
      fetchProfiles();
    }
    setCreating(false);
  };

  const handleDeleteDevice = async (id: string) => {
    const { error } = await supabase.from("devices").delete().eq("id", id);
    if (error) toast.error("Failed to delete device");
    else {
      toast.success("Device deleted");
      fetchDevices();
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Checking access...</p>
      </div>
    );
  }

  const interestLabels: Record<string, string> = {
    beta_tester: "Beta Tester",
    partner: "Partner",
    investor: "Investor",
    developer: "Developer",
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-display text-lg font-bold text-foreground">SAL Admin</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-1 h-4 w-4" /> Home
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">Dashboard</Button>
            </Link>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="mr-1 h-4 w-4" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          <Button
            variant={activeTab === "devices" ? "default" : "outline"}
            onClick={() => setActiveTab("devices")}
          >
            <Radio className="mr-2 h-4 w-4" /> Devices
          </Button>
          <Button
            variant={activeTab === "owners" ? "default" : "outline"}
            onClick={() => setActiveTab("owners")}
          >
            <UserPlus className="mr-2 h-4 w-4" /> Product Owners
          </Button>
          <Button
            variant={activeTab === "members" ? "default" : "outline"}
            onClick={() => setActiveTab("members")}
          >
            <Users className="mr-2 h-4 w-4" /> Members
          </Button>
        </div>

        {/* Devices Tab */}
        {activeTab === "devices" && (
          <>
            {/* Header with Create Button */}
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20">
                  <Radio className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="font-display text-2xl font-bold text-foreground">Devices</h2>
                  <p className="text-muted-foreground">{devices.length} registered devices</p>
                </div>
              </div>
              <Button onClick={() => setShowCreateForm(!showCreateForm)}>
                <Plus className="mr-2 h-4 w-4" /> {showCreateForm ? "Cancel" : "Create Device"}
              </Button>
            </div>

            {/* Create Device Form (toggled) */}
            {showCreateForm && (
              <Card className="bg-card border-border mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Plus className="h-5 w-5 text-primary" /> New Device
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    This will create a device and a login account. The owner can sign in with the Device ID as username.
                  </p>
                  <form onSubmit={handleCreateDevice} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="deviceId" className="text-muted-foreground">Device ID (Username)</Label>
                      <Input
                        id="deviceId"
                        placeholder="SAL001"
                        value={newDeviceId}
                        onChange={(e) => setNewDeviceId(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="devicePassword" className="text-muted-foreground">Password</Label>
                      <Input
                        id="devicePassword"
                        type="password"
                        placeholder="Min 6 characters"
                        value={newDeviceName}
                        onChange={(e) => setNewDeviceName(e.target.value)}
                        required
                        minLength={6}
                      />
                    </div>
                    <div className="flex items-end">
                      <Button type="submit" className="w-full" disabled={creating}>
                        {creating ? "Creating..." : "Create Device"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {devices.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-12 text-center">
                <Radio className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No devices created yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">#</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Device ID</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Name</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Owner</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Created</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">API</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {devices.map((device, i) => {
                      const uniqueApiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/device-data?api_key=${device.api_key || ""}`;
                      const payload = JSON.stringify({
                        speed: 0, accident: 0, latitude: 0, longitude: 0,
                        gsm_signal: 0, spo2: 0, bpm: 0, fuel: 0,
                      }, null, 2);
                      const isExpanded = expandedApiDevice === device.device_id;
                      return (
                        <React.Fragment key={device.id}>
                          <tr className="hover:bg-muted/30 transition-colors align-top">
                            <td className="px-4 py-3 text-sm text-foreground">{i + 1}</td>
                            <td className="px-4 py-3 text-sm font-medium text-primary">{device.device_id}</td>
                            <td className="px-4 py-3 text-sm text-foreground">{device.name}</td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">
                              {device.owner_user_id ? device.owner_user_id.slice(0, 8) + "..." : "Unassigned"}
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">
                              {new Date(device.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3">
                              <Button
                                variant={isExpanded ? "default" : "outline"}
                                size="sm"
                                onClick={() => setExpandedApiDevice(isExpanded ? null : device.device_id)}
                              >
                                <Radio className="mr-1 h-3 w-3" /> API
                              </Button>
                            </td>
                            <td className="px-4 py-3">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteDevice(device.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr>
                              <td colSpan={7} className="px-4 py-4 bg-muted/20">
                                <div className="space-y-3">
                                  <div className="space-y-1">
                                    <Label className="text-muted-foreground text-xs font-bold">Unique API for {device.device_id}</Label>
                                    <div className="flex items-center gap-2">
                                      <Input readOnly value={uniqueApiUrl} className="font-mono text-xs bg-muted/50" />
                                      <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(uniqueApiUrl); toast.success("API URL copied!"); }}>
                                        <Copy className="h-4 w-4" />
                                      </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground">This URL is unique to this device. No need to send <code className="text-primary">device_id</code> in the payload.</p>
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-muted-foreground text-xs">JSON Payload (send via POST)</Label>
                                    <div className="relative">
                                      <pre className="rounded-lg bg-muted/50 border border-border p-3 text-xs text-foreground font-mono overflow-x-auto whitespace-pre-wrap">{payload}</pre>
                                      <Button
                                        variant="outline" size="sm" className="absolute top-2 right-2"
                                        onClick={() => { navigator.clipboard.writeText(payload); toast.success("Payload copied!"); }}
                                      >
                                        <Copy className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Device API Bar */}
            {devices.length > 0 && (
              <Card className="bg-card border-border mt-8">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-foreground text-sm">
                    <Radio className="h-4 w-4 text-primary" /> Device API Endpoint
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground text-xs">API URL (POST)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        readOnly
                        value={`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/device-data`}
                        className="font-mono text-xs bg-muted/50"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/device-data`);
                          toast.success("API URL copied!");
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground text-xs">Sample JSON Payload</Label>
                    <div className="relative">
                      <pre className="rounded-lg bg-muted/50 border border-border p-4 text-xs text-foreground font-mono overflow-x-auto whitespace-pre-wrap">
{`{
  "device_id": "${devices[0]?.device_id || "SAL001"}",
  "speed": 62,
  "accident": 0,
  "latitude": 17.3850,
  "longitude": 78.4867,
  "gsm_signal": 4,
  "spo2": 98,
  "bpm": 76,
  "fuel": 65
}`}
                      </pre>
                      <Button
                        variant="outline"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          const payload = JSON.stringify({
                            device_id: devices[0]?.device_id || "SAL001",
                            speed: 62, accident: 0, latitude: 17.385, longitude: 78.4867,
                            gsm_signal: 4, spo2: 98, bpm: 76, fuel: 65,
                          }, null, 2);
                          navigator.clipboard.writeText(payload);
                          toast.success("Payload copied!");
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Send a <strong>POST</strong> request with the JSON payload. Replace <code className="text-primary">device_id</code> with the actual device ID from the table above.
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Product Owners Tab */}
        {activeTab === "owners" && (
          <>
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20">
                  <UserPlus className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="font-display text-2xl font-bold text-foreground">Product Owners</h2>
                  <p className="text-muted-foreground">Manage device owner accounts</p>
                </div>
              </div>
              <Button onClick={() => setShowOwnerForm(!showOwnerForm)}>
                <Plus className="mr-2 h-4 w-4" /> {showOwnerForm ? "Cancel" : "Create Product Owner"}
              </Button>
            </div>

            {showOwnerForm && (
              <Card className="bg-card border-border mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <UserPlus className="h-5 w-5 text-primary" /> New Product Owner
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateOwner} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <Label className="text-muted-foreground">Username</Label>
                      <Input
                        placeholder="owner1"
                        value={ownerUsername}
                        onChange={(e) => setOwnerUsername(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-muted-foreground">Password</Label>
                      <Input
                        type="password"
                        placeholder="Min 6 characters"
                        value={ownerPassword}
                        onChange={(e) => setOwnerPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-muted-foreground">Full Name (optional)</Label>
                      <Input
                        placeholder="John Doe"
                        value={ownerFullName}
                        onChange={(e) => setOwnerFullName(e.target.value)}
                      />
                    </div>
                    <div className="flex items-end">
                      <Button type="submit" className="w-full" disabled={creatingOwner}>
                        {creatingOwner ? "Creating..." : "Create Owner"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {profiles.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-12 text-center">
                <UserPlus className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No product owners created yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">#</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Username</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Full Name</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {profiles.map((profile, i) => (
                      <tr key={profile.user_id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 text-sm text-foreground">{i + 1}</td>
                        <td className="px-4 py-3 text-sm font-medium text-primary">
                          {profile.email?.replace("@sal.local", "") || "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground">{profile.full_name || "—"}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {new Date(profile.created_at || "").toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {activeTab === "members" && (
          <>
            <div className="mb-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground">Members</h2>
                <p className="text-muted-foreground">{members.length} total members joined</p>
              </div>
            </div>

            {loading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : members.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-12 text-center">
                <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No members have joined yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">#</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Name</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Email</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Phone</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Interest</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Message</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {members.map((member, i) => (
                      <tr key={member.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 text-sm text-foreground">{i + 1}</td>
                        <td className="px-4 py-3 text-sm font-medium text-foreground">{member.full_name}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{member.email}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{member.phone || "—"}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex rounded-full bg-primary/20 px-2.5 py-0.5 text-xs font-medium text-primary">
                            {interestLabels[member.interest] || member.interest}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground max-w-[200px] truncate">{member.message || "—"}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {new Date(member.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Admin;
