import { pool } from "../Database/database.js";
import { HASH } from "../config.js";
import aes from "crypto-js/aes.js";

const Login = async (req, res) => {
    console.log(req.body)
  try {
    const key = HASH
    // const { username, password } = req.body;
    // const u = { username, password };
    // if (u.username == undefined || u.password == undefined) {
    //   res.status(401).send("401 || Not authorized");
    //   return false;
    // }

    // const [result] = await pool.query("SELECT * FROM usuarios ");
    // const user = result.find((el) => el.username.toLowerCase() === u.username.toLowerCase());
    // if (!user) res.status(404).json({ message: "El Usuario no Existe" });
    // else {
    //   const { password } = user;
    //   const hashPassword = aes.decrypt(password, key).toString(encUtf8);
    //   if (hashPassword === u.password) {
    //     delete user.password;
    //     res.json(user);
    //   } else res.status(404).json({ message: "Usuario y/o Contraseña Incorrecto" });
    // }
  } catch (error) {
    console.error(error);
    res.status(500);
    res.send(error.message);
  }
};

const Login2 = async (req, res) => {
    const key = HASH; 
    console.log(req.body)

    try {
 


    } catch (error) {
        
    }
};

export const methods = {
  Login,
  Login2
};
