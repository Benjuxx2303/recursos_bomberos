import { pool } from "../db.js";

export const getMaintenanceData = async (req, res) => {
  try {
    const { startDate, endDate, companiaId, maquinaId } = req.query;
    const params = [];

    const dateFilter = startDate && endDate ? 
      'AND m.fec_inicio BETWEEN ? AND ?' : 
      'AND m.fec_inicio >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)';
    
    if (startDate && endDate) {
      params.push(startDate, endDate);
    }

    // Si hay un filtro de compañía desde el middleware, lo usamos
    const companyFilter = req.companyFilter ? 'AND b.compania_id = ?' : companiaId ? 'AND b.compania_id = ?' : '';
    if (req.companyFilter) {
      params.push(req.companyFilter);
    } else if (companiaId) {
      params.push(companiaId);
    }

    const machineFilter = maquinaId ? 'AND m.maquina_id = ?' : '';
    if (maquinaId) params.push(maquinaId);

    // First, get all maintenance types
    const [maintenanceTypes] = await pool.query(
      'SELECT nombre FROM tipo_mantencion WHERE isDeleted = 0'
    );

    const query = `
      SELECT
        MONTH(m.fec_inicio) AS mes,
        tm.nombre AS tipo_mantencion,
        COUNT(*) AS total
      FROM
        mantencion m
      INNER JOIN tipo_mantencion tm ON m.tipo_mantencion_id = tm.id
      INNER JOIN bitacora b ON m.bitacora_id = b.id
      INNER JOIN compania c ON b.compania_id = c.id
      WHERE
        m.isDeleted = 0
        ${dateFilter}
        ${companyFilter}
        ${machineFilter}
      GROUP BY
        mes, tipo_mantencion
      ORDER BY
        mes
    `;

    const [rows] = await pool.query(query, params);

    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const defaultTypes = {};
    maintenanceTypes.forEach(type => {
      if (type.nombre) {
        defaultTypes[type.nombre.toLowerCase()] = 0;
      }
    });

    const today = new Date();
    const currentMonth = today.getMonth();
    const monthsArray = [];
    
    for (let i = 5; i >= 0; i--) {
      let monthIndex = currentMonth - i;
      if (monthIndex < 0) {
        monthIndex = 12 + monthIndex;
      }
      monthsArray.push({
        month: meses[monthIndex],
        ...defaultTypes
      });
    }

    rows.forEach((row) => {
      const monthIndex = monthsArray.findIndex(
        item => item.month === meses[row.mes - 1]
      );
      if (monthIndex !== -1) {
        const tipo = row.tipo_mantencion ? row.tipo_mantencion.toLowerCase() : null;
        if (tipo && monthsArray[monthIndex].hasOwnProperty(tipo)) {
          monthsArray[monthIndex][tipo] = row.total;
        }
      }
    });

    res.json({ data: monthsArray });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener los datos de mantención' });
  }
};

export const getServiceData = async (req, res) => {
  try {
    const { startDate, endDate, companiaId, maquinaId } = req.query;
    const params = [];

    const dateFilter = startDate && endDate ? 
      'AND b.fh_salida BETWEEN ? AND ?' : 
      'AND b.fh_salida >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)';
    
    if (startDate && endDate) {
      params.push(startDate, endDate);
    }

    // Si hay un filtro de compañía desde el middleware, lo usamos
    const companyFilter = req.companyFilter ? 'AND b.compania_id = ?' : companiaId ? 'AND b.compania_id = ?' : '';
    if (req.companyFilter) {
      params.push(req.companyFilter);
    } else if (companiaId) {
      params.push(companiaId);
    }

    const machineFilter = maquinaId ? 'AND b.maquina_id = ?' : '';
    if (maquinaId) params.push(maquinaId);

    const query = `
      SELECT
        MONTH(b.fh_salida) AS mes,
        tc.nombre AS tipo_clave,
        COUNT(*) AS total
      FROM
        bitacora b
      INNER JOIN clave c ON b.clave_id = c.id
      INNER JOIN tipo_clave tc ON c.tipo_clave_id = tc.id
      WHERE
        b.isDeleted = 0
        ${dateFilter}
        ${companyFilter}
        ${machineFilter}
      GROUP BY
        mes, tipo_clave
      ORDER BY
        mes
    `;

    const [rows] = await pool.query(query, params);

    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const serviceData = meses.map((mes) => ({
      month: mes,
      incendios: 0,
      rescates: 0,
      otros: 0,
    }));

    rows.forEach((row) => {
      const index = row.mes - 1;
      const tipo = row.tipo_servicio.toLowerCase();
      if (tipo === 'incendio') {
        serviceData[index].incendios = row.total;
      } else if (tipo === 'rescate') {
        serviceData[index].rescates = row.total;
      } else {
        serviceData[index].otros += row.total;
      }
    });

    res.json(serviceData.slice(0, 6));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener los datos de servicios' });
  }
};

