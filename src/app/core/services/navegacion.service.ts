import { Injectable } from "@angular/core";
import { FuseNavigationItem } from "@fuse/components/navigation";

@Injectable({
    providedIn: 'root'
})

export class NavegacionService {
    private vistas: FuseNavigationItem[] = [
        /*
        {
            icon: "heroicons_outline:chart-pie",
            id: "example",
            link: "/example",
            title: "Example",
            type: "basic"
        },
        */
        
        {
            icon: "heroicons_outline:cog",
            id: "security",
            title: "Security",
            type: "collapsable",
            children: [
                {
                    icon: "heroicons_outline:users",
                    id: "usuarios",
                    link: "/usuarios/grid",
                    title: "Usuarios",
                    type: "basic"
                },
                {
                    icon: "heroicons_outline:flag",
                    id: "roles",
                    link: "/roles/grid",
                    title: "Roles",
                    type: "basic"
                },
                {
                    icon: "heroicons_outline:key",
                    id: "permisos",
                    link: "/permisos/grid",
                    title: "Permisos",
                    type: "basic"
                },
                {
                    icon: "heroicons_outline:view-grid",
                    id: "perfiles",
                    link: "/perfiles/grid",
                    title: "Perfiles",
                    type: "basic"
                }
            ]
        },
        {
            icon: "heroicons_outline:book-open",
            id: "moldes",
            link: "/moldes/grid",
            title: "Moldes",
            type: "basic"
        },
        {
            icon: "heroicons_outline:beaker",
            id: "formulas",
            title: "Fórmulas",
            type: "basic"
        },
        {
            icon: "heroicons_outline:cube-transparent",
            id: "piezas",
            title: "Piezas",
            type: "basic"
        },
        {
            icon: "heroicons_outline:cube",
            id: "productos",
            title: "Prouctos",
            type: "basic"
        },
    ]

    public get() {
        return this.vistas
    }
}