import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useAuth, LoginData } from "@/hooks/useAuth";
import AuthPage from "@/components/ui/auth-page";
import { Shield } from "lucide-react";
import { useEffect } from "react";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { login, socialLogin, resetPassword, loading, isAuthenticated } =
    useAuth();

  // Redirecionar se já estiver logado
  useEffect(() => {
    if (isAuthenticated) {
      // Pegar a página de onde o usuário veio, ou ir para o mapa por padrão
      const from = (location.state as any)?.from || "/map";
      navigate(from);
    }
  }, [isAuthenticated, navigate, location.state]);

  // Verificar se veio de confirmação de email
  useEffect(() => {
    const confirmed = searchParams.get("confirmed");
    if (confirmed === "true") {
      // Usuário confirmou email, pode mostrar mensagem
    }
  }, [searchParams]);

  const handleLogin = async (data: LoginData) => {
    const result = await login(data);

    if (result.success) {
      // O hook já mostra o toast de sucesso
      // Pegar a página de onde o usuário veio, ou ir para o mapa por padrão
      const from = (location.state as any)?.from || "/map";
      navigate(from);
    }

    // Se houver erro, o hook já mostra o toast de erro
    // Não precisamos lançar exceção aqui
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

  const handleForgotPassword = async (email: string) => {
    const result = await resetPassword(email);

    // O hook já cuida dos toasts de sucesso e erro
  };

  const handleModeChange = (mode: "login" | "register") => {
    if (mode === "register") {
      navigate("/register");
    }
  };

  return (
    <AuthPage
      mode="login"
      onLogin={handleLogin}
      onSocialLogin={handleSocialLogin}
      onForgotPassword={handleForgotPassword}
      onModeChange={handleModeChange}
      theme="gradient"
      customLogo={
        <div className="flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full">
          <Shield className="w-8 h-8 text-white" />
        </div>
      }
      title="alaganao"
      subtitle="Entre na sua conta para acessar alertas e relatórios de enchentes"
      showSocialLogin={true}
      showRememberMe={true}
      showForgotPassword={true}
      loading={loading}
    />
  );
};

export default Login;
