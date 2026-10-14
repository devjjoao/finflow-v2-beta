"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").catch(() => {
          // Registro do service worker falhou silenciosamente (ex: dev sem https)
        });
      });
    }
  }, []);

  return null;
}
