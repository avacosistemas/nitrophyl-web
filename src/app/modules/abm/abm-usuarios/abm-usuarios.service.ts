import { EventEmitter, Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})

export class ABMUsuarioService {
    events = new EventEmitter<any>();
}
