import { Route } from '@angular/router';
import { AuthGuard } from 'app/core/auth/guards/auth.guard';
import { NoAuthGuard } from 'app/core/auth/guards/noAuth.guard';
import { LayoutComponent } from 'app/layout/layout.component';
import { InitialDataResolver } from 'app/app.resolvers';

// @formatter:off
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
export const appRoutes: Route[] = [
  // Redirect empty path to '/example'
  { path: '', pathMatch: 'full', redirectTo: 'example' },

  // Redirect signed in user to the '/example'
  //
  // After the user signs in, the sign in page will redirect the user to the 'signed-in-redirect'
  // path. Below is another redirection for that path to redirect the user to the desired
  // location. This is a small convenience to keep all main routes together here on this file.
  { path: 'signed-in-redirect', pathMatch: 'full', redirectTo: 'example' },

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

  // Landing routes
  {
    path: '',
    component: LayoutComponent,
    data: {
      layout: 'empty',
    },
    children: [
      {
        path: 'home',
        loadChildren: () =>
          import('app/modules/landing/home/home.module').then(
            (m: any) => m.LandingHomeModule
          ),
      },
    ],
  },

  {
    path: '',
    component: LayoutComponent,
    resolve: {
      initialData: InitialDataResolver,
    },
    children: [
      {
        path: 'usuarios',
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
    ],
  },

  // Admin routes
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
    ],
  },
];
