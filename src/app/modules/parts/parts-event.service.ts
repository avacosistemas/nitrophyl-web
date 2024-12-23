import { EventEmitter, Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})

export class PartsEventService {
    events = new EventEmitter<any>();
    viewEvents = new EventEmitter<any>();

    private mode: string = null;

    public setMode(mode: string): void {
        this.mode = mode;
    }

    public getMode(): string {
        return this.mode;
    }
}
