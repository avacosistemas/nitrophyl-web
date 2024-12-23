import { EventEmitter, Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})

export class ABMPerfilService {
    events = new EventEmitter<any>();
}
