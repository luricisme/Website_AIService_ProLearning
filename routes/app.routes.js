const takenotesRoutes = require('./takenotes/index.routes');

function route(app){
    app.use('/', takenotesRoutes);
}

module.exports = route;