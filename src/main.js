import { addRoute, startRouter } from './router.js';
import { homeView } from './views/home.js';
import { squadView } from './views/squad.js';
import { newMatchView } from './views/new-match.js';
import { liveMatchView } from './views/live-match.js';
import { statsView } from './views/stats.js';

addRoute('/home', homeView);
addRoute('/squad', squadView);
addRoute('/new-match', newMatchView);
addRoute('/live-match/:id', liveMatchView);
addRoute('/stats', statsView);

const app = document.getElementById('app');
startRouter(app);
