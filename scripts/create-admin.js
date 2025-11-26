import bcrypt from 'bcryptjs';
import { config } from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from project root
config({ path: join(__dirname, '../.env') });

// Usage: node scripts/create-admin.js [username] [password] [email]
const argv = process.argv.slice(2);
const username = argv[0] || 'admin';
const password = argv[1] || 'admin123';
const email = argv[2] || 'admin@example.com';

const cedula = '00000000';
const nombre = 'Admin';
const apellido = 'User';
const rol = 'admin';
const genero = 'N/A';

async function main() {
  let pool;
  try {
    // Dynamic import to ensure env vars are loaded first
    const dbModule = await import('../src/Database/database.js');
    pool = dbModule.pool;

    const saltRounds = 10;
    const hash = await bcrypt.hash(password, saltRounds);

    const sql = `INSERT INTO usuarios (cedula, nombre, apellido, username, password, email, rol, genero) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    const values = [cedula, nombre, apellido, username, hash, email, rol, genero];

    const [result] = await pool.execute(sql, values);
    console.log('Admin creado con id:', result.insertId);
  } catch (err) {
    if (err && err.code === 'ER_DUP_ENTRY') {
      console.error('Error: Usuario o correo ya existe.');
    } else {
      console.error('Error creando admin:', err.message || err);
    }
  } finally {
    if (pool) {
      try { await pool.end(); } catch (e) { }
    }
    process.exit(0);
  }
}

main();
