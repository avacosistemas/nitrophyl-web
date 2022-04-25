import { EventEmitter, Injectable } from "@angular/core";

@Injectable({
    providedIn: 'root'
})

export class ABMPermisoService {
    events = new EventEmitter<any>();
}