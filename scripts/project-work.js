import { modules } from "./course-data.js?v=9";
import { renderSiteProgress } from "./site-progress.js?v=9";
import { renderModuleMenu } from "./navigation.js?v=9";

const STORAGE_PREFIX = "learning-mechanics:artifact:";
const ARTIFACT_DONE_PREFIX = "learning-mechanics:artifact-complete:";

const escapeHtml = (value) => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const getStorageKey = (moduleId) => `${STORAGE_PREFIX}${moduleId}`;

const getArtifact = (moduleId) => {
    try {
        return JSON.parse(localStorage.getItem(getStorageKey(moduleId)) || "{}");
    } catch {
        return {};
    }
};

const setArtifact = (moduleId, values) => {
    localStorage.setItem(getStorageKey(moduleId), JSON.stringify(values));
};

const collectProject = () => modules.map((module) => {
    const values = getArtifact(module.id);
    const filled = module.artifactFields.filter((field) => String(values[field.id] ?? "").trim()).length;

    return {
        moduleId: module.id,
        moduleTitle: module.title,
        artifactTitle: module.artifactTitle,
        mechanic: module.mechanic,
        filled,
        total: module.artifactFields.length,
        values
    };
});

const buildH5pBrief = () => ({
    format: "h5p-preparation-brief",
    recommendedContentType: "H5P Interactive Book или H5P Column",
    generatedAt: new Date().toISOString(),
    note: "Это структурированный brief для сборки H5P в Lumi/H5P. Это еще не полноценный .h5p-пакет.",
    modules: collectProject()
});

export function initProjectWorkspace() {
    renderArtifactForm();
    renderProjectDashboard();
}

function renderArtifactForm() {
    if (document.body.dataset.page !== "module") return;

    const moduleId = Number(document.body.dataset.module);
    const module = modules.find((item) => item.id === moduleId);
    const content = document.querySelector(".module-content");
    if (!module || !content || document.querySelector("[data-artifact-form]")) return;

    const saved = getArtifact(moduleId);
    const fieldsMarkup = module.artifactFields.map((field) => {
        const value = saved[field.id] ?? "";
        const input = field.type === "textarea"
            ? `<textarea id="artifact-${field.id}" name="${field.id}" rows="4" placeholder="${escapeHtml(field.placeholder)}">${escapeHtml(value)}</textarea>`
            : `<input id="artifact-${field.id}" name="${field.id}" type="text" value="${escapeHtml(value)}" placeholder="${escapeHtml(field.placeholder)}">`;

        return `
            <label class="artifact-field" for="artifact-${field.id}">
                <span>${escapeHtml(field.label)}</span>
                ${input}
            </label>
        `;
    }).join("");

    const form = document.createElement("article");
    form.className = "lesson-card artifact-card";
    form.innerHTML = `
        <div class="lesson-card__meta">
            <span class="tag">Сквозной проект</span>
            <span class="tag">Сохраняется в браузере</span>
        </div>
        <h2>${escapeHtml(module.artifactTitle)}</h2>
        <p>Заполните этот блок после практики модуля. Ответы сохраняются на этом устройстве и автоматически появятся на странице проекта.</p>
        <form class="artifact-form" data-artifact-form>
            ${fieldsMarkup}
            <div class="artifact-actions">
                <button class="button button--primary" type="submit">Сохранить в проект</button>
                <a class="button button--secondary" href="../project/">Открыть проект</a>
                <span class="artifact-status" data-artifact-status aria-live="polite"></span>
            </div>
        </form>
    `;

    const checklist = content.querySelector("[data-checklist]")?.closest(".lesson-card");
    content.insertBefore(form, checklist || null);

    const artifactForm = form.querySelector("[data-artifact-form]");
    const status = form.querySelector("[data-artifact-status]");

    artifactForm.addEventListener("submit", (event) => {
        event.preventDefault();
        saveArtifactFromForm(moduleId, artifactForm);
        localStorage.setItem(`${ARTIFACT_DONE_PREFIX}${moduleId}`, "true");
        renderSiteProgress();
        renderModuleMenu();
        status.textContent = "Сохранено";
        window.setTimeout(() => {
            status.textContent = "";
        }, 1800);
    });

    artifactForm.addEventListener("input", () => {
        saveArtifactFromForm(moduleId, artifactForm);
        status.textContent = "Черновик сохранен";
    });
}

function saveArtifactFromForm(moduleId, form) {
    const values = {};
    new FormData(form).forEach((value, key) => {
        values[key] = value;
    });
    setArtifact(moduleId, values);
}

