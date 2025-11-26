import { pool } from "../Database/database.js";

const getFinancialData = async (req, res) => {
  try {
    const year = "2026";
    const sql = `
    SELECT 
    COALESCE(t1.Mes, t2.Mes) AS Mes,
    COALESCE(SUM(t1.Ingreso_PC), 0) AS IngresosCobrados,
    COALESCE(SUM(t1.Ingreso_O), 0) AS IngresosProgramados,
    COALESCE(SUM(t1.Ingreso_C), 0) AS IngresosPendientes,
    COALESCE(SUM(t1.IngresoTotal), 0) AS IngresoTotal,
    COALESCE(SUM(t1.GastoTotal), 0) AS GastoTotal,    
    COALESCE(SUM(t1.IngresoTotal - t1.GastoTotal), 0) AS IngresoNeto,
    COALESCE(SUM(t1.Ingreso_O + t1.Ingreso_C), 0) AS IngresoTotalPendiente,
    COALESCE(ROUND(SUM(t1.Ingreso_O + t1.Ingreso_C) * 100 / NULLIF(SUM(t1.IngresoTotal), 0), 2), 0) AS PorcentajePendiente,
    COALESCE(SUM(t1.Movimiento_PC), 0) AS Movimiento
FROM (
    SELECT 
        MONTH(c.fechaSalida) AS Mes,
        c.estado,
        SUM(CASE WHEN c.estado = 'PC' THEN c.costo ELSE 0 END) AS Ingreso_PC,
        SUM(CASE WHEN c.estado = 'O' THEN c.costo ELSE 0 END) AS Ingreso_O,
        SUM(CASE WHEN c.estado = 'C' THEN c.costo ELSE 0 END) AS Ingreso_C,
        SUM(CASE WHEN c.estado IN ('O','C', 'PC') THEN c.costo ELSE 0 END) AS IngresoTotal,
        SUM(CASE WHEN c.estado IN ('O', 'C', 'PC') THEN 1 ELSE 0 END) AS Movimiento_PC,
        SUM(CASE WHEN c.estado IN ('O', 'C', 'PC') THEN c.pCombustible + c.pPeajes + c.pagoConductor + c.viaticos + c.otros ELSE 0 END) AS GastoTotal
    FROM carga AS c
    WHERE (c.estado IN ('PC', 'O', 'C')) AND YEAR(c.fechaSalida) = ${year}
    GROUP BY MONTH(c.fechaSalida), c.estado
) AS t1
RIGHT JOIN (
    SELECT MONTH(c.fechaSalida) AS Mes       
    FROM carga AS c
    WHERE YEAR(c.fechaSalida) = ${year}
    GROUP BY MONTH(c.fechaSalida)
) AS t2 ON t1.Mes = t2.Mes
GROUP BY COALESCE(t1.Mes, t2.Mes)
ORDER BY Mes;

    `;

    const [results] = await pool.query(sql);
    const dataObject = processFinancialData(results);

    res.json(dataObject);
  } catch (error) {
    res.status(500);
    res.send(error.message);
  }
};

const processFinancialData = (result) => {
  const dataObject = {
    count: { dataset: { labels: [], data: [] } },
    ingresos: {
      cobrados: { detallado: [] },
      pendientes: { detallado: [] },
      programados: { detallado: [] },
      total: {
        labels: [],
        data: [],
        Pendiente: { labels: [], data: [], porcentaje: [] },
      },
    },
    gastos: { detallado: [] },
  };

  let ingresosCobradosAnterior = 0;
  let ingresosPendientesAnterior = 0;
  let ingresosProgramadosAnterior = 0;
  let gastosAnterior = 0;

  result.forEach((el) => {
    const mes = el.Mes;
    const nombreMes = getMonthName(mes);
    const count = el.Movimiento;

    // Procesar ingresos
    processIngresos(
      dataObject,
      el,
      nombreMes,
      mes,
      ingresosCobradosAnterior,
      ingresosPendientesAnterior,
      ingresosProgramadosAnterior,
      count
    );

    // Procesar gastos
    processGastos(dataObject, el, nombreMes, mes, gastosAnterior);

    ingresosCobradosAnterior = el.IngresosCobrados;
    ingresosPendientesAnterior = el.IngresosPendientes;
    ingresosProgramadosAnterior = el.IngresosProgramados;
    gastosAnterior = el.GastoTotal;
  });

  return dataObject;
};

const processIngresos = (
  dataObject,
  el,
  nombreMes,
  mes,
  ingresosCobradosAnterior,
  ingresosPendientesAnterior,
  ingresosProgramadosAnterior
) => {
  dataObject.ingresos.cobrados.detallado.push({
    mes,
    nombreMes,
    IngresosCobrados: el.IngresosCobrados,
    porcentaje: compareAndCalculatePercentage(
      el.IngresosCobrados,
      ingresosCobradosAnterior
    ),
  });

  dataObject.ingresos.pendientes.detallado.push({
    mes,
    nombreMes,
    IngresosPendientes: el.IngresosPendientes,
    porcentaje: compareAndCalculatePercentage(
      el.IngresosPendientes,
      ingresosPendientesAnterior
    ),
  });

  dataObject.ingresos.programados.detallado.push({
    mes,
    nombreMes,
    IngresosProgramados: el.IngresosProgramados,
    porcentaje: compareAndCalculatePercentage(
      el.IngresosProgramados,
      ingresosProgramadosAnterior
    ),
  });
  dataObject.count.dataset.data.push(el.Movimiento);
  dataObject.count.dataset.labels.push(nombreMes);
  dataObject.ingresos.total.labels.push(nombreMes);
  dataObject.ingresos.total.data.push(el.IngresoTotal);
  dataObject.ingresos.total.Pendiente.labels.push(nombreMes);
  dataObject.ingresos.total.Pendiente.data.push(el.IngresoTotalPendiente);
  dataObject.ingresos.total.Pendiente.porcentaje.push(el.PorcentajePendiente);
  console.log(el);
};

const processGastos = (dataObject, el, nombreMes, mes, gastosAnterior) => {
  dataObject.gastos.detallado.push({
    mes,
    nombreMes,
    GastoTotal: el.GastoTotal,
    porcentaje: compareAndCalculatePercentage(el.GastoTotal, gastosAnterior),
  });
};

const compareAndCalculatePercentage = (current, previous) => {
  if (previous === 0 || previous === null) {
    return 0;
  }
  const result = ((current - previous) / previous) * 100;
  return result.toFixed(2);
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

export const methods = {
  getFinancialData,
};
