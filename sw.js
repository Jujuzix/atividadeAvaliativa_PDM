import { offlineFallback, warmStrategyCache } from "workbox-recipes";
import { CacheFirst, StaleWhileRevalidate } from "workbox-strategies";
import { registerRoute } from "workbox-routing";
import { CacheableResponsePlugin } from "workbox-cacheable-response";
import { ExpirationPlugin } from "workbox-expiration";

// Configuração de cache para páginas
const pageCache = new CacheFirst({
cacheName: 'primeira-pwa-cache',
plugins: [
    new CacheableResponsePlugin({
    statuses: [0, 200], // Cache respostas com status 0 (offline) ou 200 (OK)
    }),
    new ExpirationPlugin({
    maxAgeSeconds: 30 * 24 * 60 * 60, // Expira após 30 dias
    }),
],
});

// Indica as páginas que devem ser armazenadas no cache
warmStrategyCache({
urls: ['/index.html', '/', '/offline.html'], // Inclui a página offline no cache
strategy: pageCache,
});

// Registro da rota de navegação (para páginas navegáveis)
registerRoute(
({ request }) => request.mode === 'navigate',
pageCache
);

// Configuração de cache para imagens
registerRoute(
({ request }) => request.destination === 'image',
new CacheFirst({
    cacheName: 'images',
    plugins: [
    new ExpirationPlugin({
        maxAgeSeconds: 60 * 60 * 24 * 30, // Expira após 30 dias
    }),
    ],
})
);

// Configuração de cache para arquivos de estilo, scripts e workers
registerRoute(
({ request }) => ['style', 'script', 'worker'].includes(request.destination),
new StaleWhileRevalidate({
    cacheName: 'asset-cache',
    plugins: [
    new CacheableResponsePlugin({
        statuses: [0, 200], // Cache apenas respostas com status 0 ou 200
    }),
    ],
})
);

// Configuração do fallback offline
offlineFallback({
pageFallback: '/offline.html', // Página a ser exibida quando o usuário estiver offline
});
