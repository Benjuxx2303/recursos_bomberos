import { addMonths, format, subMonths } from 'date-fns';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';

// Obtener mantenciones para el calendario
export const getCalendarMaintenances = async (req, res) => {
  try {
    // Validar el parametro compania_id
    let { companiaId } = req.query;

    // Si hay un filtro de compañía del middleware, usarlo
    const finalCompaniaId = companiaId || req.companyFilter;

    // Validación de tipo y formato de compania_id
    if (finalCompaniaId && isNaN(finalCompaniaId)) {
      return res.status(400).json({ message: 'El parametro compania_id debe ser un número' });
    }

    const params = [];
    let companyFilter = ''; 

    // Si compania_id es válido, agregar el filtro en la consulta
    if (finalCompaniaId) {
      companyFilter = 'AND maq.compania_id = ?';
      params.push(finalCompaniaId);
    }

    const query = `
      SELECT 
        m.id,
        m.fec_inicio as date,
        CONCAT('Mantención ', maq.codigo) as title,
        em.nombre as estado,
        c.nombre as company,
        c.id as company_id,
        maq.compania_id
      FROM mantencion m
      JOIN maquina maq ON m.maquina_id = maq.id
      JOIN compania c ON maq.compania_id = c.id
      JOIN estado_mantencion em ON m.estado_mantencion_id = em.id
      WHERE m.fec_inicio BETWEEN DATE_SUB(CURRENT_DATE, INTERVAL 1 MONTH) 
      AND DATE_ADD(CURRENT_DATE, INTERVAL 2 MONTH)
      AND m.isDeleted = 0
      ${companyFilter}
      ORDER BY m.fec_inicio ASC
    `;

/*     console.log('Query:', query); // Para debugging
    console.log('Params:', params); // Para debugging */

    // Ejecutar la consulta con los parámetros seguros
    const [result] = await pool.query(query, params);

    console.log('Resultados encontrados:', result.length); // Para debugging

    // Mapeo de resultados y asignación de colores de estado
    const response = result.map(row => ({
      id: row.id,
      date: row.date,
      title: row.title,
      estado: row.estado,
      company: row.company,
      companyId: String(row.company_id), // Asegurar que companyId sea string
      status: getStatusColor(row.estado)
    }));

    // Enviar la respuesta como JSON
    res.json(response);
  } catch (error) {
    console.error('Error al obtener las mantenimientos del calendario:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(403).json({ error: 'Token inválido' });
    }
    res.status(500).json({ message: 'Ocurrió un error en el servidor. Intente nuevamente más tarde.' });
  }
};


