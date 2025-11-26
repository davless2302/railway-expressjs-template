import { pool } from "../Database/database.js";

/**
 * Main endpoint handler for financial data
 * GET /api/financialData?period=week|month|quarter|year|custom&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
const getFinancialData = async (req, res) => {
  try {
    const { period, startDate, endDate } = req.query;

    // Validate period parameter
    const validPeriods = ["week", "month", "quarter", "year", "custom"];
    if (!period || !validPeriods.includes(period)) {
      return res.status(400).json({
        error: "Invalid period parameter",
        message: "Period must be one of: week, month, quarter, year, custom",
      });
    }

    // Validate custom period dates
    if (period === "custom") {
      if (!startDate || !endDate) {
        return res.status(400).json({
          error: "Missing date parameters",
          message: "Custom period requires both startDate and endDate",
        });
      }
    }

    // Calculate date range based on period
    const dateRange = calculateDateRange(period, startDate, endDate);

    // Generate labels for the period
    const labels = generateLabels(period, dateRange.startDate, dateRange.endDate);

    // Fetch data from database
    const sql = `
      SELECT 
        c.id,
        c.nGuia,
        c.fechaSalida,
        c.costo as ingreso,
        c.estado,
        c.pCombustible,
        c.pPeajes,
        c.pagoConductor,
        c.viaticos,
        c.otros,
        (c.pCombustible + c.pPeajes + c.pagoConductor + c.viaticos + c.otros) as gastoTotal,
        c.Equipo,
        c.idEquipo,
        c.tipoCarga,
        ch.fullName as conductor,
        cl.razonSocial as clienteCategoria
      FROM carga c
      LEFT JOIN choferes ch ON c.idConductor = ch.id
      LEFT JOIN clients cl ON c.idClient = cl.id
      WHERE c.estado IN ('PC', 'O', 'C')
        AND c.fechaSalida BETWEEN ? AND ?
      ORDER BY c.fechaSalida
    `;

    const [rawData] = await pool.query(sql, [dateRange.startDate, dateRange.endDate]);

    // Process and aggregate data
    const response = processFinancialData(
      rawData,
      period,
      dateRange,
      labels
    );

    res.json(response);
  } catch (error) {
    console.error("Error in getFinancialData:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
    });
  }
};

/**
 * Calculate date range based on period type
 */
const calculateDateRange = (period, customStartDate, customEndDate) => {
  const now = new Date();
  let startDate, endDate;

  switch (period) {
    case "week":
      // Last 7 days
      endDate = new Date(now);
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 6);
      break;

    case "month":
      // Current month
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      break;

    case "quarter":
      // Current quarter
      const currentQuarter = Math.floor(now.getMonth() / 3);
      startDate = new Date(now.getFullYear(), currentQuarter * 3, 1);
      endDate = new Date(now.getFullYear(), (currentQuarter + 1) * 3, 0);
      break;

    case "year":
      // Current year
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31);
      break;

    case "custom":
      startDate = new Date(customStartDate);
      endDate = new Date(customEndDate);
      break;
  }

  // Format dates as YYYY-MM-DD
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  return {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
    label: generatePeriodLabel(period, startDate, endDate),
  };
};

/**
 * Generate human-readable label for period
 */
const generatePeriodLabel = (period, startDate, endDate) => {
  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  switch (period) {
    case "week":
      return `Semana del ${startDate.getDate()} ${monthNames[startDate.getMonth()]}`;
    case "month":
      return `${monthNames[startDate.getMonth()]} ${startDate.getFullYear()}`;
    case "quarter":
      const quarter = Math.floor(startDate.getMonth() / 3) + 1;
      return `Q${quarter} ${startDate.getFullYear()}`;
    case "year":
      return `Año ${startDate.getFullYear()}`;
    case "custom":
      return `${startDate.getDate()} ${monthNames[startDate.getMonth()]} - ${endDate.getDate()} ${monthNames[endDate.getMonth()]} ${endDate.getFullYear()}`;
    default:
      return "";
  }
};

/**
 * Generate labels for chart axes based on period
 */
const generateLabels = (period, startDateStr, endDateStr) => {
  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);

  switch (period) {
    case "week":
      return ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

    case "month":
      // Generate week labels
      const weeks = Math.ceil((endDate.getDate()) / 7);
      return Array.from({ length: weeks }, (_, i) => `Sem ${i + 1}`);

    case "quarter":
      // Generate month labels for the quarter
      const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
      const startMonth = startDate.getMonth();
      return [
        monthNames[startMonth],
        monthNames[startMonth + 1],
        monthNames[startMonth + 2]
      ];

    case "year":
      return ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

    case "custom":
      // For custom, generate appropriate labels based on duration
      const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      if (daysDiff <= 7) {
        return ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].slice(0, daysDiff + 1);
      } else if (daysDiff <= 31) {
        const weeks = Math.ceil(daysDiff / 7);
        return Array.from({ length: weeks }, (_, i) => `Sem ${i + 1}`);
      } else {
        const months = Math.ceil(daysDiff / 30);
        return Array.from({ length: months }, (_, i) => `Mes ${i + 1}`);
      }

    default:
      return [];
  }
};

