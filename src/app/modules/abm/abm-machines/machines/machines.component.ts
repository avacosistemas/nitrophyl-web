import { AfterViewInit, Component, OnInit, OnDestroy } from '@angular/core';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { BehaviorSubject, Subscription } from 'rxjs';
// * Services.
import { MachinesService } from 'app/shared/services/machines.service';

// * Interfaces.
import { IMachineResponse, IMachine } from 'app/shared/models/machine.model';

// * Forms.
import { FormBuilder, FormGroup } from '@angular/forms';

import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-machines',
  templateUrl: './machines.component.html',
  styleUrls: ['./machines.component.scss'],
})
export class MachinesComponent implements OnInit, AfterViewInit {

  public component: string = 'all';

  public form: FormGroup;

  public machines$: BehaviorSubject<IMachine[]> = new BehaviorSubject<IMachine[]>([]);
  public displayedColumns: string[] = ['position', 'name', 'status', 'actions'];

  public showSuccess: boolean = false;
  public showError: boolean = false;
  public panelOpenState: boolean = false;

  private machinesBackUp$: IMachine[] = [];
  private machinesSubscription: Subscription;
  private machinesEventSubscription: Subscription;

  constructor(
    private _machines: MachinesService,
    private formBuilder: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    this.setForm();
  }

  public ngOnInit(): void {
    this.get();
    this.machines$.next([]);
  }

  public ngOnDestroy(): void {
    if (this.machinesSubscription) {
      this.machinesSubscription.unsubscribe();
    }
    if (this.machinesEventSubscription) {
      this.machinesEventSubscription.unsubscribe();
    }
  }

  public ngAfterViewInit(): void {
    let top = document.getElementById('top');
    if (top !== null) {
      top.scrollIntoView();
      top = null;
    }
  }

  drop(event: CdkDragDrop<IMachine[]>): void {
    const previousIndex = this.machines$.value.findIndex(d => d === event.item.data);

    if (previousIndex !== event.currentIndex) { 
      moveItemInArray(this.machines$.value, previousIndex, event.currentIndex);
      this.updatePositions();
      this.machines$.next([...this.machines$.value]);
      this.saveOrder();
    }
  }

  updatePositions(): void {
    const currentMachines = this.machines$.value;
    currentMachines.forEach((machine, index) => {
      machine.posicion = index + 1;
    });
    this.machines$.next([...currentMachines]);
  }

  public mode(option: number): void {
    switch (option) {
      case 1:
        this._machines.setMode('Edit');
        break;
      case 2:
        this._machines.setMode('View');
        break;
      case 3:
        this._machines.setMode('Test');
        break;
      default:
        break;
    }
  }

  public search(): void {
    if (!this.form.controls.name.value && !this.form.controls.status.value)
      {this.machines$.next(this.machinesBackUp$);}

    if (this.form.controls.name.value && this.form.controls.status.value)
      {this.compare();}

    if (this.form.controls.name.value && !this.form.controls.status.value)
      {this.compareMachine();}

    if (!this.form.controls.name.value && this.form.controls.status.value)
      {this.compareStatus();}
  }

  private compare(): void {
    this.machines$.next(
      this.machinesBackUp$.filter(
        (machine: IMachine) =>
          machine.estado === this.form.controls.status.value &&
          machine.nombre
            ?.toLowerCase()
            .includes(this.form.controls.name.value.toLowerCase())
      )
    );
  }

  private compareMachine(): void {
    this.machines$.next(
      this.machinesBackUp$.filter((machine: IMachine) =>
        machine.nombre
          ?.toLowerCase()
          .includes(this.form.controls.name.value.toLowerCase())
      )
    );
  }

  private compareStatus(): void {
    this.machines$.next(
      this.machinesBackUp$.filter(
        (machine: IMachine) =>
          machine.estado === this.form.controls.status.value
      )
    );
  }

  private get(body?: IMachine): void {
    const error: string = 'MachinesComponent => get(): ';
    this._machines.get(body).subscribe({
      next: (res: IMachineResponse) => {
        this.machines$.next(res.data.sort((a, b) => a.posicion - b.posicion));
        this.machinesBackUp$ = res.data;
      },
      error: (err: any) => console.error(error, err),
      complete: () => {},
    });
  }

  private saveOrder(): void {
    const updatedMachines = this.machines$.value;
    this._machines.updateMachineOrder(updatedMachines).subscribe({
      next: (res: any) => {
        if (res.status === 'OK') {
          this.openSnackBar(true);
        } else {
          this.openSnackBar(false);
        }
      },
      error: () => {
        this.openSnackBar(false);
      },
    });
  }

  private setForm(): void {
    this.form = this.formBuilder.group({ name: [null], status: [null] });
  }

  private openSnackBar(option: boolean): void {
    const message: string = option
      ? 'Cambios realizados.'
      : 'No se pudieron realizar los cambios.';
    const css: string = option ? 'green' : 'red';
    this.snackBar.open(message, 'X', {
      duration: 5000,
      panelClass: `${css}-snackbar`,
    });
  }
}
