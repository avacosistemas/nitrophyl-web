import { EventEmitter, Injectable } from "@angular/core";

@Injectable({
    providedIn: 'root'
})

export class ABMService {
    events = new EventEmitter<any>();
}