-- Fix devices policies: change from restrictive to permissive
DROP POLICY IF EXISTS "Admins can manage devices" ON public.devices;
DROP POLICY IF EXISTS "Users can view own devices" ON public.devices;

CREATE POLICY "Admins can manage devices"
ON public.devices FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own devices"
ON public.devices FOR SELECT TO authenticated
USING (owner_user_id = auth.uid());

-- Fix device_data policies: change from restrictive to permissive
DROP POLICY IF EXISTS "Admins can view all device data" ON public.device_data;
DROP POLICY IF EXISTS "Users can view own device data" ON public.device_data;
DROP POLICY IF EXISTS "Service can insert device data" ON public.device_data;

CREATE POLICY "Admins can view all device data"
ON public.device_data FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own device data"
ON public.device_data FOR SELECT TO authenticated
USING (device_id IN (SELECT d.device_id FROM devices d WHERE d.owner_user_id = auth.uid()));

CREATE POLICY "Service can insert device data"
ON public.device_data FOR INSERT TO anon
WITH CHECK (true);