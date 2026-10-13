-- =====================================================================
-- AURA DENT 
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Limpieza
DROP TABLE IF EXISTS historial_estados_pago CASCADE;
DROP TABLE IF EXISTS pagos CASCADE;
DROP TABLE IF EXISTS historial_estados_cita CASCADE;
DROP TABLE IF EXISTS citas CASCADE;
DROP TABLE IF EXISTS bloqueos_agenda CASCADE;
DROP TABLE IF EXISTS disponibilidad_horaria CASCADE;
DROP TABLE IF EXISTS servicio_odontologo CASCADE;
DROP TABLE IF EXISTS servicios CASCADE;
DROP TABLE IF EXISTS odontologo_especialidad CASCADE;
DROP TABLE IF EXISTS especialidades CASCADE;
DROP TABLE IF EXISTS odontologos CASCADE;
DROP TABLE IF EXISTS pacientes CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS estados_cita CASCADE;
DROP TABLE IF EXISTS estados_pago CASCADE;
DROP TABLE IF EXISTS base_conocimiento_chatbot CASCADE;
DROP TABLE IF EXISTS bitacora_chatbot CASCADE;
DROP TABLE IF EXISTS politicas_clinica CASCADE;
DROP TABLE IF EXISTS datos_contacto CASCADE;

-- ROLES
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL,
    descripcion VARCHAR(200)
);

INSERT INTO roles (nombre, descripcion) VALUES
('Paciente', 'Usuario que agenda citas'),
('Recepcion', 'Personal de recepción'),
('Odontologo', 'Profesional odontólogo'),
('Administrador', 'Administrador del sistema');

-- USUARIOS
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rol_id INT NOT NULL REFERENCES roles(id),
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    documento_identidad VARCHAR(20) UNIQUE NOT NULL,
    telefono VARCHAR(20),
    correo VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PACIENTES
CREATE TABLE pacientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID UNIQUE NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    fecha_nacimiento DATE,
    direccion TEXT,
    alergias TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ODONTOLOGOS
CREATE TABLE odontologos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID UNIQUE NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    numero_colegiatura VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ESPECIALIDADES
CREATE TABLE especialidades (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE
);

-- ODONTOLOGO x ESPECIALIDAD
CREATE TABLE odontologo_especialidad (
    odontologo_id UUID REFERENCES odontologos(id) ON DELETE CASCADE,
    especialidad_id INT REFERENCES especialidades(id) ON DELETE CASCADE,
    PRIMARY KEY (odontologo_id, especialidad_id)
);

-- SERVICIOS
CREATE TABLE servicios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    precio NUMERIC(10,2) NOT NULL CHECK (precio >= 0),
    duracion_minutos INT NOT NULL CHECK (duracion_minutos > 0),
    monto_reserva NUMERIC(10,2) NOT NULL CHECK (monto_reserva >= 0),
    especialidad_id INT REFERENCES especialidades(id),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SERVICIO x ODONTOLOGO
CREATE TABLE servicio_odontologo (
    servicio_id INT REFERENCES servicios(id) ON DELETE CASCADE,
    odontologo_id UUID REFERENCES odontologos(id) ON DELETE CASCADE,
    PRIMARY KEY (servicio_id, odontologo_id)
);

-- DISPONIBILIDAD
CREATE TABLE disponibilidad_horaria (
    id SERIAL PRIMARY KEY,
    odontologo_id UUID NOT NULL REFERENCES odontologos(id) ON DELETE CASCADE,
    dia_semana INT NOT NULL CHECK (dia_semana BETWEEN 1 AND 7),
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    CHECK (hora_inicio < hora_fin)
);

-- BLOQUEOS
CREATE TABLE bloqueos_agenda (
    id SERIAL PRIMARY KEY,
    odontologo_id UUID NOT NULL REFERENCES odontologos(id) ON DELETE CASCADE,
    fecha_inicio TIMESTAMPTZ NOT NULL,
    fecha_fin TIMESTAMPTZ NOT NULL,
    motivo TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CHECK (fecha_inicio < fecha_fin)
);

-- ESTADOS CITA
CREATE TABLE estados_cita (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL
);

INSERT INTO estados_cita (nombre) VALUES
('pendiente_pago'), ('retenido'), ('confirmada'),
('cancelada'), ('expirada'), ('atendida');

-- CITAS
CREATE TABLE citas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paciente_id UUID NOT NULL REFERENCES pacientes(id),
    odontologo_id UUID NOT NULL REFERENCES odontologos(id),
    servicio_id INT NOT NULL REFERENCES servicios(id),
    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    estado_id INT NOT NULL REFERENCES estados_cita(id),
    codigo_reserva VARCHAR(50) UNIQUE NOT NULL,
    fecha_expiracion TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CHECK (hora_inicio < hora_fin)
);

