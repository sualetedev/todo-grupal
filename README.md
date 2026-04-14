# TodoGrupal

Aplicacion de listas de tareas colaborativa para equipos de trabajo, amigos y grupos. Permite crear grupos, invitar miembros, crear tareas, asignarlas y hacer seguimiento con un tablero estilo Kanban.

## Stack

- **Frontend**: React + Vite + React Router + Axios
- **Backend**: Node.js + Express
- **Base de datos**: MySQL (en la nube)
- **Auth**: JWT + bcrypt

## Inicio rapido

### 1. Crear una base de datos MySQL online (gratis)

No necesitas instalar MySQL. Usa uno de estos servicios gratuitos:

| Servicio | Gratis | Enlace |
|----------|--------|--------|
| **Aiven** | 1 BD MySQL gratis | https://aiven.io |
| **TiDB Cloud** | 5GB gratis (compatible MySQL) | https://tidbcloud.com |
| **Railway** | $5 de credito trial | https://railway.app |
| **PlanetScale** | Plan basico | https://planetscale.com |

#### Ejemplo con Aiven (recomendado):

1. Crea una cuenta en https://aiven.io
2. Crea un nuevo servicio MySQL (plan Free)
3. En el panel del servicio, copia la **Service URI** (algo como `mysql://avnadmin:PASSWORD@host:port/defaultdb`)
4. Esa URI es tu `DATABASE_URL`

### 2. Configurar variables de entorno

```bash
cp server/.env.example server/.env
```

Edita `server/.env` y pega tu URL de conexion:

```env
DATABASE_URL=mysql://usuario:password@tu-host:puerto/tu_base_de_datos
JWT_SECRET=una_clave_secreta_larga_y_segura
PORT=5000
```

### 3. Instalar dependencias

```bash
npm run install:all
```

### 4. Ejecutar migracion

```bash
npm run db:migrate
```

Esto crea las tablas: `users`, `groups_`, `group_members`, `tasks`.

### 5. Arrancar en modo desarrollo

```bash
npm run dev
```

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000

## Funcionalidades

- Registro e inicio de sesion con JWT
- Crear grupos y añadir miembros por email
- Tablero Kanban con 3 columnas: Pendiente, En progreso, Hecho
- Crear, editar y eliminar tareas
- Asignar tareas a miembros del grupo
- Prioridades (alta, media, baja) con colores
- Fechas limite con indicador de vencimiento
- Roles de admin y miembro por grupo
- UI moderna con tema oscuro

## Estructura del proyecto

```
todo-grupal/
├── client/                 # Frontend React + Vite
│   ├── src/
│   │   ├── components/     # Sidebar, Modal, TaskCard
│   │   ├── context/        # AuthContext
│   │   ├── pages/          # Login, Register, Dashboard, GroupDetail
│   │   ├── api.js          # Axios config
│   │   ├── App.jsx         # Rutas principales
│   │   └── index.css       # Estilos globales
│   └── vite.config.js
├── server/                 # Backend Express + MySQL
│   ├── config/             # DB pool y migracion
│   ├── middleware/          # Auth JWT y acceso a grupo
│   ├── routes/             # auth, groups, tasks
│   └── index.js            # Entry point
└── package.json            # Scripts raiz
```

## API Endpoints

### Auth
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | `/api/auth/register` | Registrar usuario |
| POST | `/api/auth/login` | Iniciar sesion |
| GET | `/api/auth/me` | Perfil del usuario actual |

### Grupos
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/api/groups` | Mis grupos |
| POST | `/api/groups` | Crear grupo |
| GET | `/api/groups/:id` | Detalle de grupo con miembros |
| PUT | `/api/groups/:id` | Actualizar grupo (admin) |
| DELETE | `/api/groups/:id` | Eliminar grupo (admin) |
| POST | `/api/groups/:id/members` | Añadir miembro (admin) |
| DELETE | `/api/groups/:id/members/:userId` | Eliminar miembro (admin) |

### Tareas
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/api/tasks/group/:groupId` | Tareas del grupo |
| POST | `/api/tasks` | Crear tarea |
| PUT | `/api/tasks/:id` | Actualizar tarea |
| DELETE | `/api/tasks/:id` | Eliminar tarea |
