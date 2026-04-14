# TodoGrupal

Aplicacion de listas de tareas colaborativa para equipos de trabajo, amigos y grupos. Permite crear grupos, invitar miembros, crear tareas, asignarlas y hacer seguimiento con un tablero estilo Kanban.

## Stack

- **Frontend**: React + Vite + React Router + Axios
- **Backend**: Node.js + Express (Vercel Serverless Functions)
- **Base de datos**: MySQL en la nube
- **Auth**: JWT + bcrypt
- **Deploy**: Vercel

---

## Probar en local

### 1. Crear base de datos MySQL online (gratis)

No necesitas instalar MySQL. Usa uno de estos servicios:


| Servicio       | Gratis                        | Enlace                                         |
| -------------- | ----------------------------- | ---------------------------------------------- |
| **Aiven**      | 1 BD MySQL gratis             | [https://aiven.io](https://aiven.io)           |
| **TiDB Cloud** | 5GB gratis (compatible MySQL) | [https://tidbcloud.com](https://tidbcloud.com) |
| **Railway**    | $5 de credito trial           | [https://railway.app](https://railway.app)     |


**Ejemplo con Aiven:**

1. Crea cuenta en [https://aiven.io](https://aiven.io)
2. Crea un servicio **MySQL** (plan Free)
3. Ve a la pestaña **Overview** y copia la **Service URI**
4. Esa URI es tu `DATABASE_URL`

### 2. Configurar variables de entorno

```bash
cp server/.env.example server/.env
```

Edita `server/.env`:

```env
DATABASE_URL=mysql://usuario:password@tu-host:puerto/tu_base_datos?ssl-mode=REQUIRED
JWT_SECRET=una_clave_secreta_larga_y_segura
PORT=5000
```

### 3. Instalar dependencias

```bash
npm run install:all
```

### 4. Crear las tablas

```bash
npm run db:migrate
```

### 5. Arrancar

```bash
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173) en tu navegador. El frontend y la API arrancan juntos.

---

## Desplegar en Vercel

### 1. Sube el proyecto a GitHub

```bash
git remote add origin https://github.com/TU_USUARIO/todo-grupal.git
git push -u origin cursor/todo-grupal-fullstack-app
```

### 2. Importar en Vercel

1. Ve a [https://vercel.com](https://vercel.com) y entra con tu cuenta de GitHub
2. Click en **"Add New Project"**
3. Selecciona el repo **todo-grupal**
4. Vercel detectara el `vercel.json` automaticamente

### 3. Configurar variables de entorno en Vercel

En la pantalla de configuracion del proyecto, añade estas **Environment Variables**:


| Variable       | Valor                                        |
| -------------- | -------------------------------------------- |
| `DATABASE_URL` | Tu URI de MySQL (la misma que usas en local) |
| `JWT_SECRET`   | Una clave secreta larga                      |
| `VERCEL`       | `1`                                          |


### 4. Deploy

Click en **Deploy** y espera a que termine. Vercel te dara una URL tipo `https://todo-grupal-xxx.vercel.app`.

### 5. Ejecutar migracion en produccion

Despues del primer deploy, ejecuta la migracion desde tu PC apuntando a la misma BD cloud:

```bash
npm run db:migrate
```

(La migracion usa la BD cloud que configuraste en `server/.env`, asi que las tablas ya estaran creadas si lo probaste en local.)

---

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
├── api/                    # Entry point Vercel Serverless
│   └── index.js
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
│   └── index.js            # Express app
├── vercel.json             # Configuracion de deploy
└── package.json            # Scripts raiz
```

## API Endpoints

### Auth


| Metodo | Ruta                 | Descripcion               |
| ------ | -------------------- | ------------------------- |
| POST   | `/api/auth/register` | Registrar usuario         |
| POST   | `/api/auth/login`    | Iniciar sesion            |
| GET    | `/api/auth/me`       | Perfil del usuario actual |


### Grupos


| Metodo | Ruta                              | Descripcion                   |
| ------ | --------------------------------- | ----------------------------- |
| GET    | `/api/groups`                     | Mis grupos                    |
| POST   | `/api/groups`                     | Crear grupo                   |
| GET    | `/api/groups/:id`                 | Detalle de grupo con miembros |
| PUT    | `/api/groups/:id`                 | Actualizar grupo (admin)      |
| DELETE | `/api/groups/:id`                 | Eliminar grupo (admin)        |
| POST   | `/api/groups/:id/members`         | Añadir miembro (admin)        |
| DELETE | `/api/groups/:id/members/:userId` | Eliminar miembro (admin)      |


### Tareas


| Metodo | Ruta                        | Descripcion      |
| ------ | --------------------------- | ---------------- |
| GET    | `/api/tasks/group/:groupId` | Tareas del grupo |
| POST   | `/api/tasks`                | Crear tarea      |
| PUT    | `/api/tasks/:id`            | Actualizar tarea |
| DELETE | `/api/tasks/:id`            | Eliminar tarea   |