-- HISTORIAL CITA
CREATE TABLE historial_estados_cita (
    id BIGSERIAL PRIMARY KEY,
    cita_id UUID NOT NULL REFERENCES citas(id) ON DELETE CASCADE,
    estado_anterior_id INT REFERENCES estados_cita(id),
    estado_nuevo_id INT NOT NULL REFERENCES estados_cita(id),
    fecha TIMESTAMPTZ DEFAULT NOW(),
    usuario_id UUID REFERENCES usuarios(id),
    motivo TEXT
);

-- ESTADOS PAGO
CREATE TABLE estados_pago (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL
);

INSERT INTO estados_pago (nombre) VALUES
('pendiente'), ('completado'), ('fallido'), ('reembolsado');

-- PAGOS
CREATE TABLE pagos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cita_id UUID NOT NULL REFERENCES citas(id) ON DELETE CASCADE,
    monto NUMERIC(10,2) NOT NULL CHECK (monto >= 0),
    metodo_pago VARCHAR(50),
    codigo_operacion VARCHAR(100),
    estado_id INT NOT NULL REFERENCES estados_pago(id),
    fecha_pago TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- HISTORIAL PAGO
CREATE TABLE historial_estados_pago (
    id BIGSERIAL PRIMARY KEY,
    pago_id UUID NOT NULL REFERENCES pagos(id) ON DELETE CASCADE,
    estado_anterior_id INT REFERENCES estados_pago(id),
    estado_nuevo_id INT NOT NULL REFERENCES estados_pago(id),
    fecha TIMESTAMPTZ DEFAULT NOW(),
    motivo TEXT
);

