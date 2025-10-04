import takeNotesRoutes from './takenotes/index.routes.js';
import filesLoaderRoutes from './files-loader/index.routes.js';

function route(app){
    app.use('/', filesLoaderRoutes);
    app.use('/', takeNotesRoutes);
}

export default route;