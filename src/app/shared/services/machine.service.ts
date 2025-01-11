import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { IMachine } from 'app/shared/models/machine.model';

@Injectable({
  providedIn: 'root'
})
export class MachineService {
  private selectedMachineSubject: BehaviorSubject<IMachine | null> = new BehaviorSubject<IMachine | null>(null);
  // eslint-disable-next-line @typescript-eslint/member-ordering
  public selectedMachine$: Observable<IMachine | null> = this.selectedMachineSubject.asObservable();

  private subtitleSubject: BehaviorSubject<string> = new BehaviorSubject<string>('');
  // eslint-disable-next-line @typescript-eslint/member-ordering
  public subtitle$: Observable<string> = this.subtitleSubject.asObservable();

  setSelectedMachine(machine: IMachine | null): void {
    this.selectedMachineSubject.next(machine);
  }

  getSelectedMachine(): IMachine | null {
    return this.selectedMachineSubject.value;
  }

  setSubtitle(subtitle: string): void {
    this.subtitleSubject.next(subtitle);
  }
}
