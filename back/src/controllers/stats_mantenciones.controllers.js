import { addMonths, format, subMonths } from 'date-fns';
import { pool } from '../db.js';

// Obtener mantenciones para el calendario
export const getCalendarMaintenances = async (req, res) => {
  try {
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
    `;
    
    const [result] = await pool.query(query);
    res.json(result.map(row => ({
      ...row,
      date: new Date(row.date),
      status: getStatusColor(row.estado)
    })));
  } catch (error) {
    res.status(500).json({ message: error.message });
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
    const { company, startDate, endDate } = req.query;
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
    if (startDate && endDate) {
      dateFilter = 'AND m.fec_inicio BETWEEN ? AND ?';
    } else if (startDate) {
    }
    if (startDate && endDate) {
      params.push(startDate, endDate);
    } else if (startDate) {
      params.push(startDate);
    } else if (endDate) {
      params.push(endDate);
    } else {
      params.push(defaultStartDate, defaultEndDate);
    }
    if (startDate && endDate) {
      params.push(startDate, endDate);
    } else {
      params.push(defaultStartDate, defaultEndDate);
    }

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
      ${company ? 'AND c.id = ?' : ''}
      GROUP BY CAST(DATE_FORMAT(m.fec_inicio, '%Y-%m-01') AS DATE)
      ORDER BY month ASC
    `;

    if (company) {
      params.push(company);
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
    const { company } = req.query;
    const currentMonth = format(new Date(), 'yyyy-MM');
    const previousMonth = format(subMonths(new Date(), 1), 'yyyy-MM');

    // Query para máquinas activas
    const activeMachinesQuery = `
      SELECT 
        COUNT(DISTINCT CASE WHEN maq.disponible = 1 THEN maq.id END) as current,
        COUNT(DISTINCT maq.id) as total
      FROM maquina maq
      WHERE ${company ? 'maq.compania_id = ? AND' : ''} maq.isDeleted = 0
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
      ${company ? 'AND maq.compania_id = ?' : ''}
      AND m.isDeleted = 0
    `;

    // Query para costos del mes actual y anterior
    const costsQuery = `
      SELECT 
        COALESCE(SUM(CASE WHEN DATE_FORMAT(m.fec_inicio, '%Y-%m') = ? THEN m.cost_ser ELSE 0 END), 0) as currentCosts,
        COALESCE(SUM(CASE WHEN DATE_FORMAT(m.fec_inicio, '%Y-%m') = ? THEN m.cost_ser ELSE 0 END), 0) as previousCosts
      FROM mantencion m
      JOIN maquina maq ON m.maquina_id = maq.id
      WHERE ${company ? 'maq.compania_id = ? AND' : ''} m.isDeleted = 0
    `;

    // Query para revisiones técnicas vencidas
    const overdueReviewsQuery = `
      SELECT COUNT(*) as overdueReviews
      FROM maquina maq
      WHERE maq.ven_rev_tec < CURRENT_DATE
      ${company ? 'AND maq.compania_id = ?' : ''}
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
      ${company ? 'AND maq.compania_id = ?' : ''}
      AND m.isDeleted = 0
    `;

    const [activeMachines] = await pool.query(activeMachinesQuery, company ? [company] : []);
    const [maintenanceStatus] = await pool.query(
      maintenanceStatusQuery, 
      company ? [currentMonth, company] : [currentMonth]
    );
    const [costs] = await pool.query(
      costsQuery, 
      company ? [currentMonth, previousMonth, company] : [currentMonth, previousMonth]
    );
    const [overdueReviews] = await pool.query(overdueReviewsQuery, company ? [company] : []);
    const [overdueMaintenances] = await pool.query(overdueMaintenancesQuery, company ? [company] : []);

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
    const query = `
      SELECT 
        c.id,
        c.nombre as name,
        COUNT(m.id) as value
      FROM compania c
      LEFT JOIN maquina maq ON c.id = maq.compania_id
      LEFT JOIN mantencion m ON maq.id = m.maquina_id
      WHERE m.fec_inicio >= DATE_SUB(CURRENT_DATE, INTERVAL 6 MONTH)
      AND m.isDeleted = 0
      GROUP BY c.id, c.nombre
      ORDER BY value DESC
    `;

    const [result] = await pool.query(query);
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
      company, 
      month, 
      type,
      orden ,
      "maquina.patente": patente,
      "maquina.nombre": maquinaNombre,
      estado,
      "personal.nombre": personalNombre,
      "personal.apellido": personalApellido,
      "personal.rut": personalRut,
      "taller.nombre": tallerNombre,
      fechaInicio,
      fechaFin
    } = req.query;
    
    const offset = (page - 1) * limit;

    let whereConditions = ['m.isDeleted = 0'];
    let params = [];

    // Filtros
    if (company) {
      whereConditions.push('c.id = ?');
      params.push(company);
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
    if (fechaInicio && fechaFin) {
      whereConditions.push('m.fec_inicio BETWEEN ? AND ?');
      params.push(fechaInicio, fechaFin);
    }

    const whereClause = whereConditions.length 
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';

    // Manejo del ordenamiento
    const orderByMap = {
      'fecha_asc': 'm.fec_inicio ASC',
      'fecha_desc': 'm.fec_inicio DESC',
      'duracion_asc': 'TIMESTAMPDIFF(HOUR, m.fec_inicio, COALESCE(m.fec_termino, NOW())) ASC',
      'duracion_desc': 'TIMESTAMPDIFF(HOUR, m.fec_inicio, COALESCE(m.fec_termino, NOW())) DESC',
      'costo_asc': 'm.cost_ser ASC',
      'costo_desc': 'm.cost_ser DESC'
    };

    const orderBy = orderByMap[orden] || 'm.fec_inicio DESC';

    const query = `
      SELECT 
        m.id,
        m.fec_inicio,
        m.fec_termino,
        m.cost_ser,
        m.bitacora_id,
        TIMESTAMPDIFF(HOUR, m.fec_inicio, COALESCE(m.fec_termino, NOW())) as duracion_horas,
        maq.codigo as vehiculo,
        maq.img_url as 'maquina.img_url',
        maq.patente as 'maquina.patente',
        maq.nombre as 'maquina.nombre',
        tm.nombre as tipo,
        em.nombre as estado,
        c.nombre as company,
        p.nombre as 'personal.nombre',
        p.apellido as 'personal.apellido',
        p.rut as 'personal.rut',
        t.nombre as 'taller.nombre'
      FROM mantencion m
      JOIN maquina maq ON m.maquina_id = maq.id
      JOIN compania c ON maq.compania_id = c.id
      JOIN tipo_mantencion tm ON m.tipo_mantencion_id = tm.id
      JOIN estado_mantencion em ON m.estado_mantencion_id = em.id
      JOIN taller t ON m.taller_id = t.id
      JOIN bitacora b ON m.bitacora_id = b.id
      JOIN personal p ON b.personal_id = p.id
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