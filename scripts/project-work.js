import { modules } from "./course-data.js";
import { renderSiteProgress } from "./site-progress.js";
import { renderModuleMenu } from "./navigation.js";
import { initSortingTasks } from "./sorting-task.js";
import { challengeOptions, maxBudget } from "./gamification-challenge.js";

const STORAGE_PREFIX = "learning-mechanics:artifact:";
const ARTIFACT_DONE_PREFIX = "learning-mechanics:artifact-complete:";
const QUIZ_BANK_MODULE_ID = 2;
const INTERACTION_BUILDER_MODULE_ID = 3;
const SCENARIO_BUILDER_MODULE_ID = 4;
const GAMIFICATION_BUILDER_MODULE_ID = 5;
const MAX_QUIZ_QUESTIONS = 10;
const MAX_INTERACTION_EXERCISES = 5;
const MAX_SCENARIO_NODES = 5;
const MAX_GAME_MECHANICS = 6;

const quizTypes = {
    single: "Один выбор",
    multiple: "Множественный выбор",
    boolean: "Да / нет",
    blanks: "Fill in the blanks"
};

const interactionTypes = {
    sorting: "Сортировка",
    ranking: "Ранжирование"
};

const scenarioChoiceTypes = {
    good: "Удачный выбор",
    partial: "Частично удачный",
    risk: "Рискованный выбор"
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

const normalizeQuizQuestion = (question = {}) => {
    const type = Object.hasOwn(quizTypes, question.type) ? question.type : "single";
    const normalized = {
        id: question.id || `question-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        type,
        prompt: String(question.prompt ?? ""),
        hint: String(question.hint ?? "")
    };

    if (type === "single" || type === "multiple") {
        const options = Array.isArray(question.options)
            ? question.options.slice(0, 6).map((option) => String(option ?? ""))
            : [];
        while (options.length < 2) options.push("");

        const correctIndex = Number(question.correctIndex);
        const validCorrectIndex = Number.isInteger(correctIndex) && correctIndex >= 0 && correctIndex < options.length
            ? correctIndex
            : 0;

        normalized.options = options;
        normalized.correctIndex = String(validCorrectIndex);
        normalized.correctIndexes = [...new Set(Array.isArray(question.correctIndexes) ? question.correctIndexes : [])]
            .map((value) => Number(value))
            .filter((value) => Number.isInteger(value) && value >= 0 && value < options.length)
            .map(String);
    }

    if (type === "boolean") {
        normalized.correctBoolean = question.correctBoolean === "yes" ? "yes" : "no";
    }

    if (type === "blanks") {
        const answers = Array.isArray(question.answers)
            ? question.answers.slice(0, 6).map((answer) => String(answer ?? ""))
            : [""];
        normalized.answers = answers.length ? answers : [""];
    }

    return normalized;
};

const getQuizQuestions = (values) => Array.isArray(values.questions)
    ? values.questions.slice(0, MAX_QUIZ_QUESTIONS).map(normalizeQuizQuestion)
    : [];

const getInteractionTemplate = (type) => ({
    id: `exercise-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type,
    title: "",
    instruction: "",
    items: "",
    targetStructure: "",
    feedback: ""
});

const normalizeInteractionExercise = (exercise = {}) => {
    const type = Object.hasOwn(interactionTypes, exercise.type) ? exercise.type : "sorting";

    return {
        id: exercise.id || `exercise-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        type,
        title: String(exercise.title ?? ""),
        instruction: String(exercise.instruction ?? ""),
        items: String(exercise.items ?? ""),
        targetStructure: String(exercise.targetStructure ?? ""),
        feedback: String(exercise.feedback ?? "")
    };
};

const getInteractionExercises = (values) => Array.isArray(values.exercises)
    ? values.exercises.slice(0, MAX_INTERACTION_EXERCISES).map(normalizeInteractionExercise)
    : [];

const getScenarioChoiceTemplate = () => ({
    text: "",
    consequence: "",
    next: "",
    type: "partial"
});

const getScenarioNodeTemplate = () => ({
    id: `node-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title: "",
    scene: "",
    question: "",
    choices: [
        getScenarioChoiceTemplate(),
        getScenarioChoiceTemplate()
    ]
});

const normalizeScenarioChoice = (choice = {}) => ({
    text: String(choice.text ?? ""),
    consequence: String(choice.consequence ?? ""),
    next: String(choice.next ?? ""),
    type: Object.hasOwn(scenarioChoiceTypes, choice.type) ? choice.type : "partial"
});

const normalizeScenarioNode = (node = {}) => {
    const choices = Array.isArray(node.choices)
        ? node.choices.slice(0, 4).map(normalizeScenarioChoice)
        : [];

    while (choices.length < 2) choices.push(getScenarioChoiceTemplate());

    return {
        id: node.id || `node-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        title: String(node.title ?? ""),
        scene: String(node.scene ?? ""),
        question: String(node.question ?? ""),
        choices
    };
};

const getScenarioNodes = (values) => Array.isArray(values.scenarioNodes)
    ? values.scenarioNodes.slice(0, MAX_SCENARIO_NODES).map(normalizeScenarioNode)
    : [];

const getGameMechanicTemplate = () => ({
    id: `game-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title: "",
    cost: "1",
    purpose: ""
});

const normalizeGameMechanic = (mechanic = {}) => {
    if (typeof mechanic === "string") {
        const option = challengeOptions.find((item) => item.id === mechanic);
        return {
            id: option?.id || `game-${Date.now()}-${Math.random().toString(16).slice(2)}`,
            title: option?.title || mechanic,
            cost: String(option?.cost ?? 1),
            purpose: option?.feedback || ""
        };
    }

    const rawCost = Number(mechanic.cost);
    const cost = Number.isFinite(rawCost) ? Math.max(0, Math.min(10, Math.round(rawCost))) : 1;

    return {
        id: mechanic.id || `game-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        title: String(mechanic.title ?? ""),
        cost: String(cost),
        purpose: String(mechanic.purpose ?? "")
    };
};

const getGameMechanics = (values) => Array.isArray(values.gameMechanics)
    ? values.gameMechanics.slice(0, MAX_GAME_MECHANICS).map(normalizeGameMechanic)
    : [];

const getGameScores = (mechanics) => mechanics.reduce((result, mechanic) => ({
    cost: result.cost + Number(mechanic.cost || 0),
    filled: result.filled + (String(mechanic.title || mechanic.purpose).trim() ? 1 : 0)
}), { cost: 0, filled: 0 });

const getGameBadges = (mechanics, scores) => {
    const badges = [];

    if (scores.filled >= 2 && scores.cost <= maxBudget) badges.push("Собранный набор");
    if (mechanics.some((mechanic) => /прогресс|чек-?лист|этап/i.test(mechanic.title))) badges.push("Видимый прогресс");
    if (mechanics.some((mechanic) => /попыт|фидбек|ошиб/i.test(`${mechanic.title} ${mechanic.purpose}`))) badges.push("Поддержка повторной попытки");
    if (mechanics.some((mechanic) => /огранич|челлендж|ресурс|таймер/i.test(mechanic.title)) && scores.cost <= maxBudget) badges.push("Мягкий челлендж");
    if (!badges.length) badges.push("Нужна доработка");

    return badges;
};

const getQuestionCount = (values) => getQuizQuestions(values)
    .filter((question) => String(question.prompt ?? "").trim()).length;

const getInteractionExerciseCount = (values) => getInteractionExercises(values)
    .filter((exercise) => String(exercise.title || exercise.instruction || exercise.items).trim()).length;

const getScenarioNodeCount = (values) => getScenarioNodes(values)
    .filter((node) => String(node.title || node.scene || node.question).trim()).length;

const getFilledCount = (module, values) => {
    if (module.id === QUIZ_BANK_MODULE_ID) {
        return [
            String(values.quizGoal ?? "").trim(),
            getQuestionCount(values) > 0 ? "questions" : ""
        ].filter(Boolean).length;
    }

    if (module.id === INTERACTION_BUILDER_MODULE_ID) {
        return [
            String(values.exerciseGoal ?? "").trim(),
            getInteractionExerciseCount(values) > 0 ? "exercises" : ""
        ].filter(Boolean).length;
    }

    if (module.id === SCENARIO_BUILDER_MODULE_ID) {
        return [
            String(values.situation ?? "").trim(),
            getScenarioNodeCount(values) > 0 ? "scenarioNodes" : ""
        ].filter(Boolean).length;
    }

    if (module.id === GAMIFICATION_BUILDER_MODULE_ID) {
        return [
            String(values.targetBehavior ?? "").trim(),
            getGameMechanics(values).some((mechanic) => String(mechanic.title || mechanic.purpose).trim()) ? "gameMechanics" : "",
            String(values.riskCheck ?? "").trim()
        ].filter(Boolean).length;
    }

    return module.artifactFields.filter((field) => String(values[field.id] ?? "").trim()).length;
};

const collectProject = () => modules.map((module) => {
    const storedValues = getArtifact(module.id);
    let values = storedValues;
    if (module.id === QUIZ_BANK_MODULE_ID) {
        values = { ...storedValues, questions: getQuizQuestions(storedValues) };
    }
    if (module.id === INTERACTION_BUILDER_MODULE_ID) {
        values = { ...storedValues, exercises: getInteractionExercises(storedValues) };
    }
    if (module.id === SCENARIO_BUILDER_MODULE_ID) {
        values = {
            situation: storedValues.situation ?? "",
            scenarioNodes: getScenarioNodes(storedValues)
        };
    }
    if (module.id === GAMIFICATION_BUILDER_MODULE_ID) {
        values = {
            targetBehavior: storedValues.targetBehavior ?? "",
            gameMechanics: getGameMechanics(storedValues),
            riskCheck: storedValues.riskCheck ?? ""
        };
    }
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

    if (moduleId === INTERACTION_BUILDER_MODULE_ID) {
        renderInteractionBuilderForm(module, content);
        return;
    }

    if (moduleId === SCENARIO_BUILDER_MODULE_ID) {
        renderScenarioBuilderForm(module, content);
        return;
    }

    if (moduleId === GAMIFICATION_BUILDER_MODULE_ID) {
        renderGamificationBuilderForm(module, content);
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

function renderScenarioBuilderForm(module, content) {
    const moduleId = module.id;
    const saved = getArtifact(moduleId);
    let scenarioNodes = getScenarioNodes(saved);

    const form = document.createElement("article");
    form.className = "lesson-card artifact-card";
    form.innerHTML = `
        <div class="lesson-card__meta">
            <span class="tag">Сквозной проект</span>
            <span class="tag">До ${MAX_SCENARIO_NODES} узлов</span>
        </div>
        <h2>${escapeHtml(module.artifactTitle)}</h2>
        <p>Соберите черновик branching scenario: опишите стартовую ситуацию, ключевые узлы, варианты выбора, последствия и переходы между ветками.</p>
        <div class="artifact-guide">
            <h3>Как пользоваться конструктором</h3>
            <ol>
                <li><strong>Начните с ситуации.</strong> Опишите, кто действует, в каком контексте и какой навык тренирует сценарий. Это будет общий замысел кейса.</li>
                <li><strong>Добавьте первый узел.</strong> Узел — это один экран сценария: короткая сцена, вопрос к слушателю и варианты действий. Первый узел считается стартом в экспортируемом сайте.</li>
                <li><strong>Заполните варианты выбора.</strong> Для каждого выбора напишите текст кнопки, последствие и тип исхода: удачный, частично удачный или рискованный. Последствие должно показывать, что изменилось после решения, а не просто говорить «верно» или «неверно».</li>
                <li><strong>Укажите переход.</strong> В поле «Куда ведет выбор» можно написать <code>Узел 2</code>, <code>2</code>, название другого узла или <code>старт</code>. В экспортируемом сайте такой выбор покажет последствие и даст перейти дальше. Если поле оставить пустым, выбор станет финальной точкой: слушатель увидит последствие и сценарий на этом маршруте остановится.</li>
                <li><strong>Проверьте дерево.</strong> Пройдите все ветки глазами: у каждого выбора должно быть понятное последствие, а у каждого перехода — существующий узел или осознанное завершение маршрута.</li>
            </ol>
        </div>
        <form class="artifact-form scenario-builder" data-artifact-form data-scenario-builder-form>
            <label class="artifact-field" for="artifact-situation">
                <span>Ситуация сценария</span>
                <textarea id="artifact-situation" name="situation" rows="4" placeholder="Кто действует, в каком контексте и какую задачу должен решить?">${escapeHtml(saved.situation ?? "")}</textarea>
            </label>

            <div class="quiz-builder__panel">
                <div>
                    <h3>Узлы сценария</h3>
                    <p data-scenario-count>${scenarioNodes.length} из ${MAX_SCENARIO_NODES}</p>
                </div>
                <button class="button button--secondary" type="button" data-add-scenario-node>Добавить узел</button>
            </div>

            <div class="scenario-builder__list" data-scenario-list></div>

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
    const list = form.querySelector("[data-scenario-list]");
    const count = form.querySelector("[data-scenario-count]");
    const status = form.querySelector("[data-artifact-status]");

    const sync = (message = "Черновик сохранен") => {
        scenarioNodes = collectScenarioNodes(artifactForm);
        setArtifact(moduleId, {
            situation: artifactForm.elements.situation.value,
            scenarioNodes
        });
        count.textContent = `${scenarioNodes.length} из ${MAX_SCENARIO_NODES}`;
        status.textContent = message;
    };

    const rerender = (message) => {
        renderScenarioNodes(list, scenarioNodes);
        count.textContent = `${scenarioNodes.length} из ${MAX_SCENARIO_NODES}`;
        status.textContent = message;
    };

    rerender("");

    artifactForm.addEventListener("click", (event) => {
        const addNodeButton = event.target.closest("[data-add-scenario-node]");
        const removeNodeButton = event.target.closest("[data-remove-scenario-node]");
        const addChoiceButton = event.target.closest("[data-add-scenario-choice]");
        const removeChoiceButton = event.target.closest("[data-remove-scenario-choice]");

        if (addNodeButton) {
            scenarioNodes = collectScenarioNodes(artifactForm);
            if (scenarioNodes.length >= MAX_SCENARIO_NODES) {
                status.textContent = `Максимум ${MAX_SCENARIO_NODES} узлов`;
                return;
            }
            scenarioNodes.push(getScenarioNodeTemplate());
            rerender("Узел добавлен");
            sync("Черновик сохранен");
        }

        if (removeNodeButton) {
            scenarioNodes = collectScenarioNodes(artifactForm)
                .filter((_, index) => index !== Number(removeNodeButton.dataset.removeScenarioNode));
            rerender("Узел удален");
            sync("Черновик сохранен");
        }

        if (addChoiceButton) {
            scenarioNodes = collectScenarioNodes(artifactForm);
            const node = scenarioNodes[Number(addChoiceButton.dataset.addScenarioChoice)];
            if (node && node.choices.length < 4) node.choices.push(getScenarioChoiceTemplate());
            rerender("Выбор добавлен");
            sync("Черновик сохранен");
        }

        if (removeChoiceButton) {
            scenarioNodes = collectScenarioNodes(artifactForm);
            const node = scenarioNodes[Number(removeChoiceButton.dataset.nodeIndex)];
            if (node && node.choices.length > 2) {
                node.choices.splice(Number(removeChoiceButton.dataset.removeScenarioChoice), 1);
            }
            rerender("Выбор удален");
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

function renderScenarioNodes(container, nodes) {
    container.innerHTML = nodes.length ? nodes.map((node, nodeIndex) => `
        <article class="quiz-builder__question scenario-builder__node" data-scenario-node-index="${nodeIndex}">
            <div class="quiz-builder__question-top">
                <div>
                    <p class="eyebrow">Узел ${nodeIndex + 1}</p>
                    <h3>${escapeHtml(node.title || "Новая развилка")}</h3>
                </div>
                <button class="button button--secondary" type="button" data-remove-scenario-node="${nodeIndex}">Удалить</button>
            </div>
            <label class="quiz-builder__field">
                <span>Название узла</span>
                <input type="text" data-scenario-field="title" value="${escapeHtml(node.title)}" placeholder="Например: Клиент раздражен после задержки">
            </label>
            <label class="quiz-builder__field">
                <span>Сцена</span>
                <textarea data-scenario-field="scene" rows="3" placeholder="Что видит слушатель? Какие вводные у ситуации?">${escapeHtml(node.scene)}</textarea>
            </label>
            <label class="quiz-builder__field">
                <span>Вопрос к слушателю</span>
                <textarea data-scenario-field="question" rows="2" placeholder="Например: Что должен сделать специалист первым шагом?">${escapeHtml(node.question)}</textarea>
            </label>
            <div class="quiz-builder__options">
                <div class="quiz-builder__subhead">
                    <h4>Варианты выбора</h4>
                    <button class="button button--secondary" type="button" data-add-scenario-choice="${nodeIndex}" ${node.choices.length >= 4 ? "disabled" : ""}>Добавить выбор</button>
                </div>
                ${node.choices.map((choice, choiceIndex) => renderScenarioChoice(nodeIndex, choiceIndex, choice, node.choices.length)).join("")}
            </div>
        </article>
    `).join("") : `
        <div class="quiz-builder__empty">
            <h3>Пока нет узлов сценария</h3>
            <p>Добавьте первую развилку: короткую сцену, вопрос к слушателю, 2-4 выбора и последствия каждого выбора.</p>
        </div>
    `;
}

function renderScenarioChoice(nodeIndex, choiceIndex, choice, choiceCount) {
    return `
        <article class="scenario-builder__choice" data-scenario-choice-index="${choiceIndex}">
            <div class="quiz-builder__subhead">
                <h4>Выбор ${choiceIndex + 1}</h4>
                <button class="button button--secondary" type="button" data-node-index="${nodeIndex}" data-remove-scenario-choice="${choiceIndex}" ${choiceCount <= 2 ? "disabled" : ""}>Убрать</button>
            </div>
            <label class="quiz-builder__field">
                <span>Текст выбора</span>
                <textarea data-scenario-choice-field="text" rows="2" placeholder="Что нажимает или выбирает слушатель?">${escapeHtml(choice.text)}</textarea>
            </label>
            <label class="quiz-builder__field">
                <span>Последствие</span>
                <textarea data-scenario-choice-field="consequence" rows="3" placeholder="Что произойдет после выбора? Что увидит слушатель и какой вывод должен сделать?">${escapeHtml(choice.consequence)}</textarea>
            </label>
            <div class="scenario-builder__choice-grid">
                <label class="quiz-builder__field">
                    <span>Тип исхода</span>
                    <select data-scenario-choice-field="type">
                        ${Object.entries(scenarioChoiceTypes).map(([type, label]) => `
                            <option value="${type}" ${choice.type === type ? "selected" : ""}>${escapeHtml(label)}</option>
                        `).join("")}
                    </select>
                </label>
                <label class="quiz-builder__field">
                    <span>Куда ведет выбор</span>
                    <input type="text" data-scenario-choice-field="next" value="${escapeHtml(choice.next)}" placeholder="Например: Узел 2, 2, название узла или старт. Оставьте пустым, чтобы завершить ветку.">
                </label>
            </div>
        </article>
    `;
}

function collectScenarioNodes(form) {
    return [...form.querySelectorAll(".scenario-builder__node[data-scenario-node-index]")]
        .slice(0, MAX_SCENARIO_NODES)
        .map((nodeElement) => normalizeScenarioNode({
            id: `node-${nodeElement.dataset.scenarioNodeIndex}`,
            title: nodeElement.querySelector("[data-scenario-field='title']")?.value ?? "",
            scene: nodeElement.querySelector("[data-scenario-field='scene']")?.value ?? "",
            question: nodeElement.querySelector("[data-scenario-field='question']")?.value ?? "",
            choices: [...nodeElement.querySelectorAll("[data-scenario-choice-index]")]
                .slice(0, 4)
                .map((choiceElement) => normalizeScenarioChoice({
                    text: choiceElement.querySelector("[data-scenario-choice-field='text']")?.value ?? "",
                    consequence: choiceElement.querySelector("[data-scenario-choice-field='consequence']")?.value ?? "",
                    type: choiceElement.querySelector("[data-scenario-choice-field='type']")?.value ?? "partial",
                    next: choiceElement.querySelector("[data-scenario-choice-field='next']")?.value ?? ""
                }))
        }));
}

function renderGamificationBuilderForm(module, content) {
    const moduleId = module.id;
    const saved = getArtifact(moduleId);
    let gameMechanics = getGameMechanics(saved);

    const form = document.createElement("article");
    form.className = "lesson-card artifact-card";
    form.innerHTML = `
        <div class="lesson-card__meta">
            <span class="tag">Сквозной проект</span>
            <span class="tag">Бюджет ${maxBudget} очков</span>
        </div>
        <h2>${escapeHtml(module.artifactTitle)}</h2>
        <p>Соберите мотивационную механику для своего урока: опишите поведение, придумайте игровые элементы, задайте стоимость каждого и проверьте, не перегружен ли урок.</p>
        <form class="artifact-form game-builder" data-artifact-form data-game-builder-form>
            <label class="artifact-field" for="artifact-targetBehavior">
                <span>Какое поведение поддерживаем</span>
                <textarea id="artifact-targetBehavior" name="targetBehavior" rows="4" placeholder="Например: довести проект до сдачи, вернуться к ошибке, пройти сложный кейс второй раз.">${escapeHtml(saved.targetBehavior ?? "")}</textarea>
            </label>

            <div class="game-challenge game-builder__challenge" data-game-builder-challenge>
                <div class="game-challenge__top">
                    <div>
                        <h3>Игровые элементы</h3>
                        <p>Добавьте до ${MAX_GAME_MECHANICS} своих механик. Стоимость показывает, сколько внимания и сложности она добавляет в урок.</p>
                    </div>
                    <span class="tag">Бюджет: <strong data-game-builder-budget>${maxBudget} / ${maxBudget}</strong></span>
                </div>

                <div class="game-challenge__grid">
                    <div class="game-builder__list" data-game-mechanics-list></div>

                    <div class="game-dashboard">
                        <div class="game-meter">
                            <div class="game-meter__label"><span>Механик в наборе</span><strong data-game-builder-count>0 / ${MAX_GAME_MECHANICS}</strong></div>
                            <div class="progress-meter"><div class="progress-meter__bar progress-meter__bar--read" data-game-builder-count-meter></div></div>
                        </div>
                        <div class="game-meter">
                            <div class="game-meter__label"><span>Использовано бюджета</span><strong data-game-builder-cost>0 / ${maxBudget}</strong></div>
                            <div class="progress-meter"><div class="progress-meter__bar progress-meter__bar--saved" data-game-builder-cost-meter></div></div>
                        </div>

                        <div class="game-badges" data-game-builder-badges aria-label="Полученные бейджи"></div>
                        <div class="game-feedback" data-game-builder-feedback aria-live="polite"></div>
                        <button class="button button--secondary" type="button" data-add-game-mechanic>Добавить механику</button>
                    </div>
                </div>
            </div>

            <label class="artifact-field" for="artifact-riskCheck">
                <span>Как избежать декоративности</span>
                <textarea id="artifact-riskCheck" name="riskCheck" rows="4" placeholder="Почему выбранные элементы связаны с учебной задачей? Что вы уберете, если механика начнет отвлекать?">${escapeHtml(saved.riskCheck ?? "")}</textarea>
            </label>

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
    const list = form.querySelector("[data-game-mechanics-list]");
    const status = form.querySelector("[data-artifact-status]");

    const rerender = (message = "") => {
        renderGameMechanicRows(list, gameMechanics);
        updateGameBuilderPreview(artifactForm, gameMechanics);
        status.textContent = message;
    };

    const sync = (message = "Черновик сохранен") => {
        gameMechanics = collectGameMechanics(artifactForm);
        updateGameBuilderPreview(artifactForm, gameMechanics);
        setArtifact(moduleId, {
            targetBehavior: artifactForm.elements.targetBehavior.value,
            gameMechanics,
            riskCheck: artifactForm.elements.riskCheck.value
        });
        status.textContent = message;
    };

    rerender("");

    artifactForm.addEventListener("click", (event) => {
        const addButton = event.target.closest("[data-add-game-mechanic]");
        const removeButton = event.target.closest("[data-remove-game-mechanic]");

        if (addButton) {
            gameMechanics = collectGameMechanics(artifactForm);
            if (gameMechanics.length >= MAX_GAME_MECHANICS) {
                status.textContent = `Максимум ${MAX_GAME_MECHANICS} механик`;
                return;
            }
            gameMechanics.push(getGameMechanicTemplate());
            rerender("Механика добавлена");
            sync("Черновик сохранен");
        }

        if (removeButton) {
            gameMechanics = collectGameMechanics(artifactForm)
                .filter((_, index) => index !== Number(removeButton.dataset.removeGameMechanic));
            rerender("Механика удалена");
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

function renderGameMechanicRows(container, mechanics) {
    container.innerHTML = mechanics.length ? mechanics.map((mechanic, index) => `
        <article class="scenario-builder__choice game-builder__mechanic" data-game-mechanic-index="${index}">
            <div class="quiz-builder__subhead">
                <h4>Механика ${index + 1}</h4>
                <button class="button button--secondary" type="button" data-remove-game-mechanic="${index}">Убрать</button>
            </div>
            <div class="scenario-builder__choice-grid">
                <label class="quiz-builder__field">
                    <span>Название механики</span>
                    <input type="text" data-game-mechanic-field="title" value="${escapeHtml(mechanic.title)}" placeholder="Например: прогресс по проектным шагам">
                </label>
                <label class="quiz-builder__field">
                    <span>Стоимость</span>
                    <input type="number" min="0" max="10" step="1" data-game-mechanic-field="cost" value="${escapeHtml(mechanic.cost)}" placeholder="1">
                </label>
            </div>
            <label class="quiz-builder__field">
                <span>Как она поддерживает обучение</span>
                <textarea data-game-mechanic-field="purpose" rows="3" placeholder="Например: показывает, какие проектные шаги уже собраны, и помогает вернуться к незавершенным частям.">${escapeHtml(mechanic.purpose)}</textarea>
            </label>
        </article>
    `).join("") : `
        <div class="quiz-builder__empty">
            <h3>Пока нет игровых механик</h3>
            <p>Добавьте 2-3 механики, задайте стоимость каждой и объясните, какое учебное поведение они поддерживают.</p>
        </div>
    `;
}

function collectGameMechanics(form) {
    return [...form.querySelectorAll(".game-builder__mechanic[data-game-mechanic-index]")]
        .slice(0, MAX_GAME_MECHANICS)
        .map((mechanicElement) => normalizeGameMechanic({
            id: `game-${mechanicElement.dataset.gameMechanicIndex}`,
            title: mechanicElement.querySelector("[data-game-mechanic-field='title']")?.value ?? "",
            cost: mechanicElement.querySelector("[data-game-mechanic-field='cost']")?.value ?? "1",
            purpose: mechanicElement.querySelector("[data-game-mechanic-field='purpose']")?.value ?? ""
        }));
}

function updateGameBuilderPreview(form, mechanics) {
    const scores = getGameScores(mechanics);
    const budgetLeft = maxBudget - scores.cost;

    const budget = form.querySelector("[data-game-builder-budget]");
    if (budget) {
        budget.textContent = `${Math.max(0, budgetLeft)} / ${maxBudget}`;
        budget.classList.toggle("is-error", budgetLeft < 0);
    }

    const countMeter = form.querySelector("[data-game-builder-count-meter]");
    const costMeter = form.querySelector("[data-game-builder-cost-meter]");
    const countValue = form.querySelector("[data-game-builder-count]");
    const costValue = form.querySelector("[data-game-builder-cost]");
    if (countMeter) countMeter.style.width = `${Math.min(100, (mechanics.length / MAX_GAME_MECHANICS) * 100)}%`;
    if (costMeter) costMeter.style.width = `${Math.min(100, (scores.cost / maxBudget) * 100)}%`;
    if (countValue) countValue.textContent = `${mechanics.length} / ${MAX_GAME_MECHANICS}`;
    if (costValue) {
        costValue.textContent = `${scores.cost} / ${maxBudget}`;
        costValue.classList.toggle("is-error", budgetLeft < 0);
    }

    const feedback = form.querySelector("[data-game-builder-feedback]");
    const badges = form.querySelector("[data-game-builder-badges]");
    if (feedback) {
        const filledMechanics = mechanics.filter((mechanic) => String(mechanic.title || mechanic.purpose).trim());
        const selectedList = filledMechanics.map((mechanic) => `<li><b>${escapeHtml(mechanic.title || "Без названия")}</b>: ${escapeHtml(mechanic.purpose || "Поясните, как эта механика поддерживает обучение.")}</li>`).join("");
        const overBudget = budgetLeft < 0 ? "<li>Бюджет превышен: уберите одну механику или замените ее более точной.</li>" : "";
        feedback.innerHTML = filledMechanics.length
            ? `<ul class="bullets">${selectedList}${overBudget}</ul>`
            : "<p>Добавьте 2-3 механики и задайте им стоимость. Чем выше стоимость, тем больше внимания и сложности она забирает у урока.</p>";
    }
    if (badges) {
        badges.innerHTML = getGameBadges(mechanics, scores)
            .map((badge) => `<span class="game-badge">${escapeHtml(badge)}</span>`)
            .join("");
    }
}

function renderQuizBankForm(module, content) {
    const moduleId = module.id;
    const saved = getArtifact(moduleId);
    let questions = getQuizQuestions(saved);

    if (Array.isArray(saved.questions) && saved.questions.length !== questions.length) {
        setArtifact(moduleId, {
            ...saved,
            questions
        });
    }

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
    return [...form.querySelectorAll(".quiz-builder__question[data-question-index]")]
        .slice(0, MAX_QUIZ_QUESTIONS)
        .map((questionElement) => {
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

        return normalizeQuizQuestion(question);
    });
}

function saveArtifactFromForm(moduleId, form) {
    const values = {};
    new FormData(form).forEach((value, key) => {
        values[key] = value;
    });
    setArtifact(moduleId, values);
}

function renderInteractionBuilderForm(module, content) {
    const moduleId = module.id;
    const saved = getArtifact(moduleId);
    let exercises = getInteractionExercises(saved);

    if (Array.isArray(saved.exercises) && saved.exercises.length !== exercises.length) {
        setArtifact(moduleId, {
            ...saved,
            exercises
        });
    }

    const form = document.createElement("article");
    form.className = "lesson-card artifact-card";
    form.innerHTML = `
        <div class="lesson-card__meta">
            <span class="tag">Сквозной проект</span>
            <span class="tag">До ${MAX_INTERACTION_EXERCISES} упражнений</span>
        </div>
        <h2>${escapeHtml(module.artifactTitle)}</h2>
        <p>Соберите набор упражнений на сортировку или ранжирование. Для каждого опишите учебную задачу, элементы, правильную структуру и обратную связь.</p>
        <form class="artifact-form interaction-builder" data-artifact-form data-interaction-builder-form>
            <label class="artifact-field" for="artifact-exerciseGoal">
                <span>Что тренирует упражнение</span>
                <textarea id="artifact-exerciseGoal" name="exerciseGoal" rows="4" placeholder="Классификацию, порядок действий, сопоставление понятий...">${escapeHtml(saved.exerciseGoal ?? "")}</textarea>
            </label>

            <div class="quiz-builder__panel">
                <div>
                    <h3>Упражнения</h3>
                    <p data-interaction-count>${exercises.length} из ${MAX_INTERACTION_EXERCISES}</p>
                </div>
                <div class="interaction-builder__add">
                    ${Object.entries(interactionTypes).map(([type, label]) => `
                        <button class="button button--secondary" type="button" data-add-exercise="${type}">${escapeHtml(label)}</button>
                    `).join("")}
                </div>
            </div>

            <div class="interaction-builder__list" data-interaction-list></div>

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
    const list = form.querySelector("[data-interaction-list]");
    const count = form.querySelector("[data-interaction-count]");
    const status = form.querySelector("[data-artifact-status]");

    const sync = (message = "Черновик сохранен") => {
        exercises = collectInteractionExercises(artifactForm);
        setArtifact(moduleId, {
            exerciseGoal: artifactForm.elements.exerciseGoal.value,
            exercises
        });
        count.textContent = `${exercises.length} из ${MAX_INTERACTION_EXERCISES}`;
        status.textContent = message;
    };

    const rerender = (message) => {
        renderInteractionExercises(list, exercises);
        count.textContent = `${exercises.length} из ${MAX_INTERACTION_EXERCISES}`;
        status.textContent = message;
        initSortingTasks();
    };

    rerender("");

    artifactForm.addEventListener("click", (event) => {
        const addButton = event.target.closest("[data-add-exercise]");
        const removeButton = event.target.closest("[data-remove-exercise]");
        const refreshButton = event.target.closest("[data-refresh-exercise]");

        if (addButton) {
            exercises = collectInteractionExercises(artifactForm);
            if (exercises.length >= MAX_INTERACTION_EXERCISES) {
                status.textContent = `Максимум ${MAX_INTERACTION_EXERCISES} упражнений`;
                return;
            }
            exercises.push(getInteractionTemplate(addButton.dataset.addExercise));
            rerender("Упражнение добавлено");
            sync("Черновик сохранен");
        }

        if (removeButton) {
            exercises = collectInteractionExercises(artifactForm)
                .filter((_, index) => index !== Number(removeButton.dataset.removeExercise));
            rerender("Упражнение удалено");
            sync("Черновик сохранен");
        }

        if (refreshButton) {
            exercises = collectInteractionExercises(artifactForm);
            rerender("Предпросмотр обновлен");
            sync("Черновик сохранен");
            initSortingTasks();
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

function renderInteractionExercises(container, exercises) {
    container.innerHTML = exercises.length ? exercises.map((exercise, index) => `
        <article class="interaction-builder__exercise" data-exercise-index="${index}" data-exercise-type="${escapeHtml(exercise.type)}">
            <div class="quiz-builder__question-top">
                <div>
                    <p class="eyebrow">Упражнение ${index + 1} · ${escapeHtml(interactionTypes[exercise.type])}</p>
                    <h3>${escapeHtml(interactionTypes[exercise.type])}</h3>
                </div>
                <button class="button button--secondary" type="button" data-remove-exercise="${index}">Удалить</button>
            </div>
            <label class="quiz-builder__field">
                <span>Название</span>
                <input type="text" data-exercise-field="title" value="${escapeHtml(exercise.title)}" placeholder="${escapeHtml(getInteractionPlaceholder(exercise.type, "title"))}">
            </label>
            <label class="quiz-builder__field">
                <span>Инструкция для слушателя</span>
                <textarea data-exercise-field="instruction" rows="3" placeholder="${escapeHtml(getInteractionPlaceholder(exercise.type, "instruction"))}">${escapeHtml(exercise.instruction)}</textarea>
            </label>
            <label class="quiz-builder__field">
                <span>${exercise.type === "ranking" ? "Шаги или элементы порядка" : "Карточки для сортировки"}</span>
                <textarea data-exercise-field="items" rows="5" placeholder="${escapeHtml(getInteractionPlaceholder(exercise.type, "items"))}">${escapeHtml(exercise.items)}</textarea>
            </label>
            <label class="quiz-builder__field">
                <span>${exercise.type === "ranking" ? "Правильный порядок" : "Зоны и правильное распределение"}</span>
                <textarea data-exercise-field="targetStructure" rows="5" placeholder="${escapeHtml(getInteractionPlaceholder(exercise.type, "targetStructure"))}">${escapeHtml(exercise.targetStructure)}</textarea>
            </label>
            <label class="quiz-builder__field">
                <span>Подсказка или фидбек</span>
                <textarea data-exercise-field="feedback" rows="3" placeholder="${escapeHtml(getInteractionPlaceholder(exercise.type, "feedback"))}">${escapeHtml(exercise.feedback)}</textarea>
            </label>
            <div class="interaction-preview">
                <div class="interaction-preview__top">
                    <h4>Предпросмотр</h4>
                    <button class="button button--secondary" type="button" data-refresh-exercise="${index}">Обновить предпросмотр</button>
                </div>
                ${renderInteractionPreview(exercise, index)}
            </div>
        </article>
    `).join("") : `
        <div class="quiz-builder__empty">
            <h3>Пока нет упражнений</h3>
            <p>Добавьте сортировку или ранжирование. Начать можно с одного небольшого задания на 4-6 элементов.</p>
        </div>
    `;
}

function parseLines(value) {
    return String(value ?? "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
}

function getInteractionPlaceholder(type, field) {
    const placeholders = {
        sorting: {
            title: "Например: Сортировка ошибок фидбека",
            instruction: "Формат: короткая команда для слушателя.\nНапример: Разложите примеры по типам учебных механик.",
            items: "Формат: одна карточка на строку.\nНапример:\nОбъяснить ошибку после ответа\nРазнести примеры по категориям\nВосстановить порядок процесса",
            targetStructure: "Формат: Зона: карточка 1, карточка 2\nНазвания карточек должны совпадать с полем выше.\nНапример:\nКвиз: Объяснить ошибку после ответа\nDrag-and-drop: Разнести примеры по категориям, Восстановить порядок процесса",
            feedback: "Формат: подсказка после ошибки или успеха.\nНапример: Проверьте, какое учебное действие выполняет слушатель: выбирает ответ или распределяет элементы."
        },
        ranking: {
            title: "Например: Порядок проектирования drag-and-drop задания",
            instruction: "Формат: короткая команда для слушателя.\nНапример: Расставьте шаги проектирования в правильной последовательности.",
            items: "Формат: один шаг на строку. Можно дать шаги в перемешанном порядке.\nНапример:\nПроверить удобство на мобильной ширине\nОпределить учебное действие\nДобавить фидбек\nВыбрать карточки и зоны",
            targetStructure: "Формат: правильный порядок, один шаг на строку.\nТекст шагов должен совпадать с полем выше.\nНапример:\nОпределить учебное действие\nВыбрать карточки и зоны\nПроверить удобство на мобильной ширине\nДобавить фидбек",
            feedback: "Формат: подсказка после ошибки или успеха.\nНапример: Сначала формулируется учебная задача, затем элементы и зоны, потом интерфейс и фидбек."
        }
    };

    return placeholders[type]?.[field] || "";
}

function getZoneKey(index) {
    return `zone-${index}`;
}

function parseSortingZones(value) {
    return parseLines(value).map((line, index) => {
        const [rawTitle, rawItems = ""] = line.includes(":") ? line.split(/:(.*)/s) : [line, ""];
        return {
            key: getZoneKey(index),
            title: rawTitle.trim() || `Зона ${index + 1}`,
            items: rawItems
                .split(/[,;]+/)
                .map((item) => item.trim().toLowerCase())
                .filter(Boolean)
        };
    });
}

function renderInteractionPreview(exercise, index) {
    if (exercise.type === "ranking") {
        return renderRankingPreview(exercise, index);
    }

    return renderSortingPreview(exercise, index);
}

function renderSortingPreview(exercise, index) {
    const items = parseLines(exercise.items);
    const zones = parseSortingZones(exercise.targetStructure);

    if (!items.length || !zones.length) {
        return `<p class="interaction-preview__empty">Заполните карточки и зоны распределения, затем обновите предпросмотр.</p>`;
    }

    const fallbackZone = zones[0]?.key || "zone-0";
    const cards = items.map((item, itemIndex) => {
        const normalizedItem = item.toLowerCase();
        const targetZone = zones.find((zone) => zone.items.some((zoneItem) => zoneItem === normalizedItem))?.key || fallbackZone;
        return `
            <button class="sorting-card" type="button" draggable="true" data-card="preview-${index}-${itemIndex}" data-target="${targetZone}">${escapeHtml(item)}</button>
        `;
    }).join("");

    return `
        <div class="interaction-preview__task sorting-task" data-sorting-task>
            <p class="interaction-preview__instruction">${escapeHtml(exercise.instruction || "Разложите карточки по зонам.")}</p>
            <div class="sorting-task__source" data-sorting-source aria-label="Карточки предпросмотра">
                ${cards}
            </div>
            <div class="sorting-task__zones">
                ${zones.map((zone) => `
                    <section class="sorting-zone" data-zone="${zone.key}" aria-label="${escapeHtml(zone.title)}">
                        <h3>${escapeHtml(zone.title)}</h3>
                    </section>
                `).join("")}
            </div>
            <div class="sorting-task__actions">
                <button class="button button--primary" type="button" data-sorting-check>Проверить</button>
                <button class="button button--secondary" type="button" data-sorting-reset>Сбросить</button>
                <span class="sorting-task__status" data-sorting-status aria-live="polite"></span>
            </div>
        </div>
    `;
}

function renderRankingPreview(exercise, index) {
    const items = parseLines(exercise.items);
    const targetOrder = parseLines(exercise.targetStructure);

    if (!items.length) {
        return `<p class="interaction-preview__empty">Заполните шаги ранжирования, затем обновите предпросмотр.</p>`;
    }

    const orderedReference = targetOrder.length ? targetOrder : items;
    const normalizedReference = orderedReference.map((item) => item.toLowerCase());

    return `
        <div class="interaction-preview__task ranking-task" data-ranking-task>
            <p class="interaction-preview__instruction">${escapeHtml(exercise.instruction || "Расставьте шаги в правильном порядке.")}</p>
            <div class="ranking-list" data-ranking-list aria-label="Шаги предпросмотра">
                ${items.map((item, itemIndex) => {
                    const referenceIndex = normalizedReference.indexOf(item.toLowerCase());
                    const correctOrder = referenceIndex >= 0 ? referenceIndex + 1 : itemIndex + 1;
                    return `
                        <div class="ranking-item" draggable="true" data-rank-item="preview-rank-${index}-${itemIndex}" data-order="${correctOrder}">
                            <span>${escapeHtml(item)}</span>
                            <div class="ranking-item__controls">
                                <button type="button" data-rank-up aria-label="Поднять шаг">↑</button>
                                <button type="button" data-rank-down aria-label="Опустить шаг">↓</button>
                            </div>
                        </div>
                    `;
                }).join("")}
            </div>
            <div class="sorting-task__actions">
                <button class="button button--primary" type="button" data-ranking-check>Проверить</button>
                <button class="button button--secondary" type="button" data-ranking-shuffle>Перемешать</button>
                <span class="sorting-task__status" data-ranking-status aria-live="polite"></span>
            </div>
        </div>
    `;
}

function collectInteractionExercises(form) {
    return [...form.querySelectorAll(".interaction-builder__exercise[data-exercise-index]")]
        .slice(0, MAX_INTERACTION_EXERCISES)
        .map((exerciseElement) => normalizeInteractionExercise({
            id: `exercise-${exerciseElement.dataset.exerciseIndex}`,
            type: exerciseElement.dataset.exerciseType,
            title: exerciseElement.querySelector("[data-exercise-field='title']")?.value ?? "",
            instruction: exerciseElement.querySelector("[data-exercise-field='instruction']")?.value ?? "",
            items: exerciseElement.querySelector("[data-exercise-field='items']")?.value ?? "",
            targetStructure: exerciseElement.querySelector("[data-exercise-field='targetStructure']")?.value ?? "",
            feedback: exerciseElement.querySelector("[data-exercise-field='feedback']")?.value ?? ""
        }));
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

function renderExportQuizBank(values) {
    const questions = getQuizQuestions(values);

    if (!questions.length) return "<p>Пока не добавлены</p>";

    return `
        <div class="export-quiz-bank">
            ${questions.map((question, index) => renderExportQuizQuestion(question, index)).join("")}
        </div>
    `;
}

function renderExportQuizQuestion(question, index) {
    const typeLabel = quizTypes[question.type] || question.type;
    return `
        <section class="export-quiz" data-export-quiz data-export-quiz-type="${escapeHtml(question.type)}">
            <p class="export-quiz__type">Вопрос ${index + 1} · ${escapeHtml(typeLabel)}</p>
            <h3>${escapeHtml(question.prompt || "Вопрос пока не заполнен")}</h3>
            ${renderExportQuizBody(question, index)}
            <button type="button" data-export-quiz-check>Проверить</button>
            <p class="export-quiz__feedback" data-export-quiz-feedback data-hint="${escapeHtml(question.hint || "Вернитесь к материалу вопроса и сравните свой ответ с учебной целью.")}" aria-live="polite"></p>
        </section>
    `;
}

function renderExportQuizBody(question, index) {
    if (question.type === "single" || question.type === "multiple") {
        const options = Array.isArray(question.options) && question.options.length ? question.options : ["", ""];
        const correctIndexes = new Set((question.correctIndexes || []).map(String));

        return `
            <div class="export-quiz__options">
                ${options.map((option, optionIndex) => {
                    const isCorrect = question.type === "single"
                        ? String(question.correctIndex ?? "0") === String(optionIndex)
                        : correctIndexes.has(String(optionIndex));
                    const inputType = question.type === "single" ? "radio" : "checkbox";
                    return `
                        <label>
                            <input type="${inputType}" name="export-question-${index}" value="${optionIndex}" ${isCorrect ? "data-correct=\"true\"" : ""}>
                            <span>${escapeHtml(option || `Вариант ${optionIndex + 1}`)}</span>
                        </label>
                    `;
                }).join("")}
            </div>
        `;
    }

    if (question.type === "boolean") {
        return `
            <div class="export-quiz__options">
                <label>
                    <input type="checkbox" value="yes" data-correct-checked="${question.correctBoolean === "yes" ? "true" : "false"}">
                    <span>Да</span>
                </label>
            </div>
        `;
    }

    const answers = Array.isArray(question.answers) && question.answers.length ? question.answers : [""];
    return `
        <div class="export-quiz__blanks">
            ${answers.map((answer, answerIndex) => `
                <label>
                    <span>Пропуск ${answerIndex + 1}</span>
                    <input type="text" data-answer="${escapeHtml(answer)}" autocomplete="off">
                </label>
            `).join("")}
        </div>
    `;
}

function renderInteractionSummary(values) {
    const exercises = getInteractionExercises(values);

    if (!exercises.length) return "<span>Пока не добавлены</span>";

    return `
        <ol class="quiz-bank-summary">
            ${exercises.map((exercise, index) => `
                <li>
                    <strong>${index + 1}. ${escapeHtml(interactionTypes[exercise.type])}: ${escapeHtml(exercise.title || "Без названия")}</strong>
                    <p>${escapeHtml(exercise.instruction || "Инструкция пока не заполнена")}</p>
                    <p><b>${exercise.type === "ranking" ? "Правильный порядок" : "Зоны и распределение"}:</b> ${escapeHtml(exercise.targetStructure || "Пока не указано").replaceAll("\n", "<br>")}</p>
                    <p><b>Фидбек:</b> ${exercise.feedback ? escapeHtml(exercise.feedback) : "<span>Пока не указан</span>"}</p>
                </li>
            `).join("")}
        </ol>
    `;
}

function renderExportInteractionExercises(values) {
    const exercises = getInteractionExercises(values);

    if (!exercises.length) return "<p>Пока не добавлены</p>";

    return `
        <div class="export-interactions">
            ${exercises.map((exercise, index) => `
                <section class="export-interaction">
                    <p class="export-quiz__type">Упражнение ${index + 1} · ${escapeHtml(interactionTypes[exercise.type])}</p>
                    <h3>${escapeHtml(exercise.title || "Упражнение без названия")}</h3>
                    ${renderInteractionPreview(exercise, index)}
                    ${exercise.feedback ? `<p class="export-interaction__hint"><b>Подсказка:</b> ${escapeHtml(exercise.feedback)}</p>` : ""}
                </section>
            `).join("")}
        </div>
    `;
}

function renderScenarioSummary(values) {
    const nodes = getScenarioNodes(values);

    if (!nodes.length) return "<span>Пока не добавлены</span>";

    return `
        <ol class="quiz-bank-summary">
            ${nodes.map((node, index) => `
                <li>
                    <strong>${index + 1}. ${escapeHtml(node.title || "Узел без названия")}</strong>
                    <p>${escapeHtml(node.scene || "Сцена пока не описана")}</p>
                    <p><b>Вопрос:</b> ${escapeHtml(node.question || "Пока не указан")}</p>
                    <ul class="bullets">
                        ${node.choices.map((choice) => `
                            <li><b>${escapeHtml(scenarioChoiceTypes[choice.type])}:</b> ${escapeHtml(choice.text || "Выбор не заполнен")} → ${escapeHtml(choice.consequence || "последствие не указано")}${choice.next ? `; переход: ${escapeHtml(choice.next)}` : ""}</li>
                        `).join("")}
                    </ul>
                </li>
            `).join("")}
        </ol>
    `;
}

function renderExportScenario(values) {
    const nodes = getScenarioNodes(values);

    if (!nodes.length) return "<p>Пока не добавлены</p>";

    return `
        <div class="export-scenario" data-export-scenario>
            ${nodes.map((node, index) => `
                <section class="export-interaction export-scenario__node" data-export-scenario-node data-node-index="${index}" data-node-title="${escapeHtml(node.title)}" ${index === 0 ? "" : "hidden"}>
                    <p class="export-quiz__type">Узел ${index + 1}</p>
                    <h3>${escapeHtml(node.title || "Узел без названия")}</h3>
                    <p>${escapeHtml(node.scene || "Сцена пока не описана").replaceAll("\n", "<br>")}</p>
                    <p><b>Вопрос:</b> ${escapeHtml(node.question || "Пока не указан").replaceAll("\n", "<br>")}</p>
                    <div class="export-scenario-choices">
                        ${node.choices.map((choice) => `
                            <button class="export-scenario-choice export-scenario-choice--${escapeHtml(choice.type)}" type="button" data-scenario-choice data-next="${escapeHtml(choice.next)}" data-consequence="${escapeHtml(choice.consequence || "Пока не указано")}" data-choice-type="${escapeHtml(choice.type)}">
                                <span>${escapeHtml(choice.text || "Выбор не заполнен")}</span>
                                <small>${escapeHtml(scenarioChoiceTypes[choice.type])}${choice.next ? ` · переход: ${escapeHtml(choice.next)}` : ""}</small>
                            </button>
                        `).join("")}
                    </div>
                    <div class="export-scenario-result" data-scenario-result hidden>
                        <p data-scenario-result-text></p>
                        <button type="button" data-scenario-continue hidden>Продолжить</button>
                    </div>
                </section>
            `).join("")}
            <button class="export-scenario-restart" type="button" data-scenario-restart>Начать сценарий заново</button>
        </div>
    `;
}

function renderGameMechanicsSummary(values) {
    const mechanics = getGameMechanics(values);
    const filledMechanics = mechanics.filter((mechanic) => String(mechanic.title || mechanic.purpose).trim());

    if (!filledMechanics.length) return "<span>Пока не добавлены</span>";

    const scores = getGameScores(filledMechanics);
    const badges = getGameBadges(filledMechanics, scores);

    return `
        <div class="quiz-bank-summary">
            <p><b>Бюджет:</b> использовано ${scores.cost} из ${maxBudget}, осталось ${Math.max(0, maxBudget - scores.cost)}</p>
            <p><b>Бейджи:</b> ${badges.map(escapeHtml).join(", ")}</p>
            <ul class="bullets">
                ${filledMechanics.map((mechanic) => `<li><b>${escapeHtml(mechanic.title || "Без названия")}</b> · стоимость ${escapeHtml(mechanic.cost)}: ${escapeHtml(mechanic.purpose || "Пояснение пока не добавлено")}</li>`).join("")}
            </ul>
        </div>
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

    if (module.id === INTERACTION_BUILDER_MODULE_ID) {
        const exerciseGoal = String(values.exerciseGoal ?? "").trim();
        return `
            <div class="project-field">
                <dt>Что тренирует упражнение</dt>
                <dd>${exerciseGoal ? escapeHtml(exerciseGoal).replaceAll("\n", "<br>") : "<span>Пока не заполнено</span>"}</dd>
            </div>
            <div class="project-field">
                <dt>Упражнения</dt>
                <dd>${renderInteractionSummary(values)}</dd>
            </div>
        `;
    }

    if (module.id === SCENARIO_BUILDER_MODULE_ID) {
        const situation = String(values.situation ?? "").trim();
        return `
            <div class="project-field">
                <dt>Ситуация сценария</dt>
                <dd>${situation ? escapeHtml(situation).replaceAll("\n", "<br>") : "<span>Пока не заполнено</span>"}</dd>
            </div>
            <div class="project-field">
                <dt>Дерево решений</dt>
                <dd>${renderScenarioSummary(values)}</dd>
            </div>
        `;
    }

    if (module.id === GAMIFICATION_BUILDER_MODULE_ID) {
        const targetBehavior = String(values.targetBehavior ?? "").trim();
        const riskCheck = String(values.riskCheck ?? "").trim();
        return `
            <div class="project-field">
                <dt>Какое поведение поддерживаем</dt>
                <dd>${targetBehavior ? escapeHtml(targetBehavior).replaceAll("\n", "<br>") : "<span>Пока не заполнено</span>"}</dd>
            </div>
            <div class="project-field">
                <dt>Игровые элементы</dt>
                <dd>${renderGameMechanicsSummary(values)}</dd>
            </div>
            <div class="project-field">
                <dt>Как избежать декоративности</dt>
                <dd>${riskCheck ? escapeHtml(riskCheck).replaceAll("\n", "<br>") : "<span>Пока не заполнено</span>"}</dd>
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
            <section><h3>Интерактивный квиз</h3>${renderExportQuizBank(values)}</section>
        `;
    }

    if (module.id === INTERACTION_BUILDER_MODULE_ID) {
        return `
            <section><h3>Что тренирует упражнение</h3><p>${escapeHtml(String(values.exerciseGoal ?? "").trim() || "Пока не заполнено").replaceAll("\n", "<br>")}</p></section>
            <section><h3>Упражнения на сортировку и ранжирование</h3>${renderExportInteractionExercises(values)}</section>
        `;
    }

    if (module.id === SCENARIO_BUILDER_MODULE_ID) {
        return `
            <section><h3>Ситуация сценария</h3><p>${escapeHtml(String(values.situation ?? "").trim() || "Пока не заполнено").replaceAll("\n", "<br>")}</p></section>
            <section><h3>Дерево решений</h3>${renderExportScenario(values)}</section>
        `;
    }

    if (module.id === GAMIFICATION_BUILDER_MODULE_ID) {
        return `
            <section><h3>Какое поведение поддерживаем</h3><p>${escapeHtml(String(values.targetBehavior ?? "").trim() || "Пока не заполнено").replaceAll("\n", "<br>")}</p></section>
            <section><h3>Игровые элементы</h3>${renderGameMechanicsSummary(values)}</section>
            <section><h3>Как избежать декоративности</h3><p>${escapeHtml(String(values.riskCheck ?? "").trim() || "Пока не заполнено").replaceAll("\n", "<br>")}</p></section>
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
        button { min-height: 42px; border: 0; border-radius: 8px; padding: 10px 14px; color: #fff; background: #17806d; font-weight: 700; cursor: pointer; }
        input { font: inherit; }
        .export-quiz-bank { display: grid; gap: 16px; }
        .export-quiz { border: 1px solid #d8ded8; border-radius: 8px; padding: 18px; background: #fbfaf6; }
        .export-quiz__type { margin: 0 0 8px; color: #115e59; font-size: 13px; font-weight: 700; text-transform: uppercase; }
        .export-quiz__options, .export-quiz__blanks { display: grid; gap: 10px; margin: 14px 0; }
        .export-quiz__options label, .export-quiz__blanks label { display: grid; gap: 8px; border: 1px solid #d8ded8; border-radius: 8px; padding: 12px; background: #fff; }
        .export-quiz__options label { grid-template-columns: 20px 1fr; align-items: start; }
        .export-quiz__blanks input { width: min(100%, 360px); border: 1px solid #d8ded8; border-radius: 6px; padding: 10px; }
        .export-quiz .is-correct { border-color: #17806d; background: #e7f4ef; }
        .export-quiz .is-wrong { border-color: #c95f4f; background: #fff0ec; }
        .export-quiz__feedback { min-height: 24px; margin: 12px 0 0; font-weight: 700; }
        .export-quiz__feedback.is-success { color: #115e59; }
        .export-quiz__feedback.is-error { color: #9f3f2f; }
        .export-interactions { display: grid; gap: 16px; }
        .export-interaction { border: 1px solid #d8ded8; border-radius: 8px; padding: 18px; background: #fbfaf6; }
        .export-interaction__hint { margin: 12px 0 0; color: #4b5b52; }
        .export-scenario { display: grid; gap: 16px; }
        .export-scenario__node[hidden] { display: none; }
        .export-scenario-choices { display: grid; gap: 12px; margin-top: 14px; }
        .export-scenario-choice { display: grid; gap: 6px; width: 100%; border: 1px solid #d8ded8; border-left: 4px solid #2f6fbb; border-radius: 8px; padding: 14px; color: #17211b; background: #fff; text-align: left; }
        .export-scenario-choice small { color: #4b5b52; font-weight: 700; }
        .export-scenario-choice--good { border-left-color: #17806d; }
        .export-scenario-choice--partial { border-left-color: #2f6fbb; }
        .export-scenario-choice--risk { border-left-color: #c95f4f; }
        .export-scenario-result { display: grid; gap: 10px; margin-top: 14px; border: 1px solid #d8ded8; border-radius: 8px; padding: 14px; background: #fff; }
        .export-scenario-result[hidden] { display: none; }
        .export-scenario-result p { margin: 0; color: #4b5b52; font-weight: 700; }
        .export-scenario-result.is-success { border-color: #17806d; background: #e7f4ef; }
        .export-scenario-result.is-error { border-color: #c95f4f; background: #fff0ec; }
        .export-scenario-restart { justify-self: start; background: #2f6fbb; }
        .interaction-preview__task, .sorting-task, .ranking-task { display: grid; gap: 16px; margin-top: 14px; }
        .interaction-preview__instruction { margin: 0; color: #4b5b52; }
        .sorting-task__source, .sorting-task__zones { display: grid; gap: 12px; }
        .sorting-task__source { grid-template-columns: repeat(3, minmax(0, 1fr)); border: 1px dashed #d8ded8; border-radius: 8px; padding: 16px; background: #fff; }
        .sorting-task__zones { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        .sorting-card { min-height: 64px; border: 1px solid #d8ded8; border-radius: 6px; padding: 12px; color: #17211b; background: #fff; font: inherit; font-weight: 700; text-align: left; cursor: grab; }
        .sorting-card:active, .ranking-item:active { cursor: grabbing; }
        .sorting-card.is-selected { border-color: #2f6fbb; box-shadow: inset 0 0 0 2px #2f6fbb; }
        .sorting-card.is-correct, .ranking-item.is-correct { border-color: #17806d; background: #e7f4ef; }
        .sorting-card.is-wrong, .ranking-item.is-wrong { border-color: #c95f4f; background: #fff0ec; }
        .sorting-zone { display: grid; align-content: start; gap: 12px; min-height: 180px; border: 1px solid #d8ded8; border-radius: 8px; padding: 16px; background: #fff; }
        .sorting-zone h3 { margin: 0; }
        .sorting-task__source.is-drag-over, .sorting-zone.is-drag-over, .ranking-item.is-drag-over { border-color: #2f6fbb; background: #edf5ff; }
        .sorting-task__actions { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
        .sorting-task__status { min-height: 24px; font-weight: 700; }
        .sorting-task__status.is-success { color: #115e59; }
        .sorting-task__status.is-error { color: #9f3f2f; }
        .ranking-list { display: grid; gap: 12px; counter-reset: ranking-step; }
        .ranking-item { display: grid; grid-template-columns: 32px minmax(0, 1fr) auto; gap: 12px; align-items: center; border: 1px solid #d8ded8; border-radius: 8px; padding: 12px; background: #fff; cursor: grab; }
        .ranking-item::before { display: inline-grid; width: 32px; height: 32px; place-items: center; border-radius: 6px; color: #fff; background: #2f6fbb; font-weight: 800; counter-increment: ranking-step; content: counter(ranking-step); }
        .ranking-item__controls { display: flex; gap: 6px; }
        .ranking-item__controls button { display: grid; width: 32px; height: 32px; min-height: 32px; place-items: center; border: 1px solid #d8ded8; border-radius: 6px; padding: 0; color: #17211b; background: #fff; }
        @media (max-width: 760px) {
            main { padding: 28px 14px; }
            h1 { font-size: 32px; }
            article { padding: 18px; }
            .sorting-task__source, .sorting-task__zones { grid-template-columns: 1fr; }
            .ranking-item { grid-template-columns: 32px minmax(0, 1fr); }
            .ranking-item__controls { grid-column: 2; }
        }
    </style>
</head>
<body>
<main>
    <p>Экспорт из курса «Механики вовлечения»</p>
    <h1>Карта интерактивного урока</h1>
    ${sections}
</main>
<script>
    let selectedCard = null;
    let draggedRankingItem = null;

    const normalizeAnswer = (value) => value.trim().toLowerCase().replaceAll("ё", "е");

    function setFeedback(quiz, isCorrect) {
        const feedback = quiz.querySelector("[data-export-quiz-feedback]");
        const hint = feedback?.dataset.hint || "";
        if (!feedback) return;

        feedback.textContent = isCorrect ? \`Верно. \${hint}\` : \`Пока нет. \${hint}\`;
        feedback.classList.toggle("is-success", isCorrect);
        feedback.classList.toggle("is-error", !isCorrect);
    }

    function markLabel(input, isCorrect) {
        const label = input.closest("label");
        if (!label) return;

        label.classList.remove("is-correct", "is-wrong");
        if (input.checked || input.type === "text") {
            label.classList.add(isCorrect ? "is-correct" : "is-wrong");
        }
    }

    function checkChoiceQuiz(quiz) {
        const inputs = [...quiz.querySelectorAll("input[type='radio'], input[type='checkbox']")];
        const selected = inputs.filter((input) => input.checked);
        const correct = inputs.filter((input) => input.dataset.correct === "true");

        if (!selected.length) {
            setFeedback(quiz, false);
            return;
        }

        const selectedValues = new Set(selected.map((input) => input.value));
        const correctValues = new Set(correct.map((input) => input.value));
        const isCorrect = selectedValues.size === correctValues.size
            && [...correctValues].every((value) => selectedValues.has(value));

        inputs.forEach((input) => {
            markLabel(input, input.checked === (input.dataset.correct === "true"));
        });
        setFeedback(quiz, isCorrect);
    }

    function checkBooleanQuiz(quiz) {
        const input = quiz.querySelector("input[type='checkbox'][data-correct-checked]");
        if (!input) return;

        const isCorrect = input.checked === (input.dataset.correctChecked === "true");
        const label = input.closest("label");
        label?.classList.remove("is-correct", "is-wrong");
        label?.classList.add(isCorrect ? "is-correct" : "is-wrong");
        setFeedback(quiz, isCorrect);
    }

    function checkBlanksQuiz(quiz) {
        const inputs = [...quiz.querySelectorAll("input[data-answer]")];
        const isCorrect = inputs.every((input) => {
            const fieldIsCorrect = normalizeAnswer(input.value) === normalizeAnswer(input.dataset.answer || "");
            input.classList.toggle("is-correct", fieldIsCorrect);
            input.classList.toggle("is-wrong", !fieldIsCorrect);
            markLabel(input, fieldIsCorrect);
            return fieldIsCorrect;
        });
        setFeedback(quiz, isCorrect);
    }

    document.querySelectorAll("[data-export-quiz]").forEach((quiz) => {
        quiz.querySelector("[data-export-quiz-check]")?.addEventListener("click", () => {
            if (quiz.dataset.exportQuizType === "blanks") {
                checkBlanksQuiz(quiz);
            } else if (quiz.dataset.exportQuizType === "boolean") {
                checkBooleanQuiz(quiz);
            } else {
                checkChoiceQuiz(quiz);
            }
        });
    });

    function normalizeScenarioRef(value) {
        return String(value || "").trim().toLowerCase().replaceAll("ё", "е");
    }

    function getScenarioNodes(scenario) {
        return [...scenario.querySelectorAll("[data-export-scenario-node]")];
    }

    function resetScenarioResults(scenario) {
        scenario.querySelectorAll("[data-scenario-result]").forEach((result) => {
            result.hidden = true;
            result.classList.remove("is-success", "is-error");
            const text = result.querySelector("[data-scenario-result-text]");
            const nextButton = result.querySelector("[data-scenario-continue]");
            if (text) text.textContent = "";
            if (nextButton) {
                nextButton.hidden = true;
                nextButton.removeAttribute("data-target-index");
            }
        });
    }

    function showScenarioNode(scenario, targetIndex) {
        const nodes = getScenarioNodes(scenario);
        const safeIndex = Number.isInteger(targetIndex) && targetIndex >= 0 && targetIndex < nodes.length ? targetIndex : 0;

        nodes.forEach((node, index) => {
            node.hidden = index !== safeIndex;
        });
        resetScenarioResults(scenario);
    }

    function resolveScenarioTarget(scenario, nextValue) {
        const normalized = normalizeScenarioRef(nextValue);
        const nodes = getScenarioNodes(scenario);
        if (!normalized) return null;
        if (["старт", "начало", "сначала", "возврат", "вернуться"].some((word) => normalized.includes(word))) return 0;

        const numberMatch = normalized.match(/(?:узел|node)?\\s*(\\d+)/);
        if (numberMatch) {
            const index = Number(numberMatch[1]) - 1;
            if (index >= 0 && index < nodes.length) return index;
        }

        const byTitle = nodes.findIndex((node) => {
            const title = normalizeScenarioRef(node.dataset.nodeTitle);
            return title && (title === normalized || normalized.includes(title) || title.includes(normalized));
        });

        return byTitle >= 0 ? byTitle : null;
    }

    function initExportScenario(scenario) {
        showScenarioNode(scenario, 0);

        scenario.addEventListener("click", (event) => {
            const choice = event.target.closest("[data-scenario-choice]");
            const continueButton = event.target.closest("[data-scenario-continue]");
            const restartButton = event.target.closest("[data-scenario-restart]");

            if (choice) {
                const node = choice.closest("[data-export-scenario-node]");
                const result = node?.querySelector("[data-scenario-result]");
                const text = result?.querySelector("[data-scenario-result-text]");
                const nextButton = result?.querySelector("[data-scenario-continue]");
                const targetIndex = resolveScenarioTarget(scenario, choice.dataset.next);
                if (!result || !text || !nextButton) return;

                result.hidden = false;
                result.classList.toggle("is-success", choice.dataset.choiceType === "good");
                result.classList.toggle("is-error", choice.dataset.choiceType === "risk");
                text.textContent = choice.dataset.consequence || "Последствие пока не указано.";

                if (targetIndex === null) {
                    nextButton.hidden = true;
                    nextButton.removeAttribute("data-target-index");
                } else {
                    nextButton.hidden = false;
                    nextButton.dataset.targetIndex = String(targetIndex);
                }
            }

            if (continueButton) {
                showScenarioNode(scenario, Number(continueButton.dataset.targetIndex));
            }

            if (restartButton) {
                showScenarioNode(scenario, 0);
            }
        });
    }

    document.querySelectorAll("[data-export-scenario]").forEach(initExportScenario);

    function getCards(task) {
        return [...task.querySelectorAll(".sorting-card")];
    }

    function moveCard(card, zone) {
        zone.append(card);
        card.classList.remove("is-selected", "is-correct", "is-wrong");
        selectedCard = null;
    }

    function clearSortingResults(task) {
        task.querySelectorAll(".sorting-card").forEach((card) => {
            card.classList.remove("is-correct", "is-wrong");
        });
    }

    function setSortingStatus(task, message, isSuccess = false) {
        const status = task.querySelector("[data-sorting-status]");
        if (!status) return;

        status.textContent = message;
        status.classList.toggle("is-success", isSuccess);
        status.classList.toggle("is-error", Boolean(message) && !isSuccess);
    }

    function checkSortingTask(task) {
        const cards = getCards(task);
        let placed = 0;
        let correct = 0;

        cards.forEach((card) => {
            const zone = card.closest("[data-zone]");
            const isPlaced = Boolean(zone);
            const isCorrect = isPlaced && zone.dataset.zone === card.dataset.target;

            if (isPlaced) placed += 1;
            if (isCorrect) correct += 1;

            card.classList.toggle("is-correct", isCorrect);
            card.classList.toggle("is-wrong", isPlaced && !isCorrect);
        });

        if (placed < cards.length) {
            setSortingStatus(task, \`Разложено \${placed} из \${cards.length}. Перенесите все карточки в зоны.\`);
            return;
        }

        if (correct === cards.length) {
            setSortingStatus(task, "Все верно: карточки находятся в подходящих зонах.", true);
        } else {
            setSortingStatus(task, \`Верно \${correct} из \${cards.length}. Посмотрите на красные карточки и уточните правило сортировки.\`);
        }
    }

    function resetSortingTask(task) {
        const source = task.querySelector("[data-sorting-source]");
        getCards(task).forEach((card) => {
            card.classList.remove("is-selected", "is-correct", "is-wrong");
            source.append(card);
        });
        selectedCard = null;
        setSortingStatus(task, "");
    }

    function initSortingTask(task) {
        if (task.dataset.sortingInitialized === "true") return;
        task.dataset.sortingInitialized = "true";

        const source = task.querySelector("[data-sorting-source]");
        const zones = [...task.querySelectorAll("[data-zone]")];

        getCards(task).forEach((card) => {
            card.addEventListener("dragstart", (event) => {
                event.dataTransfer.setData("text/plain", card.dataset.card);
                event.dataTransfer.effectAllowed = "move";
                selectedCard = card;
            });

            card.addEventListener("click", () => {
                clearSortingResults(task);
                getCards(task).forEach((item) => item.classList.remove("is-selected"));
                selectedCard = selectedCard === card ? null : card;
                card.classList.toggle("is-selected", selectedCard === card);
                setSortingStatus(task, selectedCard ? "Теперь выберите зону для этой карточки." : "");
            });
        });

        [source, ...zones].forEach((dropTarget) => {
            dropTarget.addEventListener("dragover", (event) => {
                event.preventDefault();
                dropTarget.classList.add("is-drag-over");
            });

            dropTarget.addEventListener("dragleave", () => {
                dropTarget.classList.remove("is-drag-over");
            });

            dropTarget.addEventListener("drop", (event) => {
                event.preventDefault();
                dropTarget.classList.remove("is-drag-over");
                const cardId = event.dataTransfer.getData("text/plain");
                const card = task.querySelector(\`[data-card="\${cardId}"]\`);
                if (card) moveCard(card, dropTarget);
                clearSortingResults(task);
                setSortingStatus(task, "");
            });

            dropTarget.addEventListener("click", () => {
                if (!selectedCard || dropTarget.classList.contains("sorting-card")) return;
                moveCard(selectedCard, dropTarget);
                clearSortingResults(task);
                setSortingStatus(task, "");
            });
        });

        task.querySelector("[data-sorting-check]")?.addEventListener("click", () => checkSortingTask(task));
        task.querySelector("[data-sorting-reset]")?.addEventListener("click", () => resetSortingTask(task));
    }

    function getRankingItems(task) {
        return [...task.querySelectorAll("[data-rank-item]")];
    }

    function setRankingStatus(task, message, isSuccess = false) {
        const status = task.querySelector("[data-ranking-status]");
        if (!status) return;

        status.textContent = message;
        status.classList.toggle("is-success", isSuccess);
        status.classList.toggle("is-error", Boolean(message) && !isSuccess);
    }

    function clearRankingResults(task) {
        getRankingItems(task).forEach((item) => {
            item.classList.remove("is-correct", "is-wrong", "is-drag-over");
        });
    }

    function moveRankingItem(item, direction) {
        if (direction === "up" && item.previousElementSibling) {
            item.parentElement.insertBefore(item, item.previousElementSibling);
        }

        if (direction === "down" && item.nextElementSibling) {
            item.parentElement.insertBefore(item.nextElementSibling, item);
        }
    }

    function checkRankingTask(task) {
        const items = getRankingItems(task);
        let correct = 0;

        items.forEach((item, index) => {
            const isCorrect = Number(item.dataset.order) === index + 1;
            item.classList.toggle("is-correct", isCorrect);
            item.classList.toggle("is-wrong", !isCorrect);
            if (isCorrect) correct += 1;
        });

        if (correct === items.length) {
            setRankingStatus(task, "Порядок верный.", true);
        } else {
            setRankingStatus(task, \`На своих местах \${correct} из \${items.length}. Переставьте шаги и проверьте снова.\`);
        }
    }

    function shuffleRankingTask(task) {
        const list = task.querySelector("[data-ranking-list]");
        const items = getRankingItems(task);

        items
            .map((item) => ({ item, order: Math.random() }))
            .sort((left, right) => left.order - right.order)
            .forEach(({ item }) => list.append(item));

        clearRankingResults(task);
        setRankingStatus(task, "Шаги перемешаны. Соберите порядок заново.");
    }

    function initRankingTask(task) {
        if (task.dataset.rankingInitialized === "true") return;
        task.dataset.rankingInitialized = "true";

        const list = task.querySelector("[data-ranking-list]");
        if (!list) return;

        getRankingItems(task).forEach((item) => {
            item.addEventListener("dragstart", (event) => {
                draggedRankingItem = item;
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("text/plain", item.dataset.rankItem);
            });

            item.addEventListener("dragover", (event) => {
                event.preventDefault();
                item.classList.add("is-drag-over");
            });

            item.addEventListener("dragleave", () => {
                item.classList.remove("is-drag-over");
            });

            item.addEventListener("drop", (event) => {
                event.preventDefault();
                item.classList.remove("is-drag-over");
                if (!draggedRankingItem || draggedRankingItem === item) return;

                const insertAfter = event.offsetY > item.offsetHeight / 2;
                if (insertAfter) {
                    item.after(draggedRankingItem);
                } else {
                    item.before(draggedRankingItem);
                }
                clearRankingResults(task);
                setRankingStatus(task, "");
            });
        });

        task.addEventListener("click", (event) => {
            const upButton = event.target.closest("[data-rank-up]");
            const downButton = event.target.closest("[data-rank-down]");

            if (upButton || downButton) {
                const item = event.target.closest("[data-rank-item]");
                moveRankingItem(item, upButton ? "up" : "down");
                clearRankingResults(task);
                setRankingStatus(task, "");
            }
        });

        task.querySelector("[data-ranking-check]")?.addEventListener("click", () => checkRankingTask(task));
        task.querySelector("[data-ranking-shuffle]")?.addEventListener("click", () => shuffleRankingTask(task));
    }

    document.querySelectorAll("[data-sorting-task]").forEach(initSortingTask);
    document.querySelectorAll("[data-ranking-task]").forEach(initRankingTask);
<\/script>
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
