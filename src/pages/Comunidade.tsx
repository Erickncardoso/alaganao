import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Heart,
  MessageCircle,
  Users,
  Home,
  AlertTriangle,
  Info,
  Send,
  MapPin,
  Clock,
  Shield,
  CheckCircle,
  Loader2,
  MessageSquare,
  X,
  MoreHorizontal,
  Flag,
} from "lucide-react";
import Header from "@/components/Header";
import { useCommunityPosts, CreatePostData } from "@/hooks/useCommunityPosts";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import LocationSearchBar from "@/components/LocationSearchBar";

interface NewPostForm {
  content: string;
  post_type: "help_request" | "offer_shelter" | "information" | "general";
  priority_level: "low" | "medium" | "high" | "urgent";
  location: string;
  coordinates: [number, number] | null;
}

const Comunidade = () => {
  const [activeTab, setActiveTab] = useState("todos");
  const [showNewPostForm, setShowNewPostForm] = useState(false);
  const [newPostForm, setNewPostForm] = useState<NewPostForm>({
    content: "",
    post_type: "general",
    priority_level: "medium",
    location: "",
    coordinates: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userLikes, setUserLikes] = useState<string[]>([]);
  const [currentLocation, setCurrentLocation] = useState<
    [number, number] | null
  >(null);
  const [commentingPost, setCommentingPost] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");
  const [postComments, setPostComments] = useState<Record<string, any[]>>({});

  const { toast } = useToast();
  const {
    posts,
    loading,
    error,
    createPost,
    likePost,
    addComment,
    getPostComments,
    getUserLikes,
    refetch,
  } = useCommunityPosts(activeTab);

  // Mapbox token
  const mapboxToken =
    "pk.eyJ1IjoiZXJpY2tjYXJkb3NvIiwiYSI6ImNtYmE1dGkyNTA3am4ybG9sMDQxZ2ptYmgifQ.MQMRf8oeujyQ6G-Y6hMW-A";

  const categories = [
    {
      id: "todos",
      name: "Todos",
      icon: Users,
      color: "bg-gray-100 text-gray-800",
    },
    {
      id: "ajuda",
      name: "Preciso de Ajuda",
      icon: AlertTriangle,
      color: "bg-red-100 text-red-800",
    },
    {
      id: "abrigo",
      name: "Ofereço Abrigo",
      icon: Home,
      color: "bg-green-100 text-green-800",
    },
    {
      id: "info",
      name: "Orientações",
      icon: Info,
      color: "bg-blue-100 text-blue-800",
    },
  ];

  // Obter localização atual ao carregar
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

  // Carregar likes do usuário
  useEffect(() => {
    const loadUserLikes = async () => {
      try {
        const likes = await getUserLikes();
        setUserLikes(likes);
      } catch (error) {
        console.error("Erro ao carregar likes:", error);
      }
    };

    loadUserLikes();
  }, [getUserLikes]);

  const handleLocationSelect = (
    coordinates: [number, number],
    address: string
  ) => {
    setNewPostForm((prev) => ({
      ...prev,
      location: address,
      coordinates: coordinates,
    }));
  };

  const handleSubmitPost = async () => {
    if (!newPostForm.content.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, escreva o conteúdo do post",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const postData: CreatePostData = {
        content: newPostForm.content,
        post_type: newPostForm.post_type,
        priority_level: newPostForm.priority_level,
        location: newPostForm.location || undefined,
        latitude: newPostForm.coordinates?.[1],
        longitude: newPostForm.coordinates?.[0],
      };

      await createPost(postData);

      // Reset form
      setNewPostForm({
        content: "",
        post_type: "general",
        priority_level: "medium",
        location: "",
        coordinates: null,
      });
      setShowNewPostForm(false);

      toast({
        title: "Post Criado!",
        description: "Seu post foi publicado com sucesso na comunidade.",
      });
    } catch (error) {
      console.error("Erro ao criar post:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao publicar seu post. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLikePost = async (postId: string) => {
    try {
      await likePost(postId);

      // Atualizar likes locais
      setUserLikes((prev) =>
        prev.includes(postId)
          ? prev.filter((id) => id !== postId)
          : [...prev, postId]
      );
    } catch (error) {
      console.error("Erro ao curtir post:", error);
      toast({
        title: "Erro",
        description: "Não foi possível curtir o post. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleAddComment = async (postId: string) => {
    if (!newComment.trim()) return;

    try {
      await addComment(postId, newComment);
      setNewComment("");
      setCommentingPost(null);

      // Atualizar comentários locais
      const comments = await getPostComments(postId);
      setPostComments((prev) => ({ ...prev, [postId]: comments }));

      toast({
        title: "Comentário Adicionado!",
        description: "Seu comentário foi publicado com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao adicionar comentário:", error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o comentário.",
        variant: "destructive",
      });
    }
  };

  const handleToggleComments = async (postId: string) => {
    if (commentingPost === postId) {
      setCommentingPost(null);
    } else {
      setCommentingPost(postId);

      // Carregar comentários se não estão carregados
      if (!postComments[postId]) {
        try {
          const comments = await getPostComments(postId);
          setPostComments((prev) => ({ ...prev, [postId]: comments }));
        } catch (error) {
          console.error("Erro ao carregar comentários:", error);
        }
      }
    }
  };

  const getCategoryInfo = (categoryId: string) => {
    return categories.find((cat) => cat.id === categoryId);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-600 text-white";
      case "high":
        return "bg-red-500 text-white";
      case "medium":
        return "bg-yellow-500 text-white";
      case "low":
        return "bg-green-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "Urgente";
      case "high":
        return "Alta";
      case "medium":
        return "Média";
      case "low":
        return "Baixa";
      default:
        return "Média";
    }
  };

  const getPostTypeIcon = (type: string) => {
    switch (type) {
      case "help_request":
        return "🆘";
      case "offer_shelter":
        return "🏠";
      case "information":
        return "ℹ️";
      default:
        return "💬";
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
                  Erro ao Carregar Posts
                </h3>
                <p className="text-red-600 mb-4">{error}</p>
                <Button onClick={refetch} variant="outline">
                  Tentar Novamente
                </Button>
              </div>
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
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Comunidade</h1>
          <p className="text-lg text-gray-600">
            Conecte-se com sua comunidade, ofereça ajuda e receba apoio em
            momentos de necessidade.
          </p>
        </div>

        {/* Category Tabs */}
        <div className="mb-6">
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <Button
                  key={category.id}
                  variant={activeTab === category.id ? "default" : "outline"}
                  onClick={() => setActiveTab(category.id)}
                  className="whitespace-nowrap"
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {category.name}
                </Button>
              );
            })}
          </div>
        </div>

        {/* New Post Button/Form */}
        {!showNewPostForm ? (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <Button
                onClick={() => setShowNewPostForm(true)}
                className="w-full h-12 text-lg"
              >
                <Send className="w-5 h-5 mr-2" />
                Compartilhar com a Comunidade
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Novo Post na Comunidade</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNewPostForm(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Tipo e Prioridade */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo do Post</Label>
                  <Select
                    value={newPostForm.post_type}
                    onValueChange={(value: any) =>
                      setNewPostForm((prev) => ({ ...prev, post_type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">💬 Geral</SelectItem>
                      <SelectItem value="help_request">
                        🆘 Preciso de Ajuda
                      </SelectItem>
                      <SelectItem value="offer_shelter">
                        🏠 Ofereço Abrigo
                      </SelectItem>
                      <SelectItem value="information">ℹ️ Informação</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Prioridade</Label>
                  <Select
                    value={newPostForm.priority_level}
                    onValueChange={(value: any) =>
                      setNewPostForm((prev) => ({
                        ...prev,
                        priority_level: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a prioridade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">🟢 Baixa</SelectItem>
                      <SelectItem value="medium">🟡 Média</SelectItem>
                      <SelectItem value="high">🔴 Alta</SelectItem>
                      <SelectItem value="urgent">🚨 Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Localização */}
              <div className="space-y-2">
                <Label>Localização (Opcional)</Label>
                <LocationSearchBar
                  onLocationSelect={handleLocationSelect}
                  onLocationClear={() =>
                    setNewPostForm((prev) => ({
                      ...prev,
                      location: "",
                      coordinates: null,
                    }))
                  }
                  mapboxToken={mapboxToken}
                  currentLocation={currentLocation}
                  placeholder="Adicione a localização do seu post"
                />
                {newPostForm.coordinates && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <MapPin className="w-4 h-4" />
                    <span>📍 {newPostForm.location}</span>
                  </div>
                )}
              </div>

              {/* Conteúdo */}
              <div className="space-y-2">
                <Label>Conteúdo</Label>
                <Textarea
                  placeholder="O que você gostaria de compartilhar com a comunidade?"
                  value={newPostForm.content}
                  onChange={(e) =>
                    setNewPostForm((prev) => ({
                      ...prev,
                      content: e.target.value,
                    }))
                  }
                  rows={4}
                />
                <div className="text-sm text-gray-500 text-right">
                  {newPostForm.content.length}/500
                </div>
              </div>

              {/* Botões */}
              <div className="flex gap-3">
                <Button
                  onClick={handleSubmitPost}
                  disabled={isSubmitting || !newPostForm.content.trim()}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Publicando...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Send className="w-4 h-4" />
                      Publicar
                    </div>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowNewPostForm(false)}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
            <p className="text-gray-600">Carregando posts da comunidade...</p>
          </div>
        )}

        {/* Posts */}
        {!loading && (
          <div className="space-y-4">
            {posts.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">
                    Nenhum post encontrado
                  </h3>
                  <p className="text-gray-500">
                    Seja o primeiro a compartilhar algo com a comunidade!
                  </p>
                </CardContent>
              </Card>
            ) : (
              posts.map((post) => (
                <Card
                  key={post.id}
                  className={`${
                    post.priority_level === "urgent"
                      ? "border-red-200 bg-red-50"
                      : ""
                  }`}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start space-x-4">
                      {/* Avatar */}
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold">
                          {post.author_name
                            ? post.author_name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2)
                            : "??"}
                        </span>
                      </div>

                      <div className="flex-1">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-2 flex-wrap">
                            <span className="font-semibold text-gray-900">
                              {post.author_name || "Usuário Anônimo"}
                            </span>

                            {post.is_official && (
                              <Badge className="bg-blue-600 text-white text-xs">
                                <Shield className="w-3 h-3 mr-1" />
                                Oficial
                              </Badge>
                            )}

                            <Badge
                              className={`text-xs ${getPriorityColor(
                                post.priority_level
                              )}`}
                            >
                              {getPriorityText(post.priority_level)}
                            </Badge>

                            <Badge variant="outline" className="text-xs">
                              {getPostTypeIcon(post.post_type)}{" "}
                              {post.post_type === "help_request"
                                ? "Preciso de Ajuda"
                                : post.post_type === "offer_shelter"
                                ? "Ofereço Abrigo"
                                : post.post_type === "information"
                                ? "Informação"
                                : "Geral"}
                            </Badge>

                            <div className="flex items-center text-sm text-gray-500">
                              <Clock className="w-3 h-3 mr-1" />
                              {formatTimeAgo(post.created_at)}
                            </div>
                          </div>

                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </div>

                        {/* Content */}
                        <p className="text-gray-800 mb-4 leading-relaxed">
                          {post.content}
                        </p>

                        {/* Location */}
                        {post.location && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                            <MapPin className="w-4 h-4" />
                            <span>{post.location}</span>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center space-x-6 text-sm">
                          <button
                            className={`flex items-center space-x-1 transition-colors ${
                              userLikes.includes(post.id)
                                ? "text-red-500"
                                : "text-gray-500 hover:text-red-500"
                            }`}
                            onClick={() => handleLikePost(post.id)}
                          >
                            <Heart
                              className={`w-4 h-4 ${
                                userLikes.includes(post.id)
                                  ? "fill-current"
                                  : ""
                              }`}
                            />
                            <span>{post.likes_count}</span>
                          </button>

                          <button
                            className="flex items-center space-x-1 text-gray-500 hover:text-blue-500 transition-colors"
                            onClick={() => handleToggleComments(post.id)}
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span>{post.comments_count}</span>
                          </button>

                          <button className="flex items-center space-x-1 text-gray-500 hover:text-gray-700 transition-colors">
                            <Flag className="w-4 h-4" />
                            <span>Reportar</span>
                          </button>
                        </div>

                        {/* Comments Section */}
                        {commentingPost === post.id && (
                          <div className="mt-4 pt-4 border-t border-gray-100">
                            {/* Existing Comments */}
                            {postComments[post.id] &&
                              postComments[post.id].length > 0 && (
                                <div className="space-y-3 mb-4">
                                  {postComments[post.id].map((comment) => (
                                    <div
                                      key={comment.id}
                                      className="flex space-x-3"
                                    >
                                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                        <span className="text-xs font-semibold text-gray-600">
                                          {comment.author_name
                                            ? comment.author_name
                                                .split(" ")
                                                .map((n: string) => n[0])
                                                .join("")
                                                .slice(0, 2)
                                            : "??"}
                                        </span>
                                      </div>
                                      <div className="flex-1">
                                        <div className="bg-gray-100 rounded-lg px-3 py-2">
                                          <div className="text-sm font-medium text-gray-900 mb-1">
                                            {comment.author_name ||
                                              "Usuário Anônimo"}
                                          </div>
                                          <p className="text-sm text-gray-700">
                                            {comment.content}
                                          </p>
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                          {formatTimeAgo(comment.created_at)}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                            {/* New Comment Input */}
                            <div className="flex space-x-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-xs font-semibold text-blue-600">
                                  Eu
                                </span>
                              </div>
                              <div className="flex-1 flex space-x-2">
                                <Input
                                  placeholder="Escreva um comentário..."
                                  value={newComment}
                                  onChange={(e) =>
                                    setNewComment(e.target.value)
                                  }
                                  onKeyPress={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                      e.preventDefault();
                                      handleAddComment(post.id);
                                    }
                                  }}
                                />
                                <Button
                                  size="sm"
                                  onClick={() => handleAddComment(post.id)}
                                  disabled={!newComment.trim()}
                                >
                                  <Send className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Emergency Info */}
        <Card className="mt-8 border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-orange-900 mb-2">
                  Em Situações de Emergência
                </h3>
                <p className="text-sm text-orange-800 mb-2">
                  Em situações de risco imediato à vida, ligue para os números
                  de emergência:
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-orange-100 p-3 rounded-lg">
                    <div className="font-semibold text-orange-900">
                      193 - Bombeiros
                    </div>
                    <div className="text-orange-700">Resgate e emergências</div>
                  </div>
                  <div className="bg-orange-100 p-3 rounded-lg">
                    <div className="font-semibold text-orange-900">
                      199 - Defesa Civil
                    </div>
                    <div className="text-orange-700">Proteção civil</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Comunidade;
