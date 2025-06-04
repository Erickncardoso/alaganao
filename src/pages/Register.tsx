import { useNavigate, useLocation } from "react-router-dom";
import { useAuth, RegisterData } from "@/hooks/useAuth";
import AuthPage from "@/components/ui/auth-page";
import { Shield } from "lucide-react";
import { useEffect } from "react";

const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { register, socialLogin, loading, isAuthenticated } = useAuth();

  // Redirecionar se já estiver logado
  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as any)?.from || "/map";
      navigate(from);
    }
  }, [isAuthenticated, navigate, location.state]);

  const handleRegister = async (data: RegisterData) => {
    const result = await register(data);

    if (result.success) {
      // O hook já mostra o toast de sucesso
      // Redirecionar para login após cadastro bem-sucedido
      navigate("/login?message=check-email");
    }

    // Se houver erro, o hook já mostra o toast de erro
  };

  const handleSocialLogin = async (provider: "google") => {
    const result = await socialLogin(provider);

    if (result.success) {
      // O redirecionamento será feito automaticamente pelo Supabase
      const from = (location.state as any)?.from || "/map";
      navigate(from);
    }

    // Se houver erro, o hook já mostra o toast de erro
  };

  const handleModeChange = (mode: "login" | "register") => {
    if (mode === "login") {
      navigate("/login");
    }
  };

  return (
    <AuthPage
      mode="register"
      onRegister={handleRegister}
      onSocialLogin={handleSocialLogin}
      onModeChange={handleModeChange}
      theme="gradient"
      customLogo={
        <div className="flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full">
          <Shield className="w-8 h-8 text-white" />
        </div>
      }
      title="alaganao"
      subtitle="Crie sua conta para receber alertas e reportar enchentes na sua região"
      showSocialLogin={true}
      showRememberMe={false}
      showForgotPassword={false}
      loading={loading}
    />
  );
};

export default Register;
