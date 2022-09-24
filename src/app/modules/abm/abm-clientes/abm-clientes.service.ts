import { EventEmitter, Injectable } from "@angular/core";

@Injectable({
    providedIn: 'root'
})

export class ABMClientesService {
    events = new EventEmitter<any>();
    viewEvents = new EventEmitter<any>();
}