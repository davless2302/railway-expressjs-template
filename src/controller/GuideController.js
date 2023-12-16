import { pool } from "../Database/database.js";
import { unlink } from "fs/promises"; // Use fs.promises for promises-based API
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const addGuide = async (req, res) => {
  console.log(req.body);
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
  } = req.body;
  const files = req.files || null;

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
    const idEquipo = equipment;
    const combustible = fuel;
    const destino = destination;
    const Equipo = "FJC" + equipment;
    const pCombustible = fuelPayment;
    const costoValue = costo;
    const cantidad = quantity;

    if (!files || (files && files.length === 0)) {
      sql = `
        INSERT INTO carga (nGuia, fechaCarga, tipoCarga, kmRuta, kmEquipo, Equipo, combustible, destino, salida ,idEquipo, pCombustible, costo, cPeajes, pPeajes, viaticos, cantidad)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      ];
    }

    // Construir la sentencia SQL si se suben archivos
    // Ajusta los nombres de las columnas de archivos según sea necesario
    if (files && files.length > 0) {
      sql = `
        INSERT INTO carga (nGuia, fechaCarga, tipoCarga, kmRuta, kmEquipo, Equipo, combustible, destino, salida ,idEquipo, pCombustible, costo, cPeajes, pPeajes,viaticos, cantidad, documents)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        files.map((file) => file.filename).join(","), // Concatenar nombres de archivos
        // Agrega aquí otros campos de archivos según sea necesario
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
    const [result] = await pool.query("SELECT * FROM carga");
    console.log(result);
    res.json(result);
  } catch (error) {
    console.log(error);
  }
};

export const methods = {
  addGuide,
  getGuideAll,
};
