import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Download, X, Smartphone } from "lucide-react";
import { usePWA } from "@/utils/pwa";

interface PWAInstallButtonProps {
  className?: string;
  showAsFloating?: boolean;
  customText?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = "",
  showAsFloating = false,
  customText,
}) => {
  const { canInstall, isInstalled, isStandalone, promptInstall } = usePWA();
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Mostrar o botão apenas se pode instalar e não está instalado
    setIsVisible(canInstall && !isInstalled && !isStandalone);
  }, [canInstall, isInstalled, isStandalone]);

  const handleInstall = async () => {
    setIsInstalling(true);
    try {
      const result = await promptInstall();
      if (result) {
        setIsVisible(false);
      }
    } catch (error) {
      console.error("Error during PWA installation:", error);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    // Esconder por 24 horas
    localStorage.setItem("pwa_install_dismissed", Date.now().toString());
  };

  // Verificar se foi dispensado recentemente (24h)
  useEffect(() => {
    const dismissed = localStorage.getItem("pwa_install_dismissed");
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const now = Date.now();
      const timeDiff = now - dismissedTime;
      const twentyFourHours = 24 * 60 * 60 * 1000;

      if (timeDiff < twentyFourHours) {
        setIsVisible(false);
      }
    }
  }, []);

  if (!isVisible) {
    return null;
  }

  if (showAsFloating) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.8 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed bottom-6 right-6 z-50"
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 max-w-sm">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                  <Download className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">
                    Instalar alaganao
                  </div>
                  <div className="text-xs text-gray-500">
                    Acesso rápido e offline
                  </div>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleInstall}
                disabled={isInstalling}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isInstalling ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Instalando...
                  </>
                ) : (
                  <>
                    <Smartphone className="w-4 h-4" />
                    Instalar
                  </>
                )}
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Agora não
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Botão inline
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      onClick={handleInstall}
      disabled={isInstalling}
      className={`
        inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg 
        font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 
        disabled:cursor-not-allowed ${className}
      `}
    >
      {isInstalling ? (
        <>
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          Instalando...
        </>
      ) : (
        <>
          <Download className="w-4 h-4" />
          {customText || "Instalar App"}
        </>
      )}
    </motion.button>
  );
};

export default PWAInstallButton;
