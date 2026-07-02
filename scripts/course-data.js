export const modules = [
    {
        id: 1,
        title: "Введение в интерактивное обучение",
        duration: "45-60 мин",
        slug: "module-1/",
        mechanic: "Выбор механики",
        result: "Карта образовательной задачи и подходящих интерактивных форматов.",
        practice: "Разобрать обычный урок и отметить точки, где интерактивность помогает, а где мешает.",
        artifactTitle: "Замысел интерактивного урока",
        artifactFields: [
            { id: "topic", label: "Тема урока", type: "text", placeholder: "Например: вводный урок по клиентскому сервису" },
            { id: "audience", label: "Кто проходит урок", type: "text", placeholder: "Начинающие специалисты, преподаватели, менеджеры..." },
            { id: "learningGoal", label: "Учебная цель", type: "textarea", placeholder: "Что слушатель должен уметь после урока?" },
            { id: "linearProblem", label: "Что плохо работает в линейной подаче", type: "textarea", placeholder: "Где слушатель теряет внимание, не тренируется или не получает обратную связь?" },
            { id: "candidateMechanics", label: "Какие механики могут помочь", type: "textarea", placeholder: "Квиз, drag-and-drop, сценарий, интерактивное видео..." }
        ]
    },
    {
        id: 2,
        title: "Квизы и проверка знаний",
        duration: "90 мин",
        slug: "module-2/",
        mechanic: "Quiz",
        result: "Квиз с разными типами вопросов и понятной обратной связью.",
        practice: "Спроектировать банк вопросов, собрать квиз в H5P/Lumi и проверить логику фидбека.",
        artifactTitle: "Банк вопросов и обратная связь",
        artifactFields: [
            { id: "quizGoal", label: "Что проверяет квиз", type: "textarea", placeholder: "Понимание термина, применение правила, выбор решения..." },
            { id: "questionBank", label: "Банк вопросов", type: "quiz-builder", placeholder: "Добавьте до 10 вопросов разных типов." }
        ]
    },
    {
        id: 3,
        title: "Drag-and-drop и сортировка",
        duration: "90 мин",
        slug: "module-3/",
        mechanic: "Drag-and-drop",
        result: "Упражнение на сопоставление, сортировку или сборку схемы.",
        practice: "Собрать интерактивное задание, где действие руками поддерживает учебную цель.",
        artifactTitle: "Упражнение на действие руками",
        artifactFields: [
            { id: "taskType", label: "Тип упражнения", type: "text", placeholder: "Сортировка, сопоставление, сборка схемы..." },
            { id: "items", label: "Элементы и зоны", type: "textarea", placeholder: "Какие карточки перетаскивает слушатель и куда?" },
            { id: "successCriteria", label: "Критерии правильности", type: "textarea", placeholder: "Как система поймет, что ответ верный?" }
        ]
    },
    {
        id: 4,
        title: "Разветвленные сценарии и симуляции",
        duration: "120 мин",
        slug: "module-4/",
        mechanic: "Branching scenario",
        result: "Дерево решений и рабочий прототип сценария.",
        practice: "Спроектировать развилки, последствия выбора и финальные состояния.",
        artifactTitle: "Дерево решений",
        artifactFields: [
            { id: "situation", label: "Ситуация сценария", type: "textarea", placeholder: "В какую практическую ситуацию попадает слушатель?" },
            { id: "choices", label: "Ключевые выборы", type: "textarea", placeholder: "Опишите 3-5 развилок и варианты ответа." },
            { id: "consequences", label: "Последствия и финалы", type: "textarea", placeholder: "Что происходит после выбора? Какие финальные состояния возможны?" }
        ]
    },
    {
        id: 5,
        title: "Геймификация",
        duration: "60-90 мин",
        slug: "module-5/",
        mechanic: "Игровой цикл",
        result: "Набор игровых элементов, встроенных в учебную логику.",
        practice: "Добавить цель, прогресс, награду или ограничение без превращения курса в декорацию.",
        artifactTitle: "Мотивационная механика",
        artifactFields: [
            { id: "targetBehavior", label: "Какое поведение поддерживаем", type: "textarea", placeholder: "Дойти до конца, повторить попытку, сравнить варианты..." },
            { id: "gameElement", label: "Игровой элемент", type: "textarea", placeholder: "Прогресс, уровни, ограничение попыток, бейдж..." },
            { id: "riskCheck", label: "Как избежать декоративности", type: "textarea", placeholder: "Почему этот элемент связан с учебной задачей?" }
        ]
    },
    {
        id: 6,
        title: "Интерактивное видео и лонгриды",
        duration: "60 мин",
        slug: "module-6/",
        mechanic: "Interactive video / Course presentation",
        result: "Видео или лонгрид с точками выбора, вопросами и переходами.",
        practice: "Разметить материал, добавить интерактивные остановки и проверить сценарий просмотра.",
        artifactTitle: "Интерактивная разметка материала",
        artifactFields: [
            { id: "sourceMaterial", label: "Исходный материал", type: "textarea", placeholder: "Какой текст или видео вы превращаете в интерактив?" },
            { id: "interactionPoints", label: "Точки интерактива", type: "textarea", placeholder: "Где будут вопросы, паузы, подсказки или переходы?" },
            { id: "viewingPath", label: "Сценарий прохождения", type: "textarea", placeholder: "Как слушатель пройдет материал от начала до результата?" }
        ]
    },
    {
        id: 7,
        title: "Сборка и упаковка курса",
        duration: "60-90 мин",
        slug: "module-7/",
        mechanic: "Course assembly",
        result: "Собранный урок с навигацией, экспортом и проверкой встраивания.",
        practice: "Объединить механики в цельный фрагмент и подготовить публикацию.",
        artifactTitle: "Структура готового урока",
        artifactFields: [
            { id: "lessonFlow", label: "Порядок блоков", type: "textarea", placeholder: "Вступление, теория, квиз, упражнение, сценарий, финал..." },
            { id: "navigation", label: "Навигация и переходы", type: "textarea", placeholder: "Как слушатель понимает, где он находится и что делать дальше?" },
            { id: "publishingPlan", label: "План публикации", type: "textarea", placeholder: "LMS, ссылка, iframe, самостоятельная страница..." }
        ]
    },
    {
        id: 8,
        title: "Финальный проект",
        duration: "90-120 мин",
        slug: "module-8/",
        mechanic: "Защита проекта",
        result: "Интерактивный урок минимум с тремя механиками курса.",
        practice: "Доработать проект, пройти чек-лист качества и подготовить ссылку или пакет для LMS.",
        artifactTitle: "Финальная проверка",
        artifactFields: [
            { id: "selectedMechanics", label: "Какие 3+ механики вошли в урок", type: "textarea", placeholder: "Квиз, drag-and-drop, сценарий..." },
            { id: "qualityNotes", label: "Что проверено перед сдачей", type: "textarea", placeholder: "Цель, обратная связь, навигация, экспорт, доступность..." },
            { id: "deliveryLink", label: "Ссылка или способ сдачи", type: "text", placeholder: "URL, название файла или место публикации" }
        ]
    }
];

export const moduleChecklist = [
    "Теория занимает 10-20% времени модуля.",
    "Есть разбор готового примера.",
    "Практика занимает не менее половины модуля.",
    "Результат модуля добавлен в сквозной проект.",
    "Пройден чек-лист самопроверки."
];