/**
 * Process raw data and create response structure
 */
const processFinancialData = (rawData, period, dateRange, labels) => {
  // Initialize response structure
  const response = {
    period: {
      type: period,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      label: dateRange.label,
    },
    summary: {
      totalIngresos: 0,
      totalGastos: 0,
      utilidad: 0,
      utilidadPorcentaje: 0,
    },
    ingresos: {
      total: {
        labels: labels,
        data: Array(labels.length).fill(0),
        Pendiente: {
          labels: labels,
          data: Array(labels.length).fill(0),
        },
      },
      porCategoria: [],
    },
    gastos: {
      total: {
        labels: labels,
        data: Array(labels.length).fill(0),
      },
      detallado: [],
      porCategoria: [],
    },
    utilidad: {
      labels: labels,
      data: Array(labels.length).fill(0),
      margenPorcentaje: Array(labels.length).fill(0),
    },
    count: {
      dataset: {
        labels: labels,
        data: Array(labels.length).fill(0),
      },
      cargasPendientes: 0,
      porGandola: [],
    },
  };

  // If no data, return empty structure with zeros
  if (!rawData || rawData.length === 0) {
    return response;
  }

  // Calculate summary totals
  let totalIngresos = 0;
  let totalGastos = 0;
  let totalIngresosPendientes = 0;
  let totalCargasPendientes = 0;

  const categoriaIngresos = {};
  const categoriaGastos = {
    Combustible: 0,
    Peajes: 0,
    Salarios: 0,
    Viaticos: 0,
    Otros: 0,
  };
  const vehicleData = {};

  rawData.forEach((row) => {
    const ingreso = parseFloat(row.ingreso) || 0;
    const gasto = parseFloat(row.gastoTotal) || 0;

    totalIngresos += ingreso;
    totalGastos += gasto;

    // Track pending income and count
    if (row.estado === "O" || row.estado === "C") {
      totalIngresosPendientes += ingreso;
      totalCargasPendientes += 1;
    }

    // Aggregate by category (using tipoCarga for ingresos)
    const categoria = row.tipoCarga || "Otros";
    categoriaIngresos[categoria] = (categoriaIngresos[categoria] || 0) + ingreso;

    // Aggregate gastos by type
    categoriaGastos.Combustible += parseFloat(row.pCombustible) || 0;
    categoriaGastos.Peajes += parseFloat(row.pPeajes) || 0;
    categoriaGastos.Salarios += parseFloat(row.pagoConductor) || 0;
    categoriaGastos.Viaticos += parseFloat(row.viaticos) || 0;
    categoriaGastos.Otros += parseFloat(row.otros) || 0;

    // Aggregate by vehicle
    const vehicleKey = row.Equipo || "Sin Equipo";
    if (!vehicleData[vehicleKey]) {
      vehicleData[vehicleKey] = {
        codigo: vehicleKey,
        conductor: row.conductor || "Sin Conductor",
        cargas: 0,
        cargasPendientes: 0,
        ingresos: 0,
        ingresosPendientes: 0,
      };
    }
    vehicleData[vehicleKey].cargas += 1;
    vehicleData[vehicleKey].ingresos += ingreso;

    if (row.estado === "O" || row.estado === "C") {
      vehicleData[vehicleKey].cargasPendientes += 1;
      vehicleData[vehicleKey].ingresosPendientes += ingreso;
    }

    // Aggregate by time period for charts
    const labelIndex = getLabelIndex(row.fechaSalida, period, dateRange, labels);
    if (labelIndex >= 0 && labelIndex < labels.length) {
      response.ingresos.total.data[labelIndex] += ingreso;
      response.gastos.total.data[labelIndex] += gasto;
      response.utilidad.data[labelIndex] += (ingreso - gasto);
      response.count.dataset.data[labelIndex] += 1;

      if (row.estado === "O" || row.estado === "C") {
        response.ingresos.total.Pendiente.data[labelIndex] += ingreso;
      }
    }
  });

  // Set total pending loads
  response.count.cargasPendientes = totalCargasPendientes;

  // Calculate summary
  response.summary.totalIngresos = parseFloat(totalIngresos.toFixed(2));
  response.summary.totalGastos = parseFloat(totalGastos.toFixed(2));
  response.summary.utilidad = parseFloat((totalIngresos - totalGastos).toFixed(2));
  response.summary.utilidadPorcentaje = totalIngresos > 0
    ? parseFloat(((response.summary.utilidad / totalIngresos) * 100).toFixed(1))
    : 0;

  // Process ingresos by category
  response.ingresos.porCategoria = Object.entries(categoriaIngresos).map(([categoria, monto]) => ({
    categoria,
    monto: parseFloat(monto.toFixed(2)),
    porcentaje: totalIngresos > 0 ? parseFloat(((monto / totalIngresos) * 100).toFixed(1)) : 0,
  }));

  // Process gastos by category
  response.gastos.porCategoria = Object.entries(categoriaGastos)
    .filter(([_, monto]) => monto > 0)
    .map(([categoria, monto]) => ({
      categoria,
      monto: parseFloat(monto.toFixed(2)),
      porcentaje: totalGastos > 0 ? parseFloat(((monto / totalGastos) * 100).toFixed(1)) : 0,
    }));

  // Process vehicle data
  response.count.porGandola = Object.values(vehicleData).map((vehicle) => ({
    ...vehicle,
    ingresos: parseFloat(vehicle.ingresos.toFixed(2)),
    ingresosPendientes: parseFloat(vehicle.ingresosPendientes.toFixed(2)),
    porcentaje: totalIngresos > 0
      ? parseFloat(((vehicle.ingresos / totalIngresos) * 100).toFixed(1))
      : 0,
  }));

  // Calculate margin percentages for utilidad
  response.utilidad.margenPorcentaje = response.ingresos.total.data.map((ingreso, index) => {
    const gasto = response.gastos.total.data[index];
    return ingreso > 0 ? parseFloat((((ingreso - gasto) / ingreso) * 100).toFixed(1)) : 0;
  });

  // Round all data arrays
  response.ingresos.total.data = response.ingresos.total.data.map(v => parseFloat(v.toFixed(2)));
  response.gastos.total.data = response.gastos.total.data.map(v => parseFloat(v.toFixed(2)));
  response.utilidad.data = response.utilidad.data.map(v => parseFloat(v.toFixed(2)));
  response.ingresos.total.Pendiente.data = response.ingresos.total.Pendiente.data.map(v => parseFloat(v.toFixed(2)));

  // Add detallado for gastos (monthly breakdown)
  if (period === "year" || period === "quarter") {
    const monthlyGastos = {};
    rawData.forEach((row) => {
      const date = new Date(row.fechaSalida);
      const mes = date.getMonth() + 1;
      const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

      if (!monthlyGastos[mes]) {
        monthlyGastos[mes] = {
          mes,
          nombreMes: monthNames[mes - 1],
          GastoTotal: 0,
        };
      }
      monthlyGastos[mes].GastoTotal += parseFloat(row.gastoTotal) || 0;
    });

    response.gastos.detallado = Object.values(monthlyGastos).map(item => ({
      ...item,
      GastoTotal: parseFloat(item.GastoTotal.toFixed(2)),
    }));
  }

  return response;
};

