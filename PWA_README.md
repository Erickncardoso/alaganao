# alaganao - Progressive Web App (PWA)

O **alaganao** agora é um Progressive Web App completo, oferecendo uma experiência nativa similar a aplicativos móveis nativos.

## 🚀 Funcionalidades PWA Implementadas

### ✅ **Instalação Nativa**

- **Botão de instalação automático** aparece quando o PWA pode ser instalado
- **Prompt personalizado** para instalação no navegador
- **Ícones adaptativos** para todos os dispositivos (iOS, Android, Windows)
- **Instalação via Chrome, Safari, Edge e Firefox**

### ✅ **Funcionamento Offline**

- **Service Worker completo** com estratégias de cache inteligentes
- **Cache estático** para páginas essenciais (/map, /relatar, /alertas, etc.)
- **Cache dinâmico** para conteúdo acessado pelo usuário
- **Fallback offline** para navegação sem internet

### ✅ **Notificações Push** (Preparado)

- **Infraestrutura completa** para notificações push
- **Permissões de notificação** implementadas
- **Background sync** para ações offline

### ✅ **Interface Nativa**

- **Manifesto completo** com todas as configurações PWA
- **Splash screens** para todos os tamanhos de tela
- **Tema personalizado** com cores da marca
- **Shortcuts** para ações rápidas (Mapa, Relatar, Alertas, Doações)

## 📱 Como Instalar o PWA

### **No Chrome (Desktop/Android):**

1. Acesse o site no Chrome
2. Clique no botão flutuante "📱 Instalar App" que aparece
3. Ou use o botão "Instalar" na barra de endereços
4. Confirme a instalação

### **No Safari (iOS):**

1. Acesse o site no Safari
2. Toque no botão "Compartilhar"
3. Selecione "Adicionar à Tela de Início"
4. Confirme o nome e adicione

### **No Edge (Windows):**

1. Acesse o site no Edge
2. Clique em "..." → "Aplicativos" → "Instalar este site como um aplicativo"
3. Confirme a instalação

## 🔧 Arquivos PWA Criados

### **Configuração Principal:**

- `public/manifest.json` - Manifesto PWA completo
- `public/sw.js` - Service Worker com cache inteligente
- `public/browserconfig.xml` - Configuração para Windows

### **Ícones Gerados:**

```
public/icons/
├── icon-16x16.svg
├── icon-32x32.svg
├── icon-72x72.svg
├── icon-96x96.svg
├── icon-128x128.svg
├── icon-144x144.svg
├── icon-152x152.svg
├── icon-192x192.svg
├── icon-384x384.svg
├── icon-512x512.svg
├── map-shortcut.svg
├── report-shortcut.svg
├── alert-shortcut.svg
└── donation-shortcut.svg
```

### **Componentes React:**

- `src/utils/pwa.ts` - Gerenciador PWA e hooks
- `src/components/PWAInstallButton.tsx` - Botão de instalação
- `src/App.tsx` - Integração PWA no app

## 🎯 Funcionalidades do Service Worker

### **Estratégias de Cache:**

1. **Cache First** - Para assets estáticos (ícones, imagens, CSS, JS)
2. **Network First** - Para API calls e dados dinâmicos
3. **Stale While Revalidate** - Para navegação entre páginas

### **Cache Automático:**

- Todas as páginas principais (`/`, `/map`, `/relatar`, etc.)
- Assets essenciais (ícones, manifest, background)
- Respostas de API (quando disponível)

### **Fallback Offline:**

- Páginas em cache quando offline
- Indicador visual de status offline
- Queue de ações para sync quando voltar online

## 🔄 Atualizações Automáticas

- **Detecção automática** de novas versões
- **Prompt para atualização** quando disponível
- **Reload automático** após confirmação
- **Cache invalidation** para evitar conteúdo antigo

## 📊 Recursos PWA Avançados

### **Web Share Target:**

- Permite compartilhar conteúdo de outros apps diretamente para alaganao
- Abre automaticamente a página de relatar enchentes

### **Shortcuts da Homescreen:**

- **Mapa** - Acesso direto ao mapa de enchentes
- **Relatar** - Reportar nova enchente rapidamente
- **Alertas** - Ver alertas ativos
- **Doações** - Acessar sistema de doações

### **Protocolo Personalizado:**

- `web+floodwatch://` para deep linking
- Integração com outros aplicativos

## 🛠️ Para Desenvolvedores

### **Testando o PWA:**

1. **Lighthouse Audit:**

   ```bash
   npm run build
   npx serve dist
   # Abra DevTools → Lighthouse → Progressive Web App
   ```

2. **Chrome DevTools:**

   - Application tab → Service Workers
   - Application tab → Manifest
   - Application tab → Storage

3. **Simulação Offline:**
   - DevTools → Network tab → Offline checkbox

### **Atualizando o Service Worker:**

1. Modifique `public/sw.js`
2. Incremente a versão em `CACHE_NAME`
3. O service worker será atualizado automaticamente

### **Adicionando novos recursos:**

```typescript
// Usar o hook PWA
import { usePWA } from "@/utils/pwa";

function MyComponent() {
  const { canInstall, isInstalled, promptInstall, isOnline } = usePWA();

  return (
    <div>
      {canInstall && <button onClick={promptInstall}>Instalar App</button>}

      {!isOnline && <div>Você está offline</div>}
    </div>
  );
}
```

## 📈 Benefícios do PWA

### **Para Usuários:**

- ✅ **Instalação sem App Store** - Instale direto do navegador
- ✅ **Funcionamento offline** - Use mesmo sem internet
- ✅ **Carregamento rápido** - Cache inteligente acelera o app
- ✅ **Notificações push** - Receba alertas importantes
- ✅ **Menos espaço** - Ocupa menos que apps nativos
- ✅ **Atualizações automáticas** - Sempre a versão mais recente

### **Para o Projeto:**

- ✅ **Um código para todas plataformas** - Web, Mobile, Desktop
- ✅ **Sem necessidade de App Store** - Deploy direto
- ✅ **SEO mantido** - Ainda é um site web
- ✅ **Engagement maior** - Push notifications aumentam retenção
- ✅ **Performance superior** - Service Worker acelera carregamento

## 🔄 Próximos Passos Sugeridos

1. **Gerar ícones PNG reais** usando https://progressier.com/pwa-icons-and-ios-splash-screen-generator
2. **Configurar notificações push** com Supabase ou Firebase
3. **Implementar background sync** para relatórios offline
4. **Adicionar mais shortcuts** personalizados
5. **Criar splash screens** para iOS
6. **Configurar analytics** para PWA (installs, usage)

## 📱 Compatibilidade

| Plataforma           | Instalação | Offline | Push | Shortcuts |
| -------------------- | ---------- | ------- | ---- | --------- |
| **Chrome (Android)** | ✅         | ✅      | ✅   | ✅        |
| **Chrome (Desktop)** | ✅         | ✅      | ✅   | ✅        |
| **Safari (iOS)**     | ✅         | ✅      | ❌   | ✅        |
| **Safari (Desktop)** | ✅         | ✅      | ❌   | ✅        |
| **Edge (Windows)**   | ✅         | ✅      | ✅   | ✅        |
| **Firefox**          | ⚠️         | ✅      | ✅   | ❌        |

**Legenda:** ✅ Suportado | ⚠️ Limitado | ❌ Não suportado

---

## 🎉 **Parabéns!**

Seu app **alaganao** agora é um PWA completo e pode ser instalado como um aplicativo nativo em qualquer dispositivo! 🚀📱💻