function renderProjectDashboard() {
    const summary = document.querySelector("[data-project-summary]");
    if (!summary) return;

    const project = collectProject();
    const filledModules = project.filter((item) => item.filled > 0).length;
    const totalFields = project.reduce((sum, item) => sum + item.total, 0);
    const filledFields = project.reduce((sum, item) => sum + item.filled, 0);
    const percent = totalFields === 0 ? 0 : Math.round((filledFields / totalFields) * 100);

    const cards = project.map((item) => {
        const module = modules.find((entry) => entry.id === item.moduleId);
        const fields = module.artifactFields.map((field) => {
            const value = String(item.values[field.id] ?? "").trim();
            return `
                <div class="project-field">
                    <dt>${escapeHtml(field.label)}</dt>
                    <dd>${value ? escapeHtml(value).replaceAll("\n", "<br>") : "<span>Пока не заполнено</span>"}</dd>
                </div>
            `;
        }).join("");

        return `
            <article class="project-artifact">
                <div class="project-artifact__top">
                    <div>
                        <p class="eyebrow">Модуль ${item.moduleId} · ${escapeHtml(item.mechanic)}</p>
                        <h3>${escapeHtml(item.artifactTitle)}</h3>
                    </div>
                    <a class="button button--secondary" href="../${module.slug}">Редактировать</a>
                </div>
                <dl>${fields}</dl>
            </article>
        `;
    }).join("");

    summary.innerHTML = `
        <article class="lesson-card project-overview">
            <div class="lesson-card__meta">
                <span class="tag">${filledModules} из ${modules.length} модулей начаты</span>
                <span class="tag">${percent}% полей заполнено</span>
            </div>
            <h2>Карта интерактивного урока</h2>
            <p>Здесь собираются все практические артефакты курса. Заполняйте формы в модулях, а эта страница будет становиться финальным brief вашего интерактивного урока.</p>
            <div class="progress-meter"><div class="progress-meter__bar" style="width: ${percent}%"></div></div>
        </article>
        <div class="project-export" data-project-export>
            <button class="button button--primary" type="button" data-export-html>Скачать одностраничный HTML</button>
            <button class="button button--secondary" type="button" data-export-json>Скачать JSON проекта</button>
            <button class="button button--secondary" type="button" data-export-h5p>Скачать brief для H5P</button>
        </div>
        <div class="project-artifacts">${cards}</div>
    `;

    summary.querySelector("[data-export-html]").addEventListener("click", exportOnePageHtml);
    summary.querySelector("[data-export-json]").addEventListener("click", () => {
        downloadFile("interactive-course-project.json", JSON.stringify({ modules: collectProject() }, null, 2), "application/json");
    });
    summary.querySelector("[data-export-h5p]").addEventListener("click", () => {
        downloadFile("h5p-preparation-brief.json", JSON.stringify(buildH5pBrief(), null, 2), "application/json");
    });
}

function exportOnePageHtml() {
    const project = collectProject();
    const sections = project.map((item) => {
        const module = modules.find((entry) => entry.id === item.moduleId);
        const fields = module.artifactFields.map((field) => {
            const value = String(item.values[field.id] ?? "").trim() || "Пока не заполнено";
            return `<section><h3>${escapeHtml(field.label)}</h3><p>${escapeHtml(value).replaceAll("\n", "<br>")}</p></section>`;
        }).join("");

        return `<article><p>Модуль ${item.moduleId} · ${escapeHtml(item.mechanic)}</p><h2>${escapeHtml(item.artifactTitle)}</h2>${fields}</article>`;
    }).join("");

    const html = `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Интерактивный урок · Проект</title>
    <style>
        body { margin: 0; font-family: Arial, sans-serif; line-height: 1.55; color: #17211b; background: #fbfaf6; }
        main { max-width: 960px; margin: 0 auto; padding: 48px 20px; }
        h1 { font-size: 42px; line-height: 1.05; }
        article { border: 1px solid #d8ded8; border-radius: 8px; padding: 24px; margin: 20px 0; background: #fff; }
        article > p { color: #115e59; font-weight: 700; }
        section { border-top: 1px solid #d8ded8; padding-top: 14px; margin-top: 14px; }
        h2, h3 { margin-bottom: 8px; }
    </style>
</head>
<body>
<main>
    <p>Экспорт из курса «Механики вовлечения»</p>
    <h1>Карта интерактивного урока</h1>
    ${sections}
</main>
</body>
</html>`;

    downloadFile("interactive-course-project.html", html, "text/html");
}

function downloadFile(filename, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}
