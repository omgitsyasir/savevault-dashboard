import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { getDeviceFingerprint } from "@/lib/hardwareId";

type Device = Tables<"devices">;

export function useCurrentDevice() {
  const [device, setDevice] = useState<Device | null>(null);
  const [needsRegistration, setNeedsRegistration] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    const { hardware_id } = getDeviceFingerprint();
    const { data } = await supabase
      .from("devices")
      .select("*")
      .eq("hardware_id", hardware_id)
      .maybeSingle();
    setDevice(data ?? null);
    setNeedsRegistration(!data);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const register = async (name: string, os: string) => {
    const { hardware_id } = getDeviceFingerprint();
    const { data, error } = await supabase
      .from("devices")
      .upsert({ name, os, hardware_id }, { onConflict: "hardware_id" })
      .select()
      .single();
    if (error) throw error;
    setDevice(data);
    setNeedsRegistration(false);
    return data;
  };

  const dismiss = () => setNeedsRegistration(false);

  return { device, needsRegistration, loading, register, refresh, dismiss };
}