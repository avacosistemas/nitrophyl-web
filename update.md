A continuación tenés el detalle de la API en limpio con sus especificaciones, estructura de envoltorio estándar, endpoints y modelos de datos.

---

### Configuración Base y Headers

* **Base URL:** `http://localhost:8080/nitro-api`

* **Headers requeridos:**
* `Content-Type: application/json`

* `Accept: application/json`

* `Authorization: Bearer <TOKEN>`

* `X-XSRF-TOKEN: <TOKEN>` *(si aplica seguridad CSRF)*




---

### Estructura General del Response (Wrapper)

Todas las respuestas exitosas y de error siguen la misma envoltura genérica:

```json
{
  "status": "OK",
  "data": {},
  "ok": true,
  "error": null,
  "page": {
    "page": 0,
    "pageSize": 0,
    "search": "string",
    "totalReg": 0
  }
}

```

* **`data`**: Contiene la entidad solicitada, una lista de entidades (`[]`) o un objeto vacío según el endpoint.


* **`page`**: Objeto de paginación o `null` si no aplica paginado.


* **`error`**: Mensaje o código de error en caso de fallo, o `null`.



---

### 1. Módulo: Perfiles (`/profiles`)

#### Endpoints

| Método | Endpoint | Descripción | Body Request |
| --- | --- | --- | --- |
| **GET** | `/profiles` | Obtiene el listado completo de perfiles

 | *Ninguno*<br> |
| **GET** | `/profiles/{id}` | Obtiene un perfil específico por ID

 | *Ninguno*<br> |
| **GET** | `/profiles/filterByName?name={nombre}` | Filtra perfiles por coincidencia de nombre

 | *Ninguno*<br> |
| **POST** | `/profiles` | Crea un nuevo perfil

 | `ProfileDTO`<br> |
| **PUT** | `/profiles` | Modifica un perfil existente

 | `ProfileDTO`<br> |
| **DELETE** | `/profiles/{id}` | Elimina un perfil por ID

 | *Ninguno*<br> |

#### Modelos de Perfiles

##### `ProfileDTO` (Payload para POST/PUT y contenido de `data` en GET individual)

```json
{
  "id": 1,
  "name": "Administrador",
  "enabled": true,
  "role": {
    "id": 2,
    "code": "ADM",
    "name": "Administrador"
  },
  "permissions": [
    {
      "id": 10,
      "code": "PERMISOS_CREATE",
      "description": "Descripción opcional",
      "enabled": true
    }
  ]
}

```

##### Response Esperado (GET `/profiles` o GET `/profiles/filterByName`)

```json
{
  "status": "OK",
  "data": [
    {
      "id": 1,
      "name": "Administrador",
      "enabled": true,
      "role": {
        "id": 2,
        "code": "ADM",
        "name": "Administrador"
      },
      "permissions": [
        {
          "id": 1000,
          "code": "MENU_INFORMES",
          "description": "",
          "enabled": true
        }
      ]
    }
  ],
  "ok": null,
  "error": null,
  "page": null
}

```

---

### 2. Módulo: Permisos (`/permissions`)

#### Endpoints

| Método | Endpoint | Descripción | Body Request |
| --- | --- | --- | --- |
| **GET** | `/permissions` | Obtiene el listado completo de permisos

 | *Ninguno*<br> |
| **GET** | `/permissions/{id}` | Obtiene un permiso por ID

 | *Ninguno*<br> |
| **GET** | `/permissions/filterPermisoByNombre?name={nombre}` | Filtra permisos por nombre

 | *Ninguno*<br> |
| **POST** | `/permissions` | Registra un nuevo permiso

 | `PermissionDTO`<br> |
| **PUT** | `/permissions` | Actualiza un permiso existente

 | `PermissionDTO`<br> |
| **DELETE** | `/permissions/{id}` | Elimina un permiso por ID

 | *Ninguno*<br> |

#### Modelos de Permisos

##### `PermissionDTO` (Payload para POST/PUT)

```json
{
  "id": 0,
  "code": "PERMISOS_CREATE",
  "description": "Permiso para crear entidades",
  "enabled": true
}

```

##### Response Esperado (GET `/permissions`)

```json
{
  "status": "OK",
  "data": [
    {
      "id": 10,
      "code": "PERMISOS_CREATE",
      "description": "",
      "enabled": true
    },
    {
      "id": 11,
      "code": "PERMISOS_DELETE",
      "description": "",
      "enabled": true
    }
  ],
  "ok": null,
  "error": null,
  "page": null
}

```

---

### 3. Módulo: Usuarios (`/users`)

#### Endpoints

| Método | Endpoint | Descripción | Body Request |
| --- | --- | --- | --- |
| **GET** | `/users/` | Obtiene todos los usuarios

 | *Ninguno*<br> |
