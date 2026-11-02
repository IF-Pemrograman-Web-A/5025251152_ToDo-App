const CACHE_PREFIX = `todo-e05-${self.registration.scope}`;
const SHELL_CACHE = `${CACHE_PREFIX}shell-v8`;
const DATA_CACHE = `${CACHE_PREFIX}data-v1`;

const localUrl = (path) =>
    new URL(path, self.registration.scope).href;

const APP_SHELL = [
    "./index.php",
    "./offline.html",
    "./style.css",
    "./script.js",
    "./offline-db.js",
    "./offline-sync.js",
    "./manifest.webmanifest",
    "./icons/icon-192.png",
    "./icons/icon-512.png"
];

const STATIC_URLS = new Set(
    APP_SHELL.map((path) => localUrl(path))
);

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(SHELL_CACHE)
            .then((cache) => cache.addAll(APP_SHELL))
    );
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(
                keys
                    .filter((key) =>
                        key.startsWith(CACHE_PREFIX) &&
                        key !== SHELL_CACHE &&
                        key !== DATA_CACHE
                    )
                    .map((key) => caches.delete(key))
            ))
            .then(() => self.clients.claim())
    );
});

async function cacheFirst(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);

    if (cached) return cached;

    const response = await fetch(request);

    if (response.ok) {
        await cache.put(request, response.clone());
    }

    return response;
}

async function navigationResponse(request) {
    const cache = await caches.open(SHELL_CACHE);
    const url = new URL(request.url);
    const mainUrl = new URL(localUrl("./index.php"));

    const isMainPage =
        url.pathname === mainUrl.pathname ||
        url.pathname === new URL(self.registration.scope).pathname;

    try {
        const response = await fetch(
            isMainPage ? localUrl("./index.php") : request
        );

        if (isMainPage && response.ok) {
            await cache.put(
                localUrl("./index.php"),
                response.clone()
            );
        }

        return response;
    } catch {
        if (isMainPage) {
            const mainPage = await cache.match(
                localUrl("./index.php")
            );

            if (mainPage) return mainPage;
        }

        return (
            await cache.match(localUrl("./offline.html"))
        ) || new Response("Anda sedang offline.", {
            status: 503,
            headers: {
                "Content-Type": "text/plain; charset=utf-8"
            }
        });
    }
}

async function todoResponse(request) {
    const cache = await caches.open(DATA_CACHE);

    try {
        const response = await fetch(request);

        if (response.ok) {
            const data = await response.clone().json();

            if (data.success && Array.isArray(data.todos)) {
                await cache.put(request, response.clone());
            }
        }

        return response;
    } catch {
        const cached = await cache.match(request);

        if (cached) return cached;

        return new Response(JSON.stringify({
            success: false,
            message: "Daftar ini belum pernah dibuka saat online."
        }), {
            status: 503,
            headers: {
                "Content-Type": "application/json; charset=utf-8"
            }
        });
    }
}

self.addEventListener("fetch", (event) => {
    const request = event.request;
    const url = new URL(request.url);

    if (request.method !== "GET") return;
    // Pembacaan untuk sinkronisasi harus berasal dari server, bukan snapshot cache.
    if (request.headers.get('X-Todo-Fresh') === '1') return;
    if (url.origin !== self.location.origin) return;
    if (!url.href.startsWith(self.registration.scope)) return;

    if (request.mode === "navigate") {
        event.respondWith(navigationResponse(request));
        return;
    }

    if (
        url.pathname ===
        new URL(localUrl("./api/get_todos.php")).pathname
    ) {
        event.respondWith(todoResponse(request));
        return;
    }

    if (STATIC_URLS.has(url.href)) {
        event.respondWith(cacheFirst(request, SHELL_CACHE));
        return;
    }

    if (url.href.startsWith(localUrl("./uploads/"))) {
        event.respondWith(cacheFirst(request, DATA_CACHE));
    }
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();

    const todoId = event.notification.data ? event.notification.data.todoId : null;

    event.waitUntil(
        self.clients
            .matchAll({ type: "window", includeUncontrolled: true })
            .then((clientList) => {
                for (const client of clientList) {
                    if ("focus" in client) {
                        client.postMessage({ type: "OPEN_TODO", todoId: todoId });
                        return client.focus();
                    }
                }

                const target = todoId
                ? "./index.php?todo=" + encodeURIComponent(todoId)
                : "./index.php";
                return self.clients.openWindow(target);
            })
    );
});