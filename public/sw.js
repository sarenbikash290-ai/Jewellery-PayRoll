// ============================================================================
// HRPulse Cleanup Service Worker (Self-Destructing)
// Purpose: Purge old Cache Storage (hrpulse-cache-v1), unregister the worker,
// and return the browser to direct network/Vercel communication.
// ============================================================================

self.addEventListener('install', (event) => {
  // Force the new cleanup worker to skip the 'waiting' state and activate immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // 1. Delete all existing Cache Storage caches (including hrpulse-cache-v1)
      const cacheKeys = await caches.keys();
      await Promise.all(
        cacheKeys.map((key) => {
          console.log('[Cleanup SW] Deleting cache bucket:', key);
          return caches.delete(key);
        })
      );

      // 2. Take control of open tabs immediately while active
      await self.clients.claim();
      console.log('[Cleanup SW] Controlled clients claimed.');

      // 3. Unregister this service worker registration so it stops running
      console.log('[Cleanup SW] Unregistering service worker...');
      await self.registration.unregister();
      console.log('[Cleanup SW] Cleanup completed successfully. Service worker unregistered.');
    })()
  );
});

// Do NOT define a 'fetch' handler.
// Without a fetch event listener, the browser automatically passes 100% of
// network requests directly to Vercel/network, completely bypassing Cache Storage.

