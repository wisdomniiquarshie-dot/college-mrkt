"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Download, Share, X } from "lucide-react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function isIosDevice() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function isAppInstalled() {
  return window.matchMedia("(display-mode: standalone)").matches
    || ("standalone" in window.navigator && window.navigator.standalone === true);
}

function subscribeToAppDisplay(onChange: () => void) {
  const displayMode = window.matchMedia("(display-mode: standalone)");
  displayMode.addEventListener("change", onChange);
  window.addEventListener("appinstalled", onChange);
  return () => {
    displayMode.removeEventListener("change", onChange);
    window.removeEventListener("appinstalled", onChange);
  };
}

function subscribeToNoChanges() {
  return () => {};
}

export function InstallAppPrompt() {
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null);
  const [showIosInstructions, setShowIosInstructions] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const isIos = useSyncExternalStore(subscribeToNoChanges, isIosDevice, () => false);
  const isInstalled = useSyncExternalStore(subscribeToAppDisplay, isAppInstalled, () => false);

  useEffect(() => {
    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setInstallEvent(event as InstallPromptEvent);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  async function installApp() {
    if (!installEvent) return;
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    if (choice.outcome === "accepted") setDismissed(true);
    setInstallEvent(null);
  }

  if (dismissed || isInstalled) return null;

  return (
    <aside
      aria-label="Install College MRKT"
      className="fixed bottom-4 right-4 z-40 w-[min(360px,calc(100vw-2rem))] border border-[#d1b07a] bg-[#fff8e8] p-4 text-[#183527] shadow-[0_12px_36px_rgba(16,56,32,0.22)]"
    >
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#d1b07a] bg-[#15452e] text-xs font-extrabold text-[#fff8e8]">
          CM
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-extrabold">Take College MRKT with you</h2>
          <p className="mt-1 text-xs leading-5 text-[#59645b]">
            Install the student marketplace on your phone for quick access.
          </p>
        </div>
        <button
          type="button"
          aria-label="Dismiss install prompt"
          onClick={() => setDismissed(true)}
          className="grid h-8 w-8 shrink-0 place-items-center text-[#59645b] hover:bg-[#f1e7d2]"
        >
          <X aria-hidden="true" size={17} />
        </button>
      </div>

      {showIosInstructions ? (
        <p className="mt-3 border-t border-[#e6dcc8] pt-3 text-xs leading-5">
          {isIos ? (
            <>
              Tap <Share aria-hidden="true" className="mx-0.5 inline-block h-4 w-4 align-text-bottom" />{" "}
              <strong>Share</strong> in Safari, then choose <strong>Add to Home Screen</strong>.
            </>
          ) : (
            <>Open your browser menu (⋮ or Share), then choose <strong>Install app</strong> or <strong>Add to Home Screen</strong>.</>
          )}
        </p>
      ) : (
        <button
          type="button"
          onClick={installEvent ? installApp : () => setShowIosInstructions(true)}
          className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 bg-[#d1b07a] px-4 text-sm font-extrabold text-[#103820] transition hover:bg-[#ead6aa]"
        >
          {installEvent ? <Download aria-hidden="true" size={16} /> : isIos ? <Share aria-hidden="true" size={16} /> : <Download aria-hidden="true" size={16} />}
          {installEvent ? "Install app" : "Show install steps"}
        </button>
      )}
    </aside>
  );
}
