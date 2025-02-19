import { addMonths, format, subMonths } from 'date-fns';
import { pool } from '../db.js';

// Obtener mantenciones para el calendario
export const getCalendarMaintenances = async (req, res) => {
  try {
    // Validar el parametro compania_id
    let { companiaId } = req.query;

    // Validación de tipo y formato de compania_id
    if (companiaId && isNaN(companiaId)) {
      return res.status(400).json({ message: 'El parametro compania_id debe ser un número' });
    }

    const params = [];
    let companyFilter = ''; 

    // Si compania_id es válido, agregar el filtro en la consulta
    if (companiaId) {
      companyFilter = 'AND maq.compania_id = ?';
      params.push(companiaId); // Añadir el parametro compania_id
    }

    const query = `
      SELECT 
        m.fec_inicio as date,
        CONCAT('Mantención ', maq.codigo) as title,
        em.nombre as estado,
        c.nombre as company
      FROM mantencion m
      JOIN maquina maq ON m.maquina_id = maq.id
      JOIN compania c ON maq.compania_id = c.id
      JOIN estado_mantencion em ON m.estado_mantencion_id = em.id
      WHERE m.fec_inicio BETWEEN DATE_SUB(CURRENT_DATE, INTERVAL 1 MONTH) 
      AND DATE_ADD(CURRENT_DATE, INTERVAL 2 MONTH)
      AND m.isDeleted = 0
      ${companyFilter}
    `;

    // Ejecutar la consulta con los parámetros seguros
    const [result] = await pool.query(query, params);

    // Mapeo de resultados y asignación de colores de estado
    const response = result.map(row => ({
      ...row,
      date: new Date(row.date), // Asegurarse de que la fecha esté en formato Date
      status: getStatusColor(row.estado) // Aplicar la lógica de color
    }));

    // Enviar la respuesta como JSON
    res.json(response);
  } catch (error) {
    // Registrar error de forma detallada en el servidor (sin exponer detalles al cliente)
    console.error('Error al obtener las mantenimientos del calendario:', error);

    // Devolver un mensaje de error genérico
    res.status(500).json({ message: 'Ocurrió un error en el servidor. Intente nuevamente más tarde.' });
  }
};


const getStatusColor = (estado) => {
  switch (estado) {
    case 'Ingresada':
      return 'Ingresada';
    case 'Preaprobada':
      return 'Preaprobada';
    case 'Aprobada':
      return 'Aprobada';
    case 'En proceso':
      return 'En proceso';
    case 'Completada':
      return 'Completada';
    case 'Programada':
      return 'Programada';
    default:
      return 'default';
  }
};

