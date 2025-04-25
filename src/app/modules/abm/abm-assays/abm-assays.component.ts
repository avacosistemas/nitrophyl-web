import {
  AfterContentChecked,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { map, Observable, Subscription } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';

// * Services.
import { AssayService } from 'app/shared/services/assay.service';
import { ConfigTestService } from 'app/shared/services/config-test.service';
import { FormulasService } from 'app/shared/services/formulas.service';

// * Interfaces.
import {
  IConfigTest,
  IConfigTestResponse,
  IConfigTestsResponse,
} from 'app/shared/models/config-test.interface';
import { IFormula } from 'app/shared/models/formula.interface';

@Component({
  selector: 'abm-assays',
  templateUrl: './abm-assays.component.html',
})
export class ABMAssaysComponent
  implements OnInit, AfterContentChecked, OnDestroy {
  public title: string = 'Ensayos';
  public lot: string = '';
  public machine: FormControl = new FormControl();
  public machines$: Observable<IConfigTest[]>;

  public subtitle: string;
  public formula: IFormula | undefined;

  private subscription: Subscription;
  public isModalOpen: boolean = false;
  public selectedMachineName: string = '';

  constructor(
    private configTestService: ConfigTestService,
    private assayService: AssayService,
    private router: Router,
    private _cdr: ChangeDetectorRef,
    private formulasService: FormulasService,
    private snackBar: MatSnackBar,
  ) { }

  handleAction(action: string): void {
    switch (action) {
      case 'close':
        this.close();
        break;
      default:
        console.log('Acción desconocida:', action);
        break;
    }
  }

  public ngOnInit(): void {
    if (!this.assayService.lot || !this.assayService.lot.idFormula) {
      this.router.navigate(['../../lotes/grid']);
      return;
    }

    this.title = `Ensayos del Lote ${this.assayService.lot?.nroLote}`;
    this.lot = `Lote ${this.assayService.lot?.nroLote}`;

    this.formulasService.get({ id: this.assayService.lot.idFormula, labelCombo: '' }).subscribe({
      next: (response: { data: any }) => {
        if (response && response.data) {
          this.formula = response.data;
          this.subtitle = `Fórmula: ${this.formula.labelCombo} - R${this.assayService.lot?.revision}`;
        }
      },
      error: (error: any) => {
        console.error('Error al obtener la fórmula:', error);
      }
    });

    this.machines$ = this.configTestService
      .getMachinesVigentes(this.assayService.lot.id)
      .pipe(
        map((res: IConfigTestsResponse | IConfigTestResponse) =>
          Array.isArray(res.data) ? res.data : [res.data]
        )
      );

    this.subscription = this.machine.valueChanges.subscribe(selectedMachineId => {
      if (selectedMachineId) {
        this.machines$.subscribe(machines => {
          const selectedMachine = machines.find(machine => machine.id === selectedMachineId);
          if (selectedMachine) {
            this.selectedMachineName = selectedMachine.maquina;
          } else {
            this.selectedMachineName = '';
          }
        });

        this.assayService.machine = selectedMachineId;
      }
    });

    this.assayService.isModalOpen$.subscribe(isOpen => {
      this.isModalOpen = isOpen;
    });

    this.assayService.resetSelect.subscribe(() => {
      this.machine.setValue(null);
    })
  }

  public ngAfterContentChecked(): void {
    this._cdr.detectChanges();
  }

  public close(): void {
    this.router.navigate(['../../lotes/grid']);
  }

  public ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  public add(): void {
    this.assayService.mode = 'create';

    this.assayService.openModal.next({
      mode: 'create',
      machineId: this.assayService.machine,
      machineName: this.selectedMachineName
    });
  }

  private openSnackBar(option: boolean, message?: string, css?: string, duration?: number): void {
    const defaultMessage: string = option ? 'Cambios realizados.' : 'No se pudieron realizar los cambios.';
    const defaultCss: string = option ? 'green' : 'red';
    const snackBarMessage = message ? message : defaultMessage;
    const snackBarCss = css ? css : defaultCss;
    const snackBarDuration = duration ? duration : 5000;

    this.snackBar.open(snackBarMessage, 'X', {
      duration: snackBarDuration,
      panelClass: `${css}-snackbar`,
    });
  }
}