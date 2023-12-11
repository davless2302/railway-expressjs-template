import { pool } from "../Database/database.js";

const getEquipmentBefore = async (req, res) => {
  try {
    const [query1] = await pool.query("SELECT * FROM cars ");
    const [query2] = await pool.query("SELECT * FROM choferes ");
    const result = {
      cars: query1,
      choferes: query2,
    };
    res.json(result);
  } catch (error) {
    res.status(500);
    res.send(error.message);
  }
};
const getEquipment = async (req, res) => {
  const { id } = req.params;
  try {
    const [query1] = await pool.query("SELECT * FROM equipos WHERE id = ?", id);
    res.json(query1);
  } catch (error) {
    res.status(500);
    res.send(error.message);
  }
};

const createEquipment = async (req, res) => {
  const { chutoID, remolqueID, choferID } = req.body;

  if (chutoID === "" || remolqueID === "" || choferID === "") {
    res.status(400).json({ message: "Bad Request" });
  } else {
    try {
      // Inicia la transacción

      // Consulta para insertar en la tabla 'equipos'
      const sqlEquipos =
        "INSERT INTO equipos (idVehiculo, idChofer, idRemolque) VALUES (?, ?, ?)";
      const valuesEquipos = [chutoID, choferID, remolqueID];
      await pool.execute(sqlEquipos, valuesEquipos);

      // Consultas para actualizar las tablas 'cars' y 'choferes'
      const sqlUpdateCars = "UPDATE cars SET inUse = ? WHERE id = ?";
      const valuesUpdateCars = ["Y", chutoID];
      await pool.execute(sqlUpdateCars, valuesUpdateCars);

      const valuesUpdateRemolque = ["Y", remolqueID];
      await pool.execute(sqlUpdateCars, valuesUpdateRemolque);

      const sqlUpdateChoferes = "UPDATE choferes SET inUse = ? WHERE id = ?";
      const valuesUpdateChoferes = ["Y", choferID];
      await pool.execute(sqlUpdateChoferes, valuesUpdateChoferes);

      // Confirma la transacción

      res.status(200).json({ message: "Equipo Asignado exitosamente" });
    } catch (error) {
      // Si hay un error, realiza un rollback para deshacer cualquier cambio

      console.error(error);
      res.status(500).json({ message: "Internal Error" });
    }
  }
};

const getEquipments = async (req, res) => {
  const query = `SELECT
  e.id AS idEquipo,
  c.id AS idChuto,
  c.marca AS marcaChuto,
  c.model AS modeloChuto,
  c.year AS yearChuto, 
  c.color AS colorChuto,
  c.placa AS placaChuto,
  c1.id AS idRemolque,
  c1.marca AS marcaRemolque,
  c1.model AS modeloRemolque,
  c1.year AS yearRemolque, 
  c1.color AS colorRemolque,
  ch.id AS idChofer,
  ch.cedula AS cedulaChofer,
  ch.fullName AS nombreChofer,
  ch.tlf AS tlfChofer
FROM
  equipos AS e
INNER JOIN
  cars AS c ON e.idVehiculo = c.id
INNER JOIN
  cars AS c1 ON e.idRemolque = c1.id
INNER JOIN
  choferes AS ch ON e.idChofer = ch.id
  `;
  const [result] = await pool.query(query);
  res.status(200).json(result);
};

export const methods = {
  getEquipmentBefore,
  getEquipment,
  createEquipment,
  getEquipments,
};
