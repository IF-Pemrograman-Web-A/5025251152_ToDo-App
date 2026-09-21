let todos=[
    {
        id: 1,
        title: "Membuat Website To Do List",
        desc: "Membuat website To Do List menggunakan HTML dan CSS. Website ini akan menjadi reminder tentang tugas-tugas yang perlu dikerjakan.",
        completed: false
    },
    {
        id: 2,
        title: "Push Rank Kaggle",
        desc: "Ikut kompetisi di Kaggle dan naikkan ranking.",
        completed: false
    },
    {
        id: 3,
        title: "Belanja Bulanan",
        desc: "Beli kebutuhan bulanan di supermarket.",
        completed: false
    }
];

let nextId = 4;
let selectedId = null;

const todoForm   = document.getElementById("todo-form");
const todoInput  = document.getElementById("todo-input");
const todoListEl = document.getElementById("todo-list");

const editTitle  = document.getElementById("edit-title");
const editDesc   = document.getElementById("edit-desc");
const saveDetailBtn = document.getElementById("save-detail");

const themeToggleBtn = document.getElementById("theme-toggle");

function autoResizeTextarea(el){
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
}

editDesc.addEventListener("input", () => autoResizeTextarea(editDesc));

function renderTodos(){
    todoListEl.innerHTML = "";

    todos.forEach((todo) => {
        const li = document.createElement("li");
        li.className = "todo-item" +
            (todo.completed ? " completed" : "") +
            (todo.id === selectedId ? " active" : "");
        li.dataset.id = todo.id;

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = todo.completed;
        checkbox.addEventListener("change", () => toggleComplete(todo.id));

        const span = document.createElement("span");
        span.className = "todo-text";
        span.textContent = todo.title;
        span.addEventListener("click", () => selectTodo(todo.id));

        const editBtn = document.createElement("button");
        editBtn.type = "button";
        editBtn.className = "icon-btn edit-btn";
        editBtn.textContent = "Edit";
        editBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            selectTodo(todo.id);
        });

        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.className = "icon-btn delete-btn";
        deleteBtn.textContent = "Hapus";
        deleteBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            deleteTodo(todo.id);
        });

        li.appendChild(checkbox);
        li.appendChild(span);
        li.appendChild(editBtn);
        li.appendChild(deleteBtn);

        todoListEl.appendChild(li);
    });

    if (!todos.find((t) => t.id === selectedId)){
        selectedId = null;
        editTitle.value = "";
        editDesc.value = "";
        autoResizeTextarea(editDesc);
    }
}

todoForm.addEventListener("submit", function (e){
    e.preventDefault();

    const value = todoInput.value.trim();
    if (value === "") return;

    const newTodo = {
        id: nextId++,
        title: value,
        desc: "",
        completed: false
    };

    todos.push(newTodo);
    todoInput.value = "";
    renderTodos();
});

function selectTodo(id){
    const todo = todos.find((t) => t.id === id);
    if (!todo) return;

    selectedId = id;
    editTitle.value = todo.title;
    editDesc.value = todo.desc;
    autoResizeTextarea(editDesc);

    renderTodos();
}

saveDetailBtn.addEventListener("click", function () {
    if(selectedId === null){
        alert("Pilih tugas terlebih dahulu untuk diedit.");
        return;
    }

    const todo = todos.find((t) => t.id === selectedId);
    if(!todo) return;

    const newTitle = editTitle.value.trim();
    if(newTitle === ""){
        alert("Judul tugas tidak boleh kosong.");
        return;
    }

    todo.title = newTitle;
    todo.desc = editDesc.value;

    renderTodos();
});

function toggleComplete(id){
    const todo = todos.find((t) => t.id === id);
    if (!todo) return;

    todo.completed = !todo.completed;
    renderTodos();
}


function deleteTodo(id){
    todos = todos.filter((t) => t.id !== id);
    renderTodos();
}

themeToggleBtn.addEventListener("click", function () {
    document.body.classList.toggle("dark-mode");

    if(document.body.classList.contains("dark-mode")){
        themeToggleBtn.textContent = "Light Mode";
    }else{
        themeToggleBtn.textContent = "Dark Mode";
    }
});

renderTodos();
autoResizeTextarea(editDesc);