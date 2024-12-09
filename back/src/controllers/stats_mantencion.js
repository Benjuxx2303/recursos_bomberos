import { pool } from "../db.js";
// -----------------------------------Reportes
export const getMantencionCostosByAnio = async (req, res) => {
    const { year } = req.query; //filtra por año en "fec_inicio"

    // Validación del año
    if (!/^\d{4}$/.test(year)) {
        return res.status(400).json({ message: "El año debe ser un número de 4 dígitos" });
    }

    // Arreglo con los nombres de los meses en español
    const mesesNombre = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", 
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    try {
        const [rows] = await pool.query(`
            SELECT 
                MONTH(m.fec_inicio) AS mes,  -- Usamos fec_inicio en lugar de fh_salida
                SUM(m.cost_ser) AS costoTotal,
                COUNT(m.id) AS totalMantenciones
            FROM 
                mantencion m
            WHERE 
                YEAR(m.fec_inicio) = ?  -- Filtramos por el año de fec_inicio
            GROUP BY 
                MONTH(m.fec_inicio)
            ORDER BY 
                mes
        `, [year]);

        // Formatear la respuesta
        const result = {
            year: parseInt(year),
            meses: []
        };

        // Rellenar los meses con 0 si no hay datos
        for (let i = 1; i <= 12; i++) {
            const mesData = rows.find(row => row.mes === i) || { mes: i, costoTotal: 0, totalMantenciones: 0 };
            result.meses.push({
                mes: mesesNombre[mesData.mes - 1], // Convertir el número del mes al nombre
                costoTotal: mesData.costoTotal,
                totalMantenciones: mesData.totalMantenciones
            });
        }
        
        res.json(result);
    } catch (error) {
        return res.status(500).json({
            message: "Error interno del servidor",
            error: error.message // Captura el mensaje de error
        });
    }
};




