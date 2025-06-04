"use client";

import React from "react";
import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Apple, Smartphone } from "lucide-react";

interface AppDownloadSectionProps {
  title?: string;
  description?: string;
  appName?: string;
  iosDownloadUrl?: string;
  androidDownloadUrl?: string;
  iphoneMockupSrc?: string;
  androidMockupSrc?: string;
}

const AppDownloadSection: React.FC<AppDownloadSectionProps> = ({
  title = "Baixe nosso App",
  description = "Tenha acesso completo ao nosso aplicativo em qualquer lugar. Disponível para iOS e Android com todas as funcionalidades que você precisa.",
  appName = "alaganao",
  iosDownloadUrl = "#",
  androidDownloadUrl = "#",
  iphoneMockupSrc = "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=300&h=600&fit=crop&crop=center",
  androidMockupSrc = "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&h=600&fit=crop&crop=center",
}) => {
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  const phoneVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.6, ease: "easeOut", delay: 0.2 },
    },
  };

  return (
    <section className="relative py-20 lg:py-32 bg-gradient-to-br from-gray-50 via-white to-blue-50 overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-transparent to-cyan-600/5" />
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-6 lg:px-8 relative z-10 max-w-7xl">
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {/* Content Section */}
          <motion.div
            className="flex flex-col items-start space-y-8"
            variants={itemVariants}
          >
            <div className="space-y-6">
              <Badge className="bg-blue-600/10 text-blue-600 border-blue-600/20">
                <Download className="w-4 h-4 mr-2" />
                Download Gratuito
              </Badge>

              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
                {title}
              </h2>

              <p className="text-lg text-gray-600 leading-relaxed max-w-lg">
                {description}
              </p>
            </div>

            {/* Download Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Button
                size="lg"
                className="flex items-center justify-center gap-3 px-8 py-6 text-base font-semibold bg-black text-white hover:bg-gray-800 rounded-xl"
                asChild
              >
                <a href={iosDownloadUrl}>
                  <Apple className="w-6 h-6" />
                  <div className="text-left">
                    <div className="text-xs opacity-80">Baixar na</div>
                    <div>App Store</div>
                  </div>
                </a>
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="flex items-center justify-center gap-3 px-8 py-6 text-base font-semibold border-2 hover:bg-gray-50 rounded-xl"
                asChild
              >
                <a href={androidDownloadUrl}>
                  <Smartphone className="w-6 h-6" />
                  <div className="text-left">
                    <div className="text-xs opacity-80">Baixar no</div>
                    <div>Google Play</div>
                  </div>
                </a>
              </Button>
            </div>

            {/* App Info */}
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Gratuito</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Sem anúncios</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Funcionamento offline</span>
              </div>
            </div>
          </motion.div>

          {/* Mockup Section */}
          <motion.div
            className="relative flex justify-center items-center"
            variants={itemVariants}
          >
            {/* iPhone Mockup */}
            <motion.div
              className="relative z-20"
              variants={phoneVariants}
              whileHover={{ y: -10, transition: { duration: 0.3 } }}
            >
              <div className="relative w-64 h-[520px] bg-black rounded-[3rem] p-2 shadow-2xl">
                {/* iPhone Frame */}
                <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden relative">
                  {/* Notch */}
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl z-10"></div>

                  {/* Screen Content - Imagem do app */}
                  <div
                    className="w-full h-full bg-cover bg-center"
                    style={{
                      backgroundImage: `url(${iphoneMockupSrc})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  >
                    {/* Overlay gradiente para melhor legibilidade */}
                    <div className="absolute inset-0 bg-gradient-to-t from-blue-600/20 to-transparent"></div>

                    {/* App UI Overlay */}
                    <div className="absolute bottom-8 left-4 right-4 bg-white/90 backdrop-blur-sm rounded-2xl p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                          <Download className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <div className="font-semibold text-sm">{appName}</div>
                          <div className="text-xs text-gray-500">
                            Versão 2.1.0
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Android Mockup */}
            <motion.div
              className="relative z-10 -ml-16"
              variants={phoneVariants}
              style={{ y: 40 }}
              whileHover={{ y: 30, transition: { duration: 0.3 } }}
            >
              <div className="relative w-56 h-[460px] bg-gray-800 rounded-[2.5rem] p-2 shadow-xl">
                {/* Android Frame */}
                <div className="w-full h-full bg-white rounded-[2rem] overflow-hidden relative">
                  {/* Screen Content - Imagem do app */}
                  <div
                    className="w-full h-full bg-cover bg-center"
                    style={{
                      backgroundImage: `url(${androidMockupSrc})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  >
                    {/* Overlay gradiente */}
                    <div className="absolute inset-0 bg-gradient-to-t from-cyan-600/20 to-transparent"></div>

                    {/* App UI Overlay */}
                    <div className="absolute bottom-6 left-3 right-3 bg-white/90 backdrop-blur-sm rounded-xl p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-cyan-600 rounded-lg flex items-center justify-center">
                          <Smartphone className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="font-semibold text-xs">{appName}</div>
                          <div className="text-xs text-gray-500">Android</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Floating Elements */}
            <motion.div
              className="absolute top-10 right-10 w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center"
              animate={{
                y: [0, -10, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Download className="w-8 h-8 text-blue-600" />
            </motion.div>

            <motion.div
              className="absolute bottom-20 left-10 w-12 h-12 bg-cyan-600/20 rounded-full flex items-center justify-center"
              animate={{
                y: [0, 8, 0],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5,
              }}
            >
              <Apple className="w-6 h-6 text-cyan-600" />
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default AppDownloadSection;
