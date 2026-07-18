import { initNavigation, renderModuleGrid, renderModuleMenu } from "./navigation.js";
import { renderChecklist } from "./progress.js";
import { initProjectWorkspace } from "./project-work.js";
import { initQuizExamples } from "./quiz-examples.js";
import { initSiteProgress } from "./site-progress.js";
import { initSortingTasks } from "./sorting-task.js";
import { initBranchingScenarios } from "./branching-scenario.js";
import { initGamificationChallenges } from "./gamification-challenge.js";

initNavigation();
renderModuleGrid();
initSiteProgress();
renderModuleMenu();
renderChecklist();
initProjectWorkspace();
initQuizExamples();
initSortingTasks();
initBranchingScenarios();
initGamificationChallenges();
