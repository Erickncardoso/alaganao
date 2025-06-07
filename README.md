# 🌊 Alaganao

https://github.com/Erickncardoso/GS2025

app ativo: https://alaganaoo.vercel.app/

Sistema comunitário de alerta e monitoramento de enchentes em tempo real.

## 🚀 Funcionalidades Principais

### 🎨 Seção Hero Aprimorada ✅

- **Design Visual Impactante**: Gradiente dinâmico com elementos flutuantes animados
- **Estatísticas em Tempo Real**: Cards com dados atualizados de usuários online, alertas ativos e áreas seguras
- **Animações Avançadas**: Efeitos de entrada escalonados, hover interativos e transições suaves
- **Alerta Meteorológico**: Banner dinâmico com informações de precipitação e ventos
- **Painel de Alertas ao Vivo**: Feed em tempo real com diferentes níveis de severidade

### 🗺️ Mapa Interativo 3D

- **Visualização Realística**: Representações vetoriais de água para áreas alagadas
- **Marcadores Dinâmicos**: Diferentes tipos de alertas com animações específicas
- **Rotas de Fuga Automáticas**: Cálculo inteligente de rotas seguras
- **Integração Mapbox**: Mapa 3D com edifícios e navegação avançada

### 🌤️ Dados Meteorológicos

- **API OpenWeatherMap**: Dados reais de clima e precipitação
- **Gráficos Interativos**: Visualização de 7 dias de previsão
- **Alertas de Risco**: Sistema automático baseado em precipitação

### 💰 Sistema de Doações

- **QR Code PIX**: Geração de códigos QR realistas para doações
- **Timer de Expiração**: Códigos com validade de 10 minutos
- **Compartilhamento**: Funcionalidade de compartilhar via Web Share API

## 🌟 **5 MELHORIAS AVANÇADAS IMPLEMENTADAS**

### 1. 🔄 **Integração com Backend - Dados Dinâmicos** ✅

- **Hook useRealTimeData**: Sistema completo de dados em tempo real
- **Simulação WebSocket**: Atualizações automáticas a cada 10 segundos
- **API Mock Inteligente**: Simula backend real com variações estatísticas
- **Gerenciamento de Estado**: Cache automático e sincronização
- **Fallback Gracioso**: Dados estáticos como backup

**Principais recursos:**

- Estatísticas de usuários online que variam dinamicamente
- Contadores de alertas atualizados em tempo real
- Sistema de adição/remoção de alertas
- Interface para simular métodos de backend reais

### 2. 🔔 **Notificações Push em Tempo Real** ✅

- **Hook useNotifications**: Sistema completo de notificações nativas
- **Permissões Inteligentes**: Solicitação automática e gerenciamento de estado
- **Níveis de Urgência**: Low, Normal, Critical com configurações específicas
- **Histórico Completo**: Armazenamento e controle de notificações lidas/não lidas
- **Alertas Automáticos**: Notificações baseadas em enchentes e clima

**Principais recursos:**

- Notificações críticas que requerem interação do usuário
- Auto-close para alertas não críticos (5 segundos)
- Ações personalizadas em notificações (Ver Detalhes, Rota Segura)
- Sistema de retry para notificações que falharam
- Agendamento baseado em previsão do tempo

### 3. 📍 **Geolocalização Avançada** ✅

- **Hook useGeolocation**: Sistema completo de localização em tempo real
- **Alta Precisão**: Configurações otimizadas para precisão máxima
- **Geofences Inteligentes**: Zonas de perigo, segurança e observação
- **Alertas por Proximidade**: Notificações automáticas baseadas em localização
- **Histórico de Movimento**: Tracking de posições com até 100 registros

**Principais recursos:**

- Monitoramento contínuo de localização (watchPosition)
- Cálculo preciso de distâncias (fórmula Haversine)
- Detecção de entrada/saída de zonas (geofencing)
- Busca automática de zonas seguras mais próximas
- Eventos customizados para outros componentes

### 4. 📱 **Modo Offline Completo** ✅

- **Hook useOfflineMode**: Sistema completo de funcionamento offline
- **Cache Inteligente**: Download automático de dados essenciais
- **Fila de Sincronização**: Actions pendentes com retry automático
- **Armazenamento Local**: Persistência robusta com localStorage
- **Sync Automático**: Sincronização quando voltar online

**Principais recursos:**

- Download de dados para uso offline (alertas, clima, mapa)
- Queue de ações para sincronização posterior
- Relatórios offline com sincronização automática
- Indicadores visuais de status de conexão
- Retry inteligente até 3 tentativas por ação

### 5. 📊 **Dashboard de Análise Completo** ✅

- **Componente AnalyticsDashboard**: Interface completa de métricas
- **Múltiplos Tipos de Gráfico**: Área, Linha, Pizza, Barras combinadas
- **KPIs Dinâmicos**: Indicadores com variações percentuais
- **Período Flexível**: Filtros de 24h, 7d, 30d, 3m
- **Insights Automáticos**: Recomendações baseadas em dados

**Principais recursos:**

- 12 gráficos diferentes com dados interativos
- Métricas de sistema (uptime, latência, sync)
- Análise de usuários por hora e engajamento
- Previsão de risco para próximos 7 dias
- Distribuição regional de alertas
- Exportação de dados e refresh manual

## 🎨 Melhorias Visuais Implementadas

