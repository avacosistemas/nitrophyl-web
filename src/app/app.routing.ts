import { Route } from '@angular/router';
import { AuthGuard } from 'app/core/auth/guards/auth.guard';
import { NoAuthGuard } from 'app/core/auth/guards/noAuth.guard';
import { LayoutComponent } from 'app/layout/layout.component';
import { InitialDataResolver } from 'app/app.resolvers';
import { PermissionGuard } from 'app/core/auth/guards/permission.guard';

// @formatter:off
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
export const appRoutes: Route[] = [
  { path: '', pathMatch: 'full', redirectTo: 'welcome' },

  // { path: 'signed-in-redirect', pathMatch: 'full', redirectTo: 'usuarios/grid' },

  {
    path: '',
    component: LayoutComponent,
    data: {
      layout: 'empty'
    },
    children: [
      {
        path: 'sign-out',
        loadChildren: () => import('app/modules/auth/sign-out/sign-out.module').then(m => m.AuthSignOutModule)
      }
    ]
  },
  {
    path: '',
    canActivate: [AuthGuard],
    canActivateChild: [AuthGuard],
    component: LayoutComponent,
    data: {
      layout: 'empty',
    },
    children: [
      {
        path: 'unlock-session',
        loadChildren: () =>
          import('app/modules/auth/unlock-session/unlock-session.module').then(
            (m: any) => m.AuthUnlockSessionModule
          ),
      },
    ],
  },
  // Auth routes for guests
  {
    path: '',
    canActivate: [NoAuthGuard],
    canActivateChild: [NoAuthGuard],
    component: LayoutComponent,
    data: {
      layout: 'empty',
    },
    children: [
      {
        path: 'confirmation-required',
        loadChildren: () =>
          import(
            'app/modules/auth/confirmation-required/confirmation-required.module'
          ).then((m: any) => m.AuthConfirmationRequiredModule),
      },
      {
        path: 'forgot-password',
        loadChildren: () =>
          import(
            'app/modules/auth/forgot-password/forgot-password.module'
          ).then((m: any) => m.AuthForgotPasswordModule),
      },
      {
        path: 'reset-password',
        loadChildren: () =>
          import('app/modules/auth/reset-password/reset-password.module').then(
            (m: any) => m.AuthResetPasswordModule
          ),
      },
      {
        path: 'sign-in',
        loadChildren: () =>
          import('app/modules/auth/sign-in/sign-in.module').then(
            (m: any) => m.AuthSignInModule
          ),
      },
      {
        path: 'sign-up',
        loadChildren: () =>
          import('app/modules/auth/sign-up/sign-up.module').then(
            (m: any) => m.AuthSignUpModule
          ),
      },
    ],
  },

  // Auth routes for authenticated users
  {
    path: '',
    canActivate: [AuthGuard],
    canActivateChild: [AuthGuard],
    component: LayoutComponent,
    data: {
      layout: 'empty',
    },
    children: [
      {
        path: 'unlock-session',
        loadChildren: () =>
          import('app/modules/auth/unlock-session/unlock-session.module').then(
            (m: any) => m.AuthUnlockSessionModule
          ),
      },
    ],
  },

  {
    path: '',
    canActivate: [AuthGuard],
    canActivateChild: [AuthGuard],
    component: LayoutComponent,
    resolve: {
      initialData: InitialDataResolver,
    },
    children: [
      {
        path: 'example',
        loadChildren: () =>
          import('app/modules/admin/example/example.module').then(
            (m: any) => m.ExampleModule
          ),
      },
      {
        path: 'welcome',
        loadChildren: () =>
          import('app/modules/admin/welcome/welcome.module').then(
            (m: any) => m.WelcomeModule
          ),
      },
      {
        path: 'permission-denied',
        loadChildren: () =>
          import('app/modules/admin/permission-denied/permission-denied.module').then(
            (m: any) => m.PermissionDeniedModule
          ),
      },
      {
        path: 'usuarios',
        canActivate: [PermissionGuard],
        data: { permission: 'MENU_SEGURIDAD_USUARIOS' },
        loadChildren: () =>
          import('app/modules/abm/abm-usuarios/abm-usuarios.module').then(
            (m: any) => m.ABMUsuariosModule
          ),
      },
      {
        path: 'roles',
        canActivate: [PermissionGuard],
        data: { permission: 'MENU_SEGURIDAD_ROLES' },
        loadChildren: () =>
          import('app/modules/abm/abm-roles/abm-roles.module').then(
            (m: any) => m.ABMRolesModule
          ),
      },
      {
        path: 'permisos',
        canActivate: [PermissionGuard],
        data: { permission: 'MENU_SEGURIDAD_PERMISOS' },
        loadChildren: () =>
          import('app/modules/abm/abm-permisos/abm-permisos.module').then(
            (m: any) => m.ABMPermisosModule
          ),
      },
      {
        path: 'perfiles',
        canActivate: [PermissionGuard],
        data: { permission: 'MENU_SEGURIDAD_PERFILES' },
        loadChildren: () =>
          import('app/modules/abm/abm-perfiles/abm-perfiles.module').then(
            (m: any) => m.ABMPerfilesModule
          ),
      },
      {
        path: 'moldes',
        loadChildren: () =>
          import('app/modules/abm/abm-moldes/abm-moldes.module').then(
            (m: any) => m.ABMMoldesModule
          ),
      },
      {
        path: 'procesos-piezas',
        data: { permission: 'MENU_PROCESOS_PIEZAS' },
        loadChildren: () =>
          import('app/modules/abm/abm-piezas/abm-piezas.module').then(
            (m: any) => m.ABMPiezasModule
          ),
      },
      {
        path: 'pieza-tipo',
        data: { permission: 'MENU_PIEZA_TIPO' },
        loadChildren: () =>
          import('app/modules/abm/abm-pieza-tipo/abm-pieza-tipo.module').then(
            (m: any) => m.ABMPiezaTipoModule
          ),
      },
      {
        path: 'insumos',
        data: { permission: 'MENU_INSUMOS' },
        loadChildren: () =>
          import('app/modules/abm/abm-insumos/abm-insumos.module').then(
            (m: any) => m.ABMInsumosModule
          ),
      },
      {
        path: 'insumo-tipo',
        data: { permission: 'MENU_INSUMO_TIPO' },
        loadChildren: () =>
          import('app/modules/abm/abm-insumo-tipo/abm-insumo-tipo.module').then(
            (m: any) => m.ABMInsumoTipoModule
          ),
      },
      {
        path: 'adhesivos',
        data: { permission: 'MENU_ADHESIVOS' },
        loadChildren: () =>
          import('app/modules/abm/abm-adhesivos/abm-adhesivos.module').then(
            (m: any) => m.ABMAdhesivosModule
          ),
      },
      {
        path: 'tratamientos',
        data: { permission: 'MENU_TRATAMIENTOS' },
        loadChildren: () =>
          import('app/modules/abm/abm-tratamiento/abm-tratamiento.module').then(
            (m: any) => m.ABMTratamientosModule
          ),
      },
      {
        path: 'prensas',
        data: { permission: 'MENU_PRENSAS' },
        loadChildren: () =>
          import('app/modules/abm/abm-prensa/abm-prensa.module').then(
            (m: any) => m.ABMPrensasModule
          ),
      },
      {
        path: 'prensas',
        data: { permission: 'MENU_PRENSAS' },
        loadChildren: () =>
          import('app/modules/abm/abm-prensa/abm-prensa.module').then(
            (m: any) => m.ABMPrensasModule
          ),
      },
      {
        path: 'materias-primas',
        data: { permission: 'MENU_MATERIA_PRIMA' },
        loadChildren: () =>
          import('app/modules/abm/abm-materiaprima/abm-materiaprima.module').then(
            (m: any) => m.ABMMateriaPrimaModule
          ),
      },
      {
        path: 'productos',
        loadChildren: () =>
          import('app/modules/products/products.module').then(
            (m: any) => m.ProductsModule
          ),
      },
      {
        path: 'clientes',
        canActivate: [PermissionGuard],
        data: { permission: 'MENU_ADMINISTRACION_CLIENTES' },
        loadChildren: () =>
          import('app/modules/abm/abm-clientes/abm-clientes.module').then(
            (m: any) => m.ABMClientesModule
          ),
      },
      {
        path: 'cotizaciones',
        data: { permission: 'MENU_ADMINISTRACION_COTIZACION' },
        loadChildren: () =>
          import('app/modules/abm/abm-cotizaciones/cotizaciones.module').then(
            (m: any) => m.CotizacionesModule
          ),
      },
      {
        path: 'formulas',
        loadChildren: () =>
          import('app/modules/abm/abm-formula/abm-formula.module').then(
            (m: any) => m.ABMFormulaModule
          ),
      },
      {
        path: 'maquinas',
        loadChildren: () =>
          import('app/modules/abm/abm-machines/abm-machine.module').then(
            (m: any) => m.ABMMachineModule
          ),
      },
      {
        path: 'lotes',
        loadChildren: () =>
          import('app/modules/abm/abm-lots/abm-lots.module').then(
            (m: any) => m.ABMLotsModule
          ),
      },
      {
        path: 'ensayos',
        loadChildren: () =>
          import('app/modules/abm/abm-assays/abm-assays.module').then(
            (m: any) => m.ABMAssaysModule
          ),
      },
      {
        path: 'monitor',
        loadChildren: () =>
          import('app/modules/abm/grid-monitor/grid-monitor.module').then(
            (m: any) => m.GRIDMonitorModule
          ),
      },
      {
        path: 'reports',
        loadChildren: () =>
          import('app/modules/reports/reports.module').then(m => m.ReportsModule)
      },
      {
        path: 'registro-envios',
        data: { permission: 'MENU_INFORME_CALIDAD' },
        loadChildren: () =>
          import('app/modules/registro-envios/registro-envios.module').then(m => m.RegistroEnviosModule)
      },
      {
        path: 'resultados',
        loadChildren: () =>
          import('app/modules/resultados-maquina/resultados.module').then(m => m.ResultadosModule)
      },
      {
        path: 'configuracion',
        loadChildren: () =>
          import('app/modules/abm/abm-configuracion/abm-configuracion.module').then(
            (m: any) => m.ABMConfiguracionModule
          )
      },
      {
        path: 'change-password',
        loadChildren: () =>
          import('app/modules/auth/change-password/change-password.module').then(
            (m: any) => m.AuthChangePasswordModule
          ),
      },
    ],
  },
];
