import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface DonationCampaign {
  id: string;
  title: string;
  description?: string;
  goal_amount?: number;
  current_amount: number;
  campaign_type: "emergency" | "prevention" | "reconstruction" | "supplies";
  status: "active" | "paused" | "completed" | "cancelled";
  start_date?: string;
  end_date?: string;
  location_focus?: string[];
  created_by?: string;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Donation {
  id: string;
  donor_id?: string;
  campaign_id?: string;
  amount?: number;
  donation_type: "money" | "supplies" | "volunteer_time";
  pix_transaction_id?: string;
  status: "pending" | "confirmed" | "cancelled";
  donor_name?: string;
  donor_email?: string;
  message?: string;
  is_anonymous: boolean;
  created_at?: string;
}

export interface DonationPlace {
  id: string;
  name: string;
  address: string;
  phone?: string;
  types: string[];
  hours: string;
  urgency: "alta" | "media" | "baixa";
  description: string;
  image?: string;
  needs?: string[];
  contact_person?: string;
  whatsapp?: string;
  latitude?: number;
  longitude?: number;
  verified: boolean;
}

export const useDonations = () => {
  const [campaigns, setCampaigns] = useState<DonationCampaign[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [donationPlaces, setDonationPlaces] = useState<DonationPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Buscar campanhas ativas
  const fetchCampaigns = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from("donation_campaigns")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;
      setCampaigns(data || []);
    } catch (err) {
      console.error("Erro ao buscar campanhas:", err);
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    }
  };

  // Buscar doações do usuário atual
  const fetchUserDonations = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error: fetchError } = await supabase
        .from("donations")
        .select("*")
        .eq("donor_id", user.id)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;
      setDonations(data || []);
    } catch (err) {
      console.error("Erro ao buscar doações:", err);
    }
  };

  // Criar nova doação
  const createDonation = async (donationData: Partial<Donation>) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from("donations")
        .insert({
          ...donationData,
          donor_id: user?.id,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;

      // Atualizar lista local
      setDonations((prev) => [data, ...prev]);

      return data;
    } catch (err) {
      console.error("Erro ao criar doação:", err);
      throw err;
    }
  };

  // Criar PIX para doação
  const createPixDonation = async (
    amount: number,
    campaignId?: string,
    message?: string,
    donorName?: string,
    donorEmail?: string,
    isAnonymous: boolean = false
  ) => {
    try {
      // Simular transação PIX (em produção integraria com gateway de pagamento)
      const pixTransactionId = `PIX_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      const donation = await createDonation({
        campaign_id: campaignId,
        amount,
        donation_type: "money",
        pix_transaction_id: pixTransactionId,
        donor_name: donorName,
        donor_email: donorEmail,
        message,
        is_anonymous: isAnonymous,
      });

      // Simular confirmação automática após 2 segundos (em produção seria via webhook)
      setTimeout(async () => {
        await confirmDonation(donation.id);
      }, 2000);

      return {
        donation,
        pixCode: generatePixCode(amount, pixTransactionId),
        transactionId: pixTransactionId,
      };
    } catch (err) {
      console.error("Erro ao criar doação PIX:", err);
      throw err;
    }
  };

  // Confirmar doação
  const confirmDonation = async (donationId: string) => {
    try {
      const { data, error } = await supabase
        .from("donations")
        .update({ status: "confirmed" })
        .eq("id", donationId)
        .select()
        .single();

      if (error) throw error;

      // Atualizar campanha se houver
      if (data.campaign_id && data.amount) {
        await updateCampaignAmount(data.campaign_id, data.amount);
      }

      // Atualizar lista local
      setDonations((prev) =>
        prev.map((d) =>
          d.id === donationId ? { ...d, status: "confirmed" } : d
        )
      );

      return data;
    } catch (err) {
      console.error("Erro ao confirmar doação:", err);
      throw err;
    }
  };

  // Atualizar valor arrecadado da campanha
  const updateCampaignAmount = async (campaignId: string, amount: number) => {
    try {
      const { data: campaign } = await supabase
        .from("donation_campaigns")
        .select("current_amount")
        .eq("id", campaignId)
        .single();

      if (campaign) {
        const newAmount = (campaign.current_amount || 0) + amount;

        await supabase
          .from("donation_campaigns")
          .update({ current_amount: newAmount })
          .eq("id", campaignId);

        // Atualizar lista local
        setCampaigns((prev) =>
          prev.map((c) =>
            c.id === campaignId ? { ...c, current_amount: newAmount } : c
          )
        );
      }
    } catch (err) {
      console.error("Erro ao atualizar valor da campanha:", err);
    }
  };

  // Gerar código PIX
  const generatePixCode = (amount: number, transactionId: string) => {
    const pixKey = "pix@alertacomunitario.com.br";
    const merchantName = "ALERTA COMUNITARIO";
    const merchantCity = "SAO PAULO";

    // Formato simplificado do PIX (em produção usar biblioteca específica)
    return `00020126580014BR.GOV.BCB.PIX0136${pixKey}52040000530398654${amount
      .toFixed(2)
      .padStart(
        10,
        "0"
      )}5925${merchantName}6009${merchantCity}62070503***6304${transactionId}`;
  };

  // Buscar estatísticas de doações
  const getDonationStats = async () => {
    try {
      const { data: totalDonations } = await supabase
        .from("donations")
        .select("amount")
        .eq("status", "confirmed");

      const { data: campaignStats } = await supabase
        .from("donation_campaigns")
        .select("current_amount, goal_amount, status");

      const total =
        totalDonations?.reduce((sum, d) => sum + (d.amount || 0), 0) || 0;
      const activeCampaigns =
        campaignStats?.filter((c) => c.status === "active").length || 0;
      const totalGoal =
        campaignStats?.reduce((sum, c) => sum + (c.goal_amount || 0), 0) || 0;

      return {
        totalDonated: total,
        totalDonors: totalDonations?.length || 0,
        activeCampaigns,
        progressPercentage: totalGoal > 0 ? (total / totalGoal) * 100 : 0,
      };
    } catch (err) {
      console.error("Erro ao buscar estatísticas:", err);
      return {
        totalDonated: 0,
        totalDonors: 0,
        activeCampaigns: 0,
        progressPercentage: 0,
      };
    }
  };

  // Locais de doação padrão (pode vir do banco posteriormente)
  const getDefaultDonationPlaces = (): DonationPlace[] => [
    {
      id: "1",
      name: "Centro de Doações São Vicente",
      address: "Rua das Flores, 123 - Centro",
      phone: "(11) 1234-5678",
      types: ["roupas", "alimentos"],
      hours: "Seg-Sex: 8h-17h",
      urgency: "alta",
      description:
        "Necessita urgentemente de roupas de inverno e alimentos não perecíveis",
      image:
        "https://images.unsplash.com/photo-1721322800607-8c38375eef04?w=400&h=300&fit=crop",
      needs: [
        "Roupas de inverno",
        "Alimentos não perecíveis",
        "Produtos de higiene",
      ],
      contact_person: "Maria Silva",
      whatsapp: "(11) 99999-1234",
      verified: true,
    },
    {
      id: "2",
      name: "Abrigo Esperança",
      address: "Av. Principal, 456 - Bairro Alto",
      phone: "(11) 2345-6789",
      types: ["roupas"],
      hours: "Todos os dias: 9h-18h",
      urgency: "media",
      description:
        "Aceita doações de roupas em bom estado para famílias carentes",
      image:
        "https://images.unsplash.com/photo-1582562124811-c09040d0a901?w=400&h=300&fit=crop",
      needs: ["Roupas infantis", "Roupas femininas", "Calçados"],
      contact_person: "João Santos",
      whatsapp: "(11) 99999-5678",
      verified: true,
    },
    {
      id: "3",
      name: "Banco de Alimentos Solidário",
      address: "Rua da Solidariedade, 789 - Vila Nova",
      phone: "(11) 3456-7890",
      types: ["alimentos"],
      hours: "Seg-Sab: 7h-16h",
      urgency: "alta",
      description:
        "Distribuição de alimentos para comunidades em situação de vulnerabilidade",
      image:
        "https://images.unsplash.com/photo-1517022812141-23620dba5c23?w=400&h=300&fit=crop",
      needs: ["Alimentos não perecíveis", "Cestas básicas", "Água potável"],
      contact_person: "Ana Costa",
      whatsapp: "(11) 99999-9012",
      verified: true,
    },
  ];

  // Inicialização
  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchCampaigns(), fetchUserDonations()]);

        // Carregar locais de doação padrão
        setDonationPlaces(getDefaultDonationPlaces());
      } catch (err) {
        console.error("Erro na inicialização:", err);
        setError("Erro ao carregar dados de doação");
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, []);

  return {
    // Estado
    campaigns,
    donations,
    donationPlaces,
    loading,
    error,

    // Ações
    createDonation,
    createPixDonation,
    confirmDonation,
    getDonationStats,

    // Utilitários
    refetch: () => {
      fetchCampaigns();
      fetchUserDonations();
    },
  };
};
