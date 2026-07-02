let selectedCard = null;

function getCards(task) {
    return [...task.querySelectorAll(".sorting-card")];
}

function moveCard(card, zone) {
    zone.append(card);
    card.classList.remove("is-selected", "is-correct", "is-wrong");
    selectedCard = null;
}

function clearResults(task) {
    task.querySelectorAll(".sorting-card").forEach((card) => {
        card.classList.remove("is-correct", "is-wrong");
    });
}

function setStatus(task, message, isSuccess = false) {
    const status = task.querySelector("[data-sorting-status]");
    if (!status) return;

    status.textContent = message;
    status.classList.toggle("is-success", isSuccess);
    status.classList.toggle("is-error", Boolean(message) && !isSuccess);
}

function checkTask(task) {
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
        setStatus(task, `Разложено ${placed} из ${cards.length}. Перенесите все карточки в зоны.`);
        return;
    }

    if (correct === cards.length) {
        setStatus(task, "Все верно: вы связали карточки с подходящими механиками.", true);
    } else {
        setStatus(task, `Верно ${correct} из ${cards.length}. Посмотрите на красные карточки и уточните правило сортировки.`);
    }
}

function resetTask(task) {
    const source = task.querySelector("[data-sorting-source]");
    getCards(task).forEach((card) => {
        card.classList.remove("is-selected", "is-correct", "is-wrong");
        source.append(card);
    });
    selectedCard = null;
    setStatus(task, "");
}

function initTask(task) {
    const source = task.querySelector("[data-sorting-source]");
    const zones = [...task.querySelectorAll("[data-zone]")];

    getCards(task).forEach((card) => {
        card.addEventListener("dragstart", (event) => {
            event.dataTransfer.setData("text/plain", card.dataset.card);
            event.dataTransfer.effectAllowed = "move";
            selectedCard = card;
        });

        card.addEventListener("click", () => {
            clearResults(task);
            getCards(task).forEach((item) => item.classList.remove("is-selected"));
            selectedCard = selectedCard === card ? null : card;
            card.classList.toggle("is-selected", selectedCard === card);
            setStatus(task, selectedCard ? "Теперь выберите зону для этой карточки." : "");
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
            const card = task.querySelector(`[data-card="${cardId}"]`);
            if (card) moveCard(card, dropTarget);
            clearResults(task);
            setStatus(task, "");
        });

        dropTarget.addEventListener("click", () => {
            if (!selectedCard || dropTarget.classList.contains("sorting-card")) return;
            moveCard(selectedCard, dropTarget);
            clearResults(task);
            setStatus(task, "");
        });
    });

    task.querySelector("[data-sorting-check]")?.addEventListener("click", () => checkTask(task));
    task.querySelector("[data-sorting-reset]")?.addEventListener("click", () => resetTask(task));
}

export function initSortingTasks() {
    document.querySelectorAll("[data-sorting-task]").forEach(initTask);
}
