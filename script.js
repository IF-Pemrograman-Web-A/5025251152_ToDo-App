const DB_NAME = "todo-db";
const DB_VERSION = 1;
const STORE_NAME = "todos";

let db = null;

function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = function (event) {
            const database = event.target.result;
            database.createObjectStore(STORE_NAME, {
                keyPath: "id",
                autoIncrement: true
            });
        };
        request.onsuccess = function (event) {
            resolve(event.target.result);
        };
        request.onerror = function () {
            reject(request.error);
        };
    });
}

function getAllTodos() {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const request = tx.objectStore(STORE_NAME).getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function addTodoToDB(todo) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const request = tx.objectStore(STORE_NAME).add(todo);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function updateTodoInDB(todo) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const request = tx.objectStore(STORE_NAME).put(todo);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

function deleteTodoFromDB(id) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const request = tx.objectStore(STORE_NAME).delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

let todos = [];
let selectedId = null;

const todoForm   = document.getElementById("todo-form");
const todoInput  = document.getElementById("todo-input");
const todoListEl = document.getElementById("todo-list");

const editTitle  = document.getElementById("edit-title");
const editDesc   = document.getElementById("edit-desc");
const saveDetailBtn = document.getElementById("save-detail");

const themeToggleBtn = document.getElementById("theme-toggle");

const appMessage  = document.getElementById("app-message");
const liveRegion  = document.getElementById("live-region");
const listHeading = document.getElementById("list-heading");

function announce(message) {
    liveRegion.textContent = "";
    setTimeout(() => { liveRegion.textContent = message; }, 50);
}

function showMessage(message) {
    appMessage.textContent = message;
}

function clearMessage() {
    appMessage.textContent = "";
}

function setEditorFieldsEnabled(enabled) {
    editTitle.disabled = !enabled;
    editDesc.disabled = !enabled;
    saveDetailBtn.disabled = !enabled;
}

const formNotify     = document.getElementById("todo-notify");
const formNotifyHint = document.getElementById("todo-notify-hint");
const editNotify     = document.getElementById("edit-notify");
const editNotifyHint = document.getElementById("edit-notify-hint");

const THEME_KEY = "theme";

function applyTheme(theme) {
    if (theme === "dark") {
        document.body.classList.add("dark-mode");
        themeToggleBtn.textContent = "Mode Terang";
    } else {
        document.body.classList.remove("dark-mode");
        themeToggleBtn.textContent = "Mode Gelap";
    }
}

function loadTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY);
    applyTheme(savedTheme === "dark" ? "dark" : "light");
}

themeToggleBtn.addEventListener("click", function () {
    const isDark = document.body.classList.contains("dark-mode");
    const newTheme = isDark ? "light" : "dark";
    applyTheme(newTheme);
    localStorage.setItem(THEME_KEY, newTheme);
    announce(newTheme === "dark" ? "Mode gelap aktif" : "Mode terang aktif");
});

    function createPhotoPicker(root) {
    const fileInput   = root.querySelector('input[type="file"]');
    const openBtn     = root.querySelector(".camera-open");
    const video       = root.querySelector(".camera-video");
    const canvas      = root.querySelector(".camera-canvas");
    const controls    = root.querySelector(".camera-controls");
    const captureBtn  = root.querySelector(".camera-capture");
    const closeBtn    = root.querySelector(".camera-close");
    const previewWrap = root.querySelector(".photo-preview");
    const previewImg  = root.querySelector(".photo-preview-img");
    const removeBtn   = root.querySelector(".photo-remove");
    const statusEl    = root.querySelector(".photo-status");

    let photo = null;
    let previewUrl = null;
    let stream = null;

    function setStatus(message) {
        statusEl.textContent = message;
    }

    function setPhoto(blob, altText) {
        photo = blob || null;

        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            previewUrl = null;
        }

        if (photo) {
            previewUrl = URL.createObjectURL(photo);
            previewImg.src = previewUrl;
            if (altText) previewImg.alt = altText;
            previewWrap.hidden = false;
        } else {
            previewImg.removeAttribute("src");
            previewWrap.hidden = true;
        }

        fileInput.value = "";
    }

    function closeCamera() {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
        }
        video.hidden = true;
        controls.hidden = true;
        openBtn.hidden = false;
    }

    async function openCamera() {
        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
            video.srcObject = stream;
            video.hidden = false;
            controls.hidden = false;
            openBtn.hidden = true;
            setStatus("");
        } catch (err) {
            console.error(err);
            setStatus("Kamera tidak bisa diakses.");
        }
    }

    function setEnabled(enabled) {
        removeBtn.disabled = !enabled;
        openBtn.disabled = !enabled;
        fileInput.disabled = !enabled;
    }

    openBtn.addEventListener("click", openCamera);
    closeBtn.addEventListener("click", closeCamera);

    captureBtn.addEventListener("click", () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext("2d").drawImage(video, 0, 0);
        canvas.toBlob((blob) => {
            setPhoto(blob, "Foto dari kamera");
            setStatus("Foto diambil.");
            closeCamera();
        }, "image/jpeg");
    });

    removeBtn.addEventListener("click", function () {
        setPhoto(null);
        setStatus("Foto dihapus.");
    });

    fileInput.addEventListener("change", function () {
        const file = fileInput.files[0];
        if (!file) return;
        setPhoto(file);
        setStatus("Foto dipilih.");
    });

    const api = {
        getPhoto: () => photo,
        setPhoto: setPhoto,
        setStatus: setStatus,
        setEnabled: setEnabled
    };
    return api;
}

