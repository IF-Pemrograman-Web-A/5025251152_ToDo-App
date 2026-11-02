window.todoSync = (() => {
    const store = window.todoOffline;
    let running = null;
    let serial = Promise.resolve();
    const lockName = `todo-e05-sync-${location.pathname.replace(/[^/]*$/, '')}`;
    function exclusive(run) {
        if (navigator.locks) return navigator.locks.request(lockName, run);
        const next = serial.then(run, run);
        serial = next.catch(() => {});
        return next;
    }
    
    async function report(){}

    const mysqlDate = ms => {
        if (!ms) return null;
        const d = new Date(ms), pad = n => String(n).padStart(2,'0');
        return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    };

    function fromServer(todo) {
        const due = todo.due_date ? new Date(todo.due_date.replace(' ','T')).getTime() : null;
        return {id:Number(todo.id), title:todo.title, desc:todo.description || '',
            completed:Number(todo.is_completed) === 1, notifyAt:due, originalNotifyAt:due,
            notified:Number(todo.is_notified) === 1, image:null, imagePath:todo.image_path, taskType:todo.task_type};
    }

    function validate(todo) {
        if (!todo.title.trim() || Array.from(todo.title).length > 255) throw new Error('Judul wajib diisi, maksimal 255 karakter.');
    }

    async function jsonResponse(response) {
        let data;
        try { data = await response.json(); } catch { throw new Error('Server tidak mengirim JSON. Periksa Apache dan MySQL.'); }
        if (!response.ok || !data.success) throw new Error(data.message || 'Server menolak perubahan.');
        return data;
    }

    async function send(operation) {
        const todo = operation.todo;
        let imagePath = operation.uploadedPath ?? todo.imagePath ?? null;
        if (operation.action !== 'delete' && todo.image instanceof Blob && !operation.uploadedPath) {
            const form = new FormData();
            const extension = todo.image.type === 'image/png' ? 'png' : todo.image.type === 'image/webp' ? 'webp' : 'jpg';
            form.append('photo', todo.image, `todo-photo.${extension}`);
            const upload = await jsonResponse(await fetch('api/upload_photo.php',{method:'POST',body:form}));
            imagePath = upload.image_path;
            await store.uploaded(operation, imagePath);
        }
        return jsonResponse(await fetch('api/sync_todo.php', {
            method:'POST', headers:{'Content-Type':'application/json'},
            body:JSON.stringify({operation_key:operation.operationKey, action:operation.action,
                todo:{id:todo.id,title:todo.title,description:todo.desc || '',completed:Boolean(todo.completed),
                    due_date:mysqlDate(todo.notifyAt), change_due_date:todo.notifyAt !== todo.originalNotifyAt,
                    is_notified:Boolean(todo.notified),image_path:imagePath,task_type:todo.taskType}})
        }));
    }

    async function drain() {
        while (true) {
            const operation = (await store.pending())[0];
            if (!operation) break;
            const result = await send(operation);
            await store.acknowledge(operation, Number(result.id));
            if (operation.action === 'create') window.dispatchEvent(new CustomEvent('todo:id', {
                detail:{oldId:operation.todo.id,newId:Number(result.id)}
            }));
        }
        await report();
    }

    async function sync() {
        if (running) return running;
        if (!navigator.onLine) { await report(); return; }
        running = (async () => {
            try {
                await exclusive(drain);
            } catch (error) {
                console.warn('Antrean tetap disimpan:', error);
                await report(`Belum tersinkron: ${error.message} Perubahan tetap tersimpan di perangkat.`);
            }
        })();
        try { await running; } finally { running = null; }
    }

    const schedule = () => setTimeout(() => sync(), 250);
    async function list(type) {
        let unreachable = false;
        try {
            await exclusive(async () => {
                const response = await fetch(`api/get_todos.php?type=${encodeURIComponent(type)}`, {
                    cache:'no-store', headers:{'X-Todo-Fresh':'1'}
                });
                const data = await jsonResponse(response);
                await store.merge(data.todos.map(fromServer), type);
            });
        } catch (error) { unreachable = true; console.info('Menggunakan tugas lokal:', error.message); }
        const pending = await store.pending();
        await report(unreachable && !pending.length
            ? 'Offline atau server tidak dapat dijangkau — menampilkan tugas yang tersimpan di perangkat.'
            : undefined);
        return store.list(type);
    }

    async function create(todo) {
        validate(todo);
        const record = {...todo, id:`local-${crypto.randomUUID()}`, originalNotifyAt:todo.notifyAt};
        await store.save(record,'create');
        await report(); schedule(); return record.id;
    }

    async function update(todo) {
        validate(todo);
        if (todo.taskType !== 'personal') throw new Error('Tugas Shared hanya dapat dibaca pada versi ini.');
        await store.save({...todo},'update'); await report(); schedule();
    }

    async function remove(id,type) {
        if (type !== 'personal') throw new Error('Tugas Shared tidak dapat dihapus pada versi ini.');
        await store.remove(id,type); await report(); schedule();
    }

    window.addEventListener('online', () => sync());
    window.addEventListener('offline', () => report());
    document.addEventListener('visibilitychange', () => { if (!document.hidden) sync(); });
    setInterval(sync, 30000);
    return {list,create,update,remove,sync};
})();
