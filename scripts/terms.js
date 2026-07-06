const terms = [
    {
        variants: ["учебное действие", "учебного действия", "учебному действию", "учебным действием", "учебном действии", "учебные действия", "учебных действий", "учебными действиями"],
        definition: "Конкретный шаг, который вы делаете с материалом: выбираете, сравниваете, отвечаете, сортируете, принимаете решение или исправляете ошибку."
    },
    {
        variants: ["учебная задача", "учебную задачу", "учебной задачи", "учебной задачей", "учебные задачи", "учебных задач"],
        definition: "То, ради чего добавляется материал или интерактив: какое понимание, навык или решение нужно сформировать."
    },
    {
        variants: ["учебная цель", "учебную цель", "учебной цели", "учебной целью", "учебные цели", "учебным целям"],
        definition: "Понятный результат обучения: что вы должны понять, различить, применить или создать после фрагмента курса."
    },
    {
        variants: ["интерактивная механика", "интерактивную механику", "интерактивной механики", "интерактивной механикой"],
        definition: "Формат взаимодействия внутри урока, который помогает выполнить учебное действие: квиз, сортировка, сценарий, лонгрид или игровой элемент."
    },
    {
        variants: ["интерактивность", "интерактивности", "интерактивностью"],
        definition: "Не просто клики, а действие с учебным смыслом и обратной связью."
    },
    {
        variants: ["линейная подача", "линейной подачи", "линейную подачу"],
        definition: "Подача материала одним маршрутом без выбора, проверки понимания и развилок."
    },
    {
        variants: ["обратная связь", "обратную связь", "обратной связи", "обратной связью"],
        definition: "Пояснение после действия: что получилось, где ошибка, почему ответ сработал и что делать дальше."
    },
    {
        variants: ["фидбек", "фидбека", "фидбеком", "фидбеку"],
        definition: "Короткая обратная связь после ответа или выбора."
    },
    {
        variants: ["сквозной проект", "сквозного проекта", "сквозному проекту", "сквозным проектом"],
        definition: "Итоговый проект, который собирается постепенно из заданий всех модулей."
    },
    {
        variants: ["дистрактор", "дистрактора", "дистракторы", "дистракторов", "дистракторами"],
        definition: "Правдоподобный неправильный вариант ответа, который помогает увидеть типичную ошибку."
    }
];

const ignoredSelector = [
    "a",
    "button",
    "input",
    "textarea",
    "select",
    "option",
    "code",
    "pre",
    "script",
    "style",
    ".term"
].join(",");

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const termLookup = new Map();

terms.forEach((term) => {
    term.variants.forEach((variant) => {
        termLookup.set(variant.toLowerCase(), term.definition);
    });
});

const termPattern = new RegExp(
    [...termLookup.keys()]
        .sort((left, right) => right.length - left.length)
        .map(escapeRegExp)
        .join("|"),
    "giu"
);

const shouldSkip = (node) => {
    const parent = node.parentElement;
    return !parent || parent.closest(ignoredSelector);
};

const wrapTermsInNode = (node) => {
    const text = node.nodeValue;
    if (!text || !termPattern.test(text)) return;

    termPattern.lastIndex = 0;
    const fragment = document.createDocumentFragment();
    let lastIndex = 0;

    text.replace(termPattern, (match, offset) => {
        if (offset > lastIndex) {
            fragment.append(document.createTextNode(text.slice(lastIndex, offset)));
        }

        const term = document.createElement("span");
        term.className = "term";
        term.tabIndex = 0;
        term.dataset.definition = termLookup.get(match.toLowerCase());
        term.setAttribute("aria-label", `${match}: ${term.dataset.definition}`);
        term.textContent = match;
        fragment.append(term);
        lastIndex = offset + match.length;
        return match;
    });

    if (lastIndex < text.length) {
        fragment.append(document.createTextNode(text.slice(lastIndex)));
    }

    node.replaceWith(fragment);
};

export function initTermDefinitions() {
    const root = document.querySelector("main");
    if (!root) return;

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode: (node) => shouldSkip(node) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT
    });
    const textNodes = [];

    while (walker.nextNode()) {
        textNodes.push(walker.currentNode);
    }

    textNodes.forEach(wrapTermsInNode);
}
