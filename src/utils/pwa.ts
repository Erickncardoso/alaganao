// Utilitários para PWA e Service Worker

export interface PWAInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export class PWAManager {
  private static instance: PWAManager;
  private deferredPrompt: PWAInstallPromptEvent | null = null;
  private isInstalled = false;
  private isStandalone = false;

  private constructor() {
    this.init();
  }

  public static getInstance(): PWAManager {
    if (!PWAManager.instance) {
      PWAManager.instance = new PWAManager();
    }
    return PWAManager.instance;
  }

  private init() {
    // Detectar se está rodando como PWA
    this.isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes("android-app://");

    // Detectar se está instalado
    this.isInstalled = this.isStandalone;

    // Escutar evento de prompt de instalação
    window.addEventListener(
      "beforeinstallprompt",
      this.handleBeforeInstallPrompt.bind(this)
    );

    // Escutar evento de app instalado
    window.addEventListener("appinstalled", this.handleAppInstalled.bind(this));

    // Verificar suporte a service worker
    if ("serviceWorker" in navigator) {
      this.registerServiceWorker();
    }
  }

  private handleBeforeInstallPrompt(e: Event) {
    e.preventDefault();
    this.deferredPrompt = e as PWAInstallPromptEvent;
    console.log("PWA install prompt captured");
  }

  private handleAppInstalled() {
    this.isInstalled = true;
    this.deferredPrompt = null;
    console.log("PWA installed successfully");
  }

  private async registerServiceWorker() {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });

      console.log("Service Worker registered:", registration);

      // Escutar atualizações
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              this.showUpdateAvailable();
            }
          });
        }
      });
    } catch (error) {
      console.error("Service Worker registration failed:", error);
    }
  }

  public async promptInstall(): Promise<boolean> {
    if (!this.deferredPrompt) {
      console.log("No install prompt available");
      return false;
    }

    try {
      await this.deferredPrompt.prompt();
      const choiceResult = await this.deferredPrompt.userChoice;

      if (choiceResult.outcome === "accepted") {
        console.log("User accepted the install prompt");
        return true;
      } else {
        console.log("User dismissed the install prompt");
        return false;
      }
    } catch (error) {
      console.error("Error showing install prompt:", error);
      return false;
    } finally {
      this.deferredPrompt = null;
    }
  }

  public canInstall(): boolean {
    return !!this.deferredPrompt && !this.isInstalled;
  }

  public getIsInstalled(): boolean {
    return this.isInstalled;
  }

  public getIsStandalone(): boolean {
    return this.isStandalone;
  }

  private showUpdateAvailable() {
    if (confirm("Nova versão disponível! Deseja atualizar o app?")) {
      window.location.reload();
    }
  }

  // Métodos para cache offline
  public async addToOfflineQueue(action: any) {
    try {
      const offlineActions = JSON.parse(
        localStorage.getItem("pwa_offline_actions") || "[]"
      );
      offlineActions.push({
        id: Date.now(),
        action,
        timestamp: new Date().toISOString(),
      });
      localStorage.setItem(
        "pwa_offline_actions",
        JSON.stringify(offlineActions)
      );
    } catch (error) {
      console.error("Failed to add action to offline queue:", error);
    }
  }

  public getOfflineActions() {
    try {
      return JSON.parse(localStorage.getItem("pwa_offline_actions") || "[]");
    } catch (error) {
      console.error("Failed to get offline actions:", error);
      return [];
    }
  }

  public clearOfflineActions() {
    localStorage.removeItem("pwa_offline_actions");
  }

  // Detectar status de rede
  public isOnline(): boolean {
    return navigator.onLine;
  }

  public onNetworkChange(callback: (isOnline: boolean) => void) {
    const handleOnline = () => callback(true);
    const handleOffline = () => callback(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }
}

// Hook React para usar o PWA Manager
export const usePWA = () => {
  const pwa = PWAManager.getInstance();

  return {
    canInstall: pwa.canInstall(),
    isInstalled: pwa.getIsInstalled(),
    isStandalone: pwa.getIsStandalone(),
    isOnline: pwa.isOnline(),
    promptInstall: () => pwa.promptInstall(),
    addToOfflineQueue: (action: any) => pwa.addToOfflineQueue(action),
    getOfflineActions: () => pwa.getOfflineActions(),
    clearOfflineActions: () => pwa.clearOfflineActions(),
    onNetworkChange: (callback: (isOnline: boolean) => void) =>
      pwa.onNetworkChange(callback),
  };
};
