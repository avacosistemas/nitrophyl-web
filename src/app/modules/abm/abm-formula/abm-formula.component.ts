import {
  AfterContentChecked,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

// * Services.
import { FormulaService } from 'app/shared/services/formula.service';

@Component({
  selector: 'abm-formula',
  templateUrl: './abm-formula.component.html',
  styleUrls: ['./abm-formula.component.scss'],
})
export class ABMFormulaComponent implements AfterContentChecked {
  public title: string = '';

  constructor(
    private _formulas: FormulaService,
    private router: Router,
    private cdref: ChangeDetectorRef
  ) {}

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
          this.title = 'Editar Fórmula';
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
}
