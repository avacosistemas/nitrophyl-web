import { Injectable } from '@angular/core';
import { FuseNavigationItem } from '@fuse/components/navigation';

@Injectable({
  providedIn: 'root',
})
export class NavegacionService {
  private vistas: FuseNavigationItem[] = [
    // {
    //     icon: "heroicons_outline:chart-pie",
    //     id: "example",
    //     link: "/example",
    //     title: "Example",
    //     type: "basic"
    // },
    {
      icon: 'mat_solid:biotech',
      id: 'laboratorio',
      title: 'Laboratorio',
      type: 'collapsable',
      children: [
        {
          icon: 'heroicons_outline:beaker',
          id: 'formulas',
          link: '/formulas/grid',
          title: 'Fórmulas',
          type: 'basic',
        },
        {
          icon: 'heroicons_outline:calculator',
          id: 'maquinas',
          link: '/maquinas/grid',
          title: 'Máquinas',
          type: 'basic',
        },
        {
          icon: '', // ! Icono pendiente.
          id: 'lotes',
          link: '/lotes/grid',
          title: 'Lotes',
          type: 'basic',
        },
      ],
    },
    {
      icon: 'heroicons_outline:briefcase',
      id: 'administracion',
      title: 'Administración',
      type: 'collapsable',
      children: [
        {
          icon: 'heroicons_solid:identification',
          id: 'clientes',
          link: '/clientes/grid',
          title: 'Clientes',
          type: 'basic',
        },
      ],
    },
    {
      icon: 'mat_solid:engineering',
      id: 'produccion',
      title: 'Producción',
      type: 'collapsable',
      children: [
        {
          icon: 'mat_solid:app_registration',
          id: 'moldes',
          link: '/moldes/grid',
          title: 'Moldes',
          type: 'basic',
        },
        {
          icon: 'heroicons_outline:cube-transparent',
          id: 'piezas',
          link: '/piezas/grid',
          title: 'Piezas',
          type: 'basic',
        },
        {
          icon: 'heroicons_outline:cube',
          id: 'productos',
          link: '/productos/grid',
          title: 'Prouctos',
          type: 'basic',
        },
      ],
    },
    {
      icon: 'heroicons_outline:cog',
      id: 'security',
      title: 'Seguridad',
      type: 'collapsable',
      children: [
        {
          icon: 'heroicons_outline:users',
          id: 'usuarios',
          link: '/usuarios/grid',
          title: 'Usuarios',
          type: 'basic',
        },
        {
          icon: 'heroicons_outline:flag',
          id: 'roles',
          link: '/roles/grid',
          title: 'Roles',
          type: 'basic',
        },
        {
          icon: 'heroicons_outline:key',
          id: 'permisos',
          link: '/permisos/grid',
          title: 'Permisos',
          type: 'basic',
        },
        {
          icon: 'heroicons_outline:view-grid',
          id: 'perfiles',
          link: '/perfiles/grid',
          title: 'Perfiles',
          type: 'basic',
        },
      ],
    },
  ];

  public get(): FuseNavigationItem[] {
    return this.vistas;
  }
}
