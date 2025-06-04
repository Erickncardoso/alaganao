import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  MapPin,
  Camera,
  AlertTriangle,
  CheckCircle,
  Upload,
  X,
  Loader2,
  Eye,
  Navigation,
  Clock,
  Users,
  Ruler,
  FileImage,
  Shield,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { useFloodReports } from "@/hooks/useFloodReports";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import LocationSearchBar from "@/components/LocationSearchBar";
import { imageUploadService, formatFileSize } from "@/lib/storage";

interface ReportData {
  title: string;
  location: string;
  coordinates: [number, number] | null;
  neighborhood: string;
  severity: string;
  waterLevel: string;
  affectedPeople: string;
  description: string;
  images: File[];
  rescueNeeded: boolean;
  peopleTrapped: string;
  accessBlocked: boolean;
}

const Relatar = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { createReport } = useFloodReports();

  const [formData, setFormData] = useState<ReportData>({
    title: "",
    location: "",
    coordinates: null,
    neighborhood: "",
    severity: "",
    waterLevel: "",
    affectedPeople: "",
    description: "",
    images: [],
    rescueNeeded: false,
    peopleTrapped: "",
    accessBlocked: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentLocation, setCurrentLocation] = useState<
    [number, number] | null
  >(null);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  // Mapbox token
  const mapboxToken =
    "pk.eyJ1IjoiZXJpY2tjYXJkb3NvIiwiYSI6ImNtYmE1dGkyNTA3am4ybG9sMDQxZ2ptYmgifQ.MQMRf8oeujyQ6G-Y6hMW-A";

  // Obtém localização atual ao carregar a página
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: [number, number] = [
            position.coords.longitude,
            position.coords.latitude,
          ];
          setCurrentLocation(coords);
        },
        (error) => {
          console.log("Localização não disponível:", error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        }
      );
    }
  }, []);

  const handleInputChange = (
    field: keyof ReportData,
    value: string | boolean | File[]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Remove erro de validação ao corrigir campo
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleLocationSelect = (
    coordinates: [number, number],
    address: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      location: address,
      coordinates: coordinates,
    }));

    // Tenta extrair o bairro do endereço se não foi preenchido
    if (!formData.neighborhood && address.includes(",")) {
      const parts = address.split(",");
      if (parts.length >= 2) {
        const possibleNeighborhood = parts[0].trim();
        setFormData((prev) => ({
          ...prev,
          neighborhood: possibleNeighborhood,
        }));
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validImages = files.filter((file) => {
      const isValid =
        file.type.startsWith("image/") && file.size <= 5 * 1024 * 1024; // 5MB
      if (!isValid && file.size > 5 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: `${file.name} é maior que 5MB`,
          variant: "destructive",
        });
      }
      return isValid;
    });

    if (formData.images.length + validImages.length > 5) {
      toast({
        title: "Limite de imagens",
        description: "Máximo de 5 imagens por relato",
        variant: "destructive",
      });
      return;
    }

    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, ...validImages],
    }));
  };

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.title.trim()) {
      errors.title = "Título é obrigatório";
    }

    if (!formData.location.trim()) {
      errors.location = "Localização é obrigatória";
    }

    if (!formData.neighborhood.trim()) {
      errors.neighborhood = "Bairro é obrigatório";
    }

    if (!formData.severity) {
      errors.severity = "Grau de alagamento é obrigatório";
    }

    if (
      !formData.description.trim() ||
      formData.description.trim().length < 10
    ) {
      errors.description = "Descrição deve ter pelo menos 10 caracteres";
    }

    if (
      formData.waterLevel &&
      (isNaN(Number(formData.waterLevel)) || Number(formData.waterLevel) < 0)
    ) {
      errors.waterLevel = "Nível da água deve ser um número válido";
    }

    if (
      formData.affectedPeople &&
      (isNaN(Number(formData.affectedPeople)) ||
        Number(formData.affectedPeople) < 0)
    ) {
      errors.affectedPeople = "Número de pessoas deve ser válido";
    }

    if (
      formData.rescueNeeded &&
      (!formData.peopleTrapped || isNaN(Number(formData.peopleTrapped)))
    ) {
      errors.peopleTrapped = "Informe quantas pessoas precisam de resgate";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const uploadImages = async (): Promise<string[]> => {
    if (formData.images.length === 0) return [];

    try {
      const uploadedUrls = await imageUploadService.uploadMultipleImages(
        formData.images,
        (progress) => {
          setUploadProgress(10 + progress * 0.6); // 10-70% do progresso total
        }
      );

      return uploadedUrls;
    } catch (error) {
      console.error("Erro no upload:", error);
      throw new Error(
        error instanceof Error
          ? error.message
          : "Erro ao fazer upload das imagens"
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: "Erro de Validação",
        description: "Por favor, corrija os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      // Upload das imagens primeiro
      setUploadProgress(10);
      const imageUrls = await uploadImages();

      // Preparar coordenadas
      let lat = 0,
        lng = 0;

      if (formData.coordinates) {
        [lng, lat] = formData.coordinates;
      } else if (formData.location.includes(",")) {
        // Tentar extrair das coordenadas inseridas manualmente
        const coords = formData.location
          .split(",")
          .map((c) => parseFloat(c.trim()));
        if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
          [lat, lng] = coords;
        }
      }

      setUploadProgress(70);

      // Criar relatório
      await createReport({
        title: formData.title,
        message: formData.description,
        severity: formData.severity as "low" | "moderate" | "high" | "critical",
        latitude: lat,
        longitude: lng,
        neighborhood: formData.neighborhood,
        water_level: formData.waterLevel
          ? parseFloat(formData.waterLevel)
          : undefined,
        affected_people: formData.affectedPeople
          ? parseInt(formData.affectedPeople)
          : 0,
        images: imageUrls,
        rescue_needed: formData.rescueNeeded,
        people_trapped: formData.rescueNeeded
          ? parseInt(formData.peopleTrapped)
          : 0,
        access_blocked: formData.accessBlocked,
      });

      setUploadProgress(100);
      setIsSuccess(true);

      toast({
        title: "Relato Enviado!",
        description:
          "Seu relato foi registrado com sucesso e está aguardando aprovação.",
      });

      // Reset after showing success
      setTimeout(() => {
        navigate("/");
      }, 3000);
    } catch (error) {
      console.error("Erro ao enviar relato:", error);
      toast({
        title: "Erro ao Enviar",
        description:
          error instanceof Error
            ? error.message
            : "Ocorreu um erro ao enviar seu relato. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
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

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "low":
        return "💧";
      case "moderate":
        return "🌊";
      case "high":
        return "🚨";
      case "critical":
        return "🆘";
      default:
        return "⚠️";
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <Card className="w-full max-w-lg">
            <CardContent className="pt-6 text-center">
              <div className="animate-bounce mb-4">
                <CheckCircle className="w-20 h-20 text-green-500 mx-auto" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Relato Enviado!
              </h2>
              <p className="text-gray-600 mb-6">
                Obrigado por contribuir com a comunidade. Seu relato foi
                registrado com sucesso e será analisado por nossa equipe de
                moderação.
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-center gap-2 text-green-700">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    Aguardando aprovação
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-500">
                Redirecionando em alguns segundos...
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Relatar Enchente
          </h1>
          <p className="text-lg text-gray-600">
            Ajude sua comunidade relatando situações de alagamento em sua
            região.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulário Principal */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="w-6 h-6 text-orange-500" />
                  <span>Informações do Relato</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Título */}
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-base font-medium">
                      Título do Relato *
                    </Label>
                    <Input
                      id="title"
                      placeholder="Ex: Alagamento na Rua Principal"
                      value={formData.title}
                      onChange={(e) =>
                        handleInputChange("title", e.target.value)
                      }
                      className={validationErrors.title ? "border-red-500" : ""}
                    />
                    {validationErrors.title && (
                      <p className="text-sm text-red-600">
                        {validationErrors.title}
                      </p>
                    )}
                  </div>

                  {/* Localização com LocationSearchBar */}
                  <div className="space-y-2">
                    <Label className="text-base font-medium">
                      Localização *
                    </Label>
                    <LocationSearchBar
                      onLocationSelect={handleLocationSelect}
                      onLocationClear={() => handleInputChange("location", "")}
                      mapboxToken={mapboxToken}
                      currentLocation={currentLocation}
                      placeholder="Busque por endereço, bairro ou ponto de referência"
                    />
                    {formData.coordinates && (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <Navigation className="w-4 h-4" />
                        <span>
                          Coordenadas: {formData.coordinates[1].toFixed(6)},{" "}
                          {formData.coordinates[0].toFixed(6)}
                        </span>
                      </div>
                    )}
                    {validationErrors.location && (
                      <p className="text-sm text-red-600">
                        {validationErrors.location}
                      </p>
                    )}
                  </div>

                  {/* Bairro */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="neighborhood"
                      className="text-base font-medium"
                    >
                      Bairro *
                    </Label>
                    <Input
                      id="neighborhood"
                      placeholder="Digite o nome do bairro"
                      value={formData.neighborhood}
                      onChange={(e) =>
                        handleInputChange("neighborhood", e.target.value)
                      }
                      className={
                        validationErrors.neighborhood ? "border-red-500" : ""
                      }
                    />
                    {validationErrors.neighborhood && (
                      <p className="text-sm text-red-600">
                        {validationErrors.neighborhood}
                      </p>
                    )}
                  </div>

                  {/* Grau de Alagamento */}
                  <div className="space-y-2">
                    <Label className="text-base font-medium">
                      Grau de Alagamento *
                    </Label>
                    <Select
                      onValueChange={(value) =>
                        handleInputChange("severity", value)
                      }
                      value={formData.severity}
                    >
                      <SelectTrigger
                        className={
                          validationErrors.severity ? "border-red-500" : ""
                        }
                      >
                        <SelectValue placeholder="Selecione a gravidade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">
                          <div className="flex items-center space-x-3">
                            <div className="w-4 h-4 bg-yellow-500 rounded-full" />
                            <div>
                              <span className="font-medium">💧 Leve</span>
                              <p className="text-xs text-gray-500">
                                Poças d'água, trânsito lento
                              </p>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="moderate">
                          <div className="flex items-center space-x-3">
                            <div className="w-4 h-4 bg-orange-500 rounded-full" />
                            <div>
                              <span className="font-medium">🌊 Moderado</span>
                              <p className="text-xs text-gray-500">
                                Ruas alagadas, carros presos
                              </p>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="high">
                          <div className="flex items-center space-x-3">
                            <div className="w-4 h-4 bg-red-500 rounded-full" />
                            <div>
                              <span className="font-medium">🚨 Alto</span>
                              <p className="text-xs text-gray-500">
                                Enchente, risco às pessoas
                              </p>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="critical">
                          <div className="flex items-center space-x-3">
                            <div className="w-4 h-4 bg-red-800 rounded-full" />
                            <div>
                              <span className="font-medium">🆘 Crítico</span>
                              <p className="text-xs text-gray-500">
                                Situação de emergência
                              </p>
                            </div>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {validationErrors.severity && (
                      <p className="text-sm text-red-600">
                        {validationErrors.severity}
                      </p>
                    )}
                  </div>

                  {/* Informações Adicionais */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="waterLevel"
                        className="text-base font-medium flex items-center gap-2"
                      >
                        <Ruler className="w-4 h-4" />
                        Nível da Água (cm)
                      </Label>
                      <Input
                        id="waterLevel"
                        type="number"
                        min="0"
                        placeholder="Ex: 30"
                        value={formData.waterLevel}
                        onChange={(e) =>
                          handleInputChange("waterLevel", e.target.value)
                        }
                        className={
                          validationErrors.waterLevel ? "border-red-500" : ""
                        }
                      />
                      {validationErrors.waterLevel && (
                        <p className="text-sm text-red-600">
                          {validationErrors.waterLevel}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="affectedPeople"
                        className="text-base font-medium flex items-center gap-2"
                      >
                        <Users className="w-4 h-4" />
                        Pessoas Afetadas
                      </Label>
                      <Input
                        id="affectedPeople"
                        type="number"
                        min="0"
                        placeholder="Ex: 5"
                        value={formData.affectedPeople}
                        onChange={(e) =>
                          handleInputChange("affectedPeople", e.target.value)
                        }
                        className={
                          validationErrors.affectedPeople
                            ? "border-red-500"
                            : ""
                        }
                      />
                      {validationErrors.affectedPeople && (
                        <p className="text-sm text-red-600">
                          {validationErrors.affectedPeople}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Situações de Emergência */}
                  <div className="space-y-4 p-4 border border-orange-200 bg-orange-50 rounded-lg">
                    <h3 className="font-semibold text-orange-800 flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      Situações de Emergência
                    </h3>

                    <div className="space-y-3">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.rescueNeeded}
                          onChange={(e) =>
                            handleInputChange("rescueNeeded", e.target.checked)
                          }
                          className="rounded border-gray-300"
                        />
                        <span>🚑 Pessoas precisam de resgate</span>
                      </label>

                      {formData.rescueNeeded && (
                        <div className="ml-6 space-y-2">
                          <Label htmlFor="peopleTrapped">
                            Quantas pessoas precisam de resgate?
                          </Label>
                          <Input
                            id="peopleTrapped"
                            type="number"
                            min="1"
                            placeholder="Ex: 2"
                            value={formData.peopleTrapped}
                            onChange={(e) =>
                              handleInputChange("peopleTrapped", e.target.value)
                            }
                            className={
                              validationErrors.peopleTrapped
                                ? "border-red-500"
                                : ""
                            }
                          />
                          {validationErrors.peopleTrapped && (
                            <p className="text-sm text-red-600">
                              {validationErrors.peopleTrapped}
                            </p>
                          )}
                        </div>
                      )}

                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.accessBlocked}
                          onChange={(e) =>
                            handleInputChange("accessBlocked", e.target.checked)
                          }
                          className="rounded border-gray-300"
                        />
                        <span>🚧 Acesso bloqueado para veículos</span>
                      </label>
                    </div>
                  </div>

                  {/* Descrição */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="description"
                      className="text-base font-medium"
                    >
                      Descrição *
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="Descreva a situação detalhadamente... (ex: Rua alagada na altura da calçada, trânsito parado, água chegando na metade da roda dos carros)"
                      value={formData.description}
                      onChange={(e) =>
                        handleInputChange("description", e.target.value)
                      }
                      rows={4}
                      className={
                        validationErrors.description ? "border-red-500" : ""
                      }
                    />
                    <div className="flex justify-between items-center">
                      {validationErrors.description && (
                        <p className="text-sm text-red-600">
                          {validationErrors.description}
                        </p>
                      )}
                      <span className="text-sm text-gray-500 ml-auto">
                        {formData.description.length}/500
                      </span>
                    </div>
                  </div>

                  {/* Upload de Imagens */}
                  <div className="space-y-4">
                    <Label className="text-base font-medium flex items-center gap-2">
                      <FileImage className="w-4 h-4" />
                      Fotos da Situação (máx. 5 imagens, 5MB cada)
                    </Label>

                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                        id="image-upload"
                        disabled={formData.images.length >= 5}
                      />
                      <label
                        htmlFor="image-upload"
                        className={`cursor-pointer ${
                          formData.images.length >= 5
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                      >
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 mb-2">
                          {formData.images.length >= 5
                            ? "Limite de 5 imagens atingido"
                            : "Clique para selecionar imagens ou arraste aqui"}
                        </p>
                        <p className="text-xs text-gray-500">
                          Formatos aceitos: JPG, PNG, GIF, WebP • Máx: 5MB por
                          imagem
                        </p>
                      </label>
                    </div>

                    {/* Preview das imagens */}
                    {formData.images.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">
                            {formData.images.length} imagem(ns) selecionada(s)
                          </span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setFormData((prev) => ({ ...prev, images: [] }))
                            }
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="w-4 h-4 mr-1" />
                            Remover Todas
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {formData.images.map((file, index) => (
                            <div
                              key={index}
                              className="relative group bg-gray-50 rounded-lg p-3 border"
                            >
                              <div className="flex items-start gap-3">
                                <div className="relative">
                                  <img
                                    src={URL.createObjectURL(file)}
                                    alt={`Preview ${index + 1}`}
                                    className="w-16 h-16 object-cover rounded-lg"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeImage(index)}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>

                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {file.name}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {formatFileSize(file.size)}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    {file.size > 5 * 1024 * 1024 && (
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-700">
                                        <AlertTriangle className="w-3 h-3 mr-1" />
                                        Muito grande
                                      </span>
                                    )}
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      Válida
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Progress Bar */}
                  {isSubmitting && uploadProgress > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Enviando relato...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <Progress value={uploadProgress} className="w-full" />
                    </div>
                  )}

                  {/* Botão de Envio */}
                  <Button
                    type="submit"
                    className="w-full h-12 text-lg"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Enviando...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        Enviar Relato
                      </div>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Painel Lateral */}
          <div className="space-y-6">
            {/* Preview do Relato */}
            {(formData.title || formData.severity) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    Preview do Relato
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {formData.title && (
                    <div>
                      <h3 className="font-semibold">{formData.title}</h3>
                    </div>
                  )}

                  {formData.severity && (
                    <Badge
                      variant="secondary"
                      className={`${getSeverityColor(
                        formData.severity
                      )} text-white`}
                    >
                      {getSeverityIcon(formData.severity)}{" "}
                      {formData.severity.toUpperCase()}
                    </Badge>
                  )}

                  {formData.location && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      {formData.location}
                    </div>
                  )}

                  {formData.waterLevel && (
                    <div className="flex items-center gap-2 text-sm">
                      <Ruler className="w-4 h-4 text-blue-500" />
                      Nível: {formData.waterLevel}cm
                    </div>
                  )}

                  {formData.affectedPeople && (
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-orange-500" />
                      {formData.affectedPeople} pessoas afetadas
                    </div>
                  )}

                  {formData.images.length > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <Camera className="w-4 h-4 text-green-500" />
                      {formData.images.length} foto(s) anexada(s)
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Informações Importantes */}
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-2">
                      Importante
                    </h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>
                        • Em emergências, ligue 193 (Bombeiros) ou 199 (Defesa
                        Civil)
                      </li>
                      <li>
                        • Este sistema é para relatórios informativos da
                        comunidade
                      </li>
                      <li>• Seu relato será analisado antes da publicação</li>
                      <li>• Fotos ajudam na verificação da situação</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dicas */}
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-green-900 mb-2">
                      Dicas para um bom relato
                    </h3>
                    <ul className="text-sm text-green-800 space-y-1">
                      <li>• Seja específico sobre a localização</li>
                      <li>• Inclua detalhes sobre o nível da água</li>
                      <li>• Mencione se há riscos para pessoas</li>
                      <li>• Adicione fotos da situação atual</li>
                      <li>• Mantenha-se em local seguro</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Relatar;
