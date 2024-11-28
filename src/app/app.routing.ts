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
        path: 'sign-out',
        loadChildren: () =>
          import('app/modules/auth/sign-out/sign-out.module').then(
            (m: any) => m.AuthSignOutModule
          ),
      },
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
        data: { permission: 'USUARIO_READ' },
        loadChildren: () =>
          import('app/modules/abm/abm-usuarios/abm-usuarios.module').then(
            (m: any) => m.ABMUsuariosModule
          ),
      },
      {
        path: 'roles',
        loadChildren: () =>
          import('app/modules/abm/abm-roles/abm-roles.module').then(
            (m: any) => m.ABMRolesModule
          ),
      },
      {
        path: 'permisos',
        canActivate: [PermissionGuard],
        data: { permission: 'PERMISOS_READ' },
        loadChildren: () =>
          import('app/modules/abm/abm-permisos/abm-permisos.module').then(
            (m: any) => m.ABMPermisosModule
          ),
      },
      {
        path: 'perfiles',
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
        path: 'piezas',
        loadChildren: () =>
          import('app/modules/parts/parts.module').then(
            (m: any) => m.PartsModule
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
        data: { permission: 'LISTADO_CLIENTE_CREATE' },
        loadChildren: () =>
          import('app/modules/abm/abm-clientes/abm-clientes.module').then(
            (m: any) => m.ABMClientesModule
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
        path: 'configuracion',
        loadChildren: () =>
          import('app/modules/abm/abm-configuracion/abm-configuracion.module').then(
            (m: any) => m.ABMConfiguracionModule
          )
      },
    ],
  },
];