const formPicker = createPhotoPicker(document.getElementById("form-photo-field"));
const editPicker = createPhotoPicker(document.getElementById("edit-photo-field"));
editPicker.setEnabled(false);

function autoResizeTextarea(el){
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
}

editDesc.addEventListener("input", () => autoResizeTextarea(editDesc));
editTitle.addEventListener("input", () => editTitle.removeAttribute("aria-invalid"));

function renderTodos(){
    let focusedId = null;
    let focusedRole = null;
    const activeEl = document.activeElement;
    if (activeEl && todoListEl.contains(activeEl) && activeEl.dataset.role) {
        focusedId = activeEl.closest("li").dataset.id;
        focusedRole = activeEl.dataset.role;
    }

    todoListEl.innerHTML = "";

    if (todos.length === 0) {
        const empty = document.createElement("li");
        empty.className = "todo-empty";
        empty.textContent = "Belum ada tugas.";
        todoListEl.appendChild(empty);
    }

    todos.forEach((todo) => {
        const li = document.createElement("li");
        li.className = "todo-item" +
            (todo.completed ? " completed" : "") +
            (todo.id === selectedId ? " active" : "");
        li.dataset.id = todo.id;

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = todo.completed;
        checkbox.dataset.role = "check";
        checkbox.setAttribute("aria-label", "Tandai selesai: " + todo.title);
        checkbox.addEventListener("change", () => toggleComplete(todo.id));

        const textBtn = document.createElement("button");
        textBtn.type = "button";
        textBtn.className = "todo-text";
        textBtn.dataset.role = "select";
        textBtn.textContent = todo.title;
        if (todo.id === selectedId) textBtn.setAttribute("aria-current", "true");
        if (todo.notifyAt) {
            const time = document.createElement("small");
            time.className = "todo-time";
            time.textContent = formatNotifyTime(todo.notifyAt);
            textBtn.appendChild(time);
        }
        textBtn.addEventListener("click", () => {
            selectTodo(todo.id);
            announce("Detail tugas ditampilkan: " + todo.title);
        });

        const editBtn = document.createElement("button");
        editBtn.type = "button";
        editBtn.className = "icon-btn edit-btn";
        editBtn.dataset.role = "edit";
        editBtn.textContent = "Edit";
        editBtn.setAttribute("aria-label", "Edit tugas: " + todo.title);
        editBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            selectTodo(todo.id);
            editTitle.focus();
        });

        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.className = "icon-btn delete-btn";
        deleteBtn.dataset.role = "delete";
        deleteBtn.textContent = "Hapus";
        deleteBtn.setAttribute("aria-label", "Hapus tugas: " + todo.title);
        deleteBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            deleteTodo(todo.id);
        });

        li.appendChild(checkbox);
        li.appendChild(textBtn);
        li.appendChild(editBtn);
        li.appendChild(deleteBtn);

        todoListEl.appendChild(li);
    });

    if (focusedId !== null) {
        const target = todoListEl.querySelector(
            'li[data-id="' + focusedId + '"] [data-role="' + focusedRole + '"]'
        );
        if (target) target.focus();
    }

    if (!todos.find((t) => t.id === selectedId)){
        selectedId = null;
        editTitle.value = "";
        editDesc.value = "";
        autoResizeTextarea(editDesc);
        editPicker.setPhoto(null);
        editPicker.setStatus("");
        editPicker.setEnabled(false);
        editNotify.value = "";
        editNotify.disabled = true;
        setEditorFieldsEnabled(false);
    }
}

