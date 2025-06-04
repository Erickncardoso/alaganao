import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Bell,
  Smartphone,
  MessageSquare,
  Mail,
  MapPin,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Settings,
  Navigation,
  Loader2,
  AlertCircle,
  Volume2,
  VolumeX,
  RefreshCw,
  ExternalLink,
  Calendar,
} from "lucide-react";
import Header from "@/components/Header";
import { useAlerts, AlertData } from "@/hooks/useAlerts";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Alertas = () => {
  const { toast } = useToast();
  const {
    alerts,
    userPreferences,
    currentLocation,
    locationAlerts,
    loading,
    error,
    permissionStatus,
    updateUserPreferences,
    getCurrentLocation,
    requestNotificationPermission,
    sendLocalNotification,
    getAlertStats,
    refetch,
  } = useAlerts();

  const [alertStats, setAlertStats] = useState<any>(null);
  const [isUpdatingPrefs, setIsUpdatingPrefs] = useState(false);
  const [radiusValue, setRadiusValue] = useState([5]);
  const [showAllAlerts, setShowAllAlerts] = useState(false);

  // Carregar estatísticas
  useEffect(() => {
    const loadStats = async () => {
      try {
        const stats = await getAlertStats();
        setAlertStats(stats);
      } catch (error) {
        console.error("Erro ao carregar estatísticas:", error);
      }
    };

    loadStats();
  }, [alerts, locationAlerts]);

  // Sincronizar slider com preferências
  useEffect(() => {
    if (userPreferences?.alert_radius_km) {
      setRadiusValue([userPreferences.alert_radius_km]);
    }
  }, [userPreferences]);

  const handleNotificationChange = async (type: string, enabled: boolean) => {
    if (!userPreferences) return;

    setIsUpdatingPrefs(true);
    try {
      await updateUserPreferences({ [type]: enabled });

      toast({
        title: enabled ? "Notificações Ativadas" : "Notificações Desativadas",
        description: `${getNotificationTypeLabel(type)} ${
          enabled ? "ativadas" : "desativadas"
        } com sucesso.`,
      });

      // Se ativando notificações do app, solicitar permissão
      if (
        type === "app_notifications" &&
        enabled &&
        permissionStatus !== "granted"
      ) {
        const granted = await requestNotificationPermission();
        if (!granted) {
          toast({
            title: "Permissão Negada",
            description:
              "Para receber notificações, permita o acesso nas configurações do navegador.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Erro ao atualizar preferências:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar as preferências.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingPrefs(false);
    }
  };

  const handleLocationAlertsChange = async (enabled: boolean) => {
    if (!userPreferences) return;

    setIsUpdatingPrefs(true);
    try {
      if (enabled && !currentLocation) {
        // Solicitar localização primeiro
        try {
          await getCurrentLocation();
        } catch (locationError) {
          toast({
            title: "Localização Necessária",
            description:
              "Para ativar alertas por localização, permita o acesso à sua localização.",
            variant: "destructive",
          });
          setIsUpdatingPrefs(false);
          return;
        }
      }

      await updateUserPreferences({ location_alerts_enabled: enabled });

      toast({
        title: enabled
          ? "Alertas de Localização Ativados"
          : "Alertas de Localização Desativados",
        description: enabled
          ? "Você receberá alertas para sua região."
          : "Alertas por localização foram desativados.",
      });
    } catch (error) {
      console.error("Erro ao atualizar alertas de localização:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar as configurações.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingPrefs(false);
    }
  };

  const handleRadiusChange = async (newRadius: number[]) => {
    if (!userPreferences) return;

    try {
      await updateUserPreferences({ alert_radius_km: newRadius[0] });
      setRadiusValue(newRadius);
    } catch (error) {
      console.error("Erro ao atualizar raio:", error);
    }
  };

  const testNotification = () => {
    if (permissionStatus === "granted") {
      sendLocalNotification(
        "Teste de Notificação",
        "Suas notificações estão funcionando corretamente! 🌊",
        { icon: "/favicon.ico" }
      );

      toast({
        title: "Notificação Enviada",
        description: "Verifique se recebeu a notificação de teste.",
      });
    } else {
      toast({
        title: "Permissão Necessária",
        description: "Ative as notificações primeiro para testar.",
        variant: "destructive",
      });
    }
  };

  const getNotificationTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      app_notifications: "Notificações do App",
      email_notifications: "Notificações por Email",
      sms_notifications: "Notificações por SMS",
      whatsapp_notifications: "Notificações por WhatsApp",
    };
    return labels[type] || type;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "low":
        return "bg-yellow-500";
      case "moderate":
        return "bg-orange-500";
      case "high":
        return "bg-red-500";
      case "critical":
        return "bg-red-800";
      default:
        return "bg-gray-500";
    }
  };

  const getSeverityText = (severity: string) => {
    switch (severity) {
      case "low":
        return "Baixo";
      case "moderate":
        return "Moderado";
      case "high":
        return "Alto";
      case "critical":
        return "Crítico";
      default:
        return "Desconhecido";
    }
  };

  const getLocationRiskStatus = () => {
    if (!alertStats) return null;

    const risk = alertStats.user_location_risk;

    switch (risk) {
      case "none":
        return {
          color: "border-green-200 bg-green-50",
          icon: <Shield className="w-8 h-8 text-green-600" />,
          title: "Sua região está segura",
          description: "Nenhum alerta ativo para sua localização atual",
        };
      case "low":
        return {
          color: "border-yellow-200 bg-yellow-50",
          icon: <AlertTriangle className="w-8 h-8 text-yellow-600" />,
          title: "Alerta de baixo risco",
          description: "Possibilidade de alagamentos pontuais na sua região",
        };
      case "moderate":
        return {
          color: "border-orange-200 bg-orange-50",
          icon: <AlertTriangle className="w-8 h-8 text-orange-600" />,
          title: "Alerta moderado",
          description: "Risco de alagamentos significativos na sua região",
        };
      case "high":
        return {
          color: "border-red-200 bg-red-50",
          icon: <AlertCircle className="w-8 h-8 text-red-600" />,
          title: "Alerta de alto risco",
          description: "Risco elevado de enchentes - mantenha-se atento",
        };
      case "critical":
        return {
          color: "border-red-300 bg-red-100",
          icon: <AlertCircle className="w-8 h-8 text-red-800" />,
          title: "Alerta crítico",
          description: "Risco extremo - evacuação pode ser necessária",
        };
      default:
        return {
          color: "border-gray-200 bg-gray-50",
          icon: <Shield className="w-8 h-8 text-gray-600" />,
          title: "Status desconhecido",
          description: "Não foi possível avaliar o risco da sua região",
        };
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "Agora";
    if (diffInMinutes < 60) return `${diffInMinutes}min atrás`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h atrás`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d atrás`;

    return date.toLocaleDateString("pt-BR");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
            <p className="text-gray-600">
              Carregando configurações de alertas...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-red-800 mb-2">
                  Erro ao Carregar Alertas
                </h3>
                <p className="text-red-600 mb-4">{error}</p>
                <Button onClick={refetch} variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Tentar Novamente
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const locationRisk = getLocationRiskStatus();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Sistema de Alertas
          </h1>
          <p className="text-lg text-gray-600">
            Configure como e quando você quer receber alertas sobre enchentes na
            sua região.
          </p>
        </div>

        {/* Status atual da região */}
        {locationRisk && (
          <Card className={`mb-6 ${locationRisk.color}`}>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                {locationRisk.icon}
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">{locationRisk.title}</h3>
                  <p className="text-sm">{locationRisk.description}</p>
                  {currentLocation && (
                    <p className="text-xs mt-1 opacity-75">
                      📍 {currentLocation.address}
                    </p>
                  )}
                </div>
                {alertStats && alertStats.user_location_risk !== "none" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAllAlerts(!showAllAlerts)}
                  >
                    {showAllAlerts ? "Ocultar" : "Ver"} Alertas
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Alertas da região */}
        {showAllAlerts && locationAlerts.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Alertas na Sua Região
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {locationAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="border rounded-lg p-4 bg-white"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge
                          className={`${getSeverityColor(
                            alert.severity
                          )} text-white`}
                        >
                          {getSeverityText(alert.severity)}
                        </Badge>
                        <Badge variant="outline">{alert.alert_type}</Badge>
                      </div>
                      <span className="text-sm text-gray-500">
                        {formatTimeAgo(alert.issued_at)}
                      </span>
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">
                      {alert.title}
                    </h4>
                    <p className="text-gray-700 text-sm mb-2">
                      {alert.message}
                    </p>
                    <div className="flex items-center text-sm text-gray-500">
                      <MapPin className="w-4 h-4 mr-1" />
                      {alert.area_affected}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Configurações de Localização */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MapPin className="w-5 h-5" />
                <span>Alertas por Localização</span>
              </div>
              {currentLocation && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={getCurrentLocation}
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  Atualizar Localização
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">
                    Ativar alertas de localização
                  </h4>
                  <p className="text-sm text-gray-600">
                    Receba alertas quando houver riscos de enchente na sua
                    região
                  </p>
                  {currentLocation && (
                    <p className="text-sm text-blue-600 mt-1">
                      📍 {currentLocation.address}
                    </p>
                  )}
                </div>
                <Switch
                  checked={userPreferences?.location_alerts_enabled || false}
                  onCheckedChange={handleLocationAlertsChange}
                  disabled={isUpdatingPrefs}
                />
              </div>

              {userPreferences?.location_alerts_enabled && (
                <div className="bg-blue-50 p-4 rounded-lg space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-blue-900 mb-3 block">
                      Raio de Alerta: {radiusValue[0]}km
                    </Label>
                    <Slider
                      value={radiusValue}
                      onValueChange={setRadiusValue}
                      onValueCommit={handleRadiusChange}
                      max={50}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-blue-600 mt-1">
                      <span>1km</span>
                      <span>25km</span>
                      <span>50km</span>
                    </div>
                  </div>

                  <p className="text-sm text-blue-700">
                    Você será notificado sobre alertas em um raio de{" "}
                    <strong>{radiusValue[0]}km</strong> da sua localização.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Métodos de Notificação */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bell className="w-5 h-5" />
                <span>Como você quer ser notificado</span>
              </div>
              {userPreferences?.app_notifications &&
                permissionStatus === "granted" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={testNotification}
                  >
                    <Volume2 className="w-4 h-4 mr-2" />
                    Testar Notificação
                  </Button>
                )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* App Notifications */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Smartphone className="w-5 h-5 text-blue-500" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">
                      Notificações do App
                    </h4>
                    <p className="text-sm text-gray-600">
                      Receba alertas diretamente no aplicativo
                    </p>
                    {permissionStatus === "denied" && (
                      <p className="text-xs text-red-600 mt-1">
                        Permissão negada - configure nas configurações do
                        navegador
                      </p>
                    )}
                    {permissionStatus === "granted" &&
                      userPreferences?.app_notifications && (
                        <p className="text-xs text-green-600 mt-1">
                          ✓ Permissão concedida
                        </p>
                      )}
                  </div>
                </div>
                <Switch
                  checked={userPreferences?.app_notifications || false}
                  onCheckedChange={(checked) =>
                    handleNotificationChange("app_notifications", checked)
                  }
                  disabled={isUpdatingPrefs}
                />
              </div>

              {/* Email */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-gray-500" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Email</h4>
                    <p className="text-sm text-gray-600">
                      Receba resumos e alertas importantes por email
                    </p>
                  </div>
                </div>
                <Switch
                  checked={userPreferences?.email_notifications || false}
                  onCheckedChange={(checked) =>
                    handleNotificationChange("email_notifications", checked)
                  }
                  disabled={isUpdatingPrefs}
                />
              </div>

              {/* WhatsApp */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <MessageSquare className="w-5 h-5 text-green-500" />
                  <div>
                    <h4 className="font-semibold text-gray-900">WhatsApp</h4>
                    <p className="text-sm text-gray-600">
                      Integração futura com bot do WhatsApp
                    </p>
                    <span className="text-xs text-orange-600 font-medium">
                      Em breve
                    </span>
                  </div>
                </div>
                <Switch checked={false} disabled />
              </div>

              {/* SMS */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Smartphone className="w-5 h-5 text-purple-500" />
                  <div>
                    <h4 className="font-semibold text-gray-900">SMS</h4>
                    <p className="text-sm text-gray-600">
                      Alertas via mensagem de texto
                    </p>
                    <span className="text-xs text-orange-600 font-medium">
                      Em breve
                    </span>
                  </div>
                </div>
                <Switch checked={false} disabled />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tipos de Alerta */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Tipos de Alerta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="p-4 border rounded-lg text-center">
                <div className="w-4 h-4 bg-yellow-500 rounded-full mx-auto mb-2"></div>
                <span className="font-medium block mb-1">Baixo</span>
                <p className="text-xs text-gray-600">Alagamentos pontuais</p>
                {alertStats && (
                  <p className="text-sm font-semibold text-yellow-600 mt-2">
                    {alertStats.by_severity.low}
                  </p>
                )}
              </div>

              <div className="p-4 border rounded-lg text-center">
                <div className="w-4 h-4 bg-orange-500 rounded-full mx-auto mb-2"></div>
                <span className="font-medium block mb-1">Moderado</span>
                <p className="text-xs text-gray-600">
                  Alagamentos significativos
                </p>
                {alertStats && (
                  <p className="text-sm font-semibold text-orange-600 mt-2">
                    {alertStats.by_severity.moderate}
                  </p>
                )}
              </div>

              <div className="p-4 border rounded-lg text-center">
                <div className="w-4 h-4 bg-red-500 rounded-full mx-auto mb-2"></div>
                <span className="font-medium block mb-1">Alto</span>
                <p className="text-xs text-gray-600">Risco elevado</p>
                {alertStats && (
                  <p className="text-sm font-semibold text-red-600 mt-2">
                    {alertStats.by_severity.high}
                  </p>
                )}
              </div>

              <div className="p-4 border rounded-lg text-center">
                <div className="w-4 h-4 bg-red-800 rounded-full mx-auto mb-2"></div>
                <span className="font-medium block mb-1">Crítico</span>
                <p className="text-xs text-gray-600">Evacuação recomendada</p>
                {alertStats && (
                  <p className="text-sm font-semibold text-red-800 mt-2">
                    {alertStats.by_severity.critical}
                  </p>
                )}
              </div>
            </div>

            {alertStats && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">
                  Estatísticas dos Alertas
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Total Ativo:</span>
                    <p className="font-semibold">{alertStats.total_active}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Nas últimas 24h:</span>
                    <p className="font-semibold">{alertStats.recent_count}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Enchentes:</span>
                    <p className="font-semibold">{alertStats.by_type.flood}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Emergências:</span>
                    <p className="font-semibold">
                      {alertStats.by_type.emergency}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instruções */}
        <Card>
          <CardHeader>
            <CardTitle>Como funciona</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                  <span className="text-xs font-semibold text-blue-600">1</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">
                    Monitoramento Contínuo
                  </h4>
                  <p className="text-sm text-gray-600">
                    Nosso sistema monitora relatos da comunidade e dados
                    meteorológicos 24/7
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                  <span className="text-xs font-semibold text-blue-600">2</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">
                    Análise Inteligente
                  </h4>
                  <p className="text-sm text-gray-600">
                    Cruzamos informações de múltiplas fontes para validar
                    alertas
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                  <span className="text-xs font-semibold text-blue-600">3</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">
                    Notificação Rápida
                  </h4>
                  <p className="text-sm text-gray-600">
                    Você recebe alertas instantâneos pelos canais que escolheu
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Alertas;
