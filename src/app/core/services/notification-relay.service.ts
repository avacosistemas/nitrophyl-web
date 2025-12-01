import { Injectable } from '@angular/core';

export interface RelayMessage {
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    duration?: number;
}

@Injectable({
    providedIn: 'root'
})
export class NotificationRelayService {

    private message: RelayMessage | null = null;

    constructor() { }

    public setMessage(message: RelayMessage): void {
        this.message = message;
    }

    public consumeMessage(): RelayMessage | null {
        if (!this.message) {
            return null;
        }

        const consumedMessage = this.message;
        this.message = null;
        return consumedMessage;
    }
}