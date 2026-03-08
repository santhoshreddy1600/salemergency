import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, Users, Shield, ArrowLeft, Plus, Radio, Trash2, UserPlus } from "lucide-react";
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
  created_at: string;
}

interface Profile {
  user_id: string;
  email: string | null;
  full_name: string | null;
}

const Admin = () => {
  const navigate = useNavigate();
  const [members, setMembers] = useState<Member[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<"members" | "devices" | "owners">("devices");
  const [showCreateForm, setShowCreateForm] = useState(false);
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
      toast.error("Device ID and name are required");
      return;
    }
    setCreating(true);

    let ownerUserId: string | null = null;
    if (newDeviceOwnerEmail.trim()) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("email", newDeviceOwnerEmail.trim())
        .maybeSingle();
      if (profile) {
        ownerUserId = profile.user_id;
      } else {
        toast.error("No user found with that email");
        setCreating(false);
        return;
      }
    }

    const { error } = await supabase.from("devices").insert({
      device_id: newDeviceId.trim(),
      name: newDeviceName.trim(),
      owner_user_id: ownerUserId,
    });

    if (error) {
      toast.error(error.message.includes("duplicate") ? "Device ID already exists" : error.message);
    } else {
      toast.success("Device created!");
      setNewDeviceId("");
      setNewDeviceName("");
      setNewDeviceOwnerEmail("");
      fetchDevices();
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
                  <form onSubmit={handleCreateDevice} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="deviceId" className="text-muted-foreground">Device ID</Label>
                      <Input
                        id="deviceId"
                        placeholder="SAL001"
                        value={newDeviceId}
                        onChange={(e) => setNewDeviceId(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="deviceName" className="text-muted-foreground">Device Name</Label>
                      <Input
                        id="deviceName"
                        placeholder="My SAL Device"
                        value={newDeviceName}
                        onChange={(e) => setNewDeviceName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="ownerEmail" className="text-muted-foreground">Owner Email (optional)</Label>
                      <Input
                        id="ownerEmail"
                        type="email"
                        placeholder="user@example.com"
                        value={newDeviceOwnerEmail}
                        onChange={(e) => setNewDeviceOwnerEmail(e.target.value)}
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
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {devices.map((device, i) => (
                      <tr key={device.id} className="hover:bg-muted/30 transition-colors">
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
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteDevice(device.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