export const getServiceDataWithClaves = async (req, res) => {
  try {
    const { startDate, endDate, companiaId, maquinaId, soloTotal } = req.query;
    const params = [];

    const dateFilter = startDate && endDate ? 
      'AND b.fh_salida BETWEEN ? AND ?' : 
      'AND b.fh_salida >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)';
    
    if (startDate && endDate) {
      params.push(startDate, endDate);
    }

    const companyFilter = req.companyFilter ? 'AND b.compania_id = ?' : companiaId ? 'AND b.compania_id = ?' : '';
    if (req.companyFilter) {
      params.push(req.companyFilter);
    } else if (companiaId) {
      params.push(companiaId);
    }

    const machineFilter = maquinaId ? 'AND b.maquina_id = ?' : '';
    if (maquinaId) params.push(maquinaId);

    // Función auxiliar para convertir a camelCase
    const toCamelCase = (str) => {
      return str
        .toLowerCase()
        .replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase())
        .replace(/[^a-zA-Z0-9]/g, '');
    };

    // Query para obtener totales por mes
    const totalQuery = `
      SELECT
        MONTH(b.fh_salida) AS mes,
        COUNT(*) AS total
      FROM
        bitacora b
      WHERE
        b.isDeleted = 0
        ${dateFilter}
        ${companyFilter}
        ${machineFilter}
      GROUP BY
        mes
      ORDER BY
        mes
    `;

    const [totalRows] = await pool.query(totalQuery, params);

    // Si solo se solicitan totales, retornamos solo eso
    if (soloTotal === 'true') {
      const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const today = new Date();
      const currentMonth = today.getMonth();
      const monthsArray = [];
      
      for (let i = 5; i >= 0; i--) {
        let monthIndex = currentMonth - i;
        if (monthIndex < 0) {
          monthIndex = 12 + monthIndex;
        }
        monthsArray.push({
          month: meses[monthIndex],
          total: 0
        });
      }

      totalRows.forEach((row) => {
        const monthIndex = monthsArray.findIndex(
          item => item.month === meses[row.mes - 1]
        );
        if (monthIndex !== -1) {
          monthsArray[monthIndex].total = row.total;
        }
      });

      return res.json({ data: monthsArray });
    }

    // Si no es solo total, continuamos con la lógica original
    const [tiposClaves] = await pool.query(
      'SELECT id, nombre FROM tipo_clave WHERE isDeleted = 0'
    );

    const query = `
      SELECT
        MONTH(b.fh_salida) AS mes,
        tc.nombre AS tipo_clave,
        COUNT(*) AS total
      FROM
        bitacora b
        INNER JOIN clave c ON b.clave_id = c.id
        INNER JOIN tipo_clave tc ON c.tipo_clave_id = tc.id
      WHERE
        b.isDeleted = 0
        ${dateFilter}
        ${companyFilter}
        ${machineFilter}
      GROUP BY
        mes, tc.nombre
      ORDER BY
        mes
    `;

    const [rows] = await pool.query(query, params);

    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    
    const defaultTypes = {};
    tiposClaves.forEach(tipo => {
      if (tipo.nombre) {
        defaultTypes[toCamelCase(tipo.nombre)] = 0;
      }
    });

    const today = new Date();
    const currentMonth = today.getMonth();
    const monthsArray = [];
    
    for (let i = 5; i >= 0; i--) {
      let monthIndex = currentMonth - i;
      if (monthIndex < 0) {
        monthIndex = 12 + monthIndex;
      }
      monthsArray.push({
        month: meses[monthIndex],
        total: 0,
        ...defaultTypes
      });
    }

    // Asignar totales por mes
    totalRows.forEach((row) => {
      const monthIndex = monthsArray.findIndex(
        item => item.month === meses[row.mes - 1]
      );
      if (monthIndex !== -1) {
        monthsArray[monthIndex].total = row.total;
      }
    });

    // Asignar totales por tipo
    rows.forEach((row) => {
      const monthIndex = monthsArray.findIndex(
        item => item.month === meses[row.mes - 1]
      );
      if (monthIndex !== -1) {
        const tipo = row.tipo_clave ? toCamelCase(row.tipo_clave) : null;
        if (tipo && monthsArray[monthIndex].hasOwnProperty(tipo)) {
          monthsArray[monthIndex][tipo] = row.total;
        }
      }
    });

    res.json({ data: monthsArray });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener los datos de servicios' });
  }
};

