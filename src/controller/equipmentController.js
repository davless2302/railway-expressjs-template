import { pool } from "../Database/database.js";

const getEquipments = async (req, res) => {
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

const CreateEquipment = async (req, res) => {
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

export const methods = {
  getEquipments,
  getEquipment,
  CreateEquipment,
};
