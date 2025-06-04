import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface FloodReport {
  id: string;
  title: string;
  message: string;
  severity: "low" | "moderate" | "high" | "critical";
  status: "pending" | "approved" | "rejected" | "duplicate";
  latitude: number;
  longitude: number;
  neighborhood: string;
  address?: string;
  water_level?: number;
  affected_people: number;
  images?: string[];
  rescue_needed?: boolean;
  people_trapped?: number;
  access_blocked?: boolean;
  user_id?: string;
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  report_date: string;
  created_at: string;
  updated_at: string;
}

interface CreateReportData {
  title?: string;
  message: string;
  severity: "low" | "moderate" | "high" | "critical";
  latitude: number;
  longitude: number;
  neighborhood: string;
  address?: string;
  water_level?: number;
  affected_people?: number;
  images?: string[];
  rescue_needed?: boolean;
  people_trapped?: number;
  access_blocked?: boolean;
  user_id?: string;
}

export const useFloodReports = (approved?: boolean) => {
  const [reports, setReports] = useState<FloodReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from("flood_reports")
        .select("*")
        .order("report_date", { ascending: false });

      if (approved !== undefined) {
        const status = approved ? "approved" : "pending";
        query = query.eq("status", status);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      setReports(data || []);
    } catch (err) {
      console.error("Erro ao buscar relatos:", err);
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  const createReport = async (reportData: CreateReportData) => {
    try {
      // Obter usuário atual
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const insertData = {
        title: reportData.title || "Relato de Enchente",
        message: reportData.message,
        severity: reportData.severity,
        latitude: reportData.latitude,
        longitude: reportData.longitude,
        neighborhood: reportData.neighborhood,
        address: reportData.address,
        water_level: reportData.water_level,
        affected_people: reportData.affected_people || 0,
        images: reportData.images || [],
        rescue_needed: reportData.rescue_needed || false,
        people_trapped: reportData.people_trapped || 0,
        access_blocked: reportData.access_blocked || false,
        status: "pending",
        user_id: user?.id || reportData.user_id,
        report_date: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("flood_reports")
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error("Erro do Supabase:", error);
        throw error;
      }

      // Se o relato tem situação de emergência, criar notificação
      if (
        reportData.rescue_needed &&
        reportData.people_trapped &&
        reportData.people_trapped > 0
      ) {
        try {
          await supabase.from("emergency_activations").insert({
            report_id: data.id,
            activation_type: "rescue",
            priority_level:
              reportData.severity === "critical" ? "critical" : "high",
            affected_people: reportData.people_trapped,
            description: `Resgate necessário: ${reportData.people_trapped} pessoa(s) precisam de ajuda`,
            status: "active",
            location: `${reportData.neighborhood} - ${reportData.latitude}, ${reportData.longitude}`,
          });
        } catch (emergencyError) {
          console.warn("Erro ao criar ativação de emergência:", emergencyError);
          // Não falha o relatório por causa disso
        }
      }

      await fetchReports(); // Refresh the list
      return data;
    } catch (err) {
      console.error("Erro ao criar relato:", err);
      throw err;
    }
  };

  const approveReport = async (reportId: string, approvedBy?: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error } = await supabase
        .from("flood_reports")
        .update({
          status: "approved",
          approved_at: new Date().toISOString(),
          approved_by: approvedBy || user?.id,
        })
        .eq("id", reportId);

      if (error) throw error;

      await fetchReports(); // Refresh the list
    } catch (err) {
      console.error("Erro ao aprovar relato:", err);
      throw err;
    }
  };

  const rejectReport = async (reportId: string, reason?: string) => {
    try {
      const { error } = await supabase
        .from("flood_reports")
        .update({
          status: "rejected",
          rejection_reason: reason,
          updated_at: new Date().toISOString(),
        })
        .eq("id", reportId);

      if (error) throw error;

      await fetchReports(); // Refresh the list
    } catch (err) {
      console.error("Erro ao rejeitar relato:", err);
      throw err;
    }
  };

  const deleteReport = async (reportId: string) => {
    try {
      const { error } = await supabase
        .from("flood_reports")
        .delete()
        .eq("id", reportId);

      if (error) throw error;

      await fetchReports(); // Refresh the list
    } catch (err) {
      console.error("Erro ao deletar relato:", err);
      throw err;
    }
  };

  const getReportsByLocation = async (
    latitude: number,
    longitude: number,
    radiusKm: number = 5
  ) => {
    try {
      // Função para calcular distância aproximada usando fórmula de Haversine
      const { data, error } = await supabase
        .from("flood_reports")
        .select("*")
        .eq("status", "approved")
        .order("report_date", { ascending: false });

      if (error) throw error;

      // Filtrar por distância (aproximação simples)
      const filtered =
        data?.filter((report) => {
          const latDiff = Math.abs(report.latitude - latitude);
          const lngDiff = Math.abs(report.longitude - longitude);
          const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);

          // Conversão aproximada de graus para km (1 grau ≈ 111 km)
          const distanceKm = distance * 111;
          return distanceKm <= radiusKm;
        }) || [];

      return filtered;
    } catch (err) {
      console.error("Erro ao buscar relatos por localização:", err);
      throw err;
    }
  };

  const getReportStatistics = async () => {
    try {
      const { data, error } = await supabase
        .from("flood_reports")
        .select("severity, status, created_at, rescue_needed, access_blocked")
        .eq("status", "approved");

      if (error) throw error;

      const stats = {
        total: data?.length || 0,
        bySeverity: {
          low: data?.filter((r) => r.severity === "low").length || 0,
          moderate: data?.filter((r) => r.severity === "moderate").length || 0,
          high: data?.filter((r) => r.severity === "high").length || 0,
          critical: data?.filter((r) => r.severity === "critical").length || 0,
        },
        emergencyStats: {
          rescueNeeded: data?.filter((r) => r.rescue_needed).length || 0,
          accessBlocked: data?.filter((r) => r.access_blocked).length || 0,
        },
        recentReports:
          data?.filter((r) => {
            const reportDate = new Date(r.created_at);
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            return reportDate >= yesterday;
          }).length || 0,
      };

      return stats;
    } catch (err) {
      console.error("Erro ao buscar estatísticas:", err);
      throw err;
    }
  };

  useEffect(() => {
    fetchReports();
  }, [approved]);

  return {
    reports,
    loading,
    error,
    createReport,
    approveReport,
    rejectReport,
    deleteReport,
    getReportsByLocation,
    getReportStatistics,
    refetch: fetchReports,
  };
};
