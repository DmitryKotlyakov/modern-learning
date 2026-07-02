import { modules } from "./course-data.js?v=11";
import { renderSiteProgress } from "./site-progress.js?v=11";
import { renderModuleMenu } from "./navigation.js?v=11";

const STORAGE_PREFIX = "learning-mechanics:artifact:";
const ARTIFACT_DONE_PREFIX = "learning-mechanics:artifact-complete:";
const QUIZ_BANK_MODULE_ID = 2;
const MAX_QUIZ_QUESTIONS = 10;

const quizTypes = {
    single: "Один выбор",
    multiple: "Множественный выбор",
    boolean: "Да / нет",
    blanks: "Fill in the blanks"
};

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

const getQuizQuestions = (values) => Array.isArray(values.questions) ? values.questions : [];

const getQuestionTemplate = (type) => ({
    id: `question-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type,
    prompt: "",
    hint: "",
    options: type === "single" || type === "multiple" ? ["", "", "", ""] : [],
    correctIndex: "0",
    correctIndexes: [],
    correctBoolean: "no",
    answers: type === "blanks" ? [""] : []
});

const getQuestionCount = (values) => getQuizQuestions(values)
    .filter((question) => String(question.prompt ?? "").trim()).length;

const getFilledCount = (module, values) => {
    if (module.id === QUIZ_BANK_MODULE_ID) {
        return [
            String(values.quizGoal ?? "").trim(),
            getQuestionCount(values) > 0 ? "questions" : ""
        ].filter(Boolean).length;
    }

    return module.artifactFields.filter((field) => String(values[field.id] ?? "").trim()).length;
};

const collectProject = () => modules.map((module) => {
    const values = getArtifact(module.id);
    const filled = getFilledCount(module, values);

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

    if (moduleId === QUIZ_BANK_MODULE_ID) {
        renderQuizBankForm(module, content);
        return;
    }

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

function renderQuizBankForm(module, content) {
    const moduleId = module.id;
    const saved = getArtifact(moduleId);
    let questions = getQuizQuestions(saved);

    const form = document.createElement("article");
    form.className = "lesson-card artifact-card";
    form.innerHTML = `
        <div class="lesson-card__meta">
            <span class="tag">Сквозной проект</span>
            <span class="tag">До ${MAX_QUIZ_QUESTIONS} вопросов</span>
        </div>
        <h2>${escapeHtml(module.artifactTitle)}</h2>
        <p>Соберите банк вопросов для своего квиза. Добавляйте разные типы заданий, заполняйте варианты ответов, отмечайте правильные ответы и пишите подсказку для слушателя.</p>
        <form class="artifact-form quiz-builder" data-artifact-form data-quiz-bank-form>
            <label class="artifact-field" for="artifact-quizGoal">
                <span>Что проверяет квиз</span>
                <textarea id="artifact-quizGoal" name="quizGoal" rows="4" placeholder="Понимание термина, применение правила, выбор решения...">${escapeHtml(saved.quizGoal ?? "")}</textarea>
            </label>

            <div class="quiz-builder__panel">
                <div>
                    <h3>Вопросы</h3>
                    <p data-quiz-bank-count>${questions.length} из ${MAX_QUIZ_QUESTIONS}</p>
                </div>
                <div class="quiz-builder__add">
                    ${Object.entries(quizTypes).map(([type, label]) => `
                        <button class="button button--secondary" type="button" data-add-question="${type}">${escapeHtml(label)}</button>
                    `).join("")}
                </div>
            </div>

            <div class="quiz-builder__list" data-quiz-bank-list></div>

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
    const list = form.querySelector("[data-quiz-bank-list]");
    const count = form.querySelector("[data-quiz-bank-count]");
    const status = form.querySelector("[data-artifact-status]");

    const sync = (message = "Черновик сохранен") => {
        questions = collectQuizQuestions(artifactForm);
        setArtifact(moduleId, {
            quizGoal: artifactForm.elements.quizGoal.value,
            questions
        });
        count.textContent = `${questions.length} из ${MAX_QUIZ_QUESTIONS}`;
        status.textContent = message;
    };

    const rerender = (message) => {
        renderQuizQuestions(list, questions);
        count.textContent = `${questions.length} из ${MAX_QUIZ_QUESTIONS}`;
        status.textContent = message;
    };

    rerender("");

    artifactForm.addEventListener("click", (event) => {
        const addButton = event.target.closest("[data-add-question]");
        const removeButton = event.target.closest("[data-remove-question]");
        const addOptionButton = event.target.closest("[data-add-option]");
        const removeOptionButton = event.target.closest("[data-remove-option]");
        const addAnswerButton = event.target.closest("[data-add-answer]");
        const removeAnswerButton = event.target.closest("[data-remove-answer]");

        if (addButton) {
            questions = collectQuizQuestions(artifactForm);
            if (questions.length >= MAX_QUIZ_QUESTIONS) {
                status.textContent = `Максимум ${MAX_QUIZ_QUESTIONS} вопросов`;
                return;
            }
            questions.push(getQuestionTemplate(addButton.dataset.addQuestion));
            rerender("Вопрос добавлен");
            sync("Черновик сохранен");
        }

        if (removeButton) {
            questions = collectQuizQuestions(artifactForm)
                .filter((_, index) => index !== Number(removeButton.dataset.removeQuestion));
            rerender("Вопрос удален");
            sync("Черновик сохранен");
        }

        if (addOptionButton) {
            questions = collectQuizQuestions(artifactForm);
            const question = questions[Number(addOptionButton.dataset.addOption)];
            if (question && question.options.length < 6) question.options.push("");
            rerender("Вариант добавлен");
            sync("Черновик сохранен");
        }

        if (removeOptionButton) {
            questions = collectQuizQuestions(artifactForm);
            const question = questions[Number(removeOptionButton.dataset.questionIndex)];
            if (question && question.options.length > 2) {
                question.options.splice(Number(removeOptionButton.dataset.removeOption), 1);
                question.correctIndexes = question.correctIndexes
                    .map((value) => Number(value))
                    .filter((value) => value !== Number(removeOptionButton.dataset.removeOption))
                    .map((value) => String(value > Number(removeOptionButton.dataset.removeOption) ? value - 1 : value));
                if (Number(question.correctIndex) >= question.options.length) question.correctIndex = "0";
            }
            rerender("Вариант удален");
            sync("Черновик сохранен");
        }

        if (addAnswerButton) {
            questions = collectQuizQuestions(artifactForm);
            const question = questions[Number(addAnswerButton.dataset.addAnswer)];
            if (question && question.answers.length < 6) question.answers.push("");
            rerender("Ответ добавлен");
            sync("Черновик сохранен");
        }

        if (removeAnswerButton) {
            questions = collectQuizQuestions(artifactForm);
            const question = questions[Number(removeAnswerButton.dataset.questionIndex)];
            if (question && question.answers.length > 1) {
                question.answers.splice(Number(removeAnswerButton.dataset.removeAnswer), 1);
            }
            rerender("Ответ удален");
            sync("Черновик сохранен");
        }
    });

    artifactForm.addEventListener("input", () => sync());
    artifactForm.addEventListener("change", () => sync());
    artifactForm.addEventListener("submit", (event) => {
        event.preventDefault();
        sync("Сохранено");
        localStorage.setItem(`${ARTIFACT_DONE_PREFIX}${moduleId}`, "true");
        renderSiteProgress();
        renderModuleMenu();
        window.setTimeout(() => {
            status.textContent = "";
        }, 1800);
    });
}

function renderQuizQuestions(container, questions) {
    container.innerHTML = questions.length ? questions.map((question, index) => renderQuizQuestion(question, index)).join("") : `
        <div class="quiz-builder__empty">
            <h3>Пока нет вопросов</h3>
            <p>Выберите тип вопроса выше. Начать можно с одного выбора или короткого да/нет вопроса.</p>
        </div>
    `;
}

function renderQuizQuestion(question, index) {
    return `
        <article class="quiz-builder__question" data-question-index="${index}" data-question-type="${escapeHtml(question.type)}">
            <div class="quiz-builder__question-top">
                <div>
                    <p class="eyebrow">Вопрос ${index + 1} · ${escapeHtml(quizTypes[question.type] || question.type)}</p>
                    <h3>${escapeHtml(quizTypes[question.type] || "Вопрос")}</h3>
                </div>
                <button class="button button--secondary" type="button" data-remove-question="${index}">Удалить</button>
            </div>
            <label class="quiz-builder__field">
                <span>Текст вопроса</span>
                <textarea data-question-field="prompt" rows="3" placeholder="Напишите вопрос или инструкцию">${escapeHtml(question.prompt ?? "")}</textarea>
            </label>
            ${renderQuestionBody(question, index)}
            <label class="quiz-builder__field">
                <span>Подсказка или фидбек</span>
                <textarea data-question-field="hint" rows="3" placeholder="Что увидит слушатель после ответа или ошибки?">${escapeHtml(question.hint ?? "")}</textarea>
            </label>
        </article>
    `;
}

function renderQuestionBody(question, index) {
    if (question.type === "single" || question.type === "multiple") {
        const options = Array.isArray(question.options) && question.options.length ? question.options : ["", ""];
        const correctIndexes = new Set((question.correctIndexes || []).map(String));

        return `
            <div class="quiz-builder__options">
                <div class="quiz-builder__subhead">
                    <span>Варианты ответов</span>
                    <button class="button button--secondary" type="button" data-add-option="${index}" ${options.length >= 6 ? "disabled" : ""}>Добавить вариант</button>
                </div>
                ${options.map((option, optionIndex) => {
                    const checked = question.type === "single"
                        ? String(question.correctIndex ?? "0") === String(optionIndex)
                        : correctIndexes.has(String(optionIndex));
                    const control = question.type === "single"
                        ? `<input type="radio" name="correct-${index}" value="${optionIndex}" ${checked ? "checked" : ""}>`
                        : `<input type="checkbox" value="${optionIndex}" ${checked ? "checked" : ""}>`;

                    return `
                        <label class="quiz-builder__option" data-option-index="${optionIndex}">
                            ${control}
                            <input type="text" data-option-value value="${escapeHtml(option)}" placeholder="Вариант ${optionIndex + 1}">
                            <button class="button button--secondary" type="button" data-question-index="${index}" data-remove-option="${optionIndex}" ${options.length <= 2 ? "disabled" : ""}>Убрать</button>
                        </label>
                    `;
                }).join("")}
            </div>
        `;
    }

    if (question.type === "boolean") {
        return `
            <label class="quiz-builder__field">
                <span>Правильный ответ</span>
                <select data-question-field="correctBoolean">
                    <option value="yes" ${question.correctBoolean === "yes" ? "selected" : ""}>Да</option>
                    <option value="no" ${question.correctBoolean !== "yes" ? "selected" : ""}>Нет</option>
                </select>
            </label>
        `;
    }

    const answers = Array.isArray(question.answers) && question.answers.length ? question.answers : [""];
    return `
        <div class="quiz-builder__options">
            <div class="quiz-builder__subhead">
                <span>Правильные ответы для пропусков</span>
                <button class="button button--secondary" type="button" data-add-answer="${index}" ${answers.length >= 6 ? "disabled" : ""}>Добавить ответ</button>
            </div>
            ${answers.map((answer, answerIndex) => `
                <label class="quiz-builder__answer" data-answer-index="${answerIndex}">
                    <span>Пропуск ${answerIndex + 1}</span>
                    <input type="text" data-answer-value value="${escapeHtml(answer)}" placeholder="Правильное слово или фраза">
                    <button class="button button--secondary" type="button" data-question-index="${index}" data-remove-answer="${answerIndex}" ${answers.length <= 1 ? "disabled" : ""}>Убрать</button>
                </label>
            `).join("")}
        </div>
    `;
}

function collectQuizQuestions(form) {
    return [...form.querySelectorAll("[data-question-index]")].map((questionElement) => {
        const type = questionElement.dataset.questionType;
        const prompt = questionElement.querySelector("[data-question-field='prompt']")?.value ?? "";
        const hint = questionElement.querySelector("[data-question-field='hint']")?.value ?? "";
        const question = {
            id: `question-${questionElement.dataset.questionIndex}`,
            type,
            prompt,
            hint
        };

        if (type === "single" || type === "multiple") {
            question.options = [...questionElement.querySelectorAll("[data-option-value]")]
                .map((input) => input.value);
            question.correctIndex = questionElement.querySelector(`input[name='correct-${questionElement.dataset.questionIndex}']:checked`)?.value ?? "0";
            question.correctIndexes = [...questionElement.querySelectorAll(".quiz-builder__option input[type='checkbox']:checked")]
                .map((input) => input.value);
        }

        if (type === "boolean") {
            question.correctBoolean = questionElement.querySelector("[data-question-field='correctBoolean']")?.value ?? "no";
        }

        if (type === "blanks") {
            question.answers = [...questionElement.querySelectorAll("[data-answer-value]")]
                .map((input) => input.value);
        }

        return question;
    });
}

function saveArtifactFromForm(moduleId, form) {
    const values = {};
    new FormData(form).forEach((value, key) => {
        values[key] = value;
    });
    setArtifact(moduleId, values);
}

function getQuestionCorrectAnswer(question) {
    if (question.type === "single") {
        return question.options?.[Number(question.correctIndex)] || "Не указан";
    }

    if (question.type === "multiple") {
        const answers = (question.correctIndexes || [])
            .map((index) => question.options?.[Number(index)])
            .filter(Boolean);
        return answers.length ? answers.join("; ") : "Не указаны";
    }

    if (question.type === "boolean") {
        return question.correctBoolean === "yes" ? "Да" : "Нет";
    }

    const answers = (question.answers || []).filter((answer) => String(answer).trim());
    return answers.length ? answers.join("; ") : "Не указаны";
}

function renderQuizBankSummary(values) {
    const questions = getQuizQuestions(values);

    if (!questions.length) return "<span>Пока не добавлены</span>";

    return `
        <ol class="quiz-bank-summary">
            ${questions.map((question, index) => `
                <li>
                    <strong>${index + 1}. ${escapeHtml(quizTypes[question.type] || question.type)}</strong>
                    <p>${escapeHtml(question.prompt || "Вопрос пока не заполнен")}</p>
                    <p><b>Правильный ответ:</b> ${escapeHtml(getQuestionCorrectAnswer(question))}</p>
                    <p><b>Подсказка:</b> ${question.hint ? escapeHtml(question.hint) : "<span>Пока не указана</span>"}</p>
                </li>
            `).join("")}
        </ol>
    `;
}

function renderProjectFields(module, values) {
    if (module.id === QUIZ_BANK_MODULE_ID) {
        const quizGoal = String(values.quizGoal ?? "").trim();
        return `
            <div class="project-field">
                <dt>Что проверяет квиз</dt>
                <dd>${quizGoal ? escapeHtml(quizGoal).replaceAll("\n", "<br>") : "<span>Пока не заполнено</span>"}</dd>
            </div>
            <div class="project-field">
                <dt>Банк вопросов</dt>
                <dd>${renderQuizBankSummary(values)}</dd>
            </div>
        `;
    }

    return module.artifactFields.map((field) => {
        const value = String(values[field.id] ?? "").trim();
        return `
            <div class="project-field">
                <dt>${escapeHtml(field.label)}</dt>
                <dd>${value ? escapeHtml(value).replaceAll("\n", "<br>") : "<span>Пока не заполнено</span>"}</dd>
            </div>
        `;
    }).join("");
}

function renderExportFields(module, values) {
    if (module.id === QUIZ_BANK_MODULE_ID) {
        return `
            <section><h3>Что проверяет квиз</h3><p>${escapeHtml(String(values.quizGoal ?? "").trim() || "Пока не заполнено").replaceAll("\n", "<br>")}</p></section>
            <section><h3>Банк вопросов</h3>${renderQuizBankSummary(values)}</section>
        `;
    }

    return module.artifactFields.map((field) => {
        const value = String(values[field.id] ?? "").trim() || "Пока не заполнено";
        return `<section><h3>${escapeHtml(field.label)}</h3><p>${escapeHtml(value).replaceAll("\n", "<br>")}</p></section>`;
    }).join("");
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
        const fields = renderProjectFields(module, item.values);

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
        const fields = renderExportFields(module, item.values);

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