-- BASE CONOCIMIENTO CHATBOT
CREATE TABLE base_conocimiento_chatbot (
    id SERIAL PRIMARY KEY,
    pregunta TEXT NOT NULL,
    respuesta TEXT NOT NULL,
    categoria VARCHAR(100),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- BITACORA CHATBOT
CREATE TABLE bitacora_chatbot (
    id BIGSERIAL PRIMARY KEY,
    usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    sesion_id UUID NOT NULL,
    mensaje_usuario TEXT NOT NULL,
    respuesta_ia TEXT,
    intencion VARCHAR(100),
    fecha_hora TIMESTAMPTZ DEFAULT NOW()
);

-- POLITICAS
CREATE TABLE politicas_clinica (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    contenido TEXT NOT NULL,
    tipo VARCHAR(50),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CONTACTO
CREATE TABLE datos_contacto (
    id SERIAL PRIMARY KEY,
    direccion TEXT,
    telefono VARCHAR(20),
    email VARCHAR(150),
    horario_atencion TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDICES
CREATE INDEX idx_citas_odontologo_fecha ON citas(odontologo_id, fecha, hora_inicio);
CREATE INDEX idx_citas_paciente ON citas(paciente_id);
CREATE INDEX idx_usuarios_correo ON usuarios(correo);
CREATE INDEX idx_usuarios_documento ON usuarios(documento_identidad);
CREATE INDEX idx_bitacora_chatbot_sesion ON bitacora_chatbot(sesion_id);

-- =====================================================================
-- DATOS SEMILLA
-- password de TODOS: aura2026
-- =====================================================================

INSERT INTO especialidades (nombre, descripcion) VALUES
('Odontología General', 'Consulta y tratamiento general'),
('Ortodoncia', 'Alineación de dientes con brackets'),
('Endodoncia', 'Tratamiento de conductos'),
('Periodoncia', 'Tratamiento de encías'),
('Odontopediatría', 'Atención dental infantil'),
('Cirugía Oral', 'Extracciones y cirugías'),
('Estética Dental', 'Blanqueamiento y carillas');

INSERT INTO usuarios (id, rol_id, nombres, apellidos, documento_identidad, telefono, correo, password_hash) VALUES
('11111111-1111-1111-1111-111111111111', 4, 'Admin', 'Aura Dent', '00000001', '900000001', 'admin@auradent.pe', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'),
('22222222-2222-2222-2222-222222222222', 2, 'María', 'Recepción', '00000002', '900000002', 'recepcion@auradent.pe', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'),
('33333333-3333-3333-3333-333333333333', 3, 'Carlos', 'Odontólogo', '00000003', '900000003', 'carlos@auradent.pe', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'),
('44444444-4444-4444-4444-444444444444', 3, 'Lucía', 'Ortodoncista', '00000004', '900000004', 'lucia@auradent.pe', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'),
('55555555-5555-5555-5555-555555555555', 1, 'Pablo', 'Gonzalez', '00000005', '900000005', 'pablo@auradent.pe', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'),
('66666666-6666-6666-6666-666666666666', 1, 'Omar', 'Huaytara', '00000006', '900000006', 'omar@auradent.pe', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'),
('77777777-7777-7777-7777-777777777777', 1, 'Alexander', 'Flores', '00000007', '900000007', 'alex@auradent.pe', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy');

INSERT INTO pacientes (usuario_id, fecha_nacimiento, direccion) VALUES
('55555555-5555-5555-5555-555555555555', '1998-04-15', 'Tacna, Perú'),
('66666666-6666-6666-6666-666666666666', '1999-08-22', 'Tacna, Perú'),
('77777777-7777-7777-7777-777777777777', '2000-01-10', 'Tacna, Perú');

INSERT INTO odontologos (usuario_id, numero_colegiatura) VALUES
('33333333-3333-3333-3333-333333333333', 'COP-12345'),
('44444444-4444-4444-4444-444444444444', 'COP-67890');

INSERT INTO servicios (nombre, descripcion, precio, duracion_minutos, monto_reserva, especialidad_id) VALUES
('Consulta general', 'Evaluación inicial y diagnóstico', 50.00, 30, 20.00, 1),
('Limpieza dental', 'Profilaxis y eliminación de sarro', 120.00, 45, 30.00, 1),
('Resina simple', 'Restauración estética de una cara', 150.00, 45, 30.00, 1),
('Endodoncia unirradicular', 'Tratamiento de conducto', 400.00, 90, 80.00, 3),
('Brackets metálicos (instalación)', 'Ortodoncia completa superior e inferior', 1800.00, 120, 300.00, 2),
('Blanqueamiento LED', 'Aclaramiento con luz LED', 350.00, 60, 60.00, 7),
('Extracción molar', 'Cirugía de tercer molar', 250.00, 60, 50.00, 6),
('Consulta odontopediátrica', 'Atención a niños', 60.00, 30, 20.00, 5);

INSERT INTO disponibilidad_horaria (odontologo_id, dia_semana, hora_inicio, hora_fin)
SELECT o.id, d, '09:00', '13:00' FROM odontologos o
CROSS JOIN generate_series(1,5) AS d WHERE o.numero_colegiatura = 'COP-12345';

INSERT INTO disponibilidad_horaria (odontologo_id, dia_semana, hora_inicio, hora_fin)
SELECT o.id, d, '15:00', '19:00' FROM odontologos o
CROSS JOIN generate_series(1,5) AS d WHERE o.numero_colegiatura = 'COP-12345';

INSERT INTO base_conocimiento_chatbot (pregunta, respuesta, categoria) VALUES
('¿Cuál es el horario de atención?', 'Atendemos de lunes a sábado de 9:00 a 20:00. Domingos cerrado.', 'Horarios'),
('¿Dónde están ubicados?', 'Estamos en Av. San Martín 123, Tacna, Perú.', 'Ubicación'),
('¿Qué servicios ofrecen?', 'Consulta general, limpieza, ortodoncia, endodoncia, estética dental, cirugía oral y odontopediatría.', 'Servicios'),
('¿Cómo agendo una cita?', 'Usa el módulo "Agendar cita" del portal. Selecciona servicio, fecha y hora, y paga el monto de reserva para confirmar.', 'Agendamiento'),
('¿Cuánto cuesta la consulta?', 'La consulta general cuesta S/ 50, con una reserva de S/ 20.', 'Precios'),
('¿Aceptan tarjeta?', 'Sí, aceptamos Visa, Mastercard y Yape/Plin.', 'Pagos'),
('¿Puedo cancelar mi cita?', 'Sí, hasta 24 horas antes sin costo.', 'Políticas'),
('¿Atienden niños?', 'Sí, contamos con odontopediatría desde los 3 años.', 'Servicios');

INSERT INTO politicas_clinica (titulo, contenido, tipo) VALUES
('Política de cancelación', 'El paciente puede cancelar hasta 24h antes sin penalidad.', 'cancelacion'),
('Política de reprogramación', 'Se permite una reprogramación sin costo con 24h de aviso.', 'reprogramacion'),
('Política de puntualidad', 'Se otorgan 15 minutos de tolerancia.', 'puntualidad'),
('Política de pagos', 'El monto de reserva se descuenta del total.', 'pagos');

INSERT INTO datos_contacto (direccion, telefono, email, horario_atencion) VALUES
('Av. San Martín 123, Tacna, Perú', '+51 52 123456', 'contacto@auradent.pe',
 'Lunes a Sábado 9:00 - 20:00');