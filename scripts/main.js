import { initNavigation, renderModuleGrid, renderModuleMenu } from "./navigation.js?v=11";
import { renderChecklist } from "./progress.js?v=11";
import { initProjectWorkspace } from "./project-work.js?v=11";
import { initQuizExamples } from "./quiz-examples.js?v=11";
import { initSiteProgress } from "./site-progress.js?v=11";

initNavigation();
renderModuleGrid();
initSiteProgress();
renderModuleMenu();
renderChecklist();
initProjectWorkspace();
initQuizExamples();
