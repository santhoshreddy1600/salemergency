
-- Devices table for admin to register devices
CREATE TABLE public.devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text UNIQUE NOT NULL,
  name text NOT NULL DEFAULT '',
  owner_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;

-- Admins can manage devices
CREATE POLICY "Admins can manage devices" ON public.devices
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Authenticated users can view devices assigned to them
CREATE POLICY "Users can view own devices" ON public.devices
  FOR SELECT TO authenticated
  USING (owner_user_id = auth.uid());

-- Device data table
CREATE TABLE public.device_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL,
  speed numeric NOT NULL DEFAULT 0,
  accident smallint NOT NULL DEFAULT 0,
  latitude numeric NOT NULL DEFAULT 0,
  longitude numeric NOT NULL DEFAULT 0,
  gsm_signal smallint NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.device_data ENABLE ROW LEVEL SECURITY;

-- Admins can view all device data
CREATE POLICY "Admins can view all device data" ON public.device_data
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Users can view data for their devices
CREATE POLICY "Users can view own device data" ON public.device_data
  FOR SELECT TO authenticated
  USING (device_id IN (SELECT d.device_id FROM public.devices d WHERE d.owner_user_id = auth.uid()));

-- Allow anon inserts for ESP32 (with service role in edge function)
CREATE POLICY "Service can insert device data" ON public.device_data
  FOR INSERT TO anon
  WITH CHECK (true);

-- Enable realtime for device_data
ALTER PUBLICATION supabase_realtime ADD TABLE public.device_data;
