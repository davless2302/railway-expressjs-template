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
  console.log(req.body);
};

export const methods = {
  getEquipments,
  getEquipment,
  CreateEquipment,
};
