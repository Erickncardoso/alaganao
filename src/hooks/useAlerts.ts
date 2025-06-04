import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AlertData {
  id: string;
  title: string;
  message: string;
  severity: "low" | "moderate" | "high" | "critical";
  alert_type: "weather" | "flood" | "emergency" | "maintenance";
  area_affected: string;
  latitude?: number;
  longitude?: number;
  radius_km?: number;
  status: "active" | "resolved" | "expired";
  issued_at: string;
  expires_at?: string;
  issued_by: string;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  user_id: string;
  location_alerts_enabled: boolean;
  alert_radius_km: number;
  email_notifications: boolean;
  app_notifications: boolean;
  sms_notifications: boolean;
  whatsapp_notifications: boolean;
  notification_types: string[];
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  created_at?: string;
  updated_at?: string;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
}

export interface AlertStats {
  total_active: number;
  by_severity: Record<string, number>;
  by_type: Record<string, number>;
  recent_count: number;
  user_location_risk: "low" | "moderate" | "high" | "critical" | "none";
}

export const useAlerts = () => {
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [userPreferences, setUserPreferences] =
    useState<UserPreferences | null>(null);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(
    null
  );
  const [locationAlerts, setLocationAlerts] = useState<AlertData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<
    "prompt" | "granted" | "denied"
  >("prompt");

  // Buscar alertas ativos
  const fetchAlerts = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from("emergency_alerts")
        .select("*")
        .eq("status", "active")
        .order("issued_at", { ascending: false });

      if (fetchError) throw fetchError;
      setAlerts(data || []);
    } catch (err) {
      console.error("Erro ao buscar alertas:", err);
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    }
  };

  // Buscar preferências do usuário
  const fetchUserPreferences = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error: fetchError } = await supabase
        .from("user_alert_preferences")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") {
        throw fetchError;
      }

      if (data) {
        setUserPreferences(data);
      } else {
        // Criar preferências padrão se não existir
        const defaultPrefs: Partial<UserPreferences> = {
          user_id: user.id,
          location_alerts_enabled: false,
          alert_radius_km: 5,
          email_notifications: false,
          app_notifications: true,
          sms_notifications: false,
          whatsapp_notifications: false,
          notification_types: ["flood", "emergency"],
        };

        const { data: newPrefs, error: createError } = await supabase
          .from("user_alert_preferences")
          .insert(defaultPrefs)
          .select()
          .single();

        if (createError) throw createError;
        setUserPreferences(newPrefs);
      }
    } catch (err) {
      console.error("Erro ao buscar preferências:", err);
      setError(
        err instanceof Error ? err.message : "Erro ao carregar preferências"
      );
    }
  };

  // Atualizar preferências do usuário
  const updateUserPreferences = async (updates: Partial<UserPreferences>) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || !userPreferences) return;

      const { data, error } = await supabase
        .from("user_alert_preferences")
        .update(updates)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;

      setUserPreferences(data);
      return data;
    } catch (err) {
      console.error("Erro ao atualizar preferências:", err);
      throw err;
    }
  };

  // Obter localização atual
  const getCurrentLocation = useCallback((): Promise<LocationData> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocalização não suportada"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          try {
            // Fazer geocoding reverso para obter endereço
            const response = await fetch(
              `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=pk.eyJ1IjoiZXJpY2tjYXJkb3NvIiwiYSI6ImNtYmE1dGkyNTA3am4ybG9sMDQxZ2ptYmgifQ.MQMRf8oeujyQ6G-Y6hMW-A`
            );

            const data = await response.json();
            const place = data.features?.[0];

            const locationData: LocationData = {
              latitude,
              longitude,
              address:
                place?.place_name ||
                `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
              city: place?.context?.find((c: any) => c.id.includes("place"))
                ?.text,
              state: place?.context?.find((c: any) => c.id.includes("region"))
                ?.text,
              country: place?.context?.find((c: any) =>
                c.id.includes("country")
              )?.text,
            };

            setCurrentLocation(locationData);
            resolve(locationData);
          } catch (geocodeError) {
            // Se o geocoding falhar, usar coordenadas básicas
            const basicLocation: LocationData = {
              latitude,
              longitude,
              address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
            };

            setCurrentLocation(basicLocation);
            resolve(basicLocation);
          }
        },
        (error) => {
          console.error("Erro de geolocalização:", error);
          reject(new Error("Não foi possível obter sua localização"));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutos
        }
      );
    });
  }, []);

  // Buscar alertas por localização
  const fetchLocationAlerts = async (
    location: LocationData,
    radiusKm: number = 5
  ) => {
    try {
      // Buscar alertas próximos usando função SQL
      const { data, error } = await supabase.rpc("get_alerts_near_location", {
        user_lat: location.latitude,
        user_lng: location.longitude,
        radius_km: radiusKm,
      });

      if (error) throw error;
      setLocationAlerts(data || []);
      return data || [];
    } catch (err) {
      console.error("Erro ao buscar alertas por localização:", err);
      throw err;
    }
  };

  // Solicitar permissão para notificações
  const requestNotificationPermission = async (): Promise<boolean> => {
    try {
      if (!("Notification" in window)) {
        throw new Error("Notificações não suportadas");
      }

      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);

      return permission === "granted";
    } catch (err) {
      console.error("Erro ao solicitar permissão:", err);
      return false;
    }
  };

  // Enviar notificação local
  const sendLocalNotification = (
    title: string,
    message: string,
    options?: NotificationOptions
  ) => {
    try {
      if (permissionStatus !== "granted") return;

      const notification = new Notification(title, {
        body: message,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        tag: "flood-alert",
        requireInteraction: true,
        ...options,
      });

      // Auto-fechar após 10 segundos
      setTimeout(() => notification.close(), 10000);

      return notification;
    } catch (err) {
      console.error("Erro ao enviar notificação:", err);
    }
  };

  // Obter estatísticas de alertas
  const getAlertStats = async (): Promise<AlertStats> => {
    try {
      const { data, error } = await supabase
        .from("emergency_alerts")
        .select("severity, alert_type, issued_at, status")
        .eq("status", "active");

      if (error) throw error;

      const stats: AlertStats = {
        total_active: data?.length || 0,
        by_severity: {
          low: data?.filter((a) => a.severity === "low").length || 0,
          moderate: data?.filter((a) => a.severity === "moderate").length || 0,
          high: data?.filter((a) => a.severity === "high").length || 0,
          critical: data?.filter((a) => a.severity === "critical").length || 0,
        },
        by_type: {
          weather: data?.filter((a) => a.alert_type === "weather").length || 0,
          flood: data?.filter((a) => a.alert_type === "flood").length || 0,
          emergency:
            data?.filter((a) => a.alert_type === "emergency").length || 0,
          maintenance:
            data?.filter((a) => a.alert_type === "maintenance").length || 0,
        },
        recent_count:
          data?.filter((a) => {
            const issuedAt = new Date(a.issued_at);
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            return issuedAt >= yesterday;
          }).length || 0,
        user_location_risk: "none",
      };

      // Determinar risco da localização do usuário
      if (currentLocation && locationAlerts.length > 0) {
        const maxSeverity = locationAlerts.reduce((max, alert) => {
          const severityLevels = { low: 1, moderate: 2, high: 3, critical: 4 };
          const currentLevel = severityLevels[alert.severity] || 0;
          const maxLevel = severityLevels[max] || 0;
          return currentLevel > maxLevel ? alert.severity : max;
        }, "none" as any);

        stats.user_location_risk = maxSeverity;
      }

      return stats;
    } catch (err) {
      console.error("Erro ao obter estatísticas:", err);
      throw err;
    }
  };

  // Criar novo alerta (para admins)
  const createAlert = async (alertData: Partial<AlertData>) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("emergency_alerts")
        .insert({
          ...alertData,
          issued_by: user.id,
          status: "active",
        })
        .select()
        .single();

      if (error) throw error;

      await fetchAlerts(); // Refresh alerts
      return data;
    } catch (err) {
      console.error("Erro ao criar alerta:", err);
      throw err;
    }
  };

  // Inicialização
  useEffect(() => {
    const initializeAlerts = async () => {
      setLoading(true);
      setError(null);

      try {
        // Verificar permissão de notificação atual
        if ("Notification" in window) {
          setPermissionStatus(Notification.permission);
        }

        // Buscar dados
        await Promise.all([fetchAlerts(), fetchUserPreferences()]);

        // Tentar obter localização se permitido
        try {
          const location = await getCurrentLocation();
          if (location && userPreferences?.location_alerts_enabled) {
            await fetchLocationAlerts(
              location,
              userPreferences.alert_radius_km
            );
          }
        } catch (locationError) {
          console.log("Localização não disponível:", locationError);
        }
      } catch (err) {
        console.error("Erro na inicialização:", err);
        setError(
          err instanceof Error ? err.message : "Erro ao carregar alertas"
        );
      } finally {
        setLoading(false);
      }
    };

    initializeAlerts();
  }, []);

  // Atualizar alertas por localização quando preferências mudarem
  useEffect(() => {
    if (currentLocation && userPreferences?.location_alerts_enabled) {
      fetchLocationAlerts(currentLocation, userPreferences.alert_radius_km);
    }
  }, [
    currentLocation,
    userPreferences?.location_alerts_enabled,
    userPreferences?.alert_radius_km,
  ]);

  return {
    // Estado
    alerts,
    userPreferences,
    currentLocation,
    locationAlerts,
    loading,
    error,
    permissionStatus,

    // Ações
    fetchAlerts,
    updateUserPreferences,
    getCurrentLocation,
    fetchLocationAlerts,
    requestNotificationPermission,
    sendLocalNotification,
    getAlertStats,
    createAlert,

    // Utilitários
    refetch: () => {
      fetchAlerts();
      fetchUserPreferences();
    },
  };
};