// stats
// stats
export const getReporteMantencionesEstadoCosto = async (req, res) => {
    const { startDate, endDate, companiaId } = req.query; // startDate y endDate filtra por "fec_inicio"

    // Validación de fechas con expresión regular
    const fechaRegex = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}$/;

    if (!startDate || !endDate) {
        return res.status(400).json({ message: "Se requieren startDate y endDate en formato dd-mm-yyyy." });
    }

    if (!fechaRegex.test(startDate) || !fechaRegex.test(endDate)) {
        return res.status(400).json({
            message: 'El formato de la fecha es inválido. Debe ser dd-mm-aaaa'
        });
    }

    // Validación de companiaId (si se proporciona)
    if (companiaId) {
        const companiaIdNumber = parseInt(companiaId, 10);

        if (isNaN(companiaIdNumber)) {
            return res.status(400).json({ message: "companiaId debe ser un número válido." });
        }

        try {
            // Verificar que la compañia exista y no esté eliminada
            const [companiaExists] = await pool.query(
                "SELECT 1 FROM compania WHERE id = ? AND isDeleted = 0",
                [companiaIdNumber]
            );

            if (companiaExists.length === 0) {
                return res.status(400).json({ message: "Compañía no existe o está eliminada." });
            }
        } catch (error) {
            return res.status(500).json({ message: "Error interno al verificar la compañía.", error: error.message });
        }
    }

    try {
        // Comenzar a construir la consulta para estadoMensual (solo aplica startDate, endDate y companiaId)
        let query = `
            SELECT 
                YEAR(m.fec_inicio) AS year,          -- Obtener el año de fec_inicio
                MONTH(m.fec_inicio) AS month,        -- Obtener el mes de fec_inicio
                em.nombre AS estado_mantencion,
                COUNT(m.id) AS count,
                SUM(m.cost_ser) AS cost
            FROM mantencion m
            JOIN estado_mantencion em ON m.estado_mantencion_id = em.id
            JOIN bitacora b ON m.bitacora_id = b.id      -- Relación con bitacora para obtener compania_id
            WHERE m.isDeleted = 0 
                AND m.fec_inicio BETWEEN STR_TO_DATE(?, '%d-%m-%Y') AND STR_TO_DATE(?, '%d-%m-%Y')
                AND m.fec_termino BETWEEN STR_TO_DATE(?, '%d-%m-%Y') AND STR_TO_DATE(?, '%d-%m-%Y')
        `;

        const params = [startDate, endDate, startDate, endDate];

        if (companiaId) {
            query += " AND b.compania_id = ?";  // Filtro por compania_id en bitacora
            params.push(companiaId);
        }

        query += `
            GROUP BY year, month, em.nombre
            ORDER BY year, month
        `;

        // Ejecutar la consulta para obtener el reporte mensual
        const [rows] = await pool.query(query, params);

        // Formatear la respuesta para el reporte mensual
        const report = {};

        rows.forEach(row => {
            const monthName = new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(new Date(row.year, row.month - 1)).toLowerCase();

            if (!report[row.year]) {
                report[row.year] = {};
            }

            if (!report[row.year][monthName]) {
                report[row.year][monthName] = {};
            }

            const estadoLowerCase = row.estado_mantencion.toLowerCase();
            report[row.year][monthName][estadoLowerCase] = {
                count: row.count,
                cost: row.cost
            };
        });

        // Agregar tipos de mantenciones al reporte (sin filtros de fecha ni companiaId)
        let tiposMantencionesQuery = `
            SELECT 
                tm.nombre AS tipo_mantencion,
                COUNT(dm.id) AS cantidad
            FROM detalle_mantencion dm
            JOIN tipo_mantencion tm ON dm.tipo_mantencion_id = tm.id
            JOIN mantencion m ON dm.mantencion_id = m.id
            JOIN bitacora b ON m.bitacora_id = b.id      -- Relación con bitacora para obtener compania_id
            WHERE m.isDeleted = 0
        `;

        if (companiaId) {
            tiposMantencionesQuery += " AND b.compania_id = ?";  // Filtro por compania_id en bitacora
        }

        const [tiposRows] = await pool.query(tiposMantencionesQuery, companiaId ? [companiaId] : []);

        const totalMantenciones = tiposRows.reduce((sum, row) => sum + row.cantidad, 0);
        const tiposMantenciones = {};

        tiposRows.forEach(row => {
            tiposMantenciones[row.tipo_mantencion] = {
                cantidad: row.cantidad,
                porcentaje: (row.cantidad / totalMantenciones).toFixed(2)
            };
        });

        // Agregar estado de flota al reporte (sin filtros de fecha ni companiaId)
        let estadoFlotaQuery = `
            SELECT 
                m.disponible,
                COUNT(m.id) AS cantidad
            FROM maquina m
            WHERE m.isDeleted = 0
        `;
        
        if (companiaId) {
            estadoFlotaQuery += " AND m.compania_id = ?";  // Filtro por compania_id en maquina
        }

        const [flotaRows] = await pool.query(estadoFlotaQuery, companiaId ? [companiaId] : []);

        const estadoFlota = {
            disponible: {
                cantidad: 0,
                porcentaje: 0
            },
            noDisponible: {
                cantidad: 0,
                porcentaje: 0
            }
        };

        flotaRows.forEach(row => {
            const estado = row.disponible === 1 ? 'disponible' : 'noDisponible';
            estadoFlota[estado].cantidad = row.cantidad;
        });

        // Calcular los porcentajes de la flota
        const totalFlota = estadoFlota.disponible.cantidad + estadoFlota.noDisponible.cantidad;
        if (totalFlota > 0) {
            estadoFlota.disponible.porcentaje = (estadoFlota.disponible.cantidad / totalFlota).toFixed(2);
            estadoFlota.noDisponible.porcentaje = (estadoFlota.noDisponible.cantidad / totalFlota).toFixed(2);
        }

        // Responder con todos los datos
        res.json({
            estadoMensual: report,
            tiposMantenciones: tiposMantenciones,
            estadoFlota: estadoFlota
        });
    } catch (error) {
        return res.status(500).json({ message: "Error interno del servidor", error: error.message });
    }
};


