export const modules = [
    {
        id: 1,
        title: "Введение в интерактивное обучение",
        slug: "module-1/",
        mechanic: "Выбор механики",
        result: "Понятная учебная задача и список интерактивных форматов, которые действительно ей подходят.",
        practice: "Разобрать обычный урок и отметить точки, где интерактивность помогает, а где мешает.",
        artifactTitle: "Замысел интерактивного урока",
        artifactFields: [
            { id: "topic", label: "Тема урока", type: "text", placeholder: "Например: вводный урок по клиентскому сервису" },
            { id: "audience", label: "Кто проходит урок", type: "text", placeholder: "Начинающие специалисты, преподаватели, менеджеры..." },
            { id: "learningGoal", label: "Учебная цель", type: "textarea", placeholder: "Что вы должны уметь после урока?" },
            { id: "linearProblem", label: "Что плохо работает в линейной подаче", type: "textarea", placeholder: "Где вы теряете внимание, не тренируетесь или не получаете обратную связь?" },
            { id: "candidateMechanics", label: "Какие механики могут помочь", type: "textarea", placeholder: "Квиз, drag-and-drop, сценарий, интерактивное видео..." }
        ]
    },
    {
        id: 2,
        title: "Квизы и проверка знаний",
        slug: "module-2/",
        mechanic: "Quiz",
        result: "Квиз с разными типами вопросов и понятной обратной связью.",
        practice: "Спроектировать банк вопросов, собрать квиз и проверить логику фидбека.",
        artifactTitle: "Банк вопросов и обратная связь",
        artifactFields: [
            { id: "quizGoal", label: "Что проверяет квиз", type: "textarea", placeholder: "Понимание термина, применение правила, выбор решения..." },
            { id: "questionBank", label: "Банк вопросов", type: "quiz-builder", placeholder: "Добавьте до 10 вопросов разных типов." }
        ]
    },
    {
        id: 3,
        title: "Drag-and-drop и сортировка",
        slug: "module-3/",
        mechanic: "Drag-and-drop",
        result: "Упражнение на сопоставление, сортировку или сборку схемы.",
        practice: "Собрать интерактивное задание, где действие руками поддерживает учебную цель.",
        artifactTitle: "Упражнение на действие руками",
        artifactFields: [
            { id: "exerciseGoal", label: "Что тренирует упражнение", type: "textarea", placeholder: "Классификацию, порядок действий, сопоставление понятий..." },
            { id: "exercises", label: "Упражнения", type: "interaction-builder", placeholder: "Добавьте до 5 упражнений на сортировку или ранжирование." }
        ]
    },
    {
        id: 4,
        title: "Разветвленные сценарии и симуляции",
        slug: "module-4/",
        mechanic: "Branching scenario",
        result: "Сценарий с выборами, последствиями и понятной логикой переходов между ветками.",
        practice: "Спроектировать развилки, последствия выбора и переходы между ветками.",
        artifactTitle: "Дерево решений",
        artifactFields: [
            { id: "situation", label: "Ситуация сценария", type: "textarea", placeholder: "В какую практическую ситуацию вы попадаете?" },
            { id: "scenarioNodes", label: "Узлы сценария", type: "scenario-builder", placeholder: "Добавьте до 5 узлов с вариантами выбора, последствиями и переходами." }
        ]
    },
    {
        id: 5,
        title: "Геймификация",
        slug: "module-5/",
        mechanic: "Игровой цикл",
        result: "Набор игровых элементов, встроенных в учебную логику.",
        practice: "Добавить цель, прогресс, награду или ограничение без превращения курса в декорацию.",
        artifactTitle: "Мотивационная механика",
        artifactFields: [
            { id: "targetBehavior", label: "Какое поведение поддерживаем", type: "textarea", placeholder: "Дойти до конца, повторить попытку, сравнить варианты..." },
            { id: "gameMechanics", label: "Игровые элементы", type: "gamification-builder", placeholder: "Добавьте 2-3 свои механики и задайте стоимость каждой." },
            { id: "riskCheck", label: "Как избежать декоративности", type: "textarea", placeholder: "Почему этот элемент связан с учебной задачей?" }
        ]
    },
    {
        id: 6,
        title: "Интерактивные лонгриды",
        slug: "module-6/",
        mechanic: "Interactive longread",
        result: "Лонгрид с точками выбора, вопросами и переходами.",
        practice: "Разметить текстовый материал, добавить интерактивные остановки и проверить сценарий чтения.",
        artifactTitle: "Интерактивная разметка материала",
        artifactFields: [
            { id: "sourceMaterial", label: "Исходный материал", type: "textarea", placeholder: "Какой текстовый материал вы превращаете в интерактивный лонгрид?" },
            { id: "longreadBlocks", label: "Блоки лонгрида", type: "longread-builder", placeholder: "Добавьте до 10 блоков разных типов и наполните их контентом." }
        ]
    },
    {
        id: 7,
        title: "Проверка готового проекта",
        slug: "module-7/",
        mechanic: "QA проекта",
        result: "Финальная проверка собранного урока перед экспортом и публикацией.",
        practice: "Пройти проект как новый пользователь, проверить связность, фидбек, нагрузку и устойчивость.",
        artifactTitle: "Финальная проверка проекта",
        artifactFields: [
            { id: "projectChecked", label: "Проект проверен", type: "checkbox", placeholder: "Отметьте финальную проверку проекта." }
        ]
    }
];

export const moduleChecklist = [
    "Есть разбор готового примера.",
    "Практика связана с результатом модуля.",
    "Результат модуля добавлен в сквозной проект.",
    "Пройден чек-лист самопроверки."
];
