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

    const companyFilter = companiaId ? 'AND m.compania_id = ?' : '';
    if (companiaId) params.push(companiaId);

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
      defaultTypes[type.nombre.toLowerCase()] = 0;
    });

    const maintenanceData = meses.map((mes) => ({
      month: mes,
      ...defaultTypes
    }));

    rows.forEach((row) => {
      const index = row.mes - 1;
      const tipo = row.tipo_mantencion.toLowerCase();
      maintenanceData[index][tipo] = row.total;
    });

    const currentMonth = new Date().getMonth();
    const lastSixMonths = [...maintenanceData.slice(currentMonth - 5, currentMonth + 1)];
    if (lastSixMonths.length < 6) {
      lastSixMonths.unshift(...maintenanceData.slice(-(6 - lastSixMonths.length)));
    }

    res.json({ data: lastSixMonths });
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

    const companyFilter = companiaId ? 'AND b.compania_id = ?' : '';
    if (companiaId) params.push(companiaId);

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
    const { startDate, endDate, companiaId, maquinaId } = req.query;
    const params = [];

    const dateFilter = startDate && endDate ? 
    'AND b.fh_salida BETWEEN ? AND ?' : 
    'AND b.fh_salida >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)';
    
    if (startDate && endDate) {
    params.push(startDate, endDate);
    }

    const companyFilter = companiaId ? 'AND b.compania_id = ?' : '';
    if (companiaId) params.push(companiaId);

    const machineFilter = maquinaId ? 'AND b.maquina_id = ?' : '';
    if (maquinaId) params.push(maquinaId);

    // First, get all tipos_clave
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
    
    // Create default structure with all tipos_clave set to 0
    const defaultTypes = {};
    tiposClaves.forEach(tipo => {
    defaultTypes[tipo.nombre.toLowerCase()] = 0;
    });

    const serviceData = meses.map((mes) => ({
    month: mes,
    ...defaultTypes
    }));

    // Fill in the actual data
    rows.forEach((row) => {
    const index = row.mes - 1;
    const tipo = row.tipo_clave.toLowerCase();
    serviceData[index][tipo] = row.total;
    });

    const currentMonth = new Date().getMonth();
    const lastSixMonthsData = serviceData.slice(currentMonth - 5, currentMonth + 1);
    if (lastSixMonthsData.length < 6) {
    lastSixMonthsData.unshift(...serviceData.slice(-(6 - lastSixMonthsData.length)));
    }

    res.json({ data: lastSixMonthsData });
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

    const companyFilter = companiaId ? 'AND b.compania_id = ?' : '';
    if (companiaId) params.push(companiaId);

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
    const fuelData = meses.map((mes) => ({
      month: mes,
      companias: []
    }));

    rows.forEach((row) => {
      const index = row.mes - 1;
      const companiaData = fuelData[index].companias.find(c => c.name === row.compania);
      if (companiaData) {
        companiaData.litros += row.total_litros;
      } else {
        fuelData[index].companias.push({
          name: row.compania,
          litros: row.total_litros
        });
      }
    });

    const currentMonth = new Date().getMonth();
    const lastSixMonthsData = fuelData.slice(currentMonth - 5, currentMonth + 1);

    res.json({ data: lastSixMonthsData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener los datos de combustible' });
  }
};

export const getCompanyData = async (req, res) => {
  try {
    const { startDate, endDate, companiaId } = req.query;
    const params = [];

    const dateFilter = startDate && endDate ? 
      'AND b.fh_salida BETWEEN ? AND ?' : 
      'AND b.fh_salida >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)';
    
    if (startDate && endDate) {
      params.push(startDate, endDate);
    }

    const companyFilter = companiaId ? 'AND b.compania_id = ?' : '';
    if (companiaId) params.push(companiaId);

    const query = `
      SELECT
        c.nombre AS compania,
        COUNT(DISTINCT b.id) AS total_servicios,
        COUNT(DISTINCT b.maquina_id) AS total_maquinas,
        COUNT(DISTINCT b.personal_id) AS total_personal,
        ROUND(AVG(TIMESTAMPDIFF(MINUTE, b.fh_salida, b.fh_llegada)), 2) AS promedio_minutos_servicio
      FROM
        compania c
      LEFT JOIN bitacora b ON c.id = b.compania_id AND b.isDeleted = 0
      WHERE
        c.isDeleted = 0
        ${dateFilter}
        ${companyFilter}
      GROUP BY
        c.id, c.nombre
      ORDER BY
        total_servicios DESC
    `;

    const [rows] = await pool.query(query, params);

    const companyData = rows.map((row) => ({
      name: row.compania,
      servicios: row.total_servicios,
      maquinas: row.total_maquinas,
      personal: row.total_personal,
      promedioMinutosServicio: row.promedio_minutos_servicio,
      color: "#FF6384" // Asignar un color fijo para cada compañía
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

    const companyFilter = companiaId ? 'AND p.compania_id = ?' : '';
    if (companiaId) params.push(companiaId);

    const machineFilter = maquinaId ? 'AND b.maquina_id = ?' : '';
    if (maquinaId) params.push(maquinaId);

    const query = `
      SELECT
        CONCAT(p.nombre, ' ', p.apellido) AS conductor,
        c.nombre AS compania,
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