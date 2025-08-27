"use client";

import { useEffect, useState } from "react";
import { X, Download, Share } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Check if app is already installed (standalone mode)
    const checkStandalone = () => {
      const standalone = window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone ||
        document.referrer.includes("android-app://");
      setIsStandalone(standalone);
      return standalone;
    };

    // Check if device is mobile
    const checkMobile = () => {
      const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      ) || window.innerWidth < 768;
      setIsMobile(mobile);
      return mobile;
    };

    // Check if iOS
    const checkIOS = () => {
      const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      setIsIOS(ios);
      return ios;
    };

    // Only show prompt on mobile devices that haven't installed the app
    if (!checkStandalone() && checkMobile()) {
      const isIOSDevice = checkIOS();
      
      // Check if user has dismissed the prompt before
      const dismissed = localStorage.getItem("pwa-prompt-dismissed");
      const dismissedTime = dismissed ? parseInt(dismissed) : 0;
      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
      
      // Show prompt if never dismissed or more than 7 days since last dismissal
      if (!dismissed || daysSinceDismissed > 7) {
        // For iOS, show custom prompt immediately
        if (isIOSDevice) {
          setTimeout(() => setShowPrompt(true), 2000);
        }
      }
    }

    // Listen for beforeinstallprompt event (Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Check dismissal status
      const dismissed = localStorage.getItem("pwa-prompt-dismissed");
      const dismissedTime = dismissed ? parseInt(dismissed) : 0;
      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
      
      if (!dismissed || daysSinceDismissed > 7) {
        setTimeout(() => setShowPrompt(true), 2000);
      }
    };

    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.error("Service worker registration failed:", err);
      });
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (isIOS) {
      // iOS doesn't support programmatic install, user must do it manually
      setShowPrompt(true);
    } else if (deferredPrompt) {
      // Android/Chrome install
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("pwa-prompt-dismissed", Date.now().toString());
  };

  // Don't show on desktop or if app is installed
  if (!isMobile || isStandalone || !showPrompt) {
    return null;
  }

  // iOS-specific prompt
  if (isIOS) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center animate-in fade-in duration-300">
        <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-t-3xl p-6 pb-8 animate-in slide-in-from-bottom duration-300">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center p-2">
                <svg viewBox="0 0 200 200" className="w-full h-full">
                  <path 
                    d="M40 20 C20 20, 0 40, 0 60 L0 140 C0 160, 20 180, 40 180 L80 180 L80 120 C80 100, 100 80, 120 80 L180 80 L180 60 C180 40, 160 20, 140 20 Z M120 100 C100 100, 100 100, 100 120 L100 160 L140 160 C160 160, 180 140, 180 120 L180 100 Z M100 160 L180 100" 
                    fill="black"
                    fillRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-lg">Install stickr</h3>
                <p className="text-sm text-gray-500">Add to Home Screen</p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
            <p>Install stickr for the best experience:</p>
            <ol className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-semibold">
                  1
                </span>
                <div className="flex items-center gap-2">
                  <span>Tap the</span>
                  <Share size={16} className="text-blue-500" />
                  <span>share button</span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-semibold">
                  2
                </span>
                <span>Scroll down and tap "Add to Home Screen"</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-semibold">
                  3
                </span>
                <span>Tap "Add" to install</span>
              </li>
            </ol>
          </div>

          <button
            onClick={handleDismiss}
            className="w-full mt-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity"
          >
            Got it!
          </button>
        </div>
      </div>
    );
  }

  // Android/Chrome prompt
  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 animate-in slide-in-from-bottom duration-300">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-4 border border-gray-200 dark:border-gray-800">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center flex-shrink-0 p-2">
            <svg viewBox="0 0 200 200" className="w-full h-full">
              <path 
                d="M40 20 C20 20, 0 40, 0 60 L0 140 C0 160, 20 180, 40 180 L80 180 L80 120 C80 100, 100 80, 120 80 L180 80 L180 60 C180 40, 160 20, 140 20 Z M120 100 C100 100, 100 100, 100 120 L100 160 L140 160 C160 160, 180 140, 180 120 L180 100 Z M100 160 L180 100" 
                fill="black"
                className="dark:fill-white"
                fillRule="evenodd"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-base mb-1">Install stickr</h3>
            <p className="text-sm text-gray-500 mb-3">
              Add to your home screen for the best experience
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleInstall}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-sm"
              >
                <Download size={16} />
                Install
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-2 text-gray-500 hover:text-gray-700 transition-colors text-sm"
              >
                Not now
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}