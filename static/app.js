let assets = [];
let activeCategory = "All";

const grid = document.getElementById("assetGrid");
const empty = document.getElementById("empty");
const searchInput = document.getElementById("searchInput");
const typeFilter = document.getElementById("typeFilter");

async function loadAssets() {
    const res = await fetch("/api/assets");
    assets = await res.json();
    buildCategories();
    render();
}

function buildCategories() {
    const nav = document.getElementById("categoryNav");
    const categories = [...new Set(assets.map(a => a.category))].sort();
    nav.innerHTML = categories.map(c => `
        <button class="nav category-btn" data-category="${escapeAttr(c)}">📁 <span>${escapeHtml(c)}</span></button>
    `).join("");

    document.querySelectorAll(".category-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            activeCategory = btn.dataset.category;
            document.querySelectorAll(".nav").forEach(x => x.classList.remove("active"));
            btn.classList.add("active");
            render();
        });
    });
}

function render() {
    const query = searchInput.value.toLowerCase().trim();
    const type = typeFilter.value;

    const filtered = assets.filter(a => {
        const categoryMatch = activeCategory === "All" || a.category === activeCategory;
        const typeMatch = type === "all" || a.type === type;
        const searchMatch = !query ||
            a.name.toLowerCase().includes(query) ||
            a.category.toLowerCase().includes(query) ||
            a.subcategory.toLowerCase().includes(query);
        return categoryMatch && typeMatch && searchMatch;
    });

    document.getElementById("pageTitle").textContent = activeCategory === "All" ? "All Assets" : activeCategory;
    document.getElementById("breadcrumbs").textContent = activeCategory === "All" ? "All Assets" : `All Assets / ${activeCategory}`;
    document.getElementById("totalCount").textContent = assets.length;
    document.getElementById("categoryCount").textContent = activeCategory === "All"
        ? new Set(assets.map(a => a.category)).size
        : assets.filter(a => a.category === activeCategory).length;
    document.getElementById("visibleCount").textContent = filtered.length;

    grid.innerHTML = filtered.map(cardTemplate).join("");
    empty.classList.toggle("hidden", filtered.length !== 0);
}

function cardTemplate(asset) {
    const url = "/api/file/" + asset.path.split("/").map(encodeURIComponent).join("/");

    let preview = `<div class="icon-preview">${iconFor(asset.type)}</div>`;

    if (asset.type === "image") {
        preview = `
            <div class="preview-media" onclick="previewAsset('${encodeURIComponent(asset.path)}', 'image')">
                <img src="${url}" loading="lazy" alt="${escapeAttr(asset.name)}">
                <div class="preview-overlay">🔍 Preview</div>
            </div>
        `;
    }

    if (asset.type === "video") {
        preview = `
            <div class="preview-media" onclick="previewAsset('${encodeURIComponent(asset.path)}', 'video')">
                <video src="${url}" muted preload="metadata"></video>
                <div class="play-icon">▶</div>
                <div class="preview-overlay">🎬 Preview</div>
            </div>
        `;
    }

    return `
    <article class="card">
        <div class="preview">${preview}</div>

        <div class="card-body">
            <div class="name" title="${escapeAttr(asset.name)}">
                ${escapeHtml(asset.name)}
            </div>

            <div class="meta">
                ${escapeHtml(asset.category)}
                ${asset.subcategory ? " • " + escapeHtml(asset.subcategory) : ""}
                • ${asset.extension || "file"}
            </div>

            <div class="actions">
                ${asset.type === "audio" ?
                    `<button onclick="playAudio('${encodeURIComponent(asset.path)}')">▶ Preview</button>` : ""
                }

                <button onclick="copyPath('${encodeURIComponent(asset.path)}')">
                    📋 Copy Path
                </button>

                <button class="open" onclick="openLocation('${encodeURIComponent(asset.path)}')">
                    📂 Open
                </button>
            </div>
        </div>
    </article>`;
}

async function openLocation(encodedPath) {
    const path = decodeURIComponent(encodedPath);
    const res = await fetch("/api/open-location", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({path})
    });
    const data = await res.json();
    showToast(data.ok ? "Opened in File Explorer" : data.error || "Could not open location");
}

async function copyPath(encodedPath) {
    const path = decodeURIComponent(encodedPath);
    const res = await fetch("/api/file/" + path.split("/").map(encodeURIComponent).join("/"), {method: "HEAD"});
    // The browser cannot read the server's absolute filesystem path directly.
    // Copy the relative asset path, which is useful within the library.
    await navigator.clipboard.writeText("assets/" + path);
    showToast("Asset path copied");
}

let audio = null;
function playAudio(encodedPath) {
    const path = decodeURIComponent(encodedPath);
    if (audio) {
        audio.pause();
        if (audio.dataset.path === path) {
            audio = null;
            showToast("Playback stopped");
            return;
        }
    }
    audio = new Audio("/api/file/" + path.split("/").map(encodeURIComponent).join("/"));
    audio.dataset.path = path;
    audio.play();
    showToast("Playing audio preview");
}

function iconFor(type) {
    return {audio:"🎵", video:"🎬", image:"🖼️", font:"🔤", file:"📄"}[type] || "📄";
}

function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
        "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;"
    }[c]));
}

function escapeAttr(s) {
    return escapeHtml(s);
}

function showToast(message) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(window.toastTimer);
    window.toastTimer = setTimeout(() => toast.classList.remove("show"), 1800);
}

searchInput.addEventListener("input", render);
typeFilter.addEventListener("change", render);

document.getElementById("refreshBtn").addEventListener("click", loadAssets);

document.querySelector('.nav[data-category="All"]').addEventListener("click", () => {
    activeCategory = "All";
    document.querySelectorAll(".nav").forEach(x => x.classList.remove("active"));
    document.querySelector('.nav[data-category="All"]').classList.add("active");
    render();
});

document.addEventListener("keydown", e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInput.focus();
    }
});

loadAssets();

function previewAsset(encodedPath, type) {
    const path = decodeURIComponent(encodedPath);
    const url = "/api/file/" + path.split("/").map(encodeURIComponent).join("/");

    const modal = document.createElement("div");
    modal.className = "preview-modal";

    if (type === "image") {
        modal.innerHTML = `
            <div class="modal-content">
                <button class="close-modal">✕</button>
                <img src="${url}">
            </div>
        `;
    } else {
        modal.innerHTML = `
            <div class="modal-content">
                <button class="close-modal">✕</button>
                <video src="${url}" controls autoplay></video>
            </div>
        `;
    }

    document.body.appendChild(modal);

    modal.querySelector(".close-modal").onclick = () => modal.remove();

    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    };
}