const getStatusColor = (estado) => {
  switch (estado) {
    case 'Ingresada':
      return 'Ingresada';
    case 'Evaluacion':
      return 'Evaluacion';
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

    // Si hay un filtro de compañía del middleware, usarlo
    const finalCompaniaId = companiaId || req.companyFilter;

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
      ${finalCompaniaId ? 'AND c.id = ?' : ''}
      GROUP BY CAST(DATE_FORMAT(m.fec_inicio, '%Y-%m-01') AS DATE)
      ORDER BY month ASC
    `;

    if (finalCompaniaId) {
      params.push(finalCompaniaId);
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

    // Si hay un filtro de compañía del middleware, usarlo
    const finalCompaniaId = companiaId || req.companyFilter;

    const currentMonth = format(new Date(), 'yyyy-MM');
    const previousMonth = format(subMonths(new Date(), 1), 'yyyy-MM');

    // Query para máquinas activas
    const activeMachinesQuery = `
      SELECT 
        COUNT(DISTINCT CASE WHEN maq.disponible = 1 THEN maq.id END) as current,
        COUNT(DISTINCT maq.id) as total
      FROM maquina maq
      WHERE ${finalCompaniaId ? 'maq.compania_id = ? AND' : ''} maq.isDeleted = 0
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
      ${finalCompaniaId ? 'AND maq.compania_id = ?' : ''}
      AND m.isDeleted = 0
    `;

    // Query para costos del mes actual y anterior
    const costsQuery = `
      SELECT 
        COALESCE(SUM(CASE WHEN DATE_FORMAT(m.fec_inicio, '%Y-%m') = ? THEN m.cost_ser ELSE 0 END), 0) as currentCosts,
        COALESCE(SUM(CASE WHEN DATE_FORMAT(m.fec_inicio, '%Y-%m') = ? THEN m.cost_ser ELSE 0 END), 0) as previousCosts
      FROM mantencion m
      JOIN maquina maq ON m.maquina_id = maq.id
      WHERE ${finalCompaniaId ? 'maq.compania_id = ? AND' : ''} m.isDeleted = 0
    `;

    // Query para revisiones técnicas vencidas
    const overdueReviewsQuery = `
      SELECT COUNT(*) as overdueReviews
      FROM maquina maq
      WHERE maq.ven_rev_tec < CURRENT_DATE
      ${finalCompaniaId ? 'AND maq.compania_id = ?' : ''}
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
      ${finalCompaniaId ? 'AND maq.compania_id = ?' : ''}
      AND m.isDeleted = 0
    `;

    const [activeMachines] = await pool.query(activeMachinesQuery, finalCompaniaId ? [finalCompaniaId] : []);
    const [maintenanceStatus] = await pool.query(
      maintenanceStatusQuery, 
      finalCompaniaId ? [currentMonth, finalCompaniaId] : [currentMonth]
    );
    const [costs] = await pool.query(
      costsQuery, 
      finalCompaniaId ? [currentMonth, previousMonth, finalCompaniaId] : [currentMonth, previousMonth]
    );
    const [overdueReviews] = await pool.query(overdueReviewsQuery, finalCompaniaId ? [finalCompaniaId] : []);
    const [overdueMaintenances] = await pool.query(overdueMaintenancesQuery, finalCompaniaId ? [finalCompaniaId] : []);

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
    const { companiaId } = req.query;

    // Si hay un filtro de compañía del middleware, usarlo
    const finalCompaniaId = companiaId || req.companyFilter;

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

    // Si hay un filtro de compañía, agregarlo a la consulta
    if (finalCompaniaId) {
      query += ' AND c.id = ?';
      params.push(finalCompaniaId);
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
      "maquina.codigo": maquinaNombre,
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

    // Si hay un filtro de compañía del middleware, usarlo
    const finalCompaniaId = companiaId || req.companyFilter;

    let whereConditions = ['m.isDeleted = 0'];
    let params = [];

    // Filtros existentes
    if (finalCompaniaId) {
      whereConditions.push('c.id = ?');
      params.push(finalCompaniaId);
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
      whereConditions.push('maq.codigo LIKE ?');
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
      if (aprobada === 'null') {
        whereConditions.push('m.aprobada IS NULL');
      } else {
        whereConditions.push('m.aprobada = ?');
        params.push(parseInt(aprobada));
      }
    }
    if (fechaInicio || fechaFin) {
      if (fechaInicio && fechaFin) {
        whereConditions.push('m.fec_inicio BETWEEN ? AND ?');
        params.push(fechaInicio, fechaFin);
      } else if (fechaInicio) {
        whereConditions.push('m.fec_inicio >= ?');
        params.push(fechaInicio);
      } else if (fechaFin) {
        whereConditions.push('m.fec_inicio <= ?');
        params.push(fechaFin);
      }
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
        'conductor_asc': 'CONCAT(p.nombre, " ", p.apellido) ASC',
        'conductor_desc': 'CONCAT(p.nombre, " ", p.apellido) DESC',
        'aprobador_asc': 'CONCAT(p_apr.nombre, " ", p_apr.apellido) ASC',
        'aprobador_desc': 'CONCAT(p_apr.nombre, " ", p_apr.apellido) DESC',
        'responsable_asc': 'CONCAT(p_resp.nombre, " ", p_resp.apellido) ASC',
        'responsable_desc': 'CONCAT(p_resp.nombre, " ", p_resp.apellido) DESC',
        'fecha_aprobacion_asc': 'COALESCE(m.fecha_aprobacion, "9999-12-31") ASC',
        'fecha_aprobacion_desc': 'COALESCE(m.fecha_aprobacion, "9999-12-31") DESC',
        'estado_aprobacion_asc': 'COALESCE(m.aprobada, 2) ASC',
        'estado_aprobacion_desc': 'COALESCE(m.aprobada, 2) DESC',
        'tiempo_restante_asc': 'tiempo_restante ASC NULLS LAST',
        'tiempo_restante_desc': 'tiempo_restante DESC NULLS LAST'
      };
      
      const orderBy = orderByMap[orden];
      if (!orderBy && orden) {
        throw new Error(`Orden no válido: ${orden}`);
      }
      const finalOrderBy = orderBy || 'm.id DESC';
      
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
            WHEN em.nombre = 'Programada' AND m.fec_inicio IS NOT NULL THEN 
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
          maq.codigo as 'maquina.codigo',
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
        LEFT JOIN maquina maq ON m.maquina_id = maq.id
        LEFT JOIN compania c ON maq.compania_id = c.id
        LEFT JOIN tipo_mantencion tm ON m.tipo_mantencion_id = tm.id
        LEFT JOIN estado_mantencion em ON m.estado_mantencion_id = em.id
        LEFT JOIN taller t ON m.taller_id = t.id
        LEFT JOIN bitacora b ON m.bitacora_id = b.id
        LEFT JOIN personal p ON b.personal_id = p.id
        LEFT JOIN personal p_apr ON m.aprobada_por = p_apr.id
        LEFT JOIN personal p_resp ON m.personal_responsable_id = p_resp.id
        ${whereClause}
        ORDER BY ${finalOrderBy}
        LIMIT ? OFFSET ?
      `;
      
      const countQuery = `
        SELECT COUNT(*) as total
        FROM mantencion m
        LEFT JOIN maquina maq ON m.maquina_id = maq.id
        LEFT JOIN compania c ON maq.compania_id = c.id
        LEFT JOIN tipo_mantencion tm ON m.tipo_mantencion_id = tm.id
        LEFT JOIN estado_mantencion em ON m.estado_mantencion_id = em.id
        LEFT JOIN taller t ON m.taller_id = t.id
        LEFT JOIN bitacora b ON m.bitacora_id = b.id
        LEFT JOIN personal p ON b.personal_id = p.id
        LEFT JOIN personal p_apr ON m.aprobada_por = p_apr.id
        LEFT JOIN personal p_resp ON m.personal_responsable_id = p_resp.id
        ${whereClause}
      `;

    const [records] = await pool.query(query, [...params, parseInt(limit), offset]);
    const [totalCount] = await pool.query(countQuery, params);

    res.json({
      total: totalCount[0].total,
      data: records
  
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};