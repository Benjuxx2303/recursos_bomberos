import { pool } from "../db.js";

export const getMaintenanceData = async (req, res) => {
  try {
    const query = `
      SELECT
        MONTH(m.fec_inicio) AS mes,
        tm.nombre AS tipo_mantencion,
        COUNT(*) AS total
      FROM
        mantencion m
      INNER JOIN detalle_mantencion dm ON m.id = dm.mantencion_id
      INNER JOIN tipo_mantencion tm ON dm.tipo_mantencion_id = tm.id
      WHERE
        m.isDeleted = 0
      GROUP BY
        mes, tipo_mantencion
      ORDER BY
        mes
    `;

    const [rows] = await pool.query(query);

    // Procesar los datos para ajustarlos al formato requerido
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const maintenanceData = meses.map((mes) => ({
      month: mes,
      preventivo: 0,
      correctivo: 0,
      emergencia: 0,
    }));

    rows.forEach((row) => {
      const index = row.mes - 1;
      const tipo = row.tipo_mantencion.toLowerCase();
      if (tipo === 'preventivo') {
        maintenanceData[index].preventivo = row.total;
      } else if (tipo === 'correctivo') {
        maintenanceData[index].correctivo = row.total;
      } else if (tipo === 'emergencia') {
        maintenanceData[index].emergencia = row.total;
      }
    });

    res.json(maintenanceData.slice(0, 6)); // Solo primeros 6 meses para coincidir con los datos iniciales
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener los datos de mantención' });
  }
};

export const getServiceData = async (req, res) => {
  try {
    const query = `
      SELECT
        MONTH(b.fh_salida) AS mes,
        c.descripcion AS tipo_servicio,
        COUNT(*) AS total
      FROM
        bitacora b
      INNER JOIN clave c ON b.clave_id = c.id
      WHERE
        b.isDeleted = 0
      GROUP BY
        mes, tipo_servicio
      ORDER BY
        mes
    `;

    const [rows] = await pool.query(query);

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

export const getFuelData = async (req, res) => {
  try {
    const query = `
      SELECT
        MONTH(b.fh_salida) AS mes,
        p.nombre AS tipo_combustible,
        SUM(cc.litros) AS total_litros
      FROM
        carga_combustible cc
      INNER JOIN bitacora b ON cc.bitacora_id = b.id
      INNER JOIN maquina m ON b.maquina_id = m.id
      INNER JOIN procedencia p ON m.procedencia_id = p.id
      WHERE
        cc.isDeleted = 0
      GROUP BY
        mes, tipo_combustible
      ORDER BY
        mes
    `;

    const [rows] = await pool.query(query);

    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const fuelData = meses.map((mes) => ({
      month: mes,
      diesel: 0,
      gasolina: 0,
    }));

    rows.forEach((row) => {
      const index = row.mes - 1;
      const tipo = row.tipo_combustible.toLowerCase();
      if (tipo === 'diesel') {
        fuelData[index].diesel = row.total_litros;
      } else if (tipo === 'gasolina') {
        fuelData[index].gasolina = row.total_litros;
      }
    });

    res.json(fuelData.slice(0, 6));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener los datos de combustible' });
  }
};

export const getCompanyData = async (req, res) => {
  try {
    const queryServicios = `
      SELECT
        c.nombre AS compania,
        COUNT(b.id) AS servicios
      FROM
        bitacora b
      INNER JOIN compania c ON b.compania_id = c.id
      WHERE
        b.isDeleted = 0
      GROUP BY
        c.id
    `;

    const queryPersonal = `
      SELECT
        c.nombre AS compania,
        COUNT(p.id) AS personal
      FROM
        personal p
      INNER JOIN compania c ON p.compania_id = c.id
      WHERE
        p.isDeleted = 0
      GROUP BY
        c.id
    `;

    const [serviciosRows] = await pool.query(queryServicios);
    const [personalRows] = await pool.query(queryPersonal);

    const companyData = serviciosRows.map((servicio) => {
      const personal = personalRows.find((p) => p.compania === servicio.compania);
      return {
        name: servicio.compania,
        servicios: servicio.servicios,
        personal: personal ? personal.personal : 0,
      };
    });

    res.json(companyData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener los datos de compañías' });
  }
};

export const getDriverData = async (req, res) => {
  try {
    const query = `
      SELECT
        p.id,
        CONCAT(p.nombre, ' ', p.apellido) AS nombre,
        c.nombre AS compania,
        COUNT(b.id) AS servicios,
        SUM(TIMESTAMPDIFF(HOUR, b.fh_salida, b.fh_llegada)) AS horas
      FROM
        personal p
      INNER JOIN bitacora b ON p.id = b.conductor_id
      INNER JOIN compania c ON p.compania_id = c.id
      WHERE
        p.isDeleted = 0 AND b.isDeleted = 0
      GROUP BY
        p.id
      ORDER BY
        servicios DESC
      LIMIT 5
    `;

    const [rows] = await pool.query(query);

    const driverData = rows.map((row) => ({
      id: row.id,
      nombre: row.nombre,
      compañia: row.compania,
      servicios: row.servicios,
      horas: row.horas,
    }));

    res.json(driverData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener los datos de conductores' });
  }
};