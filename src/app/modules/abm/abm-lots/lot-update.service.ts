import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LotUpdateService {
  private updateTableSubject = new Subject<void>();

  updateTable$ = this.updateTableSubject.asObservable();

  requestUpdate(): void {
    this.updateTableSubject.next();
  }
}
