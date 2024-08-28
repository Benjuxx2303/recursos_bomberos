import express from "express";
// TODO: import desde routes
import indexRoutes from './routes/index.routes.js';

import rol_personalRoutes from './routes/rol_personal.routes.js';
import companiaRoutes from './routes/compania.routes.js';
import personalRoutes from './routes/personal.routes.js';
import claveRoutes from './routes/clave.routes.js';
import tipo_maquinaRoutes from './routes/tipo_maquina.routes.js';
import procedenciaRoutes from './routes/procedencia.routes.js';
import maquinaRoutes from './routes/maquina.routes.js';
import tallerRoutes from './routes/taller.routes.js';
import conductor_maquinaRoutes from './routes/conductor_maquina.routes.js';

const app = express();
app.use(express.json());

base_route = "/api/";

// TODO:  rutas de la api
app.use(indexRoutes);
app.use(base_route, rol_personalRoutes);
app.use(base_route, companiaRoutes);
app.use(base_route, personalRoutes);
app.use(base_route, claveRoutes);
app.use(base_route, tipo_maquinaRoutes);
app.use(base_route, procedenciaRoutes);
app.use(base_route, maquinaRoutes);
app.use(base_route, tallerRoutes);
app.use(base_route, conductor_maquinaRoutes);

// TODO: que se imprima el log de las request en consola

// endpoint
app.use((req, res) =>{
    res.status(404).json({
        message: 'endpoint not found'
    })
})

export default app;