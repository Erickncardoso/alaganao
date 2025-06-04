import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface CommunityPost {
  id: string;
  content: string;
  post_type: "help_request" | "offer_shelter" | "information" | "general";
  priority_level: "low" | "medium" | "high" | "urgent";
  author_name?: string;
  author_id?: string;
  is_official: boolean;
  likes_count: number;
  comments_count: number;
  location?: string;
  latitude?: number;
  longitude?: number;
  tags?: string[];
  status: "active" | "resolved" | "expired";
  created_at: string;
  updated_at: string;
}

export interface CreatePostData {
  content: string;
  post_type: "help_request" | "offer_shelter" | "information" | "general";
  priority_level?: "low" | "medium" | "high" | "urgent";
  location?: string;
  latitude?: number;
  longitude?: number;
  tags?: string[];
}

export interface PostLike {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  author_name?: string;
  created_at: string;
  updated_at: string;
}

export const useCommunityPosts = (postType?: string) => {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from("community_posts")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (postType && postType !== "todos") {
        const typeMap: Record<string, string> = {
          ajuda: "help_request",
          abrigo: "offer_shelter",
          info: "information",
        };
        if (typeMap[postType]) {
          query = query.eq("post_type", typeMap[postType]);
        }
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      setPosts(data || []);
    } catch (err) {
      console.error("Erro ao buscar posts:", err);
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  const createPost = async (
    postData: CreatePostData
  ): Promise<CommunityPost> => {
    try {
      // Obter usuário atual
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Obter dados do perfil se disponível
      let authorName = "Usuário Anônimo";
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();

        if (profile?.full_name) {
          authorName = profile.full_name;
        } else if (user.user_metadata?.full_name) {
          authorName = user.user_metadata.full_name;
        } else if (user.email) {
          authorName = user.email.split("@")[0];
        }
      }

      const insertData = {
        content: postData.content,
        post_type: postData.post_type,
        priority_level: postData.priority_level || "medium",
        author_id: user?.id,
        author_name: authorName,
        is_official: false,
        location: postData.location,
        latitude: postData.latitude,
        longitude: postData.longitude,
        tags: postData.tags || [],
        status: "active" as const,
        likes_count: 0,
        comments_count: 0,
      };

      const { data, error } = await supabase
        .from("community_posts")
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error("Erro do Supabase:", error);
        throw error;
      }

      await fetchPosts(); // Refresh the list
      return data;
    } catch (err) {
      console.error("Erro ao criar post:", err);
      throw err;
    }
  };

  const likePost = async (postId: string): Promise<void> => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Usuário não autenticado");
      }

      // Verificar se já curtiu
      const { data: existingLike } = await supabase
        .from("post_likes")
        .select("id")
        .eq("post_id", postId)
        .eq("user_id", user.id)
        .single();

      if (existingLike) {
        // Remove like
        await supabase
          .from("post_likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user.id);

        // Decrementa contador
        await supabase.rpc("decrement_post_likes", { post_id: postId });
      } else {
        // Adiciona like
        await supabase
          .from("post_likes")
          .insert({ post_id: postId, user_id: user.id });

        // Incrementa contador
        await supabase.rpc("increment_post_likes", { post_id: postId });
      }

      await fetchPosts(); // Refresh the list
    } catch (err) {
      console.error("Erro ao curtir post:", err);
      throw err;
    }
  };

  const addComment = async (
    postId: string,
    content: string
  ): Promise<PostComment> => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Usuário não autenticado");
      }

      // Obter nome do autor
      let authorName = "Usuário Anônimo";
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();

        if (profile?.full_name) {
          authorName = profile.full_name;
        } else if (user.user_metadata?.full_name) {
          authorName = user.user_metadata.full_name;
        } else if (user.email) {
          authorName = user.email.split("@")[0];
        }
      }

      const { data, error } = await supabase
        .from("post_comments")
        .insert({
          post_id: postId,
          user_id: user.id,
          content: content,
          author_name: authorName,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Incrementa contador de comentários
      await supabase.rpc("increment_post_comments", { post_id: postId });

      await fetchPosts(); // Refresh the list
      return data;
    } catch (err) {
      console.error("Erro ao adicionar comentário:", err);
      throw err;
    }
  };

  const getPostComments = async (postId: string): Promise<PostComment[]> => {
    try {
      const { data, error } = await supabase
        .from("post_comments")
        .select("*")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (err) {
      console.error("Erro ao buscar comentários:", err);
      throw err;
    }
  };

  const getUserLikes = async (): Promise<string[]> => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return [];

      const { data, error } = await supabase
        .from("post_likes")
        .select("post_id")
        .eq("user_id", user.id);

      if (error) {
        throw error;
      }

      return data?.map((like) => like.post_id) || [];
    } catch (err) {
      console.error("Erro ao buscar likes do usuário:", err);
      return [];
    }
  };

  const resolvePost = async (postId: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from("community_posts")
        .update({ status: "resolved", updated_at: new Date().toISOString() })
        .eq("id", postId);

      if (error) {
        throw error;
      }

      await fetchPosts(); // Refresh the list
    } catch (err) {
      console.error("Erro ao resolver post:", err);
      throw err;
    }
  };

  const deletePost = async (postId: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from("community_posts")
        .delete()
        .eq("id", postId);

      if (error) {
        throw error;
      }

      await fetchPosts(); // Refresh the list
    } catch (err) {
      console.error("Erro ao deletar post:", err);
      throw err;
    }
  };

  const getPostStatistics = async () => {
    try {
      const { data, error } = await supabase
        .from("community_posts")
        .select("post_type, priority_level, status, created_at")
        .eq("status", "active");

      if (error) throw error;

      const stats = {
        total: data?.length || 0,
        byType: {
          help_request:
            data?.filter((p) => p.post_type === "help_request").length || 0,
          offer_shelter:
            data?.filter((p) => p.post_type === "offer_shelter").length || 0,
          information:
            data?.filter((p) => p.post_type === "information").length || 0,
          general: data?.filter((p) => p.post_type === "general").length || 0,
        },
        byPriority: {
          urgent:
            data?.filter((p) => p.priority_level === "urgent").length || 0,
          high: data?.filter((p) => p.priority_level === "high").length || 0,
          medium:
            data?.filter((p) => p.priority_level === "medium").length || 0,
          low: data?.filter((p) => p.priority_level === "low").length || 0,
        },
        recent:
          data?.filter((p) => {
            const postDate = new Date(p.created_at);
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            return postDate >= yesterday;
          }).length || 0,
      };

      return stats;
    } catch (err) {
      console.error("Erro ao buscar estatísticas:", err);
      throw err;
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [postType]);

  return {
    posts,
    loading,
    error,
    createPost,
    likePost,
    addComment,
    getPostComments,
    getUserLikes,
    resolvePost,
    deletePost,
    getPostStatistics,
    refetch: fetchPosts,
  };
};
