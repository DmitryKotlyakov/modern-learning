import { modules } from "./course-data.js?v=9";

const VISITED_KEY = "learning-mechanics:visited-modules";
const ARTIFACT_DONE_PREFIX = "learning-mechanics:artifact-complete:";

export const readVisitedModules = () => {
    try {
        return JSON.parse(localStorage.getItem(VISITED_KEY) || "[]");
    } catch {
        return [];
    }
};

export const isModuleVisited = (moduleId) => readVisitedModules().includes(moduleId);

export const isArtifactComplete = (moduleId) => {
    return localStorage.getItem(`${ARTIFACT_DONE_PREFIX}${moduleId}`) === "true";
};

const writeVisited = (visited) => {
    localStorage.setItem(VISITED_KEY, JSON.stringify([...new Set(visited)]));
};

const markCurrentModuleVisited = () => {
    if (document.body.dataset.page !== "module") return;

    const moduleId = Number(document.body.dataset.module);
    if (!moduleId) return;

    const visited = readVisitedModules();
    if (!visited.includes(moduleId)) {
        visited.push(moduleId);
        writeVisited(visited);
    }
};

const getCompletedArtifacts = () => modules.filter((module) => isArtifactComplete(module.id)).length;

const getPercent = (value, total) => total === 0 ? 0 : Math.round((value / total) * 100);

export function renderSiteProgress() {
    let footer = document.querySelector("[data-site-footer]");

    if (!footer) {
        footer = document.createElement("footer");
        footer.className = "site-footer";
        footer.dataset.siteFooter = "";
        document.body.append(footer);
    }

    const visitedCount = readVisitedModules().length;
    const artifactsCount = getCompletedArtifacts();
    const total = modules.length;
    const visitedPercent = getPercent(visitedCount, total);
    const artifactsPercent = getPercent(artifactsCount, total);

    footer.innerHTML = `
        <div class="footer-progress">
            <section class="footer-progress__item" aria-label="Прогресс по прочитанным модулям">
                <div class="footer-progress__label">
                    <span>Прочитанные модули</span>
                    <strong>${visitedCount} / ${total}</strong>
                </div>
                <div class="progress-meter"><div class="progress-meter__bar progress-meter__bar--read" style="width: ${visitedPercent}%"></div></div>
            </section>
            <section class="footer-progress__item" aria-label="Прогресс по финальному проекту">
                <div class="footer-progress__label">
                    <span>Кусочки финального проекта</span>
                    <strong>${artifactsCount} / ${total}</strong>
                </div>
                <div class="progress-meter"><div class="progress-meter__bar progress-meter__bar--saved" style="width: ${artifactsPercent}%"></div></div>
            </section>
        </div>
    `;
}

export function initSiteProgress() {
    markCurrentModuleVisited();
    renderSiteProgress();
}
