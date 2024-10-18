import {
  AfterContentChecked,
  ChangeDetectorRef,
  Component,
} from '@angular/core';
import { Router } from '@angular/router';

// * Services.
import { FormulasService } from 'app/shared/services/formulas.service';
import { MachinesService } from 'app/shared/services/machines.service';

// * Forms.
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';

export interface ITestTitle {
  fecha: Date;
  id: number;
  idMaterial: number;
  material: string;
  nombre: string;
  norma: string;
  version: number;
}

@Component({
  selector: 'abm-formula',
  templateUrl: './abm-formula.component.html',
  styleUrls: ['./abm-formula.component.scss'],
})
export class ABMFormulaComponent implements AfterContentChecked {
  public action: boolean = false;

  public title: string = '';

  // * Test mode:
  public testMode: boolean = false;
  public status: boolean = false;
  public addMachineTest: boolean = false;
  public testTitle: string = '';
  public testObj: any = {};
  public formTest: FormGroup;
  public machines$: any = [];

  private action$: Subscription;

  constructor(
    private _formulas: FormulasService,
    private _machines: MachinesService,
    private router: Router,
    private formBuilder: FormBuilder,
    private cdref: ChangeDetectorRef
  ) {
    this.action$ = this._formulas.actions$.subscribe((option: boolean) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      option ? this.formTest.disable() : this.formTest.enable();
      this.action = option;
    });
    this.setForm();
  }

  public ngAfterContentChecked(): void {
    this.cdref.detectChanges();
  }

  public componentAdded(event: any): void {
    if (event.component === 'all') {
      this.title = 'Consultar Fórmulas';
    } else if (event.component === 'Mode') {
      switch (this._formulas.getMode()) {
        case 'Create':
          this.title = 'Crear Fórmula';
          break;
        case 'View':
          this.title = 'Consultar Fórmula';
          break;
        case 'Edit':
          this.title = 'Crear Nueva Versión';
          break;
        case 'Test':
          this.configTest();
          break;
        default:
          break;
      }
    }
  }

  public create(): void {
    this._formulas.setMode('Create');
    this.router.navigate(['../formulas/create']);
  }

  public close(): void {
    this._formulas.events.next(1);
  }

  public edit(): void {
    this._formulas.events.next(2);
  }

  public save(): void {
    this._formulas.events.next(3);
  }

  public addMachine(): void {
    if (this.formTest.invalid) {return;}
    const machine: any = this.formTest.controls.machine;
    this._formulas.events.next([4, machine.value.id, machine.value.nombre]);
    machine.reset();
  }

  private configTest(): void {
    this.machines$ = [];
    this.formTest.controls.machine.reset();
    this.testObj = this._formulas.getTestTitle();
    this.title = 'Test';
    this.addMachineTest = true;
    const error: string = 'abm-formula.component.ts => componentAdded => ';
    this._machines.get().subscribe({
      next: (res: any) => {
        this.machines$ = [...res.data];
      },
      error: (err: any) => {
        console.error(error, err);
        this.formTest.disable();
        this.status = true;
      },
      complete: () => {},
    });
  }

  private setForm(): void {
    this.formTest = this.formBuilder.group({
      machine: [null, Validators.required],
    });
  }
}
