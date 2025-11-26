import { pool } from "../Database/database.js";
import { JWT_SECRET } from "../config.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";


const findUserByUsername = async (username) => {
  const [result] = await pool.query("SELECT * FROM usuarios ");
  return result.find(
    (el) => el.username.toLowerCase() === username.toLowerCase()
  );
};

const generateToken = (user) => {
  const payload = {
    userId: user.id, // Ajusta según la estructura real de tu usuario
    username: user.username,
    userRol: user.rol,
    avatar: user.avatar,
    userEmail: user.email,
    nombre: user.nombre,
    apellido: user.apellido,
    // Agrega más información si es necesario
  };

  const options = {
    expiresIn: "12h", // Puedes ajustar la duración del token
  };

  return jwt.sign(payload, JWT_SECRET, options);
};

const Login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(401).send("401 || Not authorized");
      return;
    }

    const user = await findUserByUsername(username);

    if (!user) {
      res.status(404).json({ message: "El Usuario no Existe" });
      return;
    }

    const match = await bcrypt.compare(password, user.password);

    if (match) {
      // Evitar enviar la contraseña en la respuesta
      const { password, ...userWithoutPassword } = user;

      // Generar token y enviarlo como parte de la respuesta
      const token = generateToken(userWithoutPassword);
      res.json({ user: userWithoutPassword, token });
    } else {
      res.status(404).json({ message: "Usuario o Contraseña Incorrecto" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
};

export const methods = {
  Login,
};
