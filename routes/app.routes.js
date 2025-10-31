import filesLoaderRoutes from './files-loader/index.routes.js';
import notesRoutes from './notes/index.routes.js';

function route(app){
    app.use('/', filesLoaderRoutes);
    app.use('/', notesRoutes);
}

export default route;