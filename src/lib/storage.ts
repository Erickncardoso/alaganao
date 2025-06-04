import { supabase } from "@/integrations/supabase/client";

export interface UploadProgress {
  progress: number;
  isUploading: boolean;
  error?: string;
}

export class ImageUploadService {
  private static instance: ImageUploadService;

  public static getInstance(): ImageUploadService {
    if (!ImageUploadService.instance) {
      ImageUploadService.instance = new ImageUploadService();
    }
    return ImageUploadService.instance;
  }

  /**
   * Valida se o arquivo é uma imagem válida
   */
  public validateImage(file: File): { isValid: boolean; error?: string } {
    // Verificar tipo
    if (!file.type.startsWith("image/")) {
      return { isValid: false, error: "Arquivo deve ser uma imagem" };
    }

    // Verificar tamanho (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return { isValid: false, error: "Imagem deve ter no máximo 5MB" };
    }

    // Verificar extensão
    const allowedExtensions = ["jpg", "jpeg", "png", "gif", "webp"];
    const fileExtension = file.name.split(".").pop()?.toLowerCase();
    if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
      return {
        isValid: false,
        error: "Formato não suportado. Use: JPG, PNG, GIF ou WebP",
      };
    }

    return { isValid: true };
  }

  /**
   * Gera um nome único para o arquivo
   */
  public generateFileName(
    originalName: string,
    prefix: string = "flood-reports"
  ): string {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2);
    const extension = originalName.split(".").pop();
    return `${prefix}/${timestamp}-${randomId}.${extension}`;
  }

  /**
   * Faz upload de uma única imagem
   */
  public async uploadSingleImage(
    file: File,
    fileName?: string,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    try {
      // Validar arquivo
      const validation = this.validateImage(file);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Gerar nome do arquivo se não fornecido
      const filePath = fileName || this.generateFileName(file.name);

      onProgress?.(10);

      // Upload para o Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("images")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error("Erro no upload:", uploadError);
        throw new Error(`Erro ao fazer upload: ${uploadError.message}`);
      }

      onProgress?.(80);

      // Obter URL pública
      const {
        data: { publicUrl },
      } = supabase.storage.from("images").getPublicUrl(filePath);

      onProgress?.(100);

      return publicUrl;
    } catch (error) {
      console.error("Erro no upload da imagem:", error);
      throw error;
    }
  }

  /**
   * Faz upload de múltiplas imagens
   */
  public async uploadMultipleImages(
    files: File[],
    onProgress?: (progress: number) => void,
    onFileProgress?: (fileIndex: number, progress: number) => void
  ): Promise<string[]> {
    try {
      if (files.length === 0) return [];

      const uploadedUrls: string[] = [];
      const totalFiles = files.length;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        try {
          const fileProgress = (fileIndex: number, progress: number) => {
            const overallProgress =
              (fileIndex / totalFiles) * 100 + progress / totalFiles;
            onProgress?.(Math.min(overallProgress, 100));
            onFileProgress?.(fileIndex, progress);
          };

          const url = await this.uploadSingleImage(
            file,
            undefined,
            (progress) => fileProgress(i, progress)
          );

          uploadedUrls.push(url);
        } catch (error) {
          console.error(`Erro no upload do arquivo ${file.name}:`, error);
          throw new Error(
            `Erro no upload do arquivo "${file.name}": ${
              error instanceof Error ? error.message : "Erro desconhecido"
            }`
          );
        }
      }

      onProgress?.(100);
      return uploadedUrls;
    } catch (error) {
      console.error("Erro no upload de múltiplas imagens:", error);
      throw error;
    }
  }

  /**
   * Remove uma imagem do storage
   */
  public async deleteImage(filePath: string): Promise<void> {
    try {
      // Extrair caminho relativo da URL se necessário
      let relativePath = filePath;
      if (filePath.includes("/storage/v1/object/public/images/")) {
        relativePath = filePath.split("/storage/v1/object/public/images/")[1];
      }

      const { error } = await supabase.storage
        .from("images")
        .remove([relativePath]);

      if (error) {
        console.error("Erro ao deletar imagem:", error);
        throw new Error(`Erro ao deletar imagem: ${error.message}`);
      }
    } catch (error) {
      console.error("Erro ao deletar imagem:", error);
      throw error;
    }
  }

  /**
   * Remove múltiplas imagens
   */
  public async deleteMultipleImages(filePaths: string[]): Promise<void> {
    try {
      const relativePaths = filePaths.map((path) => {
        if (path.includes("/storage/v1/object/public/images/")) {
          return path.split("/storage/v1/object/public/images/")[1];
        }
        return path;
      });

      const { error } = await supabase.storage
        .from("images")
        .remove(relativePaths);

      if (error) {
        console.error("Erro ao deletar imagens:", error);
        throw new Error(`Erro ao deletar imagens: ${error.message}`);
      }
    } catch (error) {
      console.error("Erro ao deletar múltiplas imagens:", error);
      throw error;
    }
  }

  /**
   * Redimensiona uma imagem antes do upload (opcional)
   */
  public async resizeImage(
    file: File,
    maxWidth: number = 1920,
    maxHeight: number = 1080,
    quality: number = 0.8
  ): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        // Calcular novas dimensões mantendo proporção
        let { width, height } = img;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;

        // Desenhar imagem redimensionada
        ctx?.drawImage(img, 0, 0, width, height);

        // Converter para blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const resizedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(resizedFile);
            } else {
              reject(new Error("Erro ao redimensionar imagem"));
            }
          },
          file.type,
          quality
        );
      };

      img.onerror = () => reject(new Error("Erro ao carregar imagem"));
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Comprime uma imagem mantendo qualidade aceitável
   */
  public async compressImage(
    file: File,
    targetSizeKB: number = 500
  ): Promise<File> {
    let quality = 0.8;
    let compressedFile = file;

    while (compressedFile.size > targetSizeKB * 1024 && quality > 0.1) {
      compressedFile = await this.resizeImage(file, 1920, 1080, quality);
      quality -= 0.1;
    }

    return compressedFile;
  }
}

// Exportar instância única
export const imageUploadService = ImageUploadService.getInstance();

// Utilitários auxiliares
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export const isImageFile = (file: File): boolean => {
  return file.type.startsWith("image/");
};

export const getImageDimensions = (
  file: File
): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};
