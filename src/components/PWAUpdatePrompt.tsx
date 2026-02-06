import { useRegisterSW } from 'virtual:pwa-register/react';

export function PWAUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, r) {
      console.log('SW registered:', swUrl);
      // Check for updates every 30 seconds
      if (r) {
        setInterval(() => {
          r.update();
        }, 30000);
      }
    },
    onRegisterError(error) {
      console.log('SW registration error:', error);
    },
  });

  const close = () => {
    setNeedRefresh(false);
  };

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-blue-600 text-white p-4 rounded-lg shadow-lg max-w-sm">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <p className="font-medium">Neue Version verfügbar!</p>
          <p className="text-sm text-blue-100 mt-1">
            Klicken Sie auf "Aktualisieren" um die neueste Version zu laden.
          </p>
        </div>
        <button
          onClick={close}
          className="text-blue-200 hover:text-white"
        >
          ✕
        </button>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => updateServiceWorker(true)}
          className="bg-white text-blue-600 px-4 py-2 rounded font-medium hover:bg-blue-50"
        >
          Aktualisieren
        </button>
        <button
          onClick={close}
          className="text-blue-200 hover:text-white px-4 py-2"
        >
          Später
        </button>
      </div>
    </div>
  );
}