export const getFuelData = async (req, res) => {
  try {
    const { startDate, endDate, companiaId, maquinaId } = req.query;
    const params = [];

    const dateFilter = startDate && endDate ? 
      'AND b.fh_salida BETWEEN ? AND ?' : 
      'AND b.fh_salida >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)';
    
    if (startDate && endDate) {
      params.push(startDate, endDate);
    }

    // Si hay un filtro de compañía desde el middleware, lo usamos
    const companyFilter = req.companyFilter ? 'AND b.compania_id = ?' : companiaId ? 'AND b.compania_id = ?' : '';
    if (req.companyFilter) {
      params.push(req.companyFilter);
    } else if (companiaId) {
      params.push(companiaId);
    }

    const machineFilter = maquinaId ? 'AND b.maquina_id = ?' : '';
    if (maquinaId) params.push(maquinaId);

    const query = `
      SELECT
        MONTH(b.fh_salida) AS mes,
        c.nombre AS compania,
        SUM(cc.litros) AS total_litros,
        COUNT(DISTINCT b.id) as total_servicios,
        ROUND(SUM(cc.litros)/COUNT(DISTINCT b.id), 2) as promedio_litros_servicio
      FROM
        carga_combustible cc
      INNER JOIN bitacora b ON cc.bitacora_id = b.id
      INNER JOIN compania c ON b.compania_id = c.id
      WHERE
        cc.isDeleted = 0
        ${dateFilter}
        ${companyFilter}
        ${machineFilter}
      GROUP BY
        mes, compania
      ORDER BY
        mes, total_litros DESC
    `;

    const [rows] = await pool.query(query, params);

    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    
    const today = new Date();
    const currentMonth = today.getMonth();
    const monthsArray = [];
    
    for (let i = 5; i >= 0; i--) {
      let monthIndex = currentMonth - i;
      if (monthIndex < 0) {
        monthIndex = 12 + monthIndex;
      }
      monthsArray.push({
        month: meses[monthIndex],
        companias: []
      });
    }

    rows.forEach((row) => {
      const monthIndex = monthsArray.findIndex(
        item => item.month === meses[row.mes - 1]
      );
      if (monthIndex !== -1) {
        const companiaData = monthsArray[monthIndex].companias.find(c => c.name === row.compania);
        if (companiaData) {
          companiaData.litros += row.total_litros;
        } else {
          monthsArray[monthIndex].companias.push({
            name: row.compania,
            litros: row.total_litros
          });
        }
      }
    });

    res.json({ data: monthsArray });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener los datos de combustible' });
  }
};

