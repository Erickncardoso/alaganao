import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Settings,
  Shield,
  Bell,
  Camera,
  Edit,
  Save,
  X,
  Activity,
  Heart,
  AlertTriangle,
  MessageSquare,
  Calendar,
  Clock,
  Users,
  Loader2,
  Eye,
  EyeOff,
  CheckCircle,
} from "lucide-react";
import Header from "@/components/Header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const profileSchema = z.object({
  fullName: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  location: z.string().optional(),
  bio: z.string().max(500, "Bio deve ter no máximo 500 caracteres").optional(),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(6, "Senha atual é obrigatória"),
    newPassword: z
      .string()
      .min(8, "Nova senha deve ter pelo menos 8 caracteres")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Senha deve conter maiúscula, minúscula e número"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Senhas não coincidem",
    path: ["confirmPassword"],
  });

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

interface UserStats {
  reportsCount: number;
  donationsCount: number;
  commentsCount: number;
  helpedPeople: number;
  joinDate: string;
  lastActivity: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "error";
  timestamp: string;
  read: boolean;
}

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, isAuthenticated, updateProfile } = useAuth();

  console.log("Profile component rendered:", {
    user,
    profile,
    isAuthenticated,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    appNotifications: true,
    alertRadius: 10,
    locationSharing: true,
    publicProfile: false,
  });

  // Formulário de perfil
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      location: "",
      bio: "",
    },
  });

  // Formulário de senha
  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Redirecionar se não estiver logado
  useEffect(() => {
    console.log("Auth check:", { isAuthenticated });
    if (isAuthenticated === false) {
      console.log("Redirecting to login...");
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  // Carregar dados do usuário
  useEffect(() => {
    console.log("Loading user data:", { profile, user });
    if (profile && user) {
      const formData = {
        fullName: profile.full_name || "",
        email: user.email || "",
        phone: profile.phone || "",
        location: profile.location || "",
        bio: "",
      };
      console.log("Setting form data:", formData);
      profileForm.reset(formData);

      if (profile.preferences) {
        const newPreferences = {
          emailNotifications: profile.preferences.email_notifications || true,
          appNotifications: profile.preferences.app_notifications || true,
          alertRadius: profile.preferences.alert_radius_km || 10,
          locationSharing: true,
          publicProfile: false,
        };
        console.log("Setting preferences:", newPreferences);
        setPreferences(newPreferences);
      }
    }
  }, [profile, user, profileForm]);

  // Carregar estatísticas do usuário
  useEffect(() => {
    const loadUserStats = async () => {
      if (!user?.id) return;

      try {
        const stats = {
          reportsCount: 12,
          donationsCount: 5,
          commentsCount: 28,
          helpedPeople: 45,
          joinDate: profile?.created_at || user.created_at,
          lastActivity: new Date().toISOString(),
        };
        console.log("Setting user stats:", stats);
        setUserStats(stats);

        const notifs = [
          {
            id: "1",
            title: "Alerta de Enchente",
            message: "Nova situação de risco detectada na sua região",
            type: "warning" as const,
            timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            read: false,
          },
          {
            id: "2",
            title: "Doação Confirmada",
            message: "Sua doação de R$ 50 foi processada com sucesso",
            type: "success" as const,
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
            read: true,
          },
        ];
        console.log("Setting notifications:", notifs);
        setNotifications(notifs);
      } catch (error) {
        console.error("Erro ao carregar estatísticas:", error);
      }
    };

    loadUserStats();
  }, [user, profile]);

  // Atualizar perfil
  const handleUpdateProfile = async (data: ProfileFormData) => {
    try {
      console.log("Updating profile with data:", data);
      setLoading(true);

      const result = await updateProfile({
        full_name: data.fullName,
        phone: data.phone,
        location: data.location,
        preferences: {
          email_notifications: preferences.emailNotifications,
          app_notifications: preferences.appNotifications,
          alert_radius_km: preferences.alertRadius,
        },
      });

      console.log("Update result:", result);

      if (result.success) {
        setIsEditing(false);
        toast({
          title: "Perfil atualizado!",
          description: "Suas informações foram salvas com sucesso.",
        });
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Erro ao atualizar perfil",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Alterar senha
  const handleChangePassword = async (data: PasswordFormData) => {
    try {
      console.log("Changing password...");
      setLoading(true);

      const { error } = await supabase.auth.updateUser({
        password: data.newPassword,
      });

      if (error) {
        throw error;
      }

      setIsChangingPassword(false);
      passwordForm.reset();
      toast({
        title: "Senha alterada!",
        description: "Sua senha foi atualizada com sucesso.",
      });
    } catch (error: any) {
      console.error("Error changing password:", error);
      toast({
        title: "Erro ao alterar senha",
        description: error.message || "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Marcar notificação como lida
  const markNotificationAsRead = (id: string) => {
    console.log("Marking notification as read:", id);
    setNotifications((prev) =>
      prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif))
    );
  };

  // Obter iniciais do usuário
  const getUserInitials = () => {
    if (profile?.full_name) {
      return profile.full_name
        .split(" ")
        .map((name) => name[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

  // Obter nome de exibição
  const getDisplayName = () => {
    return profile?.full_name || user?.email?.split("@")[0] || "Usuário";
  };

  // Formatizar data
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Se ainda está carregando ou não autenticado
  if (isAuthenticated === false) {
    console.log("Showing not authenticated view");
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Acesso Restrito
            </h2>
            <p className="text-gray-600 mb-6">
              Você precisa estar logado para acessar seu perfil.
            </p>
            <Button onClick={() => navigate("/login")}>Fazer Login</Button>
          </div>
        </div>
      </div>
    );
  }

  if (isAuthenticated === null || !user) {
    console.log("Showing loading view");
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Carregando...</p>
          </div>
        </div>
      </div>
    );
  }

  console.log("Rendering main profile view");

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header do Perfil */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm border p-6 mb-6"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user.user_metadata?.avatar_url} />
                <AvatarFallback className="bg-blue-600 text-white text-lg">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <Button
                size="sm"
                className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full p-0"
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {getDisplayName()}
                  </h1>
                  <p className="text-gray-500">{user.email}</p>
                  {profile?.location && (
                    <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                      <MapPin className="h-4 w-4" />
                      {profile.location}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-4 sm:mt-0">
                  <Button
                    variant={isEditing ? "destructive" : "outline"}
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    {isEditing ? (
                      <>
                        <X className="h-4 w-4 mr-2" />
                        Cancelar
                      </>
                    ) : (
                      <>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar Perfil
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Estatísticas Rápidas */}
              {userStats && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {userStats.reportsCount}
                    </div>
                    <div className="text-sm text-gray-500">Relatórios</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {userStats.donationsCount}
                    </div>
                    <div className="text-sm text-gray-500">Doações</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {userStats.commentsCount}
                    </div>
                    <div className="text-sm text-gray-500">Comentários</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {userStats.helpedPeople}
                    </div>
                    <div className="text-sm text-gray-500">
                      Pessoas Ajudadas
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Debug Info */}
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-600">Debug Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>
                <strong>User ID:</strong> {user?.id}
              </p>
              <p>
                <strong>Email:</strong> {user?.email}
              </p>
              <p>
                <strong>Profile:</strong> {profile ? "Loaded" : "Not loaded"}
              </p>
              <p>
                <strong>Authenticated:</strong> {String(isAuthenticated)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Conteúdo Principal */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Perfil</TabsTrigger>
            <TabsTrigger value="preferences">Preferências</TabsTrigger>
            <TabsTrigger value="activity">Atividades</TabsTrigger>
            <TabsTrigger value="security">Segurança</TabsTrigger>
          </TabsList>

          {/* Tab: Perfil */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Informações Pessoais</CardTitle>
                <CardDescription>
                  Gerencie suas informações básicas e dados de contato
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={profileForm.handleSubmit(handleUpdateProfile)}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Nome Completo</Label>
                      <Input
                        id="fullName"
                        disabled={!isEditing}
                        {...profileForm.register("fullName")}
                      />
                      {profileForm.formState.errors.fullName && (
                        <p className="text-sm text-destructive">
                          {profileForm.formState.errors.fullName.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        disabled
                        {...profileForm.register("email")}
                      />
                      <p className="text-xs text-gray-500">
                        Para alterar o email, entre em contato com o suporte
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        placeholder="(11) 99999-9999"
                        disabled={!isEditing}
                        {...profileForm.register("phone")}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location">Localização</Label>
                      <Input
                        id="location"
                        placeholder="Cidade, Estado"
                        disabled={!isEditing}
                        {...profileForm.register("location")}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      placeholder="Conte um pouco sobre você..."
                      disabled={!isEditing}
                      {...profileForm.register("bio")}
                    />
                  </div>

                  {isEditing && (
                    <div className="flex justify-end gap-2">
                      <Button type="submit" disabled={loading}>
                        {loading ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Salvar Alterações
                      </Button>
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Preferências */}
          <TabsContent value="preferences">
            <Card>
              <CardHeader>
                <CardTitle>Preferências</CardTitle>
                <CardDescription>
                  Configure suas preferências de notificação e privacidade
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Seção de preferências em desenvolvimento...</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Atividades */}
          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Atividades</CardTitle>
                <CardDescription>
                  Seu histórico de atividades na plataforma
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Seção de atividades em desenvolvimento...</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Segurança */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Segurança</CardTitle>
                <CardDescription>
                  Gerencie a segurança da sua conta
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Seção de segurança em desenvolvimento...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;
