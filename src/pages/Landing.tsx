import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import {
  Droplets,
  Menu,
  X,
  Smartphone,
  Bell,
  HeartHandshake,
  Map,
  AlertTriangle,
  Users,
  Heart,
  FileText,
  BarChart3,
  MapPin,
} from "lucide-react";
import AppDownloadSection from "@/components/ui/app-download-section";

export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [countersVisible, setCountersVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-fade-in-up");
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -30px 0px",
      }
    );

    const elements = document.querySelectorAll(".scroll-reveal");
    elements.forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                <Droplets className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">alaganao</span>
            </div>

            {/* Navigation Desktop */}
            <nav className="hidden md:flex items-center space-x-8">
              <a
                href="#inicio"
                className="text-gray-700 hover:text-blue-600 transition-colors"
              >
                Início
              </a>
              <a
                href="#como-funciona"
                className="text-gray-700 hover:text-blue-600 transition-colors"
              >
                Como Funciona
              </a>
              <a
                href="#recursos"
                className="text-gray-700 hover:text-blue-600 transition-colors"
              >
                Recursos
              </a>
              <a
                href="#comunidade"
                className="text-gray-700 hover:text-blue-600 transition-colors"
              >
                Comunidade
              </a>
              <a
                href="#contato"
                className="text-gray-700 hover:text-blue-600 transition-colors"
              >
                Contato
              </a>
            </nav>

            {/* CTA Buttons Desktop */}
            <div className="hidden md:flex items-center space-x-4">
              <Link
                to="/login"
                className="text-gray-700 hover:text-blue-600 transition-colors"
              >
                Entrar
              </Link>
              <Link
                to="/register"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Cadastrar
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t bg-white">
              <div className="px-2 pt-2 pb-3 space-y-1">
                <a
                  href="#inicio"
                  className="block px-3 py-2 text-gray-700 hover:text-blue-600"
                >
                  Início
                </a>
                <a
                  href="#como-funciona"
                  className="block px-3 py-2 text-gray-700 hover:text-blue-600"
                >
                  Como Funciona
                </a>
                <a
                  href="#recursos"
                  className="block px-3 py-2 text-gray-700 hover:text-blue-600"
                >
                  Recursos
                </a>
                <a
                  href="#comunidade"
                  className="block px-3 py-2 text-gray-700 hover:text-blue-600"
                >
                  Comunidade
                </a>
                <a
                  href="#contato"
                  className="block px-3 py-2 text-gray-700 hover:text-blue-600"
                >
                  Contato
                </a>
                <div className="pt-4 border-t border-gray-200">
                  <Link
                    to="/login"
                    className="block w-full text-left px-3 py-2 text-gray-700 hover:text-blue-600"
                  >
                    Entrar
                  </Link>
                  <Link
                    to="/register"
                    className="block w-full text-left px-3 py-2 bg-blue-600 text-white rounded-lg mt-2"
                  >
                    Cadastrar
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section com Background Moderno */}
      <section
        id="inicio"
        className="relative min-h-screen flex items-center overflow-hidden"
        style={{
          backgroundImage: `url('/bgShero.jpg')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Overlay para melhor legibilidade */}
        <div
          className="absolute inset-0 z-0"
          style={{
            background: `
              radial-gradient(circle at 20% 20%, rgba(120, 171, 252, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 80% 80%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
              linear-gradient(135deg, rgba(240, 249, 255, 0.3) 0%, rgba(224, 242, 254, 0.3) 50%, rgba(240, 249, 255, 0.3) 100%)
            `,
          }}
        />

        {/* Formas Geométricas Flutuantes */}
        <div className="absolute inset-0 overflow-hidden z-10">
          {/* Forma 1 - Grande círculo azul claro */}
          <motion.div
            animate={{
              y: [0, -15, 0],
              x: [0, 10, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute -top-20 -left-20 w-96 h-96 rounded-full"
            style={{
              background: `
                radial-gradient(circle, 
                  rgba(59, 130, 246, 0.12) 0%, 
                  rgba(147, 197, 253, 0.08) 40%, 
                  transparent 70%
                )
              `,
            }}
          />

          {/* Forma 2 - Círculo médio no canto superior direito */}
          <motion.div
            animate={{
              y: [0, 20, 0],
              x: [0, -8, 0],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1,
            }}
            className="absolute -top-10 -right-10 w-64 h-64 rounded-full"
            style={{
              background: `
                radial-gradient(ellipse 150% 100%, 
                  rgba(96, 165, 250, 0.15) 0%, 
                  rgba(147, 197, 253, 0.08) 50%, 
                  transparent 80%
                )
              `,
            }}
          />

          {/* Forma 3 - Elipse no centro direito */}
          <motion.div
            animate={{
              y: [0, -12, 0],
              scaleY: [1, 1.05, 1],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2,
            }}
            className="absolute top-1/2 -right-32 w-80 h-48 rounded-full transform -translate-y-1/2"
            style={{
              background: `
                radial-gradient(ellipse 120% 200%, 
                  rgba(59, 130, 246, 0.1) 0%, 
                  rgba(147, 197, 253, 0.06) 60%, 
                  transparent 90%
                )
              `,
            }}
          />
        </div>

        {/* Conteúdo da Hero Section */}
        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="scroll-reveal"
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 text-white drop-shadow-lg">
                Proteja sua <span className="text-blue-200">comunidade</span>{" "}
                das enchentes
              </h1>
              <p className="text-xl text-white/90 mb-8 leading-relaxed drop-shadow-md">
                Plataforma colaborativa que conecta moradores, autoridades e
                voluntários para monitoramento em tempo real e prevenção de
                enchentes.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/register"
                  className="bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Começar Agora
                </Link>
                <button
                  onClick={() =>
                    document
                      .getElementById("como-funciona")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                  className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold hover:bg-white hover:text-gray-900 transition-all duration-300 backdrop-blur-sm"
                >
                  Saiba Mais
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="scroll-reveal"
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="bg-white/80 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white/50"
              >
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="h-12 w-12 bg-green-500 rounded-lg mx-auto mb-2 flex items-center justify-center shadow-lg">
                      <MapPin className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      1,247
                    </div>
                    <div className="text-sm text-gray-600">Relatórios</div>
                  </div>
                  <div className="text-center">
                    <div className="h-12 w-12 bg-purple-500 rounded-lg mx-auto mb-2 flex items-center justify-center shadow-lg">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      8,532
                    </div>
                    <div className="text-sm text-gray-600">Usuários</div>
                  </div>
                  <div className="text-center">
                    <div className="h-12 w-12 bg-orange-500 rounded-lg mx-auto mb-2 flex items-center justify-center shadow-lg">
                      <Heart className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      R$ 127k
                    </div>
                    <div className="text-sm text-gray-600">Doações</div>
                  </div>
                  <div className="text-center">
                    <div className="h-12 w-12 bg-red-500 rounded-lg mx-auto mb-2 flex items-center justify-center shadow-lg">
                      <AlertTriangle className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">94</div>
                    <div className="text-sm text-gray-600">Alertas Ativos</div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Como Funciona */}
      <section id="como-funciona" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 scroll-reveal">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Como Funciona
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Nossa plataforma simplifica o monitoramento de enchentes através
              de três passos simples
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Smartphone,
                title: "1. Reporte",
                description:
                  "Use nosso app para reportar situações de risco, alagamentos ou necessidades de ajuda em sua região.",
              },
              {
                icon: Bell,
                title: "2. Receba Alertas",
                description:
                  "Receba notificações em tempo real sobre situações de risco próximas à sua localização.",
              },
              {
                icon: HeartHandshake,
                title: "3. Ajude",
                description:
                  "Participe da comunidade oferecendo ajuda, doações ou compartilhando informações importantes.",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="text-center scroll-reveal"
              >
                <div className="h-16 w-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full mx-auto mb-6 flex items-center justify-center">
                  <item.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {item.title}
                </h3>
                <p className="text-gray-600">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Recursos */}
      <section id="recursos" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 scroll-reveal">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Recursos da Plataforma
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Ferramentas completas para monitoramento e resposta a enchentes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Map,
                title: "Mapa Interativo",
                description:
                  "Visualize relatórios e alertas em tempo real em um mapa interativo de sua região.",
                color: "blue",
              },
              {
                icon: AlertTriangle,
                title: "Sistema de Alertas",
                description:
                  "Receba notificações instantâneas sobre situações de risco próximas a você.",
                color: "red",
              },
              {
                icon: Users,
                title: "Rede de Apoio",
                description:
                  "Conecte-se com vizinhos e voluntários para coordenar ajuda mútua.",
                color: "purple",
              },
              {
                icon: Heart,
                title: "Sistema de Doações",
                description:
                  "Facilite doações para pessoas afetadas através de PIX e campanhas organizadas.",
                color: "green",
              },
              {
                icon: FileText,
                title: "Relatórios Detalhados",
                description:
                  "Gere relatórios completos com fotos, localização e descrição das situações.",
                color: "orange",
              },
              {
                icon: BarChart3,
                title: "Analytics",
                description:
                  "Acompanhe estatísticas e tendências para melhor planejamento preventivo.",
                color: "indigo",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="bg-white rounded-xl p-6 shadow-sm border scroll-reveal hover:shadow-lg transition-all duration-200"
              >
                <div
                  className={`h-12 w-12 bg-${item.color}-100 rounded-lg mb-4 flex items-center justify-center`}
                >
                  <item.icon className={`h-6 w-6 text-${item.color}-600`} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {item.title}
                </h3>
                <p className="text-gray-600">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Seção de Download do App */}
      <AppDownloadSection
        title="Baixe o alaganao"
        description="Tenha alertas em tempo real, reporte enchentes rapidamente e ajude sua comunidade diretamente do seu celular. Disponível para iOS e Android."
        appName="alaganao"
        iosDownloadUrl="https://apps.apple.com"
        androidDownloadUrl="https://play.google.com"
        iphoneMockupSrc="https://images.unsplash.com/photo-1551650975-87deedd944c3?w=300&h=600&fit=crop&crop=center"
        androidMockupSrc="https://images.unsplash.com/photo-1512486130939-2c4f79935e4f?w=300&h=600&fit=crop&crop=center"
      />

      {/* CTA Final */}
      <section className="py-20 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8 scroll-reveal">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Faça Parte da Mudança
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Junte-se a milhares de pessoas que já estão protegendo suas
            comunidades. Cadastre-se gratuitamente e comece a fazer a diferença
            hoje mesmo.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Criar Conta Gratuita
            </Link>
            <Link
              to="/login"
              className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
            >
              Já Tenho Conta
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contato" className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                  <Droplets className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold">alaganao</span>
              </div>
              <p className="text-gray-400">
                Plataforma colaborativa para monitoramento e prevenção de
                enchentes.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Plataforma</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a
                    href="#como-funciona"
                    className="hover:text-white transition-colors"
                  >
                    Como Funciona
                  </a>
                </li>
                <li>
                  <a
                    href="#recursos"
                    className="hover:text-white transition-colors"
                  >
                    Recursos
                  </a>
                </li>
                <li>
                  <Link
                    to="/login"
                    className="hover:text-white transition-colors"
                  >
                    Acessar App
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Comunidade</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a
                    href="#comunidade"
                    className="hover:text-white transition-colors"
                  >
                    Histórias
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Voluntários
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Contato</h3>
              <ul className="space-y-2 text-gray-400">
                <li>contato@floodwatch.com.br</li>
                <li>(11) 99999-9999</li>
                <li>São Paulo, SP</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 alaganao. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        .scroll-reveal {
          opacity: 0;
          transform: translateY(30px);
          transition: all 0.5s ease;
        }

        .animate-fade-in-up {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
}