//Datos del ultimo mes
export const getCompanyData = async (req, res) => {
  try {
    const { startDate, endDate, companiaId } = req.query;
    const params = [];

    let query = `
      SELECT
        c.nombre AS compania,
        COALESCE(COUNT(DISTINCT CASE WHEN b.id IS NOT NULL THEN b.id END), 0) AS total_servicios,
        COALESCE(COUNT(DISTINCT CASE WHEN b.maquina_id IS NOT NULL THEN b.maquina_id END), 0) AS total_maquinas,
        COALESCE(COUNT(DISTINCT CASE WHEN b.personal_id IS NOT NULL THEN b.personal_id END), 0) AS total_personal,
        COALESCE(ROUND(AVG(CASE 
          WHEN b.fh_salida IS NOT NULL AND b.fh_llegada IS NOT NULL AND b.fh_llegada > b.fh_salida
          THEN ABS(TIMESTAMPDIFF(MINUTE, b.fh_salida, b.fh_llegada))
          END), 2), 0) AS promedio_minutos_servicio
      FROM
        compania c
      LEFT JOIN bitacora b ON c.id = b.compania_id AND b.isDeleted = 0
    `;

    // Condición para el rango de fechas
    if (startDate && endDate) {
      query += ' AND b.fh_salida BETWEEN ? AND ?';
      params.push(startDate, endDate);
    } else {
      query += ' AND (b.fh_salida >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH) OR b.fh_salida IS NULL)';
    }

    // Si hay un filtro de compañía desde el middleware, lo usamos
    if (req.companyFilter) {
      query += ' AND c.id = ?';
      params.push(req.companyFilter);
    } else if (companiaId) {
      query += ' AND c.id = ?';
      params.push(companiaId);
    }

    query += `
      WHERE
        c.isDeleted = 0
      GROUP BY
        c.id, c.nombre
      ORDER BY
        total_servicios DESC, c.nombre ASC
    `;

    const [rows] = await pool.query(query, params);

    const companyData = rows.map((row) => ({
      name: row.compania,
      servicios: row.total_servicios,
      maquinas: row.total_maquinas,
      personal: row.total_personal,
      promedioMinutosServicio: row.promedio_minutos_servicio,
      color: "#FF6384"
    }));

    res.json({ data: companyData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener los datos de compañías' });
  }
};

export const getDriverData = async (req, res) => {
  try {
    const { startDate, endDate, companiaId, maquinaId } = req.query;
    const params = [];

    const dateFilter = startDate && endDate ? 
      'AND b.fh_salida BETWEEN ? AND ?' : 
      'AND b.fh_salida >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)';
    
    if (startDate && endDate) {
      params.push(startDate, endDate);
    }

    // Si hay un filtro de compañía desde el middleware, lo usamos
    const companyFilter = req.companyFilter ? 'AND p.compania_id = ?' : companiaId ? 'AND p.compania_id = ?' : '';
    if (req.companyFilter) {
      params.push(req.companyFilter);
    } else if (companiaId) {
      params.push(companiaId);
    }

    const machineFilter = maquinaId ? 'AND b.maquina_id = ?' : '';
    if (maquinaId) params.push(maquinaId);

    const query = `
      SELECT
        CONCAT(p.nombre, ' ', p.apellido) AS conductor,
        c.nombre AS compania,
        p.id AS id,
        COUNT(DISTINCT b.id) AS total_servicios,
        COUNT(DISTINCT b.maquina_id) AS maquinas_conducidas,
        ROUND(AVG(TIMESTAMPDIFF(MINUTE, b.fh_salida, b.fh_llegada)), 2) AS promedio_minutos_servicio
      FROM
        personal p
      INNER JOIN bitacora b ON p.id = b.personal_id
      INNER JOIN compania c ON p.compania_id = c.id
      WHERE
        p.isDeleted = 0 AND b.isDeleted = 0
        ${dateFilter}
        ${companyFilter}
        ${machineFilter}
      GROUP BY
        p.id, conductor, c.nombre
      ORDER BY
        total_servicios DESC
    `;

    const [rows] = await pool.query(query, params);

    const driverData = rows.map((row) => ({
      id: row.id,
      nombre: row.conductor,
      compania: row.compania,
      servicios: row.total_servicios,
      maquinasConducidas: row.maquinas_conducidas,
      promedioMinutosServicio: row.promedio_minutos_servicio,
    }));

    res.json({ data: driverData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener los datos de conductores' });
  }
};

export const getSummaryData = async (req, res) => {
  try {
    // Si hay un filtro de compañía desde el middleware, lo usamos en lugar del companiaId del query
    const companiaId = req.companyFilter || req.query.companiaId;

    // Validar que companiaId sea numérico si existe
    if (companiaId && isNaN(companiaId)) {
      return res.status(400).json({
        success: false,
        message: 'El parámetro companiaId debe ser un número válido.'
      });
    }

    const params = [];

    // Si existe companiaId, lo agregamos a las consultas
    if (companiaId) {
      params.push(Number(companiaId));
    }

    // Obtener mantenimientos pendientes y programados
    const [pendingMaintenance] = await pool.query(`
      SELECT COUNT(*) as total 
      FROM mantencion m
      INNER JOIN bitacora b ON m.bitacora_id = b.id
      INNER JOIN compania c ON b.compania_id = c.id
      WHERE m.isDeleted = 0 
      AND (
        m.estado_mantencion_id IN (
          SELECT id FROM estado_mantencion 
          WHERE nombre LIKE '%Programada%' AND isDeleted = 0
        )
        OR m.fec_inicio > CURRENT_DATE()
      )
      ${companiaId ? 'AND b.compania_id = ?' : ''}
    `, params);
    const pendingMaintenanceTotal = pendingMaintenance[0] ? pendingMaintenance[0].total : 0;

    // Obtener servicios del mes actual
    const [servicesThisMonth] = await pool.query(`
      SELECT COUNT(*) as total
      FROM bitacora b 
      WHERE b.isDeleted = 0
      AND MONTH(b.fh_salida) = MONTH(CURRENT_DATE())
      AND YEAR(b.fh_salida) = YEAR(CURRENT_DATE())
      ${companiaId ? 'AND b.compania_id = ?' : ''}
    `, params);
    const servicesThisMonthTotal = servicesThisMonth[0] ? servicesThisMonth[0].total : 0;

    // Obtener consumo total de combustible del mes actual relacionado con bitácora
    const [fuelConsumption] = await pool.query(`
      SELECT COALESCE(SUM(cc.litros), 0) as total
      FROM carga_combustible cc
      INNER JOIN bitacora b ON cc.bitacora_id = b.id
      WHERE cc.isDeleted = 0 
      AND b.isDeleted = 0
      AND MONTH(b.fh_salida) = MONTH(CURRENT_DATE())
      AND YEAR(b.fh_salida) = YEAR(CURRENT_DATE())
      ${companiaId ? 'AND b.compania_id = ?' : ''}
    `, params);
    const fuelConsumptionTotal = fuelConsumption[0]?.total ?? 0;

    // Obtener total de compañías
    const [totalCompanies] = await pool.query(`
      SELECT COUNT(*) as total
      FROM compania
      WHERE isDeleted = 0
      ${companiaId ? 'AND id = ?' : ''}
    `, params);
    const totalCompaniesTotal = totalCompanies[0] ? totalCompanies[0].total : 0;

    // Obtener conductores activos (rol Maquinista y no eliminados)
    const [activeDrivers] = await pool.query(`
      SELECT COUNT(DISTINCT p.id) as total
      FROM personal p
      INNER JOIN rol_personal rp ON p.rol_personal_id = rp.id
      WHERE p.isDeleted = 0
      AND rp.nombre = 'Maquinista'
      ${companiaId ? 'AND p.compania_id = ?' : ''}
    `, params);
    const activeDriversTotal = activeDrivers[0] ? activeDrivers[0].total : 0;

    const summaryData = {
      pendingMaintenance: pendingMaintenanceTotal,
      servicesThisMonth: servicesThisMonthTotal,
      fuelConsumption: fuelConsumptionTotal,
      totalCompanies: totalCompaniesTotal,
      activeDrivers: activeDriversTotal
    };

    res.json({ success: true, data: summaryData });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener los datos de resumen',
      error: error.message 
    });
  }
};