todoForm.addEventListener("submit", async function (e){
    e.preventDefault();
    clearMessage();

    const value = todoInput.value.trim();
    if (value === "") {
        showMessage("Judul tugas tidak boleh kosong.");
        todoInput.focus();
        return;
    }

    let notifyAt = null;
    if (formNotify.value) {
        notifyAt = new Date(formNotify.value).getTime();
        if (isNaN(notifyAt) || notifyAt <= Date.now()) {
            formNotifyHint.textContent = "Waktu notifikasi harus di masa depan.";
            formNotify.setAttribute("aria-invalid", "true");
            formNotify.focus();
            return;
        }
        await ensureNotificationPermission();
    }

    const newTodo = {
        title: value,
        desc: "",
        completed: false,
        image: formPicker.getPhoto(),
        notifyAt: notifyAt,
        notified: false
    };

    try {
        const newId = await addTodoToDB(newTodo);
        newTodo.id = newId;
        todos.push(newTodo);
        todoInput.value = "";
        formNotify.value = "";
        updateNotifyHints();
        formPicker.setPhoto(null);
        formPicker.setStatus("");
        renderTodos();
        announce("Tugas ditambahkan: " + value);
        todoInput.focus();
    } catch (error) {
        console.error("Gagal menyimpan tugas:", error);
        showMessage("Tugas gagal disimpan.");
    }
});

function selectTodo(id){
    const todo = todos.find((t) => t.id === id);
    if (!todo) return;

    selectedId = id;
    editTitle.value = todo.title;
    editDesc.value = todo.desc;
    autoResizeTextarea(editDesc);

    editPicker.setPhoto(todo.image, "Foto untuk tugas: " + todo.title);
    editPicker.setStatus("");
    editPicker.setEnabled(true);

    editNotify.value = todo.notifyAt ? toLocalInputValue(todo.notifyAt) : "";
    editNotify.disabled = false;
    setEditorFieldsEnabled(true);
    updateNotifyHints();

    renderTodos();
}

saveDetailBtn.addEventListener("click", async function () {
    clearMessage();

    if(selectedId === null){
        showMessage("Pilih tugas terlebih dahulu untuk diedit.");
        return;
    }

    const todo = todos.find((t) => t.id === selectedId);
    if(!todo) return;

    const newTitle = editTitle.value.trim();
    if(newTitle === ""){
        showMessage("Judul tugas tidak boleh kosong.");
        editTitle.setAttribute("aria-invalid", "true");
        editTitle.focus();
        return;
    }

    let newNotifyAt = null;
    if (editNotify.value) {
        newNotifyAt = new Date(editNotify.value).getTime();
        const changed = newNotifyAt !== todo.notifyAt;
        if (changed && (isNaN(newNotifyAt) || newNotifyAt <= Date.now())) {
            editNotifyHint.textContent = "Waktu notifikasi harus di masa depan.";
            editNotify.setAttribute("aria-invalid", "true");
            editNotify.focus();
            return;
        }
        await ensureNotificationPermission();
    }

    if (newNotifyAt !== (todo.notifyAt || null)) {
        todo.notified = false;
    }
    todo.notifyAt = newNotifyAt;

    todo.title = newTitle;
    todo.desc = editDesc.value;
    todo.image = editPicker.getPhoto();

    try {
        await updateTodoInDB(todo);
        editPicker.setStatus("Perubahan disimpan.");
        updateNotifyHints();
        renderTodos();
    } catch (error) {
        console.error("Gagal memperbarui tugas:", error);
        showMessage("Perubahan gagal disimpan.");
    }
});

