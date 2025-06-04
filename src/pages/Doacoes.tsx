import React, { useState, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  MapPin,
  Heart,
  Shirt,
  UtensilsCrossed,
  Copy,
  Check,
  Search,
  Filter,
  Target,
  Users,
  TrendingUp,
  Gift,
  Phone,
  MessageCircle,
  Shield,
  Clock,
  Star,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDonations } from "@/hooks/useDonations";
import PixQRCode from "@/components/PixQRCode";

const Doacoes = () => {
  const { toast } = useToast();
  const {
    campaigns,
    donations,
    donationPlaces,
    loading,
    error,
    createPixDonation,
    getDonationStats,
  } = useDonations();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [selectedCampaign, setSelectedCampaign] = useState<string>("");
  const [donationForm, setDonationForm] = useState({
    amount: "",
    message: "",
    donorName: "",
    donorEmail: "",
    isAnonymous: false,
  });
  const [donationStats, setDonationStats] = useState<any>(null);
  const [copiedPix, setCopiedPix] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [currentPixData, setCurrentPixData] = useState<any>(null);
  const [processingDonation, setProcessingDonation] = useState(false);

  const pixKey = "pix@alertacomunitario.com.br";

  // Carregar estatísticas
  useEffect(() => {
    const loadStats = async () => {
      try {
        const stats = await getDonationStats();
        setDonationStats(stats);
      } catch (error) {
        console.error("Erro ao carregar estatísticas:", error);
      }
    };

    loadStats();
  }, [campaigns]);

  const filteredPlaces = donationPlaces.filter((place) => {
    const matchesSearch =
      place.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      place.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterType === "all" || place.types.includes(filterType);
    return matchesSearch && matchesFilter;
  });

  const copyPixKey = () => {
    navigator.clipboard.writeText(pixKey);
    setCopiedPix(true);
    toast({
      title: "Chave PIX copiada!",
      description: "A chave PIX foi copiada para a área de transferência.",
    });
    setTimeout(() => setCopiedPix(false), 2000);
  };

  const handlePixDonation = async () => {
    if (!donationForm.amount || parseFloat(donationForm.amount) <= 0) {
      toast({
        title: "Valor inválido",
        description: "Por favor, insira um valor válido para doação.",
        variant: "destructive",
      });
      return;
    }

    if (
      !donationForm.isAnonymous &&
      (!donationForm.donorName || !donationForm.donorEmail)
    ) {
      toast({
        title: "Dados incompletos",
        description:
          "Por favor, preencha seu nome e email ou marque como doação anônima.",
        variant: "destructive",
      });
      return;
    }

    setProcessingDonation(true);

    try {
      const result = await createPixDonation(
        parseFloat(donationForm.amount),
        selectedCampaign || undefined,
        donationForm.message || undefined,
        donationForm.isAnonymous ? undefined : donationForm.donorName,
        donationForm.isAnonymous ? undefined : donationForm.donorEmail,
        donationForm.isAnonymous
      );

      setCurrentPixData({
        amount: donationForm.amount,
        pixCode: result.pixCode,
        transactionId: result.transactionId,
      });

      setShowQRCode(true);

      toast({
        title: "QR Code PIX gerado!",
        description: `QR Code criado para doação de R$ ${donationForm.amount}`,
      });

      // Simular confirmação após 3 segundos
      setTimeout(() => {
        toast({
          title: "Doação confirmada! 🎉",
          description: "Sua doação foi processada com sucesso. Obrigado!",
        });

        // Limpar formulário
        setDonationForm({
          amount: "",
          message: "",
          donorName: "",
          donorEmail: "",
          isAnonymous: false,
        });
        setSelectedCampaign("");
      }, 3000);
    } catch (error) {
      console.error("Erro ao processar doação:", error);
      toast({
        title: "Erro na doação",
        description: "Não foi possível processar sua doação. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setProcessingDonation(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "alta":
        return "bg-red-100 text-red-800 border-red-200";
      case "media":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-green-100 text-green-800 border-green-200";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "roupas":
        return <Shirt className="w-4 h-4" />;
      case "alimentos":
        return <UtensilsCrossed className="w-4 h-4" />;
      default:
        return <Heart className="w-4 h-4" />;
    }
  };

  const getCampaignTypeColor = (type: string) => {
    switch (type) {
      case "emergency":
        return "bg-red-100 text-red-800";
      case "prevention":
        return "bg-blue-100 text-blue-800";
      case "reconstruction":
        return "bg-green-100 text-green-800";
      case "supplies":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getCampaignTypeLabel = (type: string) => {
    switch (type) {
      case "emergency":
        return "Emergência";
      case "prevention":
        return "Prevenção";
      case "reconstruction":
        return "Reconstrução";
      case "supplies":
        return "Suprimentos";
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
            <p className="text-gray-600">Carregando doações...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Heart className="w-12 h-12 text-red-500 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">
              Doações Solidárias
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Ajude comunidades em situação de vulnerabilidade através de doações
            de roupas, alimentos ou contribuições financeiras via PIX.
          </p>
        </div>

        {/* Estatísticas */}
        {donationStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">
                    R${" "}
                    {donationStats.totalDonated.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                  <p className="text-sm text-gray-600">Total Arrecadado</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">
                    {donationStats.totalDonors}
                  </p>
                  <p className="text-sm text-gray-600">Doadores</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Target className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">
                    {donationStats.activeCampaigns}
                  </p>
                  <p className="text-sm text-gray-600">Campanhas Ativas</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Gift className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">
                    {donationStats.progressPercentage.toFixed(1)}%
                  </p>
                  <p className="text-sm text-gray-600">Meta Atingida</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Campanhas Ativas */}
        {campaigns.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Campanhas Urgentes
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {campaigns.slice(0, 3).map((campaign) => (
                <Card key={campaign.id} className="overflow-hidden">
                  {campaign.image_url && (
                    <img
                      src={campaign.image_url}
                      alt={campaign.title}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <Badge
                        className={getCampaignTypeColor(campaign.campaign_type)}
                      >
                        {getCampaignTypeLabel(campaign.campaign_type)}
                      </Badge>
                      {campaign.end_date && (
                        <span className="text-sm text-gray-500">
                          <Clock className="w-4 h-4 inline mr-1" />
                          {new Date(campaign.end_date).toLocaleDateString(
                            "pt-BR"
                          )}
                        </span>
                      )}
                    </div>
                    <CardTitle className="text-lg">{campaign.title}</CardTitle>
                    {campaign.description && (
                      <CardDescription>{campaign.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    {campaign.goal_amount && (
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">Progresso</span>
                          <span className="text-sm text-gray-600">
                            R$ {campaign.current_amount.toLocaleString("pt-BR")}{" "}
                            / R$ {campaign.goal_amount.toLocaleString("pt-BR")}
                          </span>
                        </div>
                        <Progress
                          value={
                            (campaign.current_amount / campaign.goal_amount) *
                            100
                          }
                          className="h-2"
                        />
                      </div>
                    )}
                    <Button
                      className="w-full"
                      onClick={() => setSelectedCampaign(campaign.id)}
                      variant={
                        selectedCampaign === campaign.id ? "default" : "outline"
                      }
                    >
                      {selectedCampaign === campaign.id ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Selecionada
                        </>
                      ) : (
                        <>
                          <Heart className="w-4 h-4 mr-2" />
                          Selecionar Campanha
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* PIX Donation Section */}
        <Card className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center text-blue-800">
              <Heart className="w-6 h-6 mr-2" />
              Doação via PIX
            </CardTitle>
            <CardDescription>
              Contribua financeiramente para ajudar comunidades afetadas por
              emergências
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Campanha selecionada */}
            {selectedCampaign && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-800 mb-2">
                  <Target className="w-4 h-4 inline mr-1" />
                  Campanha Selecionada
                </h4>
                <p className="text-sm text-green-700">
                  {campaigns.find((c) => c.id === selectedCampaign)?.title}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCampaign("")}
                  className="text-green-700 hover:text-green-900 p-0 h-auto mt-2"
                >
                  Remover seleção
                </Button>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              {/* Coluna 1: Dados da doação */}
              <div className="space-y-4">
                <div>
                  <Label
                    htmlFor="pix-amount"
                    className="text-sm font-medium text-gray-700"
                  >
                    Valor da doação (R$) *
                  </Label>
                  <Input
                    id="pix-amount"
                    type="number"
                    placeholder="0,00"
                    value={donationForm.amount}
                    onChange={(e) =>
                      setDonationForm((prev) => ({
                        ...prev,
                        amount: e.target.value,
                      }))
                    }
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label
                    htmlFor="donation-message"
                    className="text-sm font-medium text-gray-700"
                  >
                    Mensagem (opcional)
                  </Label>
                  <Textarea
                    id="donation-message"
                    placeholder="Deixe uma mensagem de apoio..."
                    value={donationForm.message}
                    onChange={(e) =>
                      setDonationForm((prev) => ({
                        ...prev,
                        message: e.target.value,
                      }))
                    }
                    className="mt-1"
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="anonymous"
                    checked={donationForm.isAnonymous}
                    onCheckedChange={(checked) =>
                      setDonationForm((prev) => ({
                        ...prev,
                        isAnonymous: checked as boolean,
                      }))
                    }
                  />
                  <Label htmlFor="anonymous" className="text-sm">
                    Doação anônima
                  </Label>
                </div>
              </div>

              {/* Coluna 2: Dados do doador */}
              <div className="space-y-4">
                {!donationForm.isAnonymous && (
                  <>
                    <div>
                      <Label
                        htmlFor="donor-name"
                        className="text-sm font-medium text-gray-700"
                      >
                        Seu nome *
                      </Label>
                      <Input
                        id="donor-name"
                        placeholder="Nome completo"
                        value={donationForm.donorName}
                        onChange={(e) =>
                          setDonationForm((prev) => ({
                            ...prev,
                            donorName: e.target.value,
                          }))
                        }
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label
                        htmlFor="donor-email"
                        className="text-sm font-medium text-gray-700"
                      >
                        Seu email *
                      </Label>
                      <Input
                        id="donor-email"
                        type="email"
                        placeholder="email@exemplo.com"
                        value={donationForm.donorEmail}
                        onChange={(e) =>
                          setDonationForm((prev) => ({
                            ...prev,
                            donorEmail: e.target.value,
                          }))
                        }
                        className="mt-1"
                      />
                    </div>
                  </>
                )}

                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Chave PIX
                  </Label>
                  <div className="flex mt-1">
                    <Input
                      value={pixKey}
                      readOnly
                      className="flex-1 bg-gray-50"
                    />
                    <Button
                      onClick={copyPixKey}
                      variant="outline"
                      size="sm"
                      className="ml-2"
                    >
                      {copiedPix ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <Button
              onClick={handlePixDonation}
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={processingDonation}
            >
              {processingDonation ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                "Gerar QR Code PIX"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Search and Filter */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Locais para Doação Física
          </h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar por nome ou endereço..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterType === "all" ? "default" : "outline"}
                onClick={() => setFilterType("all")}
                size="sm"
              >
                <Filter className="w-4 h-4 mr-2" />
                Todos
              </Button>
              <Button
                variant={filterType === "roupas" ? "default" : "outline"}
                onClick={() => setFilterType("roupas")}
                size="sm"
              >
                <Shirt className="w-4 h-4 mr-2" />
                Roupas
              </Button>
              <Button
                variant={filterType === "alimentos" ? "default" : "outline"}
                onClick={() => setFilterType("alimentos")}
                size="sm"
              >
                <UtensilsCrossed className="w-4 h-4 mr-2" />
                Alimentos
              </Button>
            </div>
          </div>
        </div>

        {/* Donation Places Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlaces.map((place) => (
            <Card
              key={place.id}
              className="overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="relative">
                <img
                  src={place.image}
                  alt={place.name}
                  className="w-full h-48 object-cover"
                />
                <Badge
                  className={`absolute top-3 right-3 ${getUrgencyColor(
                    place.urgency
                  )}`}
                >
                  {place.urgency === "alta"
                    ? "Urgente"
                    : place.urgency === "media"
                    ? "Moderado"
                    : "Normal"}
                </Badge>
                {place.verified && (
                  <Badge className="absolute top-3 left-3 bg-blue-100 text-blue-800">
                    <Shield className="w-3 h-3 mr-1" />
                    Verificado
                  </Badge>
                )}
              </div>

              <CardHeader>
                <CardTitle className="text-lg">{place.name}</CardTitle>
                <CardDescription className="flex items-center text-sm">
                  <MapPin className="w-4 h-4 mr-1" />
                  {place.address}
                </CardDescription>
              </CardHeader>

              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  {place.description}
                </p>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Aceita doações de:
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      {place.types.map((type) => (
                        <Badge
                          key={type}
                          variant="outline"
                          className="flex items-center gap-1"
                        >
                          {getTypeIcon(type)}
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {place.needs && place.needs.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Necessidades atuais:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {place.needs.slice(0, 3).map((need, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="text-xs"
                          >
                            {need}
                          </Badge>
                        ))}
                        {place.needs.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{place.needs.length - 3} mais
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="text-sm text-gray-600 space-y-1">
                    <p>
                      <strong>Horário:</strong> {place.hours}
                    </p>
                    <p>
                      <strong>Telefone:</strong> {place.phone}
                    </p>
                    {place.contact_person && (
                      <p>
                        <strong>Contato:</strong> {place.contact_person}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button className="flex-1" variant="outline">
                      <Heart className="w-4 h-4 mr-2" />
                      Quero Doar
                    </Button>
                    {place.whatsapp && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </Button>
                    )}
                    <Button size="sm" variant="outline">
                      <Phone className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredPlaces.length === 0 && (
          <div className="text-center py-12">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum local encontrado
            </h3>
            <p className="text-gray-600">
              Tente ajustar os filtros ou termo de busca para encontrar locais
              de doação.
            </p>
          </div>
        )}

        {/* Emergency Contact */}
        <Card className="mt-12 bg-red-50 border-red-200">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              Emergência ou Situação Crítica?
            </CardTitle>
            <CardDescription className="text-red-600">
              Se você conhece alguma comunidade em situação crítica que precisa
              de ajuda urgente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button variant="destructive">
                <AlertCircle className="w-4 h-4 mr-2" />
                Relatar Emergência
              </Button>
              <Button variant="outline" className="border-red-300 text-red-700">
                <MessageCircle className="w-4 h-4 mr-2" />
                WhatsApp: (11) 99999-9999
              </Button>
              <Button variant="outline" className="border-red-300 text-red-700">
                <ExternalLink className="w-4 h-4 mr-2" />
                Central de Doações
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal do QR Code PIX */}
      {showQRCode && currentPixData && (
        <PixQRCode
          amount={currentPixData.amount}
          pixKey={pixKey}
          onClose={() => {
            setShowQRCode(false);
            setCurrentPixData(null);
          }}
        />
      )}
    </div>
  );
};

export default Doacoes;
