import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const url = new URL(req.url);
  const apiKey = url.searchParams.get("api_key");

  if (!apiKey) {
    return new Response(JSON.stringify({ error: "api_key is required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Look up device by api_key
  const { data: device, error: deviceError } = await supabase
    .from("devices")
    .select("device_id")
    .eq("api_key", apiKey)
    .maybeSingle();

  if (deviceError || !device) {
    return new Response(JSON.stringify({ error: "Invalid API key" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (req.method === "GET") {
    // ESP32 polls for pending commands
    const { data: commands, error } = await supabase
      .from("device_commands")
      .select("id, command, created_at")
      .eq("device_id", device.device_id)
      .eq("status", "pending")
      .order("created_at", { ascending: true });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark fetched commands as "sent"
    if (commands && commands.length > 0) {
      const ids = commands.map((c: any) => c.id);
      await supabase
        .from("device_commands")
        .update({ status: "sent" })
        .in("id", ids);
    }

    return new Response(JSON.stringify({ commands: commands || [] }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