async function toggleComplete(id){
    const todo = todos.find((t) => t.id === id);
    if (!todo) return;

    todo.completed = !todo.completed;

    try {
        await updateTodoInDB(todo);
        renderTodos();
        announce("Tugas " + todo.title + (todo.completed ? " ditandai selesai" : " ditandai belum selesai"));
    } catch (error) {
        console.error("Gagal memperbarui status:", error);
        todo.completed = !todo.completed;
        renderTodos();
    }
}

async function deleteTodo(id){
    clearMessage();
    const todo = todos.find((t) => t.id === id);

    try {
        await deleteTodoFromDB(id);
        todos = todos.filter((t) => t.id !== id);
        renderTodos();
        announce("Tugas dihapus: " + (todo ? todo.title : ""));
        listHeading.focus();
    } catch (error) {
        console.error("Gagal menghapus tugas:", error);
        showMessage("Tugas gagal dihapus.");
    }
}

let swRegistration = null;

async function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) {
        console.warn("Browser ini tidak mendukung Service Worker.");
        return;
    }

    try {
        await navigator.serviceWorker.register("sw.js");
        swRegistration = await navigator.serviceWorker.ready;
    } catch (error) {
        console.error("Service Worker gagal didaftarkan:", error);
    }

    navigator.serviceWorker.addEventListener("message", function (event) {
        if (event.data && event.data.type === "OPEN_TODO" && event.data.todoId) {
            selectTodo(event.data.todoId);
        }
    });
}

function permissionHintText() {
    if (!("Notification" in window)) {
        return "Browser ini tidak mendukung notifikasi.";
    }
    if (Notification.permission === "granted") {
        return "Notifikasi aktif.";
    }
    if (Notification.permission === "denied") {
        return "Notifikasi diblokir di browser. Ubah izin situs agar pengingat bisa muncul.";
    }
    return "Izin notifikasi akan diminta saat kamu menekan Simpan.";
}

function updateNotifyHints() {
    const text = permissionHintText();
    formNotifyHint.textContent = text;
    editNotifyHint.textContent = text;
    formNotify.removeAttribute("aria-invalid");
    editNotify.removeAttribute("aria-invalid");
}

async function ensureNotificationPermission() {
    if ("Notification" in window && Notification.permission === "default") {
        try {
            await Notification.requestPermission();
        } catch (error) {
            console.error("Gagal meminta izin notifikasi:", error);
        }
    }
    updateNotifyHints();
}

function toLocalInputValue(ms) {
    const d = new Date(ms);
    const pad = (n) => String(n).padStart(2, "0");
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) +
        "T" + pad(d.getHours()) + ":" + pad(d.getMinutes());
}

function formatNotifyTime(ms) {
    return new Date(ms).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

async function showReminder(todo) {
    const options = {
        body: todo.title,
        tag: "todo-" + todo.id,
        data: { todoId: todo.id },
        lang: "id"
    };

    if (swRegistration) {
        try {
            await swRegistration.showNotification("Pengingat Tugas", options);
            return;
        } catch (error) {
            console.error("Notifikasi lewat Service Worker gagal:", error);
        }
    }

    if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Pengingat Tugas", options);
    }
}

async function checkReminders() {
    if (!("Notification" in window) || Notification.permission !== "granted") return;

    const now = Date.now();
    const dueTodos = todos.filter((t) =>
        t.notifyAt && !t.notified && !t.completed && t.notifyAt <= now
    );

    for (const todo of dueTodos) {
        todo.notified = true;
        try {
            await updateTodoInDB(todo);
        } catch (error) {
            console.error("Gagal menyimpan status notifikasi:", error);
        }
        await showReminder(todo);
    }
}

setInterval(checkReminders, 15000);
document.addEventListener("visibilitychange", function () {
    if (!document.hidden) checkReminders();
});

formNotify.addEventListener("input", updateNotifyHints);
editNotify.addEventListener("input", updateNotifyHints);

async function init() {
    loadTheme();

    try {
        db = await openDatabase();
        todos = await getAllTodos();
    } catch (error) {
        console.error("Database gagal dibuka:", error);
        showMessage("Penyimpanan data tidak tersedia di browser ini.");
    }

    renderTodos();
    autoResizeTextarea(editDesc);
    updateNotifyHints();

    await registerServiceWorker();
    checkReminders();

    const todoIdFromUrl = Number(new URLSearchParams(location.search).get("todo"));
    if (todoIdFromUrl) selectTodo(todoIdFromUrl);
}

init();
