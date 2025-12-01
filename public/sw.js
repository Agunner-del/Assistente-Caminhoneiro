const CACHE_NAME = 'copiloto-de-estrada-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/src/main.tsx',
  '/src/App.tsx',
  '/src/pages/Dashboard.tsx',
  '/src/pages/Transactions.tsx',
  '/src/pages/Fuel.tsx',
  '/src/pages/VisualInventory.tsx',
  '/src/pages/Auth.tsx',
  '/src/lib/theme.ts',
  '/src/lib/supabase.ts',
  '/src/stores/authStore.ts'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache aberto');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Background sync for offline data
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-transactions') {
    event.waitUntil(syncTransactions());
  }
});

// Sync transactions when back online
async function syncTransactions() {
  try {
    // Get cached transactions that need to be synced
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match('/api/transactions/sync');
    
    if (response) {
      const transactions = await response.json();
      
      // Send each transaction to the server
      for (const transaction of transactions) {
        try {
          await fetch('/api/transactions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${transaction.token}`
            },
            body: JSON.stringify(transaction.data)
          });
        } catch (error) {
          console.error('Erro ao sincronizar transação:', error);
        }
      }
      
      // Clear synced transactions
      await cache.delete('/api/transactions/sync');
    }
  } catch (error) {
    console.error('Erro ao sincronizar:', error);
  }
}

// Push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data?.text() || 'Nova notificação do Copiloto de Estrada',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    vibrate: [200, 100, 200],
    tag: 'copiloto-notification'
  };

  event.waitUntil(
    self.registration.showNotification('Copiloto de Estrada', options)
  );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});