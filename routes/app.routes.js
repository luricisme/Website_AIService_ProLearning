import filesLoaderRoutes from './files-loader/index.routes.js';
import notesRoutes from './notes/index.routes.js';
import flashcardsRoute from './flashcards/index.routes.js';

function route(app){
    app.use('/', filesLoaderRoutes);
    app.use('/', notesRoutes);
    app.use('/', flashcardsRoute)
}

export default route;