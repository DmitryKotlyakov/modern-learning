import { modules } from "./course-data.js";
import { isArtifactComplete, isModuleVisited } from "./site-progress.js";

const getBasePath = () => (window.location.pathname.includes("/pages/") ? "../" : "pages/");

const getCurrentRoute = () => {
    const path = window.location.pathname.replace(/\/$/, "");
    return path.split("/").pop() || "index";
};

const getLinkRoute = (href) => {
    const cleanHref = href.replace(/\/$/, "").replace(/\.html$/, "");
    return cleanHref.split("/").pop() || "index";
};

export function initNavigation() {
    const toggle = document.querySelector(".nav-toggle");
    const nav = document.querySelector(".site-nav");

    if (toggle && nav) {
        toggle.addEventListener("click", () => {
            const isOpen = nav.classList.toggle("is-open");
            toggle.setAttribute("aria-expanded", String(isOpen));
        });
    }

    document.querySelectorAll("[data-nav-link]").forEach((link) => {
        const href = link.getAttribute("href") ?? "";
        const current = getCurrentRoute();
        const route = getLinkRoute(href);

        if (route === current || (current.startsWith("module-") && route === "module-1")) {
            link.classList.add("is-active");
        }
    });
}

export function renderModuleGrid() {
    const grid = document.querySelector("[data-module-grid]");
    if (!grid) return;

    const base = getBasePath();
    grid.innerHTML = modules.map((module) => `
        <a class="module-card" href="${base}${module.slug}">
            <span class="module-card__number">${module.id}</span>
            <div>
                <h3>${module.title}</h3>
                <p>${module.result}</p>
            </div>
            <span class="module-card__meta">${module.mechanic}</span>
        </a>
    `).join("");
}

export function renderModuleMenu() {
    const menu = document.querySelector("[data-module-menu]");
    if (!menu) return;

    setupModuleMenuToggle(menu);

    const current = getCurrentRoute();
    menu.innerHTML = modules.map((module) => `
        <a href="../${module.slug}" class="${[
            getLinkRoute(module.slug) === current ? "is-active" : "",
            isModuleVisited(module.id) ? "is-visited" : "",
            isArtifactComplete(module.id) ? "is-saved" : ""
        ].filter(Boolean).join(" ")}">
            <span>${module.id}</span>
            ${module.title}
        </a>
    `).join("");
}

function setupModuleMenuToggle(menu) {
    const sidebar = menu.closest(".course-sidebar");
    if (!sidebar || sidebar.querySelector("[data-module-menu-toggle]")) return;

    if (!menu.id) {
        menu.id = "module-menu";
    }

    const toggle = document.createElement("button");
    toggle.className = "module-menu-toggle";
    toggle.type = "button";
    toggle.dataset.moduleMenuToggle = "";
    toggle.setAttribute("aria-controls", menu.id);
    toggle.setAttribute("aria-expanded", "false");
    toggle.innerHTML = `
        <span>Модули курса</span>
        <strong>Показать</strong>
    `;

    toggle.addEventListener("click", () => {
        const isOpen = menu.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", String(isOpen));
        toggle.querySelector("strong").textContent = isOpen ? "Скрыть" : "Показать";
    });

    const title = sidebar.querySelector(".sidebar-title");
    if (title) {
        title.insertAdjacentElement("afterend", toggle);
    } else {
        sidebar.prepend(toggle);
    }
}
