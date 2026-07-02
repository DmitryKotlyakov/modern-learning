function normalizeAnswer(value) {
    return value.trim().toLowerCase().replaceAll("ё", "е");
}

function setFeedback(quiz, isCorrect) {
    const feedback = quiz.querySelector("[data-quiz-feedback]");
    if (!feedback) return;

    feedback.textContent = isCorrect ? feedback.dataset.success : feedback.dataset.error;
    feedback.classList.toggle("is-success", isCorrect);
    feedback.classList.toggle("is-error", !isCorrect);
}

function markOption(input, isCorrect) {
    const option = input.closest("label");
    if (!option) return;

    option.classList.remove("is-correct", "is-wrong");
    if (input.checked || input.type === "text") {
        option.classList.add(isCorrect ? "is-correct" : "is-wrong");
    }
}

function checkChoiceQuiz(quiz) {
    const inputs = [...quiz.querySelectorAll("input[type='radio'], input[type='checkbox']")];
    const selected = inputs.filter((input) => input.checked);
    const correct = inputs.filter((input) => input.dataset.correct === "true");

    if (selected.length === 0) {
        setFeedback(quiz, false);
        return;
    }

    const selectedValues = new Set(selected.map((input) => input.value));
    const correctValues = new Set(correct.map((input) => input.value));
    const isCorrect = selectedValues.size === correctValues.size
        && [...correctValues].every((value) => selectedValues.has(value));

    inputs.forEach((input) => {
        const shouldBeChecked = input.dataset.correct === "true";
        markOption(input, input.checked === shouldBeChecked);
    });

    setFeedback(quiz, isCorrect);
}

function checkBooleanCheckboxQuiz(quiz) {
    const input = quiz.querySelector("input[type='checkbox'][data-correct-checked]");
    if (!input) return;

    const expected = input.dataset.correctChecked === "true";
    const isCorrect = input.checked === expected;
    const option = input.closest("label");

    if (option) {
        option.classList.remove("is-correct", "is-wrong");
        option.classList.add(isCorrect ? "is-correct" : "is-wrong");
    }

    setFeedback(quiz, isCorrect);
}

function checkBlanksQuiz(quiz) {
    const inputs = [...quiz.querySelectorAll("input[data-answer]")];
    const isCorrect = inputs.every((input) => {
        const expected = normalizeAnswer(input.dataset.answer || "");
        const actual = normalizeAnswer(input.value);
        const fieldIsCorrect = actual === expected;

        input.classList.toggle("is-correct", fieldIsCorrect);
        input.classList.toggle("is-wrong", !fieldIsCorrect);
        markOption(input, fieldIsCorrect);

        return fieldIsCorrect;
    });

    setFeedback(quiz, isCorrect);
}

export function initQuizExamples() {
    document.querySelectorAll("[data-quiz]").forEach((quiz) => {
        const checkButton = quiz.querySelector("[data-quiz-check]");
        if (!checkButton) return;

        checkButton.addEventListener("click", () => {
            if (quiz.dataset.quizType === "blanks") {
                checkBlanksQuiz(quiz);
            } else if (quiz.dataset.quizType === "boolean-checkbox") {
                checkBooleanCheckboxQuiz(quiz);
            } else {
                checkChoiceQuiz(quiz);
            }
        });
    });
}
