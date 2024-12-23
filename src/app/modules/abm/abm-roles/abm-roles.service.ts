import { EventEmitter, Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})

export class ABMRolService {
    events = new EventEmitter<any>();
}
