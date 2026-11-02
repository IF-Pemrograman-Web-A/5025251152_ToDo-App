// Penyimpanan lokal dan antrean perubahan, terpisah dari versi E03.
window.todoOffline = (() => {
    const opened = new Promise((resolve, reject) => {
        const request = indexedDB.open('todo-e05-offline', 1);
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains('todos')) db.createObjectStore('todos', {keyPath: 'id'});
            if (!db.objectStoreNames.contains('outbox')) db.createObjectStore('outbox', {keyPath: 'operationId', autoIncrement: true});
        };
        request.onsuccess = () => {
            request.result.onversionchange = () => request.result.close();
            resolve(request.result);
        };
        request.onerror = () => reject(request.error);
    });
    async function transaction(stores, mode, run) {
        const db = await opened;
        return new Promise((resolve, reject) => {
            const tx = db.transaction(stores, mode);
            let result;
            tx.oncomplete = () => resolve(typeof result === 'function' ? result() : result);
            tx.onabort = () => reject(tx.error || new Error('Transaksi dibatalkan.'));
            tx.onerror = () => reject(tx.error);
            try { result = run(tx); } catch (error) { tx.abort(); reject(error); }
        });
    }
    const all = (name) => transaction([name], 'readonly', tx => {
        const request = tx.objectStore(name).getAll();
        return () => request.result;
    });
    const save = (todo, action = 'update') => transaction(['todos','outbox'], 'readwrite', tx => {
        tx.objectStore('todos').put(todo);
        tx.objectStore('outbox').add({action, todo, operationKey: crypto.randomUUID(), createdAt: Date.now()});
        return todo;
    });
    const remove = (id, taskType) => transaction(['todos','outbox'], 'readwrite', tx => {
        tx.objectStore('todos').delete(id);
        tx.objectStore('outbox').add({action:'delete', todo:{id,taskType}, operationKey:crypto.randomUUID(), createdAt:Date.now()});
    });
    // Data server tidak boleh menimpa tugas yang masih punya perubahan lokal.
    const merge = (rows, taskType) => transaction(['todos','outbox'], 'readwrite', tx => {
        const queue = tx.objectStore('outbox').getAll();
        queue.onsuccess = () => {
            const protectedIds = new Set(queue.result.map(op => op.todo.id));
            const store = tx.objectStore('todos');
            const local = store.getAll();
            local.onsuccess = () => {
                for (const todo of local.result) {
                    if (todo.taskType === taskType && !protectedIds.has(todo.id)) store.delete(todo.id);
                }
                for (const todo of rows) if (!protectedIds.has(todo.id)) store.put(todo);
            };
        };
    });
    // Setelah create disetujui server, ganti ID lokal di tugas DAN antrean berikutnya.
    const acknowledge = (operation, serverId) => transaction(['todos','outbox'], 'readwrite', tx => {
        const queueStore = tx.objectStore('outbox');
        queueStore.delete(operation.operationId);
        if (operation.action !== 'create') return;
        const oldId = operation.todo.id;
        const store = tx.objectStore('todos');
        const local = store.get(oldId);
        local.onsuccess = () => {
            if (local.result) {
                store.delete(oldId);
                store.put({...local.result, id:serverId});
            }
        };
        const following = queueStore.getAll();
        following.onsuccess = () => {
            for (const entry of following.result) {
                if (entry.todo.id === oldId) queueStore.put({...entry, todo:{...entry.todo,id:serverId}});
            }
        };
    });
    const uploaded = (operation, imagePath) => transaction(['todos','outbox'], 'readwrite', tx => {
        const request = tx.objectStore('outbox').get(operation.operationId);
        request.onsuccess = () => {
            if (request.result) tx.objectStore('outbox').put({...request.result, uploadedPath:imagePath});
        };
    });
    return {
        ready: () => opened.then(() => true),
        list: async type => (await all('todos')).filter(todo => todo.taskType === type),
        pending: () => all('outbox'), save, remove, merge, acknowledge, uploaded
    };
})();
