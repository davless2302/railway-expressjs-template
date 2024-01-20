import { pool } from "../Database/database.js";
import { unlink } from "fs/promises"; // Use fs.promises for promises-based API
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getFinancialData = async (req, res) => {
  const year = "2024";
  const sql = `SELECT 
  COALESCE(t1.Mes, t2.Mes) AS Mes,
  COALESCE(SUM(t1.Ingreso_PC), 0) AS IngresosCobrados,
  COALESCE(SUM(t1.Ingreso_O), 0) AS IngresosProgramados,
  COALESCE(SUM(t1.Ingreso_C), 0) AS IngresosPendientes,
  COALESCE(SUM(t1.IngresoTotal), 0) AS IngresoTotal,
  COALESCE(SUM(t2.GastoTotal), 0) AS GastoTotal,
  COALESCE(SUM(t1.ingresoTotal - t2.GastoTotal), 0) AS IngresoNeto,
  COALESCE(SUM(t1.Ingreso_O + t1.Ingreso_C), 0) AS IngresoTotalPendiente,
  COALESCE(ROUND(SUM(((t1.Ingreso_O + t1.Ingreso_C) * 100) / t1.IngresoTotal ), 2), 0) AS PorcetajePendiente
FROM 
  (SELECT 
      MONTH(c.fechaSalida) AS Mes,
      SUM(CASE WHEN c.estado = 'PC' AND YEAR(c.fechaSalida) = ${year} THEN c.costo ELSE 0 END) AS Ingreso_PC,
      SUM(CASE WHEN c.estado = 'O' AND YEAR(c.fechaSalida) = ${year} THEN c.costo ELSE 0 END) AS Ingreso_O,
      SUM(CASE WHEN c.estado = 'C' AND YEAR(c.fechaSalida) = ${year} THEN c.costo ELSE 0 END) AS Ingreso_C,
      SUM(CASE WHEN c.estado IN ('O', 'C', 'PC') AND YEAR(c.fechaSalida) = ${year} THEN c.costo ELSE 0 END) AS ingresoTotal
   FROM 
      carga AS c
   WHERE 
      (c.estado IN ('PC', 'O', 'C')) AND YEAR(c.fechaSalida) = ${year}
   GROUP BY 
      MONTH(c.fechaSalida)) AS t1

RIGHT JOIN

  (SELECT 
      MONTH(c.fechaSalida) AS Mes,
      SUM(CASE WHEN c.estado IN ('O', 'C', 'PC') AND YEAR(c.fechaSalida) = ${year} THEN c.pCombustible + c.pPeajes + c.pagoConductor + c.viaticos + c.otros ELSE 0 END) AS GastoTotal
   FROM 
      carga AS c
   WHERE 
      YEAR(c.fechaSalida) = ${year}
   GROUP BY 
      MONTH(c.fechaSalida)) AS t2

ON t1.Mes = t2.Mes

GROUP BY
  COALESCE(t1.Mes, t2.Mes)

`;
  try {
    const [results] = await pool.query(sql);

    const dataObject = processFinancialData(results);

    res.json(dataObject);
  } catch (error) {
    res.status(500);
    res.send(error.message);
  }
};

const processFinancialData = (result) => {
  const dataSetDate = [];
  const dataSetIngresosCobrados = [];
  const dataSetIngresosPendientes = [];
  const dataSetIngresosProgramados = [];
  const dataSetGastos = [];

  const ingresosCobradosArray = [];
  const ingresosPendientesArray = [];
  const ingresosProgramadosArray = [];
  const gastosArray = [];

  let ingresosCobradosAnterior = 0;
  let ingresosPendientesAnterior = 0;
  let ingresosProgramadosAnterior = 0;
  let gastosAnterior = 0;

  result.forEach((el) => {
    const mes = el.Mes;
    const nombreMes = getMonthName(mes);

    dataSetDate.push(nombreMes);
    dataSetIngresosCobrados.push(el.IngresosCobrados);
    dataSetIngresosPendientes.push(el.IngresosPendientes);
    dataSetIngresosProgramados.push(el.IngresosProgramados);
    dataSetGastos.push(el.GastoTotal);

    const porcentajeIngresosCobrados = compareAndCalculatePercentage(
      el.IngresosCobrados,
      ingresosCobradosAnterior
    );
    const porcentajeIngresosPendientes = compareAndCalculatePercentage(
      el.IngresosPendientes,
      ingresosPendientesAnterior
    );
    const porcentajeIngresosProgramados = compareAndCalculatePercentage(
      el.IngresosProgramados,
      ingresosProgramadosAnterior
    );
    const porcentajeGastos = compareAndCalculatePercentage(
      el.GastoTotal,
      gastosAnterior
    );

    ingresosCobradosAnterior = el.IngresosCobrados;
    ingresosPendientesAnterior = el.IngresosPendientes;
    ingresosProgramadosAnterior = el.IngresosProgramados;
    gastosAnterior = el.GastoTotal;

    ingresosCobradosArray.push({
      mes,
      nombreMes,
      IngresosCobrados: el.IngresosCobrados,
      porcentaje: porcentajeIngresosCobrados,
    });
    ingresosPendientesArray.push({
      mes,
      nombreMes,
      IngresosPendientes: el.IngresosPendientes,
      porcentaje: porcentajeIngresosPendientes,
    });
    ingresosProgramadosArray.push({
      mes,
      nombreMes,
      IngresosProgramados: el.IngresosProgramados,
      porcentaje: porcentajeIngresosProgramados,
    });
    gastosArray.push({
      mes,
      nombreMes,
      GastoTotal: el.GastoTotal,
      porcentaje: porcentajeGastos,
    });
  });

  const dataObject = {
    ingresos: {
      cobrados: {
        detallado: ingresosCobradosArray,
        datasets: {
          labels: dataSetDate,
          data: dataSetIngresosCobrados,
          porcentaje: ingresosCobradosArray.map((entry) => entry.porcentaje),
        },
      },
      pendientes: {
        detallado: ingresosPendientesArray,
        datasets: {
          labels: dataSetDate,
          data: dataSetIngresosPendientes,
          porcentaje: ingresosPendientesArray.map((entry) => entry.porcentaje),
        },
      },
      programados: {
        detallado: ingresosProgramadosArray,
        datasets: {
          labels: dataSetDate,
          data: dataSetIngresosProgramados,
          porcentaje: ingresosProgramadosArray.map((entry) => entry.porcentaje),
        },
      },
    },
    gastos: {
      detallado: gastosArray,
      datasets: {
        labels: dataSetDate,
        data: dataSetGastos,
        porcentaje: gastosArray.map((entry) => entry.porcentaje),
      },
    },
  };

  return dataObject;
};

const compareAndCalculatePercentage = (current, previous) => {
  if (previous === 0 || previous === null) {
    return 0; // El mes anterior es 0, por lo que el porcentaje es 0.
  }

  return ((current - previous) / previous) * 100;
};

const getMonthName = (monthNumber) => {
  const monthNames = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  return monthNames[monthNumber - 1] || "";
};

const getDriver = async (req, res) => {
  const { id } = req.params;
  try {
    const [query1] = await pool.query(
      "SELECT * FROM vehiculos WHERE id = ?",
      id
    );
    res.json(query1);
  } catch (error) {
    res.status(500);
    res.send(error.message);
  }
};

export const methods = {
  getFinancialData,
};
