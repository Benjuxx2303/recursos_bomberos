import express from "express";
import morgan from "morgan";
import cors from "cors";
// import multer from 'multer';
// TODO: import desde routes
import indexRoutes from './routes/index.routes.js';

import rol_personalRoutes from './routes/rol_personal.routes.js';
import companiaRoutes from './routes/compania.routes.js';
import personalRoutes from './routes/personal.routes.js';
import claveRoutes from './routes/clave.routes.js';
import estado_mantencionRoutes from './routes/estado_mantencion.routes.js';
import tipo_maquinaRoutes from './routes/tipo_maquina.routes.js';
import procedenciaRoutes from './routes/procedencia.routes.js';
import maquinaRoutes from './routes/maquina.routes.js';
import tallerRoutes from './routes/taller.routes.js';
import conductor_maquinaRoutes from './routes/conductor_maquina.routes.js';
import bitacoraRoutes from './routes/bitacora.routes.js';
import mantencionRoutes from './routes/mantencion.routes.js'; //
import tipoMantencionRoutes from './routes/tipo_mantencion.routes.js';
import usuarioRoutes from './routes/usuario.routes.js';
import divisionRoutes from './routes/division.routes.js';
import subdivisionRoutes from './routes/subdivision.routes.js';
import servicioRoutes from './routes/servicio.routes.js';
import detalle_mantencionRoutes from './routes/detalle_mantencion.routes.js';
import carga_combustibleRoutes from './routes/carga_combustible.routes.js';

const app = express();
app.use(express.json());
app.use(morgan('dev'));
app.use(cors());


const base_route = "/api/";


// TODO:  rutas de la api
app.use(indexRoutes);
app.use(base_route, rol_personalRoutes); 
app.use(base_route, companiaRoutes); 
app.use(base_route, personalRoutes);
app.use(base_route, claveRoutes);
app.use(base_route, estado_mantencionRoutes)
app.use(base_route, tipo_maquinaRoutes);
app.use(base_route, procedenciaRoutes);
app.use(base_route, maquinaRoutes);
app.use(base_route, tallerRoutes);
app.use(base_route, conductor_maquinaRoutes);
app.use(base_route, bitacoraRoutes);
app.use(base_route, mantencionRoutes);
app.use(base_route, tipoMantencionRoutes);
app.use(base_route, usuarioRoutes);
app.use(base_route, divisionRoutes);
app.use(base_route, subdivisionRoutes);
app.use(base_route, servicioRoutes);
app.use(base_route, detalle_mantencionRoutes);
app.use(base_route, carga_combustibleRoutes);

// endpoint
app.use((req, res) =>{
    res.status(404).json({
        message: 'endpoint not found'
    })
})

export default app;