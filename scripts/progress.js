import { moduleChecklist } from "./course-data.js?v=11";

const storageKey = (moduleId) => `learning-mechanics:module-${moduleId}:checklist`;

export function renderChecklist() {
    const checklist = document.querySelector("[data-checklist]");
    if (!checklist) return;

    const moduleId = document.body.dataset.module || "course";
    const saved = JSON.parse(localStorage.getItem(storageKey(moduleId)) || "[]");

    checklist.innerHTML = moduleChecklist.map((item, index) => `
        <label>
            <input type="checkbox" data-check-index="${index}" ${saved.includes(index) ? "checked" : ""}>
            <span>${item}</span>
        </label>
    `).join("");

    const update = () => {
        const checked = [...checklist.querySelectorAll("input:checked")].map((input) => Number(input.dataset.checkIndex));
        localStorage.setItem(storageKey(moduleId), JSON.stringify(checked));
        updateProgress(checked.length, moduleChecklist.length);
    };

    checklist.addEventListener("change", update);
    update();
}

function updateProgress(done, total) {
    const bar = document.querySelector("[data-progress-bar]");
    const text = document.querySelector("[data-progress-text]");
    const percent = total === 0 ? 0 : Math.round((done / total) * 100);

    if (bar) bar.style.width = `${percent}%`;
    if (text) text.textContent = `${done} из ${total}`;
}