/**
 * Get label index for a given date based on period
 */
const getLabelIndex = (fechaSalida, period, dateRange, labels) => {
  const date = new Date(fechaSalida);
  const startDate = new Date(dateRange.startDate);
  const endDate = new Date(dateRange.endDate);

  switch (period) {
    case "week":
      const dayOfWeek = date.getDay();
      return dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday = 0, Sunday = 6

    case "month":
      const weekOfMonth = Math.floor((date.getDate() - 1) / 7);
      return Math.min(weekOfMonth, labels.length - 1);

    case "quarter":
      const monthInQuarter = date.getMonth() - startDate.getMonth();
      return monthInQuarter;

    case "year":
      return date.getMonth();

    case "custom":
      const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      if (daysDiff <= 7) {
        const dayOfWeek = date.getDay();
        return dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      } else if (daysDiff <= 31) {
        const daysSinceStart = Math.floor((date - startDate) / (1000 * 60 * 60 * 24));
        const weekIndex = Math.floor(daysSinceStart / 7);
        return Math.min(weekIndex, labels.length - 1);
      } else {
        const monthsSinceStart = (date.getFullYear() - startDate.getFullYear()) * 12 +
          (date.getMonth() - startDate.getMonth());
        return Math.min(monthsSinceStart, labels.length - 1);
      }

    default:
      return 0;
  }
};

export const methods = {
  getFinancialData,
};
