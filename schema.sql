-- Simple MySQL schema (sin índices espaciales, sintaxis compatible)
-- Crea la base de datos y las tablas necesarias.

CREATE DATABASE IF NOT EXISTS railway_express DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE railway_express;

-- Tabla usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cedula VARCHAR(80) NOT NULL,
  nombre VARCHAR(150) NOT NULL,
  apellido VARCHAR(150) NOT NULL,
  username VARCHAR(150) NOT NULL,
  password TEXT NOT NULL,
  email VARCHAR(255) NOT NULL,
  rol VARCHAR(80) NOT NULL,
  genero VARCHAR(50) DEFAULT NULL,
  avatar VARCHAR(255) DEFAULT NULL,
  ubicacion POINT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY ux_usuarios_username (username),
  UNIQUE KEY ux_usuarios_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla clients (clientes)
CREATE TABLE IF NOT EXISTS clients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  razonSocial VARCHAR(255) NOT NULL,
  alias VARCHAR(150) NOT NULL,
  rif VARCHAR(120) NOT NULL,
  phone VARCHAR(80) DEFAULT NULL,
  direccion TEXT DEFAULT NULL,
  logo VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY ux_clients_rif (rif)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla choferes (drivers)
CREATE TABLE IF NOT EXISTS choferes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cedula VARCHAR(80) NOT NULL,
  fullName VARCHAR(255) NOT NULL,
  address VARCHAR(255) DEFAULT NULL,
  tlf VARCHAR(80) DEFAULT NULL,
  gender VARCHAR(30) DEFAULT NULL,
  birthdate DATE DEFAULT NULL,
  imagen VARCHAR(255) DEFAULT NULL,
  documents TEXT DEFAULT NULL,
  inUse CHAR(1) DEFAULT 'N',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY ux_choferes_cedula (cedula)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla cars (vehículos)
CREATE TABLE IF NOT EXISTS cars (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type VARCHAR(60) NOT NULL,
  marca VARCHAR(150) DEFAULT NULL,
  model VARCHAR(150) DEFAULT NULL,
  year SMALLINT DEFAULT NULL,
  color VARCHAR(80) DEFAULT NULL,
  placa VARCHAR(80) DEFAULT NULL,
  km DECIMAL(12,2) DEFAULT 0,
  serialM VARCHAR(150) DEFAULT NULL,
  serialC VARCHAR(150) DEFAULT NULL,
  images VARCHAR(255) DEFAULT NULL,
  documents TEXT DEFAULT NULL,
  inUse CHAR(1) DEFAULT 'N',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY ux_cars_placa (placa),
  UNIQUE KEY ux_cars_serialM (serialM),
  UNIQUE KEY ux_cars_serialC (serialC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla equipos (asignaciones: chuto + remolque + chofer)
CREATE TABLE IF NOT EXISTS equipos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  idVehiculo INT NOT NULL,
  idChofer INT NOT NULL,
  idRemolque INT NOT NULL,
  alias VARCHAR(150) DEFAULT NULL,
  estado VARCHAR(20) DEFAULT 'A',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_equipos_vehiculo FOREIGN KEY (idVehiculo) REFERENCES cars(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_equipos_remolque FOREIGN KEY (idRemolque) REFERENCES cars(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_equipos_chofer FOREIGN KEY (idChofer) REFERENCES choferes(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla carga (guías / movimientos)
CREATE TABLE IF NOT EXISTS carga (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nGuia VARCHAR(120) NOT NULL,
  fechaCarga DATETIME DEFAULT NULL,
  fechaSalida DATETIME DEFAULT NULL,
  fechaLlegada DATETIME DEFAULT NULL,
  tipoCarga VARCHAR(150) DEFAULT NULL,
  cantidad DECIMAL(18,4) DEFAULT NULL,
  otros DECIMAL(18,2) DEFAULT 0,
  salida VARCHAR(255) DEFAULT NULL,
  destino VARCHAR(255) DEFAULT NULL,
  kmRuta DECIMAL(12,2) DEFAULT NULL,
  kmEquipo DECIMAL(12,2) DEFAULT NULL,
  kmEquipoDestino DECIMAL(12,2) DEFAULT NULL,
  combustible VARCHAR(150) DEFAULT NULL,
  pCombustible DECIMAL(18,2) DEFAULT 0,
  CombustibleDestino DECIMAL(18,2) DEFAULT 0,
  pPeajes DECIMAL(18,2) DEFAULT 0,
  cPeajes DECIMAL(18,2) DEFAULT 0,
  viaticos DECIMAL(18,2) DEFAULT 0,
  documents TEXT DEFAULT NULL,
  costo DECIMAL(18,2) DEFAULT 0,
  estado VARCHAR(10) DEFAULT 'P',
  Equipo VARCHAR(150) DEFAULT NULL,
  idEquipo INT DEFAULT NULL,
  idClient INT DEFAULT NULL,
  idConductor INT DEFAULT NULL,
  pagoConductor DECIMAL(18,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY ux_carga_nGuia (nGuia),
  CONSTRAINT fk_carga_equipo FOREIGN KEY (idEquipo) REFERENCES equipos(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_carga_client FOREIGN KEY (idClient) REFERENCES clients(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_carga_conductor FOREIGN KEY (idConductor) REFERENCES choferes(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Índices de ayuda
CREATE INDEX IF NOT EXISTS idx_carga_estado_fechaSalida ON carga(estado, fechaSalida);
CREATE INDEX IF NOT EXISTS idx_equipos_ids ON equipos(idVehiculo, idRemolque, idChofer);

-- Fin del esquema
