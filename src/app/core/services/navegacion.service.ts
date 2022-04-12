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
            icon: "heroicons_outline:user-group",
            id: "usuarios",
            link: "/usuarios",
            title: "Usuarios",
            type: "basic"
        },
        {
            icon: "heroicons_outline:flag",
            id: "roles",
            link: "/roles",
            title: "Roles",
            type: "basic"
        },
        {
            icon: "heroicons_outline:key",
            id: "permisos",
            link: "/permisos",
            title: "Permisos",
            type: "basic"
        },
        {
            icon: "heroicons_outline:view-grid",
            id: "perfiles",
            link: "/perfiles",
            title: "Perfiles",
            type: "basic"
        },
    ]

    public get() {
        return this.vistas
    }
}