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
        files.map((file) => file.filename).join(","),
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
    res.json(result);
  } catch (error) {
    console.log(error);
  }
};

const getGuide = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query(
      `SELECT * FROM carga WHERE nGuia = ${id} `
    );
    // console.log(result);
    res.json(result);
  } catch (error) {
    console.log(error);
  }
};
const UpdateGuide = async (req, res) => {
  const { estado } = req.body;
  if (estado === "P") {
    console.log(req.body);
    const { nGuia, fechaSalida } = req.body;
    const files = req.files ? req.files : null;
    try {
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

      if (!nGuia || !fechaSalida) {
        if (files) {
          await deleteFiles(files);
        }
        return res.status(400).json({ message: "Solicitud incorrecta" });
      }

      // Obtener los documentos actuales de la base de datos
      const selectSql = "SELECT documents FROM carga WHERE nGuia = ?";
      const [currentDocuments] = await pool.query(selectSql, [nGuia]);

      let combinedDocuments = currentDocuments[0].documents;

      // Agregar nuevos documentos solo si hay archivos
      if (files && files.length > 0) {
        combinedDocuments = combinedDocuments
          ? combinedDocuments.concat(
              ",",
              files.map((file) => file.filename)
            )
          : files.map((file) => file.filename).join(",");
      }
      // Actualizar la base de datos con los documentos combinados
      const updateSql =
        "UPDATE carga SET fechaSalida = ?, documents = ?, estado = 'O' WHERE nGuia = ?";
      await pool.query(updateSql, [fechaSalida, combinedDocuments, nGuia]);

      res.status(200).json({ message: "Guía actualizada correctamente" });
    } catch (error) {
      console.log(error);
      if (files) {
        await deleteFiles(files);
      }
      return res.status(500).json({ message: "Internal Server Error" });
    }
  } else if (estado === "O") {
    const { nGuia, fechaLlegada, kmDestino, CombustibleDestino } = req.body;
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
      if (!nGuia || !fechaLlegada || !kmDestino || !CombustibleDestino) {
        if (files) {
          await deleteFiles(files);
        }
        return res.status(400).json({ message: "Solicitud incorrecta" });
      }

      // Obtener documentos y ID de equipo actuales de la base de datos
      const selectSql = "SELECT documents, idEquipo FROM carga WHERE nGuia = ?";
      const [currentData] = await pool.query(selectSql, [nGuia]);

      let combinedDocuments = currentData[0].documents;

      if (files && files.length > 0) {
        combinedDocuments = combinedDocuments
          ? combinedDocuments.concat(
              ",",
              files.map((file) => file.filename)
            )
          : files.map((file) => file.filename).join(",");
      }

      // Obtener el ID del vehículo asociado al equipo
      const query = "SELECT idVehiculo FROM equipos WHERE id = ?";
      const [result] = await pool.query(query, [currentData[0].idEquipo]);

      // Obtener el kilometraje actual del vehículo
      const query2 = "SELECT km FROM cars WHERE id = ?";
      const [result2] = await pool.query(query2, [result[0].idVehiculo]);

      if (kmDestino < result2[0].km) {
        return res
          .status(400)
          .json({ message: "El Kilometraje es Menor al Ingresado en Sistema" });
      }

      // Actualizar la base de datos con los documentos y otros datos
      const updateSql =
        "UPDATE carga SET fechaLlegada = ?, kmEquipoDestino = ?, CombustibleDestino = ?, documents = ?, estado = 'C' WHERE nGuia = ?";
      await pool.query(updateSql, [
        fechaLlegada,
        kmDestino,
        CombustibleDestino,
        combinedDocuments,
        nGuia,
      ]);

      // Actualizar el kilometraje del vehículo
      const updateSql2 = "UPDATE cars SET km = ?  WHERE id = ?";
      await pool.query(updateSql2, [kmDestino, result[0].idVehiculo]);

      res.status(200).json({ message: "Guía actualizada correctamente" });
    } catch (error) {
      console.log(error);

      // Eliminar archivos en caso de error
      if (files) {
        await deleteFiles(files);
      }

      return res.status(500).json({ message: "Error interno del servidor" });
    }
  } else if (estado === "C") {
    const { nGuia } = req.body;
    const files = req.files ? req.files : null;
    try {
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

      if (!nGuia || !estado) {
        if (files) {
          await deleteFiles(files);
        }
        return res.status(400).json({ message: "Solicitud incorrecta" });
      }

      // Obtener los documentos actuales de la base de datos
      const selectSql = "SELECT documents FROM carga WHERE nGuia = ?";
      const [currentDocuments] = await pool.query(selectSql, [nGuia]);

      let combinedDocuments = currentDocuments[0].documents;

      // Agregar nuevos documentos solo si hay archivos
      if (files && files.length > 0) {
        combinedDocuments = combinedDocuments
          ? combinedDocuments.concat(
              ",",
              files.map((file) => file.filename)
            )
          : files.map((file) => file.filename).join(",");
      }
      // Actualizar la base de datos con los documentos combinados
      const updateSql =
        "UPDATE carga SET documents = ?, estado = 'PC' WHERE nGuia = ?";
      await pool.query(updateSql, [combinedDocuments, nGuia]);

      res.status(200).json({ message: "Guía actualizada correctamente" });
    } catch (error) {
      console.log(error);
      if (files) {
        await deleteFiles(files);
      }
      return res.status(500).json({ message: "Internal Server Error" });
    }
  }
};

export const methods = {
  addGuide,
  getGuideAll,
  getGuide,
  UpdateGuide,
};
