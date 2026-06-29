import { modules } from "./course-data.js";

const getBasePath = () => (window.location.pathname.includes("/pages/") ? "" : "pages/");

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
        const current = window.location.pathname.split("/").pop() || "index.html";
        if (href.endsWith(current) || (current.startsWith("module-") && href.endsWith("module-1.html"))) {
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
            <span class="module-card__meta">${module.duration} · ${module.mechanic}</span>
        </a>
    `).join("");
}

export function renderModuleMenu() {
    const menu = document.querySelector("[data-module-menu]");
    if (!menu) return;

    const current = window.location.pathname.split("/").pop();
    menu.innerHTML = modules.map((module) => `
        <a href="${module.slug}" class="${module.slug === current ? "is-active" : ""}">
            <span>${module.id}</span>
            ${module.title}
        </a>
    `).join("");
}
