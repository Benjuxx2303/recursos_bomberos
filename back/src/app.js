import express from "express";
// TODO: import desde routes

const app = express();
app.use(express.json());

// TODO:  rutas de la api

app.use((req, res) =>{
    res.status(404).json({
        message: 'endpoint not found'
    })
})

export default app;