export const getMonthlyStats = async (req, res) => {
  try {
    const { companiaId, startDate, endDate } = req.query;
    const params = [];

    // Mapa de números de mes a abreviaturas en español
    const monthAbbreviations = {
      1: 'Ene', 2: 'Feb', 3: 'Mar', 4: 'Abr', 
      5: 'May', 6: 'Jun', 7: 'Jul', 8: 'Ago',
      9: 'Sep', 10: 'Oct', 11: 'Nov', 12: 'Dic'
    };

    // Si no hay fechas, usar los últimos 6 meses por defecto
    const defaultStartDate = format(subMonths(new Date(), 5), 'yyyy-MM-dd');
    const defaultEndDate = format(new Date(), 'yyyy-MM-dd');

    let dateFilter = '';
    // Si startDate y endDate están presentes
    if (startDate && endDate) {
      dateFilter = 'AND m.fec_inicio BETWEEN ? AND ?';
      params.push(startDate, endDate);
    } else if (startDate) { // Si solo startDate está presente
      dateFilter = 'AND m.fec_inicio >= ?';
      params.push(startDate);
    } else if (endDate) { // Si solo endDate está presente
      dateFilter = 'AND m.fec_inicio <= ?';
      params.push(endDate);
    } else { // Si no hay fechas, usamos las fechas por defecto
      dateFilter = 'AND m.fec_inicio BETWEEN ? AND ?';
      params.push(defaultStartDate, defaultEndDate);
    }

    // Preparamos la consulta SQL
    let query = `
      SELECT 
        CAST(DATE_FORMAT(m.fec_inicio, '%Y-%m-01') AS DATE) as month,
        SUM(CASE WHEN tm.nombre = 'Preventiva' THEN 1 ELSE 0 END) as preventiva,
        SUM(CASE WHEN tm.nombre = 'Correctiva' THEN 1 ELSE 0 END) as correctiva,
        SUM(CASE WHEN tm.nombre = 'Emergencia' THEN 1 ELSE 0 END) as emergencia,
        COUNT(*) as total,
        COALESCE(SUM(m.cost_ser), 0) as costos
      FROM mantencion m
      JOIN maquina maq ON m.maquina_id = maq.id
      JOIN compania c ON maq.compania_id = c.id
      JOIN tipo_mantencion tm ON m.tipo_mantencion_id = tm.id
      WHERE m.isDeleted = 0
      ${dateFilter}
      ${companiaId ? 'AND c.id = ?' : ''}
      GROUP BY CAST(DATE_FORMAT(m.fec_inicio, '%Y-%m-01') AS DATE)
      ORDER BY month ASC
    `;

    if (companiaId) {
      params.push(companiaId);
    }

    const [result] = await pool.query(query, params);

    // Generar array de meses entre las fechas seleccionadas
    let startMonth = startDate ? new Date(startDate) : new Date(defaultStartDate);
    let endMonth = endDate ? new Date(endDate) : new Date(defaultEndDate);
    startMonth.setDate(1);
    endMonth.setDate(1);
    const months = [];
    let currentMonth = startMonth;

    while (currentMonth <= endMonth) {
      months.push(format(currentMonth, 'yyyy-MM'));
      currentMonth = addMonths(currentMonth, 1);
    }

    // Mapear los datos al formato requerido
    const stats = months.map(month => {
      const monthData = result.find(r => {
        const rMonth = format(r.month, 'yyyy-MM');
        return rMonth === month;
      }) || {
        month,
        preventiva: 0,
        correctiva: 0,
        emergencia: 0,
        total: 0,
        costos: 0,
      };
      const monthNumber = monthData.month instanceof Date ? 
        parseInt(format(monthData.month, 'M'), 10) :
        parseInt(month.split('-')[1], 10);
      return {
        month: monthAbbreviations[monthNumber],
        nro_month: monthNumber,
        preventiva: parseInt(monthData.preventiva, 10),
        correctiva: parseInt(monthData.correctiva, 10),
        emergencia: parseInt(monthData.emergencia, 10),
        total: parseInt(monthData.total, 10), 
        costos: parseInt(monthData.costos, 10),
      };
    });

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener KPIs
export const getKPIs = async (req, res) => {
  try {
    const { companiaId } = req.query;
    const currentMonth = format(new Date(), 'yyyy-MM');
    const previousMonth = format(subMonths(new Date(), 1), 'yyyy-MM');

    // Query para máquinas activas
    const activeMachinesQuery = `
      SELECT 
        COUNT(DISTINCT CASE WHEN maq.disponible = 1 THEN maq.id END) as current,
        COUNT(DISTINCT maq.id) as total
      FROM maquina maq
      WHERE ${companiaId ? 'maq.compania_id = ? AND' : ''} maq.isDeleted = 0
    `;

    // Query para mantenciones en proceso y completadas del mes actual
    const maintenanceStatusQuery = `
      SELECT 
        SUM(CASE WHEN em.nombre = 'En Proceso' THEN 1 ELSE 0 END) as inProgress,
        SUM(CASE WHEN em.nombre = 'Completada' THEN 1 ELSE 0 END) as completedOrders
      FROM mantencion m
      JOIN maquina maq ON m.maquina_id = maq.id
      JOIN estado_mantencion em ON m.estado_mantencion_id = em.id
      WHERE DATE_FORMAT(m.fec_inicio, '%Y-%m') = ?
      ${companiaId ? 'AND maq.compania_id = ?' : ''}
      AND m.isDeleted = 0
    `;

    // Query para costos del mes actual y anterior
    const costsQuery = `
      SELECT 
        COALESCE(SUM(CASE WHEN DATE_FORMAT(m.fec_inicio, '%Y-%m') = ? THEN m.cost_ser ELSE 0 END), 0) as currentCosts,
        COALESCE(SUM(CASE WHEN DATE_FORMAT(m.fec_inicio, '%Y-%m') = ? THEN m.cost_ser ELSE 0 END), 0) as previousCosts
      FROM mantencion m
      JOIN maquina maq ON m.maquina_id = maq.id
      WHERE ${companiaId ? 'maq.compania_id = ? AND' : ''} m.isDeleted = 0
    `;

    // Query para revisiones técnicas vencidas
    const overdueReviewsQuery = `
      SELECT COUNT(*) as overdueReviews
      FROM maquina maq
      WHERE maq.ven_rev_tec < CURRENT_DATE
      ${companiaId ? 'AND maq.compania_id = ?' : ''}
      AND maq.isDeleted = 0
    `;

    // Query para mantenciones vencidas
    const overdueMaintenancesQuery = `
      SELECT COUNT(*) as overdueMaintenances
      FROM mantencion m
      JOIN maquina maq ON m.maquina_id = maq.id
      JOIN estado_mantencion em ON m.estado_mantencion_id = em.id
      WHERE m.fec_inicio <= CURRENT_DATE
      AND em.nombre NOT IN ('En Proceso', 'Completada')
      ${companiaId ? 'AND maq.compania_id = ?' : ''}
      AND m.isDeleted = 0
    `;

    const [activeMachines] = await pool.query(activeMachinesQuery, companiaId ? [companiaId] : []);
    const [maintenanceStatus] = await pool.query(
      maintenanceStatusQuery, 
      companiaId ? [currentMonth, companiaId] : [currentMonth]
    );
    const [costs] = await pool.query(
      costsQuery, 
      companiaId ? [currentMonth, previousMonth, companiaId] : [currentMonth, previousMonth]
    );
    const [overdueReviews] = await pool.query(overdueReviewsQuery, companiaId ? [companiaId] : []);
    const [overdueMaintenances] = await pool.query(overdueMaintenancesQuery, companiaId ? [companiaId] : []);

    res.json({
      activeMachines: {
        current: activeMachines[0].current,
        total: activeMachines[0].total
      },
      inProgress: maintenanceStatus[0].inProgress,
      monthCosts: {
        current: costs[0].currentCosts,
        previous: costs[0].previousCosts
      },
      completedOrders: maintenanceStatus[0].completedOrders,
      overdueReviews: overdueReviews[0].overdueReviews,
      overdueMaintenances: overdueMaintenances[0].overdueMaintenances
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener mantenciones por compañía
export const getMaintenanceByCompany = async (req, res) => {
  try {
    const { companiaId } = req.query; // Recibimos el filtro por compañia desde los query params
    let query = `
      SELECT 
        c.id,
        c.nombre as name,
        COUNT(m.id) as value
      FROM compania c
      LEFT JOIN maquina maq ON c.id = maq.compania_id
      LEFT JOIN mantencion m ON maq.id = m.maquina_id
      WHERE m.fec_inicio >= DATE_SUB(CURRENT_DATE, INTERVAL 6 MONTH)
      AND m.isDeleted = 0
    `;

    const params = []; // Para almacenar los parámetros de la consulta

    // Si se ha proporcionado un companiaId, agregamos el filtro a la consulta
    if (companiaId) {
      query += ' AND c.id = ?';
      params.push(companiaId);
    }

    query += `
      GROUP BY c.id, c.nombre
      ORDER BY value DESC
    `;

    const [result] = await pool.query(query, params);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Obtener historial de mantenciones
export const getMaintenanceHistory = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 5, 
      companiaId, 
      month, 
      type,
      orden,
      "maquina.patente": patente,
      "maquina.nombre": maquinaNombre,
      estado,
      "personal.nombre": personalNombre,
      "personal.apellido": personalApellido,
      "personal.rut": personalRut,
      "taller.nombre": tallerNombre,
      "aprobador.nombre": aprobadorNombre,
      "aprobador.apellido": aprobadorApellido,
      "responsable.nombre": responsableNombre,
      "responsable.apellido": responsableApellido,
      aprobada,
      fechaInicio,
      fechaFin
    } = req.query;
    
    const offset = (page - 1) * limit;

    let whereConditions = ['m.isDeleted = 0'];
    let params = [];

    // Filtros existentes
    if (companiaId) {
      whereConditions.push('c.id = ?');
      params.push(companiaId);
    }
    if (month) {
      whereConditions.push('DATE_FORMAT(m.fec_inicio, "%Y-%m") = ?');
      params.push(month);
    }
    if (type) {
      whereConditions.push('tm.nombre = ?');
      params.push(type);
    }
    if (patente) {
      whereConditions.push('maq.patente LIKE ?');
      params.push(`%${patente}%`);
    }
    if (maquinaNombre) {
      whereConditions.push('maq.nombre LIKE ?');
      params.push(`%${maquinaNombre}%`);
    }
    if (estado) {
      whereConditions.push('em.nombre LIKE ?');
      params.push(`%${estado}%`);
    }
    if (personalNombre) {
      whereConditions.push('p.nombre LIKE ?');
      params.push(`%${personalNombre}%`);
    }
    if (personalApellido) {
      whereConditions.push('p.apellido LIKE ?');
      params.push(`%${personalApellido}%`);
    }
    if (personalRut) {
      whereConditions.push('p.rut LIKE ?');
      params.push(`%${personalRut}%`);
    }
    if (tallerNombre) {
      whereConditions.push('t.nombre LIKE ?');
      params.push(`%${tallerNombre}%`);
    }

    // Nuevos filtros
    if (aprobadorNombre) {
      whereConditions.push('p_apr.nombre LIKE ?');
      params.push(`%${aprobadorNombre}%`);
    }
    if (aprobadorApellido) {
      whereConditions.push('p_apr.apellido LIKE ?');
      params.push(`%${aprobadorApellido}%`);
    }
    if (responsableNombre) {
      whereConditions.push('p_resp.nombre LIKE ?');
      params.push(`%${responsableNombre}%`);
    }
    if (responsableApellido) {
      whereConditions.push('p_resp.apellido LIKE ?');
      params.push(`%${responsableApellido}%`);
    }
    if (aprobada !== undefined) {
      whereConditions.push('m.aprobada = ?');
      params.push(aprobada);
    }
    if (fechaInicio && fechaFin) {
      whereConditions.push('m.fec_inicio BETWEEN ? AND ?');
      params.push(fechaInicio, fechaFin);
    }

    const whereClause = whereConditions.length 
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';

    const orderByMap = {
      'fecha_asc': 'm.fec_inicio ASC',
      'fecha_desc': 'm.fec_inicio DESC',
      'duracion_asc': 'TIMESTAMPDIFF(HOUR, m.fec_inicio, COALESCE(m.fec_termino, NOW())) ASC',
      'duracion_desc': 'TIMESTAMPDIFF(HOUR, m.fec_inicio, COALESCE(m.fec_termino, NOW())) DESC',
      'costo_asc': 'm.cost_ser ASC',
      'costo_desc': 'm.cost_ser DESC',
      'tipo_asc': 'tm.nombre ASC',
      'tipo_desc': 'tm.nombre DESC',
      'estado_asc': 'em.nombre ASC',
      'estado_desc': 'em.nombre DESC',
      'taller_asc': 't.nombre ASC',
      'taller_desc': 't.nombre DESC',
      'conductor_asc': 'p.nombre ASC',
      'conductor_desc': 'p.nombre DESC',
      'aprobador_asc': 'p_apr.nombre ASC',
      'aprobador_desc': 'p_apr.nombre DESC',
      'responsable_asc': 'p_resp.nombre ASC',
      'responsable_desc': 'p_resp.nombre DESC',
      'fecha_aprobacion_asc': 'm.fecha_aprobacion ASC',
      'fecha_aprobacion_desc': 'm.fecha_aprobacion DESC',
      'estado_aprobacion_asc': 'm.aprobada ASC',
      'estado_aprobacion_desc': 'm.aprobada DESC',
      'tiempo_restante_asc': 'tiempo_restante ASC',
      'tiempo_restante_desc': 'tiempo_restante DESC'
    };

    const orderBy = orderByMap[orden] || 'm.fec_inicio DESC';

    const query = `
      SELECT 
        m.id,
        m.fec_inicio,
        m.fec_termino,
        m.cost_ser,
        m.bitacora_id,
        m.aprobada,
        DATE_FORMAT(m.fecha_aprobacion, '%d-%m-%Y %H:%i') as fecha_aprobacion,
        m.aprobada_por,
        m.personal_responsable_id,
        TIMESTAMPDIFF(HOUR, m.fec_inicio, COALESCE(m.fec_termino, NOW())) as duracion_horas,
        CASE 
          WHEN em.nombre = 'Programada' THEN 
            CASE
              WHEN TIMESTAMPDIFF(MONTH, NOW(), m.fec_inicio) > 0 THEN CONCAT(TIMESTAMPDIFF(MONTH, NOW(), m.fec_inicio), ' meses')
              WHEN TIMESTAMPDIFF(WEEK, NOW(), m.fec_inicio) > 0 THEN CONCAT(TIMESTAMPDIFF(WEEK, NOW(), m.fec_inicio), ' semanas')
              WHEN TIMESTAMPDIFF(DAY, NOW(), m.fec_inicio) > 0 THEN CONCAT(TIMESTAMPDIFF(DAY, NOW(), m.fec_inicio), ' días')
              ELSE CONCAT(TIMESTAMPDIFF(HOUR, NOW(), m.fec_inicio), ' horas')
            END
          ELSE NULL
        END as tiempo_restante,
        maq.codigo as vehiculo,
        maq.id as 'maquina.id',
        maq.img_url as 'maquina.img_url',
        maq.patente as 'maquina.patente',
        maq.nombre as 'maquina.nombre',
        tm.nombre as tipo,
        tm.id as 'tipo_mantencion.id',
        em.nombre as estado,
        em.id as 'estado_mantencion.id',
        c.nombre as company,
        p.nombre as 'personal.nombre',
        p.apellido as 'personal.apellido',
        p.rut as 'personal.rut',
        t.nombre as 'taller.nombre',
        t.id as 'taller.id',
        CONCAT(p_apr.nombre, ' ', p_apr.apellido) as 'aprobador_nombre',
        CONCAT(p_resp.nombre, ' ', p_resp.apellido) as 'responsable_nombre'
      FROM mantencion m
      JOIN maquina maq ON m.maquina_id = maq.id
      JOIN compania c ON maq.compania_id = c.id
      JOIN tipo_mantencion tm ON m.tipo_mantencion_id = tm.id
      JOIN estado_mantencion em ON m.estado_mantencion_id = em.id
      JOIN taller t ON m.taller_id = t.id
      JOIN bitacora b ON m.bitacora_id = b.id
      JOIN personal p ON b.personal_id = p.id
      LEFT JOIN personal p_apr ON m.aprobada_por = p_apr.id
      LEFT JOIN personal p_resp ON m.personal_responsable_id = p_resp.id
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM mantencion m
      JOIN maquina maq ON m.maquina_id = maq.id
      JOIN compania c ON maq.compania_id = c.id
      JOIN tipo_mantencion tm ON m.tipo_mantencion_id = tm.id
      JOIN estado_mantencion em ON m.estado_mantencion_id = em.id
      JOIN taller t ON m.taller_id = t.id
      JOIN bitacora b ON m.bitacora_id = b.id
      JOIN personal p ON b.personal_id = p.id
      LEFT JOIN personal p_apr ON m.aprobada_por = p_apr.id
      LEFT JOIN personal p_resp ON m.personal_responsable_id = p_resp.id
      ${whereClause}
    `;

    const [records] = await pool.query(query, [...params, parseInt(limit), offset]);
    const [totalCount] = await pool.query(countQuery, params);

    res.json({
      data: records,
      total: totalCount[0].total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};