import cors from "cors";
import express from "express";
import { createServer } from 'http';
import morgan from "morgan";
import { initializeWebSocket } from './utils/websocket.js';

import indexRoutes from './routes/index.routes.js';

import alertaRoutes from './routes/alerta.routes.js';
import bitacoraRoutes from './routes/bitacora.routes.js';
import carga_combustibleRoutes from './routes/carga_combustible.routes.js';
import claveRoutes from './routes/clave.routes.js';
import companiaRoutes from './routes/compania.routes.js';
import conductor_maquinaRoutes from './routes/conductor_maquina.routes.js';
import detalle_mantencionRoutes from './routes/detalle_mantencion.routes.js';
import divisionRoutes from './routes/division.routes.js';
import estado_mantencionRoutes from './routes/estado_mantencion.routes.js';
import mantencionRoutes from './routes/mantencion.routes.js';
import maquinaRoutes from './routes/maquina.routes.js';
import marcaRoutes from './routes/marca.routes.js';
import modelosRoutes from './routes/modelo.routes.js';
import permisoRoutes from './routes/permiso.routes.js';
import personalRoutes from './routes/personal.routes.js';
import procedenciaRoutes from './routes/procedencia.routes.js';
import rol_permisoRoutes from './routes/rol_permiso.routes.js';
import rol_personalRoutes from './routes/rol_personal.routes.js';
import servicioRoutes from './routes/servicio.routes.js';
import statsRoutes from './routes/stats.routes.js';
import stats_mantencionesRoutes from './routes/stats_mantenciones.routes.js';
import subdivisionRoutes from './routes/subdivision.routes.js';
import tallerRoutes from './routes/taller.routes.js';
import tipo_claveRoutes from './routes/tipo_clave.routes.js';
import tipoMantencionRoutes from './routes/tipo_mantencion.routes.js';
import tipo_maquinaRoutes from './routes/tipo_maquina.routes.js';
import usuarioRoutes from './routes/usuario.routes.js';

const app = express();
const httpServer = createServer(app);

// Configuración CORS
const corsOptions = {
    // origin: JSON.parse(process.env.CORS_ORIGINS),
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control'],
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(morgan('dev'));

// Inicializar WebSocket con la configuración CORS
initializeWebSocket(httpServer, corsOptions);

const base_route = "/api/";

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
app.use(base_route, statsRoutes);
app.use(base_route, stats_mantencionesRoutes);
app.use(base_route, modelosRoutes);
app.use(base_route, alertaRoutes);
app.use(base_route, marcaRoutes);
app.use(base_route, tipo_claveRoutes);
app.use(base_route, permisoRoutes);
app.use(base_route, rol_permisoRoutes);

// endpoint
app.use((req, res) =>{
    res.status(404).json({
        message: 'endpoint not found'
    })
})

export { app, httpServer };
