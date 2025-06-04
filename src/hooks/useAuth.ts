import { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  location?: string;
  preferences?: {
    email_notifications: boolean;
    app_notifications: boolean;
    alert_radius_km: number;
  };
  created_at: string;
  updated_at: string;
}

export interface LoginData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms?: boolean;
  phone?: string;
  location?: string;
}

export const useAuth = () => {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);

  // Inicializar autenticação
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Verificar sessão atual
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();

        if (currentSession) {
          setSession(currentSession);
          setUser(currentSession.user);
          await loadUserProfile(currentSession.user.id);
        }
      } catch (error) {
        console.error("Erro ao inicializar autenticação:", error);
      } finally {
        setInitializing(false);
        setLoading(false);
      }
    };

    initializeAuth();

    // Escutar mudanças de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session);

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await loadUserProfile(session.user.id);
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Carregar perfil do usuário
  const loadUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 = not found
        throw error;
      }

      if (data) {
        setProfile(data);
      } else {
        // Criar perfil se não existir
        await createUserProfile(userId);
      }
    } catch (error) {
      console.error("Erro ao carregar perfil:", error);
    }
  };

  // Criar perfil do usuário
  const createUserProfile = async (userId: string) => {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) return;

      const profileData = {
        id: userId,
        email: user.data.user.email!,
        full_name: user.data.user.user_metadata?.full_name || "",
        preferences: {
          email_notifications: true,
          app_notifications: true,
          alert_radius_km: 10,
        },
      };

      const { data, error } = await supabase
        .from("user_profiles")
        .insert(profileData)
        .select()
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error("Erro ao criar perfil:", error);
    }
  };

  // Login
  const login = async (
    data: LoginData
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);

      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        let errorMessage = "Erro ao fazer login";

        switch (error.message) {
          case "Invalid login credentials":
            errorMessage = "Email ou senha incorretos";
            break;
          case "Email not confirmed":
            errorMessage = "Por favor, confirme seu email antes de fazer login";
            break;
          case "Too many requests":
            errorMessage =
              "Muitas tentativas. Tente novamente em alguns minutos";
            break;
          default:
            errorMessage = error.message;
        }

        toast({
          title: "Erro no login",
          description: errorMessage,
          variant: "destructive",
        });

        return { success: false, error: errorMessage };
      }

      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo de volta ao alaganao",
      });

      return { success: true };
    } catch (error) {
      console.error("Erro no login:", error);
      const errorMessage = "Erro inesperado ao fazer login";

      toast({
        title: "Erro no login",
        description: errorMessage,
        variant: "destructive",
      });

      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Registro
  const register = async (
    data: RegisterData
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);

      console.log("🔍 DEBUG - Iniciando registro:", {
        email: data.email,
        fullName: data.fullName,
        passwordLength: data.password?.length || 0,
        confirmPasswordLength: data.confirmPassword?.length || 0,
      });

      // Validar senhas
      if (data.password !== data.confirmPassword) {
        const errorMessage = "As senhas não coincidem";
        console.log("❌ Erro de validação - Senhas diferentes");
        toast({
          title: "Erro no cadastro",
          description: errorMessage,
          variant: "destructive",
        });
        return { success: false, error: errorMessage };
      }

      console.log("✅ Validações passaram, chamando Supabase...");

      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            phone: data.phone || "",
            location: data.location || "",
          },
          emailRedirectTo: `${window.location.origin}/login?confirmed=true`,
        },
      });

      console.log("📡 Resposta do Supabase:", { error });

      if (error) {
        let errorMessage = "Erro ao criar conta";

        switch (error.message) {
          case "User already registered":
            errorMessage = "Este email já está cadastrado";
            break;
          case "Password should be at least 6 characters":
            errorMessage = "A senha deve ter pelo menos 6 caracteres";
            break;
          case "Invalid email":
            errorMessage = "Email inválido";
            break;
          case "Signup is disabled":
            errorMessage = "Cadastro temporariamente desabilitado";
            break;
          default:
            errorMessage = error.message;
        }

        console.log("❌ Erro do Supabase:", errorMessage);

        toast({
          title: "Erro no cadastro",
          description: errorMessage,
          variant: "destructive",
        });

        return { success: false, error: errorMessage };
      }

      console.log("🎉 Registro realizado com sucesso!");

      toast({
        title: "Conta criada com sucesso!",
        description: "Verifique seu email para confirmar a conta e fazer login",
      });

      return { success: true };
    } catch (error) {
      console.error("💥 Erro inesperado no registro:", error);
      const errorMessage = "Erro inesperado ao criar conta";

      toast({
        title: "Erro no cadastro",
        description: errorMessage,
        variant: "destructive",
      });

      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);

      const { error } = await supabase.auth.signOut();

      if (error) {
        toast({
          title: "Erro ao sair",
          description: error.message,
          variant: "destructive",
        });
        return { success: false, error: error.message };
      }

      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso",
      });

      return { success: true };
    } catch (error) {
      console.error("Erro no logout:", error);
      const errorMessage = "Erro inesperado ao fazer logout";

      toast({
        title: "Erro ao sair",
        description: errorMessage,
        variant: "destructive",
      });

      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Redefinir senha
  const resetPassword = async (
    email: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        let errorMessage = "Erro ao enviar email de recuperação";

        switch (error.message) {
          case "User not found":
            errorMessage = "Email não encontrado";
            break;
          case "For security purposes, you can only request this once every 60 seconds":
            errorMessage = "Aguarde 60 segundos antes de solicitar novamente";
            break;
          default:
            errorMessage = error.message;
        }

        toast({
          title: "Erro na recuperação",
          description: errorMessage,
          variant: "destructive",
        });

        return { success: false, error: errorMessage };
      }

      toast({
        title: "Email enviado!",
        description: "Verifique sua caixa de entrada para redefinir sua senha",
      });

      return { success: true };
    } catch (error) {
      console.error("Erro ao redefinir senha:", error);
      const errorMessage = "Erro inesperado ao redefinir senha";

      toast({
        title: "Erro na recuperação",
        description: errorMessage,
        variant: "destructive",
      });

      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Login social
  const socialLogin = async (
    provider: "google"
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        toast({
          title: "Erro no login social",
          description: error.message,
          variant: "destructive",
        });
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error("Erro no login social:", error);
      const errorMessage = "Erro inesperado no login social";

      toast({
        title: "Erro no login social",
        description: errorMessage,
        variant: "destructive",
      });

      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Atualizar perfil
  const updateProfile = async (
    updates: Partial<UserProfile>
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!user) {
        return { success: false, error: "Usuário não autenticado" };
      }

      setLoading(true);

      const { data, error } = await supabase
        .from("user_profiles")
        .update(updates)
        .eq("id", user.id)
        .select()
        .single();

      if (error) {
        toast({
          title: "Erro ao atualizar perfil",
          description: error.message,
          variant: "destructive",
        });
        return { success: false, error: error.message };
      }

      setProfile(data);

      toast({
        title: "Perfil atualizado!",
        description: "Suas informações foram salvas com sucesso",
      });

      return { success: true };
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      const errorMessage = "Erro inesperado ao atualizar perfil";

      toast({
        title: "Erro ao atualizar perfil",
        description: errorMessage,
        variant: "destructive",
      });

      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return {
    // Estado
    user,
    session,
    profile,
    loading,
    initializing,
    isAuthenticated: !!user,

    // Ações
    login,
    register,
    logout,
    resetPassword,
    socialLogin,
    updateProfile,

    // Utilitários
    refetch: () => {
      if (user) {
        loadUserProfile(user.id);
      }
    },
  };
};
