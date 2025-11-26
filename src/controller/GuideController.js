import { pool } from "../Database/database.js";
import { unlink } from "fs/promises"; // Use fs.promises for promises-based API
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const addGuide = async (req, res) => {
  const {
    guideNumber,
    materialType,
    date,
    costo,
    quantity,
    salida,
    km,
    kmRoute,
    destination,
    equipment,
    pPeajes,
    cPeajes,
    viaticos,
    fuel,
    fuelPayment,
    client,
    conductor,
    pConductor,
  } = req.body;
  const files = req.files || null;
  console.log(equipment.split("|")[0]);
  const deleteFiles = async (files) => {
    if (files && files.length > 0) {
      for (let file of files) {
        const filePath = path.join(
          __dirname,
          "../static/images/guide",
          file.filename
        );

        try {
          await unlink(filePath);
          console.log(`Archivo eliminado: ${filePath}`);
        } catch (unlinkError) {
          console.error(
            `Error al eliminar el archivo: ${filePath}`,
            unlinkError
          );
        }
      }
    }
  };

  try {
    // Verificar campos obligatorios
    const requiredFields = [
      guideNumber,
      km,
      salida,
      viaticos,
      fuel,
      costo,
      kmRoute,
      destination,
      pPeajes,
      cPeajes,
      fuelPayment,
      quantity,
      materialType,
      equipment,
      client,
      conductor,
      pConductor,
    ];

    if (requiredFields.some((field) => !field)) {
      await deleteFiles(files);
      return res.status(400).json({
        status: 400,
        message: "Bad Request - Missing required fields",
      });
    }

    // Construir la sentencia SQL solo si no se sube ningún archivo
    let sql = "";
    let values = [];
    const nGuia = guideNumber;
    const fechaCarga = date;
    const tipoCarga = materialType;
    const kmRuta = kmRoute;
    const kmEquipo = km;
    const idEquipo = equipment.split("|")[1];
    const combustible = fuel;
    const destino = destination;
    const Equipo = equipment.split("|")[0];
    const pCombustible = fuelPayment;
    const costoValue = costo;
    const cantidad = quantity;
    const idClient = client;

    if (!files || (files && files.length === 0)) {
      sql = `
        INSERT INTO carga (nGuia, fechaCarga, tipoCarga, kmRuta, kmEquipo, Equipo, combustible, destino, salida ,idEquipo, pCombustible, costo, cPeajes, pPeajes, viaticos, cantidad, idClient, idConductor, pagoConductor)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      values = [
        nGuia,
        fechaCarga,
        tipoCarga,
        kmRuta,
        kmEquipo,
        Equipo,
        combustible,
        destino,
        salida,
        idEquipo,
        pCombustible,
        costoValue,
        cPeajes,
        pPeajes,
        viaticos,
        cantidad,
        idClient,
        conductor,
        pConductor,
      ];
    }

    // Construir la sentencia SQL si se suben archivos
    // Ajusta los nombres de las columnas de archivos según sea necesario
    if (files && files.length > 0) {
      sql = `
        INSERT INTO carga (nGuia, fechaCarga, tipoCarga, kmRuta, kmEquipo, Equipo, combustible, destino, salida ,idEquipo, pCombustible, costo, cPeajes, pPeajes,viaticos, cantidad, documents, idClient, idConductor, pagoConductor)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?, ?, ?)
      `;
      values = [
        nGuia,
        fechaCarga,
        tipoCarga,
        kmRuta,
        kmEquipo,
        Equipo,
        combustible,
        destino,
        salida,
        idEquipo,
        pCombustible,
        costoValue,
        cPeajes,
        pPeajes,
        viaticos,
        cantidad,
        files.map((file) => file.filename).join(","),
        idClient,
        conductor,
        pConductor,
      ];
    }

    const result = await pool.execute(sql, values);
    // Enviar respuesta de éxito
    res
      .status(200)
      .json({ status: 200, message: "Material Ingresado Exitosamente" });
  } catch (error) {
    console.log(error);
    await deleteFiles(files);
    if (error.code === "ER_DUP_ENTRY") {
      if (error.sqlMessage.includes("nGuia")) {
        return res.status(400).json({ message: "Numero de Guia Existente" });
      }
      return res.status(400).json({ message: "Error desconocido" });
    }

    res.status(500).json({ status: 500, message: "Internal Server Error" });
  }
};
const getGuideAll = async (req, res) => {
  try {
    const [result] = await pool.query(
      "SELECT c.id, c.nGuia, c.fechaCarga, c.tipoCarga, c.cantidad, c.costo, c.estado, c.Equipo, cl.razonSocial AS client FROM carga AS c INNER JOIN clients AS cl ON c.idClient = cl.id"
    );
    res.json(result);
  } catch (error) {
    console.log(error);
  }
};
const getGuide = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query(
      `SELECT c.id, c.nGuia, c.fechaCarga, c.fechaSalida, c.fechaLlegada, c.tipoCarga, c.cantidad, c.otros, c.salida, c.destino, c.kmRuta, c.kmEquipo, c.kmEquipoDestino, c.combustible, c.pCombustible, c.CombustibleDestino, cPeajes, pPeajes, c.viaticos , c.documents,  c.costo, c.estado, c.Equipo, c.pagoConductor, cl.alias as ClientPerson ,  cl.razonSocial AS client, cl.phone, cf.fullName AS conductor, cf.tlf AS tlfConductor FROM carga AS c INNER JOIN clients AS cl ON c.idClient = cl.id INNER JOIN choferes AS cf ON c.idConductor = cf.id WHERE c.nGuia= ${id} `
    );
    // console.log(result);
    res.json(result);
  } catch (error) {
    console.log(error);
  }
};
const UpdateGuide = async (req, res) => {
  const { estado } = req.body;
  const getIncomingFiles = (req) => {
    // Prefer multer files (objects), otherwise accept an array of filenames in req.body.files
    if (req.files && req.files.length > 0) return req.files;
    if (Array.isArray(req.body.files) && req.body.files.length > 0) {
      // normalize to objects with filename property
      return req.body.files.map((name) => ({ filename: name }));
    }
    return null;
  };

  const getField = (req, nameVariants) => {
    for (let n of nameVariants) {
      if (req.body && typeof req.body[n] !== 'undefined' && req.body[n] !== null) return req.body[n];
      if (req.query && typeof req.query[n] !== 'undefined' && req.query[n] !== null) return req.query[n];
      if (req.params && typeof req.params[n] !== 'undefined' && req.params[n] !== null) return req.params[n];
    }
    return undefined;
  };

  const deleteFiles = async (files) => {
    if (!files || files.length === 0) return;
    for (let file of files) {
      if (!file || !file.filename) continue;
      const filePath = path.join(__dirname, "../static/images/guide", file.filename);
      try {
        await unlink(filePath);
        console.log(`Archivo eliminado: ${filePath}`);
      } catch (err) {
        console.error(`Error al eliminar el archivo: ${filePath}`, err);
      }
    }
  };

  // Step 1 (departure): app may send estado = 'O' (or legacy 'P')
  if (estado === "P") {
    const nGuia = getField(req, ['nGuia', 'nguia', 'n_guia']);
    const fechaSalida = getField(req, ['fechaSalida', 'fecha_salida', 'fechaSalida']);
    const combustible = getField(req, ['combustible']);
    const peaje = getField(req, ['peaje']);
    const viaticos = getField(req, ['viaticos']);
    const otros = getField(req, ['otros']);
    const files = getIncomingFiles(req);
    try {
      if (!nGuia || !fechaSalida) {
        return res.status(400).json({ message: "Solicitud incorrecta: falta nGuia o fechaSalida" });
      }

      const selectSql = "SELECT documents, viaticos, pPeajes, otros, pCombustible FROM carga WHERE nGuia = ?";
      const [data] = await pool.query(selectSql, [nGuia]);
      if (!data || data.length === 0) return res.status(404).json({ message: "Guía no encontrada" });

      let combinedDocuments = data[0].documents;
      const currentPCombustible = parseFloat(data[0].pCombustible || 0);
      const currentViaticos = parseFloat(data[0].viaticos || 0);
      const currentPPeajes = parseFloat(data[0].pPeajes || 0);
      const currentOtros = parseFloat(data[0].otros || 0);

      const addCombustible = parseFloat(combustible || 0);
      const addViaticos = parseFloat(viaticos || 0);
      const addPeaje = parseFloat(peaje || 0);
      const addOtros = parseFloat(otros || 0);

      const newCombustible = currentPCombustible + addCombustible;
      const newViaticos = currentViaticos + addViaticos;
      const newPeaje = currentPPeajes + addPeaje;
      const newOtros = currentOtros + addOtros;

      if (files && files.length > 0) {
        combinedDocuments = combinedDocuments
          ? combinedDocuments + "," + files.map((f) => f.filename).join(",")
          : files.map((f) => f.filename).join(",");
      }

      const updateSql = "UPDATE carga SET fechaSalida = ?, documents = ?, pCombustible = ?, viaticos = ?, pPeajes = ?, otros = ?, estado = 'O' WHERE nGuia = ?";
      await pool.query(updateSql, [fechaSalida, combinedDocuments, newCombustible, newViaticos, newPeaje, newOtros, nGuia]);

      res.status(200).json({ message: "Guía actualizada correctamente" });
    } catch (error) {
      console.log(error);
      if (files) await deleteFiles(files);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  }

  // Step 2 (arrival): app may send estado = 'C'
  else if (estado === "O") {
    const nGuia = getField(req, ['nGuia', 'nguia', 'n_guia']);
    const fechaLlegada = getField(req, ['fechaLlegada', 'fecha_llegada']);
    const kmDestino = getField(req, ['kmDestino', 'km_destino']);
    const CombustibleDestino = getField(req, ['CombustibleDestino', 'combustibleDestino', 'combustible_destino']);
    const combustible = getField(req, ['combustible']);
    const peaje = getField(req, ['peaje']);
    const viaticos = getField(req, ['viaticos']);
    const otros = getField(req, ['otros']);
    const files = getIncomingFiles(req);

    try {
      if (!nGuia) {
        return res.status(400).json({ message: "Solicitud incorrecta: falta nGuia" });
      }

      const selectSql = "SELECT documents, idEquipo, pCombustible, pPeajes, otros, viaticos, kmEquipoDestino, CombustibleDestino FROM carga WHERE nGuia = ?";
      const [currentData] = await pool.query(selectSql, [nGuia]);
      if (!currentData || currentData.length === 0) return res.status(404).json({ message: "Guía no encontrada" });

      let combinedDocuments = currentData[0].documents;
      const currentPCombustible = parseFloat(currentData[0].pCombustible || 0);
      const currentPPeajes = parseFloat(currentData[0].pPeajes || 0);
      const currentViaticos = parseFloat(currentData[0].viaticos || 0);
      const currentOtros = parseFloat(currentData[0].otros || 0);

      const addCombustible = parseFloat(combustible || 0);
      const addPeaje = parseFloat(peaje || 0);
      const addViaticos = parseFloat(viaticos || 0);
      const addOtros = parseFloat(otros || 0);

      const newCombustible = currentPCombustible + addCombustible;
      const newPeaje = currentPPeajes + addPeaje;
      const newViaticos = currentViaticos + addViaticos;
      const newOtros = currentOtros + addOtros;

      if (files && files.length > 0) {
        combinedDocuments = combinedDocuments
          ? combinedDocuments + "," + files.map((f) => f.filename).join(",")
          : files.map((f) => f.filename).join(",");
      }

      // Obtener el ID del vehículo asociado al equipo
      const query = "SELECT idVehiculo FROM equipos WHERE id = ?";
      const [result] = await pool.query(query, [currentData[0].idEquipo]);
      if (!result || result.length === 0) return res.status(404).json({ message: "Equipo no encontrado" });

      // Obtener el kilometraje actual del vehículo
      const query2 = "SELECT km FROM cars WHERE id = ?";
      const [result2] = await pool.query(query2, [result[0].idVehiculo]);
      if (!result2 || result2.length === 0) return res.status(404).json({ message: "Vehículo no encontrado" });

      // If kmDestino provided, validate it; otherwise keep existing kmEquipoDestino
      const hasKmDestino = typeof kmDestino !== 'undefined' && kmDestino !== null && kmDestino !== '';
      if (hasKmDestino) {
        if (parseFloat(kmDestino) < parseFloat(result2[0].km)) {
          return res.status(400).json({ message: "El Kilometraje es Menor al Ingresado en Sistema (" + result2[0].km + " km)" });
        }
      }

      // Use existing values when specific fields are not provided
      const kmToUpdate = hasKmDestino ? kmDestino : currentData[0].kmEquipoDestino;
      const combustibleDestinoToUpdate = (typeof CombustibleDestino !== 'undefined' && CombustibleDestino !== null && CombustibleDestino !== '') ? CombustibleDestino : currentData[0].CombustibleDestino;

      const updateSql = "UPDATE carga SET fechaLlegada = ?, kmEquipoDestino = ?, CombustibleDestino = ?, documents = ?, pCombustible = ?, pPeajes = ?, viaticos = ?, otros = ?, estado = 'C' WHERE nGuia = ?";
      await pool.query(updateSql, [fechaLlegada, kmToUpdate, combustibleDestinoToUpdate, combinedDocuments, newCombustible, newPeaje, newViaticos, newOtros, nGuia]);

      // Actualizar el kilometraje del vehículo sólo si se recibió kmDestino
      if (hasKmDestino) {
        const updateSql2 = "UPDATE cars SET km = ? WHERE id = ?";
        await pool.query(updateSql2, [kmDestino, result[0].idVehiculo]);
      }

      res.status(200).json({ message: "Guía actualizada correctamente" });
    } catch (error) {
      console.log(error);
      if (files) await deleteFiles(files);
      return res.status(500).json({ message: "Error interno del servidor" });
    }
  }

  // Step 3 (payment confirmation): app may send estado = 'PC'
  else if (estado === "C") {
    const nGuia = getField(req, ['nGuia', 'nguia', 'n_guia']);
    const files = getIncomingFiles(req);
    try {
      if (!nGuia) return res.status(400).json({ message: "Solicitud incorrecta: falta nGuia" });

      const selectSql = "SELECT documents FROM carga WHERE nGuia = ?";
      const [currentDocuments] = await pool.query(selectSql, [nGuia]);
      if (!currentDocuments || currentDocuments.length === 0) return res.status(404).json({ message: "Guía no encontrada" });

      let combinedDocuments = currentDocuments[0].documents;
      if (files && files.length > 0) {
        combinedDocuments = combinedDocuments
          ? combinedDocuments + "," + files.map((f) => f.filename).join(",")
          : files.map((f) => f.filename).join(",");
      }

      const updateSql = "UPDATE carga SET documents = ?, estado = 'PC' WHERE nGuia = ?";
      await pool.query(updateSql, [combinedDocuments, nGuia]);

      res.status(200).json({ message: "Guía actualizada correctamente" });
    } catch (error) {
      console.log(error);
      if (files) await deleteFiles(files);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  } else {
    return res.status(400).json({ message: "Estado no soportado. Use one of: O, C, PC (or P for legacy)." });
  }
};

export const methods = {
  addGuide,
  getGuideAll,
  getGuide,
  UpdateGuide,
};
