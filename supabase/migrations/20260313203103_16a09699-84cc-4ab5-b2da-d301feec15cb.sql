
CREATE TABLE public.device_commands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL,
  command text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.device_commands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert commands for own devices"
ON public.device_commands FOR INSERT TO authenticated
WITH CHECK (device_id IN (SELECT d.device_id FROM devices d WHERE d.owner_user_id = auth.uid()));

CREATE POLICY "Admins can manage commands"
ON public.device_commands FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Devices can read pending commands"
ON public.device_commands FOR SELECT TO anon
USING (true);

CREATE POLICY "Devices can update command status"
ON public.device_commands FOR UPDATE TO anon
USING (true);

CREATE POLICY "Users can view own device commands"
ON public.device_commands FOR SELECT TO authenticated
USING (device_id IN (SELECT d.device_id FROM devices d WHERE d.owner_user_id = auth.uid()));
