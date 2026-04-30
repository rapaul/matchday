import { addRoute, startRouter } from './router.js';
import { homeView } from './views/home.js';
import { squadView } from './views/squad.js';
import { newMatchView } from './views/new-match.js';
import { liveMatchView } from './views/live-match.js';
import { potdHistoryView } from './views/potd-history.js';

addRoute('/home', homeView);
addRoute('/squad', squadView);
addRoute('/new-match', newMatchView);
addRoute('/live-match/:id', liveMatchView);
addRoute('/potd-history', potdHistoryView);

const app = document.getElementById('app');
startRouter(app);
