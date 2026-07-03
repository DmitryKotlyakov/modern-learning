export const challengeOptions = [
    {
        id: "project-progress",
        title: "Прогресс по проектным шагам",
        cost: 2,
        clarity: 3,
        motivation: 2,
        risk: 0,
        feedback: "Хороший выбор: прогресс связан с реальным результатом, а не с количеством кликов."
    },
    {
        id: "retry-feedback",
        title: "Повторная попытка с разбором ошибки",
        cost: 2,
        clarity: 2,
        motivation: 3,
        risk: 0,
        feedback: "Механика поддерживает тренировку: ошибка становится поводом попробовать лучше."
    },
    {
        id: "badge-project",
        title: "Бейдж за собранный артефакт",
        cost: 1,
        clarity: 1,
        motivation: 2,
        risk: 1,
        feedback: "Бейдж уместен, если он выдается за значимый результат и объясняет, что подтверждает."
    },
    {
        id: "timer-reading",
        title: "Таймер на чтение теории",
        cost: 1,
        clarity: -1,
        motivation: 0,
        risk: 3,
        feedback: "Слабый выбор: скорость чтения редко является учебной целью и может мешать пониманию."
    },
    {
        id: "leaderboard",
        title: "Рейтинг между слушателями",
        cost: 2,
        clarity: 0,
        motivation: 1,
        risk: 3,
        feedback: "Рейтинг легко превращает обучение в сравнение. Он уместен только при понятной и безопасной соревновательной задаче."
    },
    {
        id: "limited-attempts",
        title: "Три попытки в тренажере",
        cost: 2,
        clarity: 1,
        motivation: 2,
        risk: 1,
        feedback: "Ограничение может работать, если после каждой попытки есть хороший фидбек."
    },
    {
        id: "checklist",
        title: "Чек-лист качества перед сдачей",
        cost: 1,
        clarity: 3,
        motivation: 1,
        risk: 0,
        feedback: "Сильная механика для проектного курса: помогает не потерять важные шаги."
    }
];

export const maxBudget = 5;

const clampScore = (value) => Math.max(0, Math.min(10, value));

function getSelectedOptions(challenge) {
    return challengeOptions.filter((option) => challenge.querySelector(`[data-game-option="${option.id}"]`)?.checked);
}

function renderMeter(challenge, name, value) {
    const meter = challenge.querySelector(`[data-game-meter="${name}"]`);
    const label = challenge.querySelector(`[data-game-value="${name}"]`);
    if (!meter || !label) return;

    const score = clampScore(value);
    meter.style.width = `${score * 10}%`;
    label.textContent = `${score} / 10`;
}

function getBadges(selected, scores) {
    const badges = [];
    const ids = new Set(selected.map((option) => option.id));

    if (scores.clarity >= 6 && scores.risk <= 3) {
        badges.push("Не декоративно");
    }

    if (ids.has("project-progress") && (ids.has("retry-feedback") || ids.has("checklist"))) {
        badges.push("Хороший игровой цикл");
    }

    if (ids.has("limited-attempts") && !ids.has("timer-reading")) {
        badges.push("Мягкий челлендж");
    }

    if (!badges.length) {
        badges.push("Нужна доработка");
    }

    return badges;
}

function updateChallenge(challenge) {
    const selected = getSelectedOptions(challenge);
    const budgetUsed = selected.reduce((sum, option) => sum + option.cost, 0);
    const budgetLeft = maxBudget - budgetUsed;
    const scores = selected.reduce((result, option) => ({
        clarity: result.clarity + option.clarity,
        motivation: result.motivation + option.motivation,
        risk: result.risk + option.risk
    }), { clarity: 2, motivation: 2, risk: 0 });

    challenge.querySelector("[data-game-budget]").textContent = `${Math.max(0, budgetLeft)} / ${maxBudget}`;
    challenge.querySelector("[data-game-budget]").classList.toggle("is-error", budgetLeft < 0);

    renderMeter(challenge, "clarity", scores.clarity);
    renderMeter(challenge, "motivation", scores.motivation);
    renderMeter(challenge, "risk", scores.risk);

    const feedback = challenge.querySelector("[data-game-feedback]");
    const badges = challenge.querySelector("[data-game-badges]");
    const selectedList = selected.map((option) => `<li>${option.feedback}</li>`).join("");
    const overBudget = budgetLeft < 0 ? "<li>Бюджет превышен: уберите одну механику или замените ее более точной.</li>" : "";

    feedback.innerHTML = selected.length
        ? `<ul class="bullets">${selectedList}${overBudget}</ul>`
        : "<p>Выберите 2-3 механики. Смотрите, как меняются смысл, мотивация и риск декоративности.</p>";

    badges.innerHTML = getBadges(selected, scores)
        .map((badge) => `<span class="game-badge">${badge}</span>`)
        .join("");

    challenge.querySelectorAll(".game-option").forEach((label) => {
        const input = label.querySelector("[data-game-option]");
        label.classList.toggle("is-selected", Boolean(input?.checked));
    });
}

function renderChallenge(challenge) {
    const options = challenge.querySelector("[data-game-options]");
    if (!options) return;

    options.innerHTML = challengeOptions.map((option) => `
        <label class="game-option">
            <input type="checkbox" data-game-option="${option.id}">
            <span>
                <strong>${option.title}</strong>
                <small>Стоимость: ${option.cost}. Смысл ${option.clarity >= 0 ? "+" : ""}${option.clarity}, мотивация ${option.motivation >= 0 ? "+" : ""}${option.motivation}, риск +${option.risk}</small>
            </span>
        </label>
    `).join("");
}

function initChallenge(challenge) {
    if (challenge.dataset.gameChallengeInitialized === "true") return;
    challenge.dataset.gameChallengeInitialized = "true";

    renderChallenge(challenge);
    updateChallenge(challenge);
    challenge.addEventListener("change", () => updateChallenge(challenge));
    challenge.querySelector("[data-game-reset]")?.addEventListener("click", () => {
        challenge.querySelectorAll("[data-game-option]").forEach((input) => {
            input.checked = false;
        });
        updateChallenge(challenge);
    });
}

export function initGamificationChallenges() {
    document.querySelectorAll("[data-gamification-challenge]").forEach(initChallenge);
}