// dashboardSummary (mes actual)
export const getReporteGeneral = async (req, res) => {
    // Obtener la fecha actual para hacer comparaciones
    const fechaHoy = new Date();
    const fechaFinMes = new Date(fechaHoy.getFullYear(), fechaHoy.getMonth() + 1, 0); // Último día del mes

    // Definir los sinónimos de los estados
    const estados = {
        abiertas: ['abierta', 'en proceso', 'pendiente'], // Los sinónimos de "abierta"
        completadas: ['cerrada', 'terminada', 'finalizada', 'completada'], // Los sinónimos de "completada"
        atrasadas: ['atrasada', 'vencida'] // Los sinónimos de "atrasada"
    };

    try {
        // Contar el total de máquinas
        const [totalMaquinasRows] = await pool.query(`
            SELECT COUNT(*) AS total
            FROM maquina
        `);
        const totalMaquinas = totalMaquinasRows[0].total;

        // Contar las máquinas activas
        const [maquinasActivasRows] = await pool.query(`
            SELECT COUNT(*) AS total
            FROM maquina
            WHERE isDeleted = 0
        `);
        const maquinasActivas = maquinasActivasRows[0].total;

        // Contar las máquinas disponibles (disponible = 1)
        const [maquinasDisponiblesRows] = await pool.query(`
            SELECT COUNT(*) AS total
            FROM maquina
            WHERE disponible = 1 AND isDeleted = 0
        `);
        const maquinasDisponibles = maquinasDisponiblesRows[0].total;

        // Calcular el porcentaje de flota disponible
        const flotaDisponible = maquinasActivas > 0 ? (maquinasDisponibles / maquinasActivas) * 100 : 0;

        // Contar mantenciones programadas para el resto del mes
        const [mantencionesProximasRows] = await pool.query(`
            SELECT COUNT(*) AS total
            FROM mantencion m
            JOIN bitacora b ON m.bitacora_id = b.id
            WHERE m.isDeleted = 0
              AND m.fec_termino BETWEEN CURDATE() AND ?
        `, [fechaFinMes]);

        const mantencionesProximas = mantencionesProximasRows[0].total;

        // Contar mantenciones abiertas
        const estadosAbiertos = estados.abiertas.join("','"); // Unir los sinónimos de "abierta"
        const [mantencionesAbiertasRows] = await pool.query(`
            SELECT COUNT(*) AS total
            FROM mantencion m
            JOIN estado_mantencion em ON m.estado_mantencion_id = em.id
            WHERE em.nombre IN ('${estadosAbiertos}')
              AND m.isDeleted = 0
        `);
        const mantencionesAbiertas = mantencionesAbiertasRows[0].total;

        // Contar mantenciones completadas este mes
        const estadosCompletadas = estados.completadas.join("','"); // Unir los sinónimos de "completada"
        const [mantencionesCompletadasRows] = await pool.query(`
            SELECT COUNT(*) AS total
            FROM mantencion m
            JOIN estado_mantencion em ON m.estado_mantencion_id = em.id
            WHERE em.nombre IN ('${estadosCompletadas}')
              AND m.isDeleted = 0
              AND MONTH(m.fec_termino) = MONTH(CURDATE())
              AND YEAR(m.fec_termino) = YEAR(CURDATE())
        `);
        const mantencionesCompletadas = mantencionesCompletadasRows[0].total;

        // Contar mantenciones atrasadas (fechas de término pasadas)
        const estadosAtrasadas = estados.atrasadas.join("','"); // Unir los sinónimos de "atrasada"
        const [mantencionesAtrasadasRows] = await pool.query(`
            SELECT COUNT(*) AS total
            FROM mantencion m
            JOIN estado_mantencion em ON m.estado_mantencion_id = em.id
            WHERE em.nombre IN ('${estadosAtrasadas}')
              AND m.isDeleted = 0
              AND m.fec_termino < CURDATE()
        `);
        const mantencionesAtrasadas = mantencionesAtrasadasRows[0].total;

        // Calcular el tiempo de resolución promedio de mantenciones
        const [tiempoResolucionRows] = await pool.query(`
            SELECT AVG(DATEDIFF(m.fec_termino, m.fec_inicio)) AS promedio
            FROM mantencion m
            WHERE m.isDeleted = 0
              AND m.fec_termino IS NOT NULL
        `);
        const tiempoResolucionPromedio = Math.round(tiempoResolucionRows[0].promedio) || 0;

        // Calcular el porcentaje de mantenciones preventivas (sin fec_termino pero con fec_inicio)
        const [mantencionesPreventivasRows] = await pool.query(`
            SELECT COUNT(*) AS total
            FROM mantencion m
            WHERE m.isDeleted = 0
              AND (m.fec_termino IS NULL OR m.fec_termino = '')
              AND m.fec_inicio IS NOT NULL
        `);
        const mantencionesPreventivas = mantencionesPreventivasRows[0].total;
        const porcentajePreventivas = totalMaquinas > 0 ? (mantencionesPreventivas / totalMaquinas) * 100 : 0;

        // Devolver el reporte completo
        const reporte = {
            totalMaquinas,
            maquinasActivas, // flota disponible (isDeleted = 0)
            mantencionesProximas, // mantenciones programadas para el resto del mes
            mantencionesAbiertas, // mantenciones en proceso en este momento ("abierta"; "en proceso")
            mantencionesCompletadas, // mantenciones completadas este mes ("cerrada";"terminada")
            mantencionesAtrasadas, // mantenciones vencidas ("atrasada"; "vencida"); fecha de término < hoy
            eficiencia: {
                tiempoResolucionPromedio, // Tiempo aproximado promedio , en que tarda en realizarse una mantención (en días); compara "fec_inicio" con "fec_termino"
                porcentajePreventivas, // Porcentaje de mantenciones preventivas (sin fecha de término pero con fecha de inicio)
                flotaDisponible // Porcentaje de flota disponible (máquinas disponibles / máquinas activas) ; porcentaje de máquinas disponibles frente al total de máquinas (comparar "disponible = 1" con "disponible = 0"; dividir las disponibles con la flota total (maquinas activas))
            }
        };

        res.json(reporte);
    } catch (error) {
        return res.status(500).json({
            message: "Error interno del servidor",
            error: error.message
        });
    }
};