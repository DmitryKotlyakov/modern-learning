const scenarioData = {
    start: "start",
    nodes: {
        start: {
            title: "Клиент раздражен после задержки",
            text: "Вы ведете учебный сценарий для службы поддержки. Клиент пишет: «Я уже третий день жду ответ. Вы вообще собираетесь решать проблему?» Что должен сделать специалист первым шагом?",
            choices: [
                {
                    text: "Сразу объяснить, что задержка произошла из-за высокой нагрузки.",
                    next: "excuse",
                    tone: "risk"
                },
                {
                    text: "Признать задержку, назвать следующий конкретный шаг и срок.",
                    next: "clear-step",
                    tone: "good"
                },
                {
                    text: "Попросить клиента еще раз подробно описать проблему.",
                    next: "repeat",
                    tone: "partial"
                }
            ]
        },
        excuse: {
            title: "Последствие выбора",
            text: "Клиент видит объяснение, но не видит решения. Раздражение растет: причина задержки важна, но она не заменяет понятный следующий шаг.",
            feedback: "Это рискованная ветка. В сценарии такой выбор полезен как типичная ошибка: он правдоподобен, но не решает задачу клиента.",
            choices: [
                {
                    text: "Вернуться к развилке и выбрать действие, которое продвигает ситуацию.",
                    next: "start",
                    tone: "partial"
                }
            ]
        },
        repeat: {
            title: "Последствие выбора",
            text: "Клиент может дать детали, но если он уже описывал проблему раньше, просьба повторить все сначала выглядит как потеря контекста.",
            feedback: "Это частично рабочий вариант. Он может помочь при нехватке данных, но в стартовой сцене лучше сначала признать задержку и обозначить конкретное действие.",
            choices: [
                {
                    text: "Уточнить только недостающую деталь и назвать следующий шаг.",
                    next: "clear-step",
                    tone: "good"
                },
                {
                    text: "Вернуться к началу и проверить другой путь.",
                    next: "start",
                    tone: "partial"
                }
            ]
        },
        "clear-step": {
            title: "Удачная ветка",
            text: "Клиент получает сигнал, что ситуацию увидели и взяли в работу: «Понимаю, что ожидание затянулось. Сейчас проверю статус заявки и вернусь с ответом до 16:00».",
            feedback: "Это сильный выбор: он признает проблему, снижает неопределенность и дает проверяемое обещание. В учебном сценарии такой финал закрепляет принцип: последствие должно показывать, почему решение работает.",
            outcome: "success",
            choices: [
                {
                    text: "Пройти сценарий заново",
                    next: "start",
                    tone: "good"
                }
            ]
        }
    }
};

function renderScenario(scenario, nodeId) {
    const node = scenarioData.nodes[nodeId] || scenarioData.nodes[scenarioData.start];
    const title = scenario.querySelector("[data-scenario-title]");
    const text = scenario.querySelector("[data-scenario-text]");
    const feedback = scenario.querySelector("[data-scenario-feedback]");
    const choices = scenario.querySelector("[data-scenario-choices]");
    const progress = scenario.querySelector("[data-scenario-progress]");

    scenario.dataset.currentNode = nodeId;
    scenario.classList.toggle("is-complete", node.outcome === "success");

    title.textContent = node.title;
    text.textContent = node.text;
    feedback.textContent = node.feedback || "";
    feedback.hidden = !node.feedback;
    feedback.classList.toggle("is-success", node.outcome === "success");
    progress.textContent = node.outcome === "success" ? "Финал" : nodeId === scenarioData.start ? "Стартовая развилка" : "Последствие выбора";

    choices.innerHTML = node.choices.map((choice) => `
        <button class="scenario-choice scenario-choice--${choice.tone}" type="button" data-next-node="${choice.next}">
            ${choice.text}
        </button>
    `).join("");
}

function initScenario(scenario) {
    if (scenario.dataset.scenarioInitialized === "true") return;
    scenario.dataset.scenarioInitialized = "true";

    scenario.addEventListener("click", (event) => {
        const choice = event.target.closest("[data-next-node]");
        if (!choice) return;

        renderScenario(scenario, choice.dataset.nextNode);
    });

    renderScenario(scenario, scenarioData.start);
}

export function initBranchingScenarios() {
    document.querySelectorAll("[data-branching-scenario]").forEach(initScenario);
}
