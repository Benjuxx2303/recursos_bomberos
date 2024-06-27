import express from "express";
// TODO: import desde routes
import indexRoutes from './routes/index.routes.js';
import rol_personalRoutes from './routes/rol_personal.routes.js';
import companiaRoutes from './routes/compania.routes.js';

const app = express();
app.use(express.json());

// TODO:  rutas de la api
app.use(indexRoutes);
app.use("/api/", rol_personalRoutes);
app.use("/api/", companiaRoutes);

// endpoint
app.use((req, res) =>{
    res.status(404).json({
        message: 'endpoint not found'
    })
})

export default app;