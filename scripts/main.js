import { initNavigation, renderModuleGrid, renderModuleMenu } from "./navigation.js";
import { renderChecklist } from "./progress.js";
import { initProjectWorkspace } from "./project-work.js";
import { initQuizExamples } from "./quiz-examples.js";
import { initSiteProgress } from "./site-progress.js";

initNavigation();
renderModuleGrid();
initSiteProgress();
renderModuleMenu();
renderChecklist();
initProjectWorkspace();
initQuizExamples();
