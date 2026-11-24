# Aura-Dent · Backend

API del sistema de gestión de citas odontológicas. Construida con **TypeScript**, **Express** y **arquitectura hexagonal (puertos y adaptadores)** sobre **PostgreSQL**.

## Arquitectura

El proyecto se divide en tres capas concéntricas. El **dominio** no depende de nada; la **aplicación** depende solo del dominio; la **infraestructura** depende de ambas y es la única que conoce frameworks, base de datos y servicios externos.

```
src/
├── dominio/                         # Núcleo del negocio (sin dependencias externas)
│   ├── modelos/                     # Entidades y objetos de valor (incl. Usuario y Rol)
│   ├── excepciones/                 # Errores de negocio
│   ├── puertos/
│   │   ├── entrada/                 # Interfaces que exponen los casos de uso
│   │   └── salida/                  # Interfaces que el dominio necesita del exterior
│   └── servicios/                   # Lógica de dominio que no pertenece a una entidad
├── aplicacion/                      # Orquestación de casos de uso
│   └── casos_uso/
│       ├── asistente_ia/
│       ├── autenticacion/           # login y obtención de perfil
│       ├── pagos/
│       └── reserva_citas/
├── infraestructura/                 # Detalles: se conectan a los puertos
│   ├── adaptadores/
│   │   ├── entrada/                 # Controladores web, middlewares y widget de chat
│   │   └── salida/                  # Repositorios PostgreSQL, JWT, correo, seguridad
│   └── configuracion/               # Servidor HTTP y variables de entorno
├── compartido/                      # Utilidades transversales
└── servidor_principal.ts            # Punto de entrada
scripts/
└── preparar_bd.ts                   # Crea el esquema y siembra usuarios demo
tests/
├── dominio/
└── aplicacion/
```

## Requisitos

- Node.js 18 o superior
- PostgreSQL 16 instalado y en ejecución local (puerto 5432)

## Puesta en marcha

Desde la raíz del monorepo:

```bash
npm install
copy backend\.env.ejemplo backend\.env     # en Linux/macOS: cp backend/.env.ejemplo backend/.env
npm run db:setup --workspace backend       # crea tablas y usuarios demo
npm run dev:backend
```

Ajusta los valores `POSTGRES_*` en `backend/.env` según tu instalación local antes de ejecutar `npm run db:setup`.

## Scripts

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Servidor en modo desarrollo con recarga en caliente |
| `npm run build` | Compila TypeScript a `dist/` |
| `npm start` | Ejecuta la versión compilada |
| `npm test` | Ejecuta las pruebas con Jest |
| `npm run db:setup` | Crea el esquema y siembra los usuarios demo |
| `npm run db:migrate` | Actualiza el esquema de una base existente sin sembrar ni borrar datos |

Si ya tenías datos antes de la expiración de reservas, ejecuta `npm run db:migrate --workspace backend` una vez antes de iniciar el servidor. Las citas anteriores conservan su estado y `expira_en` queda vacío para ellas.

## Usuarios demo (`npm run db:setup`)

Las pruebas de eliminación con PostgreSQL se ejecutan con `PROBAR_POSTGRES=1 npm test -- --runInBand` desde `backend` (PowerShell: `$env:PROBAR_POSTGRES='1'; npm test -- --runInBand`). Crean y retiran un esquema temporal propio; no modifican las citas existentes. Sin esa variable se ejecutan únicamente las pruebas habituales.

Contraseña para todos: `demo1234`.

| Rol | Email |
| --- | --- |
| Administrador | `admin@auradent.com` |
| Odontólogo | `odontologo@auradent.com` |
| Recepción | `recepcion@auradent.com` |
| Paciente | `paciente@auradent.com` |

## Autenticación

Login por email/contraseña que devuelve un **JWT**. El token se envía en la cabecera `Authorization: Bearer <token>`. El middleware `autenticar` valida el token y `autorizar(...roles)` restringe el acceso por rol.

| Método | Ruta | Acceso | Descripción |
| --- | --- | --- | --- |
| GET | `/salud` | Público | Verificación de disponibilidad del servicio |
| POST | `/api/autenticacion/login` | Público | Inicio de sesión (`email`, `password`) → `{ token, usuario }` |
| GET | `/api/usuarios/me` | Autenticado | Devuelve el perfil del usuario del token |
| POST | `/api/reservas` | Autenticado | Crea una reserva temporal (15 minutos) |
| POST | `/api/reservas/:id/confirmar` | Autenticado | Confirma la cita tras validar el pago |
| DELETE | `/api/citas/:id` | Paciente propietario | Cancela lógicamente una reserva sin pago aprobado y conserva la trazabilidad |
| POST | `/api/pagos/qr` | Autenticado | Valida un pago realizado por QR |
| POST | `/api/asistente/disponibilidad` | Autenticado | Consulta disponibilidad del asistente IA |

## Modelo de datos

El esquema lo crea `scripts/preparar_bd.ts`. Tablas: `usuarios`, `citas` y `pagos`.

```sql
CREATE TABLE usuarios (
  id UUID PRIMARY KEY,
  nombres VARCHAR(100) NOT NULL,
  apellidos VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  dni_ce VARCHAR(20) NOT NULL UNIQUE,
  fecha_nacimiento DATE,
  alergias TEXT,
  rol VARCHAR(20) NOT NULL CHECK (rol IN ('Paciente','Recepcion','Odontologo','Administrador')),
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);
```
## Política, trazabilidad y rendimiento

La implementación, los endpoints, el respaldo verificado y las pruebas se describen en [informes/IMPLEMENTACION.md](informes/IMPLEMENTACION.md). Las mediciones con 100.000 y 1.000.000 de citas están en [informes/rendimiento.json](informes/rendimiento.json).

Para actualizar una base existente usa `npm run db:migrate` después de `npm run db:backup`. No uses `db:setup` sobre los datos existentes: contiene semillas demo. Cancelar o vencer cambia estados y conserva el historial.
