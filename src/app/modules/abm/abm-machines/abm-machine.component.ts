import {
  AfterContentChecked,
  ChangeDetectorRef,
  Component,
} from '@angular/core';
import { Router } from '@angular/router';

// * Services.
import { MachinesService } from 'app/shared/services/machines.service';

@Component({
  selector: 'abm-machine',
  templateUrl: './abm-machine.component.html',
  styleUrls: ['./abm-machine.component.scss'],
})
export class ABMMachineComponent implements AfterContentChecked {
  public title: string = '';

  constructor(
    private _machines: MachinesService,
    private router: Router,
    private cdref: ChangeDetectorRef
  ) {}

  public ngAfterContentChecked(): void {
    this.cdref.detectChanges();
  }

  public componentAdded(event: any): void {
    if (event.component === 'all') {
      this.title = 'Consultar Máquinas';
    } else if (event.component === 'Mode') {
      switch (this._machines.getMode()) {
        case 'Create':
          this.title = 'Crear Máquina';
          break;
        case 'View':
          this.title = 'Consultar Máquina';
          break;
        case 'Edit':
          this.title = 'Editar Máquina';
          break;
        case 'Test':
          this.title = 'Pruebas';
          break;
        default:
          break;
      }
    }
  }

  public create(): void {
    this._machines.setMode('Create');
    this.router.navigate(['../maquinas/create']);
  }

  public close(): void {
    this._machines.events.next(1);
  }

  public edit(): void {
    this._machines.events.next(2);
  }

  public save(): void {
    this._machines.events.next(3);
  }
}
