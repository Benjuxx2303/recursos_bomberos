import { format, subMonths } from 'date-fns';
import { pool } from '../db.js';

// Obtener mantenciones para el calendario
export const getCalendarMaintenances = async (req, res) => {
  try {
    const query = `
      SELECT 
        m.fec_inicio as date,
        CONCAT('Mantención ', maq.codigo) as title,
        CASE 
          WHEN em.nombre = 'Completado' THEN 'completed'
          WHEN em.nombre = 'Pendiente' AND m.fec_inicio < CURRENT_DATE THEN 'overdue'
          ELSE 'scheduled'
        END as status,
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
      date: new Date(row.date)
    })));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener estadísticas mensuales
export const getMonthlyStats = async (req, res) => {
  try {
    const { company } = req.query;
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = subMonths(new Date(), i);
      return format(date, 'yyyy-MM');
    }).reverse();

    let query = `
      SELECT 
        DATE_FORMAT(m.fec_inicio, '%Y-%m') as month,
        SUM(CASE WHEN tm.nombre = 'Preventivo' THEN 1 ELSE 0 END) as preventivo,
        SUM(CASE WHEN tm.nombre = 'Correctivo' THEN 1 ELSE 0 END) as correctivo,
        SUM(CASE WHEN tm.nombre = 'Emergencia' THEN 1 ELSE 0 END) as emergencia,
        COUNT(*) as total,
        COALESCE(SUM(m.cost_ser), 0) as costos
      FROM mantencion m
      JOIN maquina maq ON m.maquina_id = maq.id
      JOIN compania c ON maq.compania_id = c.id
      JOIN tipo_mantencion tm ON m.tipo_mantencion_id = tm.id
      ${company ? 'WHERE c.id = ?' : ''}
      AND m.isDeleted = 0
      GROUP BY DATE_FORMAT(m.fec_inicio, '%Y-%m')
      HAVING month >= ? AND month <= ?
      ORDER BY month
    `;

    const params = company 
      ? [company, last6Months[0], last6Months[5]]
      : [last6Months[0], last6Months[5]];

    const [result] = await pool.query(query, params);
    
    const stats = last6Months.map(month => {
      const monthData = result.find(r => r.month === month) || {
        month,
        preventivo: 0,
        correctivo: 0,
        emergencia: 0,
        total: 0,
        costos: 0
      };
      return {
        ...monthData,
        month: format(new Date(monthData.month), 'MMM')
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

    // Query para mantenciones en proceso y completadas
    const maintenanceStatusQuery = `
      SELECT 
        SUM(CASE WHEN em.nombre = 'En Proceso' THEN 1 ELSE 0 END) as inProgress,
        SUM(CASE WHEN em.nombre = 'Completado' THEN 1 ELSE 0 END) as completedOrders
      FROM mantencion m
      JOIN maquina maq ON m.maquina_id = maq.id
      JOIN estado_mantencion em ON m.estado_mantencion_id = em.id
      WHERE DATE_FORMAT(m.fec_inicio, '%Y-%m') = ?
      ${company ? 'AND maq.compania_id = ?' : ''}
      AND m.isDeleted = 0
    `;

    // Query para costos
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
      overdueReviews: overdueReviews[0].overdueReviews
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
    const { page = 1, limit = 5, company, month, type } = req.query;
    const offset = (page - 1) * limit;

    let whereConditions = ['m.isDeleted = 0'];
    let params = [];

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

    const whereClause = whereConditions.length 
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';

    const query = `
      SELECT 
        m.id as id,
        m.fec_inicio as fecha,
        maq.codigo as vehiculo,
        tm.nombre as tipo,
        em.nombre as estado,
        c.nombre as company,
        m.cost_ser as costos
      FROM mantencion m
      JOIN maquina maq ON m.maquina_id = maq.id
      JOIN compania c ON maq.compania_id = c.id
      JOIN tipo_mantencion tm ON m.tipo_mantencion_id = tm.id
      JOIN estado_mantencion em ON m.estado_mantencion_id = em.id
      ${whereClause}
      ORDER BY m.fec_inicio DESC
      LIMIT ? OFFSET ?
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM mantencion m
      JOIN maquina maq ON m.maquina_id = maq.id
      JOIN compania c ON maq.compania_id = c.id
      JOIN tipo_mantencion tm ON m.tipo_mantencion_id = tm.id
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