### Animações CSS Customizadas

- `animate-float`: Movimento flutuante suave para elementos
- `animate-glow`: Efeito de brilho pulsante
- `animate-shimmer`: Gradiente animado para texto e elementos
- `animate-fadeInUp`: Entrada suave de baixo para cima
- `animate-slideInLeft/Right`: Entrada lateral com efeito deslizante
- `animate-scaleIn`: Entrada com efeito de escala

### Efeitos Visuais

- **Backdrop Blur**: Efeito de desfoque em cards e elementos
- **Gradientes Animados**: Texto com cores em movimento
- **Elementos Flutuantes**: Círculos animados no fundo
- **Padrão SVG**: Textura sutil no background
- **Ondas Decorativas**: Separação visual entre seções

### Interações Melhoradas

- **Hover Effects**: Transformações e sombras em botões
- **Cards Interativos**: Elevação e efeitos ao passar o mouse
- **Botões Responsivos**: Animações de clique e hover
- **Transições Suaves**: Todas as mudanças com timing perfeito

## 🛠️ Tecnologias Utilizadas

- **React 18** - Framework principal
- **TypeScript** - Tipagem estática
- **Vite** - Build tool e dev server
- **Tailwind CSS** - Estilização utilitária
- **Shadcn/UI** - Componentes de interface
- **Mapbox GL JS** - Mapas interativos 3D
- **TanStack Query** - Gerenciamento de estado
- **Lucide React** - Ícones modernos
- **OpenWeatherMap API** - Dados meteorológicos
- **Recharts** - Biblioteca de gráficos interativos

## 🚀 Como Executar

### Pré-requisitos

- Node.js 18+
- npm ou yarn

### Instalação

```bash
# Clone o repositório
git clone [url-do-repositorio]

# Instale as dependências
npm install --legacy-peer-deps

# Configure as variáveis de ambiente
cp .env.example .env
# Adicione sua chave da OpenWeatherMap API
VITE_OPENWEATHER_API_KEY=sua_chave_aqui

# Execute o servidor de desenvolvimento
npm run dev
```

### Build para Produção

```bash
npm run build
npm run preview
```

## 🌟 Destaques da Seção Hero

### Layout Responsivo

- **Grid Adaptativo**: 3 colunas em desktop, empilhamento em mobile
- **Conteúdo Principal**: 2/3 do espaço para informações principais
- **Painel Lateral**: 1/3 para alertas em tempo real

### Elementos Visuais

- **6 Elementos Flutuantes**: Círculos animados com diferentes tamanhos e delays
- **Gradiente Complexo**: Transição de azul escuro para azul médio
- **Padrão de Fundo**: SVG com pontos sutis para textura
- **Decoração de Ondas**: SVG na parte inferior para transição suave

### Estatísticas Dinâmicas

- **Usuários Online**: Dados atualizados em tempo real
- **Alertas Ativos**: Contadores dinâmicos com classificação
- **Áreas Seguras**: Status de funcionalidade

### Sistema de Alertas

- **4 Níveis**: Crítico, Moderado, Informativo, Resolvido
- **Informações Detalhadas**: Localização, tempo, número de reportes
- **Indicador ao Vivo**: Status em tempo real com animação

## 📱 Responsividade

- **Mobile First**: Design otimizado para dispositivos móveis
- **Breakpoints**: sm, md, lg, xl para diferentes tamanhos
- **Grid Flexível**: Adaptação automática do layout
- **Tipografia Escalável**: Tamanhos de fonte responsivos

## 🎯 Rotas Disponíveis

- **/** - Página principal com mapa e seção hero aprimorada
- **/relatar** - Formulário para reportar enchentes
- **/comunidade** - Página da comunidade
- **/alertas** - Lista de alertas ativos
- **/doacoes** - Sistema de doações com PIX QR Code
- **/analytics** - **NOVO!** Dashboard completo de análise de dados

## 🔄 Status dos Sistemas

### ✅ **Sistemas Implementados e Funcionais**

- 🎨 Seção Hero Aprimorada
- 🔄 Dados Dinâmicos em Tempo Real
- 🔔 Notificações Push
- 📍 Geolocalização Avançada
- 📱 Modo Offline
- 📊 Dashboard de Análise

### 🚀 **Próximos Passos Recomendados**

1. **Integração com Backend Real**: Substituir simulações por APIs reais
2. **Service Worker**: PWA para melhor experiência offline
3. **Base de Dados**: Implementar persistência real (PostgreSQL/MongoDB)
4. **Autenticação**: Sistema de login e perfis de usuário
5. **Machine Learning**: Previsão inteligente de enchentes
6. **Push Notifications Server**: Servidor dedicado para notificações

## 🤝 Contribuição

Contribuições são bem-vindas! Por favor, leia as diretrizes de contribuição antes de submeter pull requests.

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

---

## 🎉 **TODAS AS 5 MELHORIAS FORAM IMPLEMENTADAS COM SUCESSO!**

O Flood Watch Community agora possui um sistema completo e avançado de:

- ✅ Dados dinâmicos e tempo real
- ✅ Notificações push inteligentes
- ✅ Geolocalização com geofencing
- ✅ Funcionamento offline robusto
- ✅ Dashboard de análise profissional

**Desenvolvido com ❤️ para proteger comunidades contra enchentes**
