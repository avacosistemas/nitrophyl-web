import { AfterViewInit, Component, OnInit } from '@angular/core';

// * Services.
import { MachinesService } from 'app/shared/services/machines.service';

// * Interfaces.
import { IMachineResponse, IMachine } from 'app/shared/models/machine.model';

// * Forms.
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-machines',
  templateUrl: './machines.component.html',
})
export class MachinesComponent implements OnInit, AfterViewInit {
  private machinesBackUp$: IMachine[] = [];

  public component: string = 'all';

  public form: FormGroup;

  public machines$: IMachine[] | undefined;
  public displayedColumns: string[] = ['name', 'status', 'actions'];

  public showSuccess: boolean = false;
  public showError: boolean = false;
  public panelOpenState: boolean = false;

  constructor(
    private _machines: MachinesService,
    private formBuilder: FormBuilder
  ) {
    this.setForm();
  }

  public ngOnInit(): void {
    this.get();
  }

  public ngAfterViewInit(): void {
    let top = document.getElementById('top');
    if (top !== null) {
      top.scrollIntoView();
      top = null;
    }
  }

  public mode(option: number): void {
    switch (option) {
      case 1:
        this._machines.setMode('Edit');
        break;
      case 2:
        this._machines.setMode('View');
        break;
      default:
        break;
    }
  }

  public search(): void {
    if (!this.form.controls.name.value && !this.form.controls.status.value)
      this.machines$ = this.machinesBackUp$;

    if (this.form.controls.name.value && this.form.controls.status.value)
      this.compare();

    if (this.form.controls.name.value && !this.form.controls.status.value)
      this.compareMachine();

    if (!this.form.controls.name.value && this.form.controls.status.value)
      this.compareStatus();
  }

  private compare(): void {
    this.machines$ = this.machinesBackUp$.filter(
      (machine: IMachine) =>
        machine.estado === this.form.controls.status.value &&
        machine.nombre
          ?.toLowerCase()
          .includes(this.form.controls.name.value.toLowerCase())
    );
  }

  private compareMachine(): void {
    this.machines$ = this.machinesBackUp$.filter((machine: IMachine) =>
      machine.nombre
        ?.toLowerCase()
        .includes(this.form.controls.name.value.toLowerCase())
    );
  }

  private compareStatus(): void {
    this.machines$ = this.machinesBackUp$.filter(
      (machine: IMachine) => machine.estado === this.form.controls.status.value
    );
  }

  private get(body?: IMachine): void {
    let error: string = 'MachinesComponent => get(): ';
    this._machines.get(body).subscribe({
      next: (res: IMachineResponse) => {
        this.machines$ = res.data;
        this.machinesBackUp$ = res.data;
      },
      error: (err: any) => console.error(error, err),
      complete: () => {},
    });
  }

  private setForm(): void {
    this.form = this.formBuilder.group({ name: [null], status: [null] });
  }
}