| **GET** | `/users/{id}` | Obtiene un usuario específico por ID

 | *Ninguno*<br> |
| **POST** | `/users/` | Crea un nuevo usuario

 | `UserDTO`<br> |
| **PUT** | `/users/` | Modifica un usuario existente

 | `UserDTO`<br> |
| **DELETE** | `/users/{id}` | Elimina un usuario por ID

 | *Ninguno*<br> |

#### Modelos de Usuarios

##### `UserDTO` (Payload para POST/PUT)

```json
{
  "id": 0,
  "username": "adminbeto",
  "name": "Alberto",
  "lastname": "Gonzalez",
  "email": "alosgonzalez@gmail.com",
  "enabled": true,
  "admin": false,
  "profiles": [
    {
      "id": 1
    }
  ]
}

```

##### Response Esperado (GET `/users/` o GET `/users/{id}`)

```json
{
  "status": "OK",
  "data": {
    "id": 1,
    "username": "adminbeto",
    "name": "Alberto",
    "lastname": "Gonzalez",
    "email": "alosgonzalez@gmail.com",
    "enabled": true,
    "admin": false,
    "profiles": [
      {
        "id": 1,
        "name": null,
        "role": null,
        "permissions": [],
        "enabled": null
      }
    ]
  },
  "ok": null,
  "error": null,
  "page": null
}

```
### Módulo: Roles (`/roles`)

* **Base URL:** `http://localhost:8080/nitro-api`
* **Headers requeridos:**
* `Content-Type: application/json`
* `Accept: application/json`
* `Authorization: Bearer <TOKEN>`
* `X-XSRF-TOKEN: <TOKEN>`



---

#### Endpoints

| Método | Endpoint | Descripción | Body Request |
| --- | --- | --- | --- |
| **GET** | `/roles/` | Lista todos los roles disponibles | *Ninguno* |
| **GET** | `/roles/{id}` | Obtiene los detalles de un rol específico por ID | *Ninguno* |
| **POST** | `/roles/` | Crea un nuevo rol en el sistema | `RoleDTO` |
| **PUT** | `/roles/{id}` | Actualiza un rol existente enviando su ID en la URL | `RoleDTO` |
| **DELETE** | `/roles/{id}` | Elimina un rol por ID | *Ninguno* |

> *Nota:* A diferencia de otros controladores donde la actualización se hace sobre la raíz del recurso, este endpoint exige el parámetro de ruta en el PUT: `/roles/{id}`.

---

#### Modelo de Datos

##### `RoleDTO` (Payload para POST y PUT)

```json
{
  "id": 0,
  "code": "GRAL",
  "name": "General"
}

```

* `id` *(integer)*: Identificador único (`0` o omitido para nuevos registros).
* `code` *(string)*: Código identificador único del rol (ej: `"ADM"`, `"GRAL"`).
* `name` *(string)*: Nombre descriptivo del rol.

---

#### Respuestas Esperadas

##### 1. Listado de roles (GET `/roles/`) — `200 OK`

```json
{
  "status": "OK",
  "data": [
    {
      "id": 2,
      "code": "ADM",
      "name": "Administrador"
    },
    {
      "id": 1000,
      "code": "GRAL",
      "name": "General"
    }
  ],
  "ok": null,
  "error": null,
  "page": null
}

```

##### 2. Obtener un rol por ID (GET `/roles/{id}`) — `200 OK`

```json
{
  "status": "OK",
  "data": {
    "id": 2,
    "code": "ADM",
    "name": "Administrador"
  },
  "ok": null,
  "error": null,
  "page": null
}

```

##### 3. Creación exitosa (POST `/roles/`) — `201 Created` o `200 OK`

```json
{
  "status": "OK",
  "data": {
    "id": 1001,
    "code": "OPER",
    "name": "Operario"
  },
  "ok": true,
  "error": null,
  "page": null
}

```

##### 4. Eliminación exitosa (DELETE `/roles/{id}`) — `204 No Content` o `200 OK`

* Si retorna `204`: Sin cuerpo en la respuesta.
* Si retorna `200`:

```json
{
  "status": "OK",
  "data": {},
  "ok": true,
  "error": null,
  "page": null
}

```
---

### Códigos de Respuesta HTTP

* **`200 OK`**: Solicitud exitosa (lectura, modificación o respuesta estándar).


* **`201 Created`**: Entidad creada correctamente.


* **`204 No Content`**: Eliminación realizada con éxito.


* **`401 Unauthorized`**: Falta o vencimiento de la cabecera `Authorization: Bearer`.


* **`403 Forbidden`**: Token válido pero sin permisos suficientes para el recurso.


* **`404 Not Found`**: El ID o recurso solicitado no existe.