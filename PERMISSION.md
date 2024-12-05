# Documentación de Permisos en la Aplicación

---

## **1. Mostrar Componentes Según Permisos**

Utiliza el pipe `hasPermission` para renderizar elementos solo si el usuario tiene el permiso necesario.

### Ejemplo:
```html
<button *ngIf="'CREAR_USUARIO' | hasPermission" mat-flat-button>
    Agregar Usuarios
</button>

<button *ngIf="('LISTADO_CLIENTE_CREATE' | hasPermission) && (titulo === 'Consulta Clientes')" mat-flat-button>
    Agregar Usuarios
</button>
```

### Configuración:
1. **Importa `CoreSharedModule` en el módulo del componente**.  

   ```typescript
   import { CoreSharedModule } from 'app/core/shared/shared.module';

   @NgModule({
       imports: [CoreSharedModule],
       declarations: [MiComponente]
   })
   export class MiComponenteModule {}
   ```

---

## **2. Configurar Permisos en la Navegación**

Define permisos en `navegacion.service.ts` usando la propiedad `permissionCode`.

### Ejemplo:
Archivo: [src/app/core/navigation/navigation.service.ts](src/app/core/services/navegacion.service.ts)
```typescript
{
    icon: 'heroicons_outline:key',
    id: 'permisos',
    link: '/permisos/grid',
    title: 'Permisos',
    type: 'basic',
    permissionCode: 'PERMISOS_READ', // Agregar tipo de Permiso
},
```

Esto asegura que solo los usuarios con el permiso `PERMISOS_READ` vean el enlace en el menú.

---

## **3. Proteger Rutas con Permisos**

Usa el guard `PermissionGuard` para restringir rutas según los permisos.

### Ejemplo:
Archivo: [src/app/app.routing.ts](src/app/app.routing.ts)
```typescript
{
    path: 'permisos',
    canActivate: [PermissionGuard], // Agregar
    data: { permission: 'PERMISOS_READ' }, // Agregar el tipo de Permiso
    loadChildren: () =>
        import('app/modules/abm/abm-permisos/abm-permisos.module').then(
            (m) => m.ABMPermisosModule
        ),
},
```

Si el usuario no tiene el permiso especificado, el guard redirige a una página por defecto o la anterior.

---

## **4. Configurar Permisos en Rutas Hijas**

Para aplicar permisos a rutas hijas, debes configurarlas en el archivo de enrutamiento del módulo correspondiente e importar el guard `PermissionGuard`.

### Pasos:
1. Ve al archivo de enrutamiento del módulo (ejemplo: `abm-usuariosmodule.ts`).
2. Agrega el `PermissionGuard` a las rutas hijas que deseas proteger, usando `canActivate` y `data` para especificar los permisos.

### Ejemplo:
Archivo: [src/app/modules/abm/abm-usuarios/abm-usuarios.module.ts](src/app/modules/abm/abm-usuarios/abm-usuarios.module.ts)
```typescript
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ABMUsuariosComponent } from './abm-usuarios.component';
import { ABMUsuariosUserComponent } from './usuarios-user/usuarios-user.component';
import { ABMUsuariosGrillaComponent } from './usuarios-grilla/usuarios-grilla.component';
import { ABMUsuariosCrearComponent } from './usuarios-crear/usuarios-crear.component';

import { PermissionGuard } from 'app/core/auth/guards/permission.guard'; // Importa el guard

const routes: Routes = [
    {
        path: '',
        component: ABMUsuariosComponent,
        children: [
            {
                path: 'user/:id',
                component: ABMUsuariosUserComponent,
                canActivate: [PermissionGuard],
                data: { permission: 'USUARIO_MODIFY' }, // Permiso para esta ruta
            },
            {
                path: 'grid',
                component: ABMUsuariosGrillaComponent,
                canActivate: [PermissionGuard],
                data: { permission: 'USUARIO_READ' }, // Permiso para esta ruta
            },
            {
                path: 'create',
                component: ABMUsuariosCrearComponent,
                canActivate: [PermissionGuard],
                data: { permission: 'USUARIO_CREATE' }, // Permiso para esta ruta
            },
        ],
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class ABMUsuariosRoutingModule {}
```

### Resultado:
- Solo los usuarios con `USUARIO_MODIFY` podrán acceder a `/usuarios/user/:id`.
- Solo los usuarios con `USUARIOS_READ` podrán acceder a `/usuarios/grid`.
- Solo los usuarios con `USUARIOS_CREATE` podrán acceder a `/usuarios/create`. 

Esto asegura que cada ruta hija esté protegida según los permisos configurados.