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

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const url = new URL(req.url);
    const apiKey = url.searchParams.get("api_key");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();

    let deviceId: string;

    if (apiKey) {
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
      deviceId = device.device_id;
    } else if (body.device_id) {
      // Fallback: use device_id from body (legacy support)
      deviceId = body.device_id;
    } else {
      return new Response(JSON.stringify({ error: "api_key parameter or device_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error } = await supabase.from("device_data").insert({
      device_id: deviceId,
      speed: body.speed ?? 0,
      accident: body.accident ?? 0,
      latitude: body.latitude ?? 0,
      longitude: body.longitude ?? 0,
      gsm_signal: body.gsm_signal ?? 0,
      spo2: body.spo2 ?? 0,
      bpm: body.bpm ?? 0,
      fuel: body.fuel ?? 0,
      door_open: body.door_open ?? 0,
      touch1: body.touch1 ?? 0,
      touch2: body.touch2 ?? 0,
      seatbelt: body.seatbelt ?? 0,
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, device_id: deviceId }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});