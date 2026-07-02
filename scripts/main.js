import { initNavigation, renderModuleGrid, renderModuleMenu } from "./navigation.js?v=9";
import { renderChecklist } from "./progress.js?v=9";
import { initProjectWorkspace } from "./project-work.js?v=9";
import { initQuizExamples } from "./quiz-examples.js?v=10";
import { initSiteProgress } from "./site-progress.js?v=9";

initNavigation();
renderModuleGrid();
initSiteProgress();
renderModuleMenu();
renderChecklist();
initProjectWorkspace();
initQuizExamples();
