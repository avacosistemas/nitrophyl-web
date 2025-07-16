import { Injectable } from '@angular/core';
import { FuseNavigationItem } from '@fuse/components/navigation';
import { AuthService } from 'app/core/auth/auth.service';

@Injectable({
  providedIn: 'root',
})
export class NavegacionService {

  private vistas: FuseNavigationItem[] = [
    {
      icon: 'heroicons_outline:document-report',
      id: 'informes',
      title: 'Informes',
      permissionCode: 'MENU_INFORMES',
      type: 'collapsable',
      children: [
        {
          id: 'resultados',
          link: '/resultados/maquina',
          title: 'Resultados',
          type: 'basic',
          permissionCode: 'MENU_INFORME_MAQUINAS',
        },
        {
          id: 'calidad',
          link: '/reports',
          title: 'Calidad',
          type: 'basic',
          permissionCode: 'MENU_INFORME_CALIDAD',
        },
        {
          id: 'configuracion',
          link: '/configuracion/grid',
          title: 'Configuración Calidad',
          permissionCode: 'MENU_CONF_INFORME_CALIDAD',
          type: 'basic',
        }
      ]
    },
    {
      icon: 'mat_solid:biotech',
      id: 'laboratorio',
      title: 'Laboratorio',
      type: 'collapsable',
      permissionCode: 'MENU_LABORATORIO',
      children: [
        {
          icon: 'heroicons_outline:calculator',
          id: 'maquinas',
          link: '/maquinas/grid',
          title: 'Máquinas',
          permissionCode: 'MENU_LABORATORIO_MAQUINAS',
          type: 'basic',
        },
        {
          icon: 'heroicons_outline:beaker',
          id: 'formulas',
          link: '/formulas/grid',
          title: 'Fórmulas',
          permissionCode: 'MENU_LABORATORIO_FORMULAS',
          type: 'basic',
        },
        {
          icon: 'mat_solid:auto_awesome_motion',
          id: 'lotes',
          link: '/lotes/grid',
          title: 'Lotes',
          permissionCode: 'MENU_LABORATORIO_LOTES',
          type: 'basic',
        },
        {
          icon: 'mat_solid:monitor',
          id: 'monitor',
          link: '/monitor/full',
          title: 'Monitor',
          permissionCode: 'MENU_LABORATORIO_MONITOR',
          type: 'basic',
        }
      ]
    },
    {
      icon: 'heroicons_outline:briefcase',
      id: 'administracion',
      title: 'Administración',
      type: 'collapsable',
      permissionCode: 'MENU_ADMINISTRACION',
      children: [
        {
          icon: 'heroicons_solid:identification',
          id: 'clientes',
          link: '/clientes/grid',
          title: 'Clientes',
          permissionCode: 'MENU_ADMINISTRACION_CLIENTES',
          type: 'basic',
        },
      ],
    },
    {
      icon: 'mat_solid:engineering',
      id: 'produccion',
      title: 'Producción',
      type: 'collapsable',
      permissionCode: 'MENU_PRODUCCION',
      children: [
        {
          icon: 'mat_solid:app_registration',
          id: 'moldes',
          link: '/moldes/grid',
          title: 'Moldes',
          permissionCode: 'MENU_PRODUCCION_MOLDES',
          type: 'basic',
        },
        {
          icon: 'heroicons_outline:cube-transparent',
          id: 'procesos-piezas',
          link: '/procesos-piezas',
          title: 'Procesos y Piezas',
          permissionCode: 'MENU_PROCESOS_PIEZAS',
          type: 'basic',
        },
        {
          icon: 'heroicons_outline:color-swatch',
          id: 'pieza-tipo',
          link: '/pieza-tipo/grid',
          title: 'Tipos de Pieza',
          permissionCode: 'MENU_PIEZA_TIPO',
          type: 'basic',
        },
      ],
    },
    {
      icon: 'heroicons_outline:cog',
      id: 'security',
      title: 'Seguridad',
      permissionCode: 'MENU_SEGURIDAD',
      type: 'collapsable',
      children: [
        {
          icon: 'heroicons_outline:users',
          id: 'usuarios',
          link: '/usuarios/grid',
          title: 'Usuarios',
          permissionCode: 'MENU_SEGURIDAD_USUARIOS',
          type: 'basic',
        },
        {
          icon: 'heroicons_outline:flag',
          id: 'roles',
          link: '/roles/grid',
          title: 'Roles',
          permissionCode: 'MENU_SEGURIDAD_ROLES',
          type: 'basic',
        },
        {
          icon: 'heroicons_outline:key',
          id: 'permisos',
          link: '/permisos/grid',
          title: 'Permisos',
          type: 'basic',
          permissionCode: 'MENU_SEGURIDAD_PERMISOS',
        },
        {
          icon: 'heroicons_outline:view-grid',
          id: 'perfiles',
          link: '/perfiles/grid',
          title: 'Perfiles',
          type: 'basic',
          permissionCode: 'MENU_SEGURIDAD_PERFILES',
        },
      ],
    },
  ];

  constructor(private authService: AuthService) { }

  public get(): FuseNavigationItem[] {
    const userPermissions: string[] = this.authService.getUserPermissions();

    return this.vistas.map((vista) => {
      if (vista.children) {
        vista.children = vista.children.filter((child) => {
          if (child.permissionCode) {
            return userPermissions.includes(child.permissionCode);
          }
          return true;
        });
      }

      if (vista.permissionCode) {
        return userPermissions.includes(vista.permissionCode) ? vista : null;
      }

      return vista;
    }).filter(Boolean);
  }
}
