import { EventEmitter, Injectable } from "@angular/core";

@Injectable({
    providedIn: 'root'
})

export class ProductsEventService {
    events = new EventEmitter<any>();
    viewEvents = new EventEmitter<any>();

    private mode: string = null;

    public setMode(mode: string) {
        this.mode = mode;
    }

    public getMode() {
        return this.mode;
    }
}