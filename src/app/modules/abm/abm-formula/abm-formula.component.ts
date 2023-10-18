import {
  AfterContentChecked,
  ChangeDetectorRef,
  Component,
} from '@angular/core';
import { Router } from '@angular/router';

// * Services.
import { FormulasService } from 'app/shared/services/formulas.service';

// * Forms.
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'abm-formula',
  templateUrl: './abm-formula.component.html',
  styleUrls: ['./abm-formula.component.scss'],
})
export class ABMFormulaComponent implements AfterContentChecked {
  public formTest: FormGroup;
  public title: string = '';

  constructor(
    private _formulas: FormulasService,
    private router: Router,
    private formBuilder: FormBuilder,
    private cdref: ChangeDetectorRef
  ) {
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
          this.title = 'Pruebas Fórmula';
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

  public test(): void {
    if (this.formTest.invalid) {
      return;
    }
    this._formulas.events.next(4);
  }

  private setForm(): void {
    this.formTest = this.formBuilder.group({
      machine: [null, Validators.required],
    });
  }
}
