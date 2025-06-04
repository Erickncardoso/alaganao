import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  ArrowRight,
  Loader2,
  CheckCircle,
  AlertCircle,
  Chrome,
  Shield,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";

const loginSchema = z.object({
  email: z.string().email("Por favor, digite um email válido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  rememberMe: z.boolean().optional(),
});

const registerSchema = z
  .object({
    fullName: z.string().min(2, "O nome deve ter pelo menos 2 caracteres"),
    email: z.string().email("Por favor, digite um email válido"),
    password: z
      .string()
      .min(8, "A senha deve ter pelo menos 8 caracteres")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "A senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número"
      ),
    confirmPassword: z.string(),
    acceptTerms: z.boolean().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

interface AuthPageProps {
  mode?: "login" | "register";
  onModeChange?: (mode: "login" | "register") => void;
  onLogin?: (data: LoginFormData) => Promise<void>;
  onRegister?: (data: RegisterFormData) => Promise<void>;
  onForgotPassword?: (email: string) => Promise<void>;
  onSocialLogin?: (provider: "google") => Promise<void>;
  theme?: "light" | "dark" | "gradient";
  layout?: "centered" | "split";
  showSocialLogin?: boolean;
  showRememberMe?: boolean;
  showForgotPassword?: boolean;
  customLogo?: React.ReactNode;
  backgroundImage?: string;
  primaryColor?: string;
  title?: string;
  subtitle?: string;
  enableCaptcha?: boolean;
  maxAttempts?: number;
  loading?: boolean;
}

const PasswordStrengthIndicator: React.FC<{ password: string }> = ({
  password,
}) => {
  const [strength, setStrength] = useState(0);
  const [feedback, setFeedback] = useState<string[]>([]);

  useEffect(() => {
    const calculateStrength = () => {
      let score = 0;
      const newFeedback: string[] = [];

      if (password.length >= 8) {
        score += 20;
      } else {
        newFeedback.push("Pelo menos 8 caracteres");
      }

      if (/[a-z]/.test(password)) {
        score += 20;
      } else {
        newFeedback.push("Letra minúscula");
      }

      if (/[A-Z]/.test(password)) {
        score += 20;
      } else {
        newFeedback.push("Letra maiúscula");
      }

      if (/\d/.test(password)) {
        score += 20;
      } else {
        newFeedback.push("Número");
      }

      if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        score += 20;
        newFeedback.length = 0;
      } else if (score >= 60) {
        newFeedback.push("Caractere especial");
      }

      setStrength(score);
      setFeedback(newFeedback);
    };

    calculateStrength();
  }, [password]);

  const getStrengthColor = () => {
    if (strength < 40) return "bg-red-500";
    if (strength < 80) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getStrengthText = () => {
    if (strength < 40) return "Fraca";
    if (strength < 80) return "Média";
    return "Forte";
  };

  if (!password) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Força da senha</span>
        <span
          className={`font-medium ${
            strength >= 80
              ? "text-green-600"
              : strength >= 40
              ? "text-yellow-600"
              : "text-red-600"
          }`}
        >
          {getStrengthText()}
        </span>
      </div>
      <Progress value={strength} className="h-2" />
      {feedback.length > 0 && (
        <div className="text-xs text-muted-foreground">
          Faltando: {feedback.join(", ")}
        </div>
      )}
    </div>
  );
};

const SocialLoginButton: React.FC<{
  provider: "google";
  onClick: () => void;
  disabled?: boolean;
}> = ({ provider, onClick, disabled }) => {
  const getIcon = () => {
    return <Chrome className="w-4 h-4" />;
  };

  const getLabel = () => {
    return "Continuar com Google";
  };

  return (
    <Button
      variant="outline"
      className="w-full h-11 transition-all duration-200 hover:bg-muted/50"
      onClick={onClick}
      disabled={disabled}
    >
      {getIcon()}
      <span className="ml-2">{getLabel()}</span>
    </Button>
  );
};

const AuthPage: React.FC<AuthPageProps> = ({
  mode: initialMode = "login",
  onModeChange,
  onLogin,
  onRegister,
  onForgotPassword,
  onSocialLogin,
  theme = "light",
  layout = "centered",
  showSocialLogin = true,
  showRememberMe = true,
  showForgotPassword = true,
  customLogo,
  backgroundImage,
  primaryColor = "hsl(221.2 83.2% 53.3%)",
  title,
  subtitle,
  enableCaptcha = false,
  maxAttempts = 5,
  loading = false,
}) => {
  const [mode, setMode] = useState(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [showForgotPasswordForm, setShowForgotPasswordForm] = useState(false);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  });

  const handleModeChange = (newMode: "login" | "register") => {
    setMode(newMode);
    onModeChange?.(newMode);
    loginForm.reset();
    registerForm.reset();
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleLoginSubmit = async (data: LoginFormData) => {
    if (enableCaptcha && loginAttempts >= maxAttempts) {
      return;
    }

    try {
      setIsLoading(true);
      await onLogin?.(data);
    } catch (error) {
      setLoginAttempts((prev) => prev + 1);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (data: RegisterFormData) => {
    try {
      setIsLoading(true);
      await onRegister?.(data);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotPasswordEmail) return;

    try {
      setIsLoading(true);
      await onForgotPassword?.(forgotPasswordEmail);
      setShowForgotPasswordForm(false);
      setForgotPasswordEmail("");
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: "google") => {
    try {
      setIsLoading(true);
      await onSocialLogin?.(provider);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getThemeClasses = () => {
    switch (theme) {
      case "dark":
        return "bg-background text-foreground";
      case "gradient":
        return "bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50";
      default:
        return "bg-gray-50";
    }
  };

  const getCardClasses = () => {
    switch (theme) {
      case "dark":
        return "bg-card border-border";
      case "gradient":
        return "bg-white/80 backdrop-blur-sm border-white/20 shadow-xl";
      default:
        return "bg-white border-gray-200 shadow-lg";
    }
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-4 ${getThemeClasses()}`}
    >
      {backgroundImage && (
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        />
      )}

      <div className="relative w-full max-w-md">
        <Card className={`${getCardClasses()} overflow-hidden`}>
          <CardHeader className="space-y-4 pb-8">
            <div className="flex flex-col items-center space-y-4">
              {customLogo && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", duration: 0.5 }}
                >
                  {customLogo}
                </motion.div>
              )}

              <div className="text-center">
                <CardTitle className="text-2xl font-bold">
                  {title || (mode === "login" ? "Entrar" : "Criar Conta")}
                </CardTitle>
                <CardDescription className="mt-2">
                  {subtitle ||
                    (mode === "login"
                      ? "Entre na sua conta para continuar"
                      : "Crie sua conta para começar")}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <AnimatePresence mode="wait">
              {showForgotPasswordForm ? (
                <motion.div
                  key="forgot-password"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div className="text-center">
                    <h3 className="text-lg font-semibold">
                      Esqueceu sua senha?
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Digite seu email para receber instruções de recuperação
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="forgot-email">Email</Label>
                    <Input
                      id="forgot-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={forgotPasswordEmail}
                      onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Button
                      onClick={handleForgotPassword}
                      disabled={!forgotPasswordEmail || isLoading || loading}
                      className="w-full"
                    >
                      {isLoading || loading ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : null}
                      Enviar Instruções
                    </Button>

                    <Button
                      variant="ghost"
                      onClick={() => setShowForgotPasswordForm(false)}
                      className="w-full"
                    >
                      Voltar ao Login
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key={mode}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Social Login */}
                  {showSocialLogin && (
                    <div className="space-y-3">
                      <SocialLoginButton
                        provider="google"
                        onClick={() => handleSocialLogin("google")}
                        disabled={isLoading || loading}
                      />

                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <Separator className="w-full" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-background px-2 text-muted-foreground">
                            ou
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Login Form */}
                  {mode === "login" && (
                    <form
                      onSubmit={loginForm.handleSubmit(handleLoginSubmit)}
                      className="space-y-4"
                    >
                      <div className="space-y-2">
                        <Label htmlFor="login-email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="login-email"
                            type="email"
                            placeholder="seu@email.com"
                            className="pl-10"
                            {...loginForm.register("email")}
                          />
                        </div>
                        {loginForm.formState.errors.email && (
                          <p className="text-sm text-destructive">
                            {loginForm.formState.errors.email.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="login-password">Senha</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="login-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Digite sua senha"
                            className="pl-10 pr-10"
                            {...loginForm.register("password")}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        {loginForm.formState.errors.password && (
                          <p className="text-sm text-destructive">
                            {loginForm.formState.errors.password.message}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        {showRememberMe && (
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="remember-me"
                              {...loginForm.register("rememberMe")}
                            />
                            <Label htmlFor="remember-me" className="text-sm">
                              Lembrar de mim
                            </Label>
                          </div>
                        )}

                        {showForgotPassword && (
                          <Button
                            type="button"
                            variant="link"
                            className="px-0 text-sm"
                            onClick={() => setShowForgotPasswordForm(true)}
                          >
                            Esqueceu a senha?
                          </Button>
                        )}
                      </div>

                      <Button
                        type="submit"
                        className="w-full"
                        disabled={isLoading || loading}
                      >
                        {isLoading || loading ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <ArrowRight className="w-4 h-4 mr-2" />
                        )}
                        Entrar
                      </Button>
                    </form>
                  )}

                  {/* Register Form */}
                  {mode === "register" && (
                    <form
                      onSubmit={registerForm.handleSubmit(handleRegisterSubmit)}
                      className="space-y-4"
                    >
                      <div className="space-y-2">
                        <Label htmlFor="register-name">Nome Completo</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="register-name"
                            type="text"
                            placeholder="Seu nome completo"
                            className="pl-10"
                            {...registerForm.register("fullName")}
                          />
                        </div>
                        {registerForm.formState.errors.fullName && (
                          <p className="text-sm text-destructive">
                            {registerForm.formState.errors.fullName.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="register-email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="register-email"
                            type="email"
                            placeholder="seu@email.com"
                            className="pl-10"
                            {...registerForm.register("email")}
                          />
                        </div>
                        {registerForm.formState.errors.email && (
                          <p className="text-sm text-destructive">
                            {registerForm.formState.errors.email.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="register-password">Senha</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="register-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Crie uma senha forte"
                            className="pl-10 pr-10"
                            {...registerForm.register("password")}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        {registerForm.formState.errors.password && (
                          <p className="text-sm text-destructive">
                            {registerForm.formState.errors.password.message}
                          </p>
                        )}

                        <PasswordStrengthIndicator
                          password={registerForm.watch("password") || ""}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="register-confirm-password">
                          Confirmar Senha
                        </Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="register-confirm-password"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirme sua senha"
                            className="pl-10 pr-10"
                            {...registerForm.register("confirmPassword")}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        {registerForm.formState.errors.confirmPassword && (
                          <p className="text-sm text-destructive">
                            {
                              registerForm.formState.errors.confirmPassword
                                .message
                            }
                          </p>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="accept-terms"
                          {...registerForm.register("acceptTerms")}
                        />
                        <Label
                          htmlFor="accept-terms"
                          className="text-sm leading-none"
                        >
                          Eu aceito os{" "}
                          <Button
                            type="button"
                            variant="link"
                            className="p-0 h-auto text-sm underline"
                          >
                            termos de uso
                          </Button>{" "}
                          e{" "}
                          <Button
                            type="button"
                            variant="link"
                            className="p-0 h-auto text-sm underline"
                          >
                            política de privacidade
                          </Button>
                        </Label>
                      </div>
                      {registerForm.formState.errors.acceptTerms && (
                        <p className="text-sm text-destructive">
                          {registerForm.formState.errors.acceptTerms.message}
                        </p>
                      )}

                      <Button
                        type="submit"
                        className="w-full"
                        disabled={isLoading || loading}
                      >
                        {isLoading || loading ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <CheckCircle className="w-4 h-4 mr-2" />
                        )}
                        Criar Conta
                      </Button>
                    </form>
                  )}

                  {/* Mode Switch */}
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      {mode === "login"
                        ? "Não tem uma conta?"
                        : "Já tem uma conta?"}{" "}
                      <Button
                        type="button"
                        variant="link"
                        className="p-0 h-auto font-medium"
                        onClick={() =>
                          handleModeChange(
                            mode === "login" ? "register" : "login"
                          )
                        }
                      >
                        {mode === "login" ? "Criar conta" : "Entrar"}
                      </Button>
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthPage;
