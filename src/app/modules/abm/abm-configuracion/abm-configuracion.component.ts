import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ConfiguracionService } from 'app/shared/services/configuracion.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'app-abm-configuracion',
  templateUrl: './abm-configuracion.component.html',
  styleUrls: ['./abm-configuracion.component.scss']
})
export class ABMConfiguracionComponent implements OnInit {

  public component: string = 'all';
  public title: string = '';
  public testObj: any = {};

  private action$: Subscription;
  public action: boolean = false;
  public formTest: FormGroup;

  constructor(
    private configuracionService: ConfiguracionService,
    private router: Router,
    private cdref: ChangeDetectorRef
  ) {
 this.action$ = this.configuracionService.actions$.subscribe((option: boolean) => {
      option ? this.formTest.disable() : this.formTest.enable();
      this.action = option;
    });
  }

  public componentAdded(event: any): void {
    if (event.component === 'all') {
      this.title = 'Consultar Configuraciones';
    } else if (event.component === 'Mode') {
      switch (this.configuracionService.getMode()) {
        case 'Create':
          this.title = 'Crear Configuración';
          break;
        case 'View':
          this.title = 'Consultar Configuración';
          break;
        case 'Edit':
          this.title = 'Editar Configuración';
          break;
        default:
          break;
      }
    }
  }

  ngOnInit(): void {
  }

  public ngAfterContentChecked(): void {
    this.cdref.detectChanges();
  }

  public create(): void {
    this.configuracionService.setMode('Create');
    this.router.navigate(['../configuracion/create']);
  }

  public close(): void {
    this.configuracionService.events.next(1);
  }

  public edit(): void {
    this.configuracionService.events.next(2);
  }

  public save(): void {
    this.configuracionService.events.next(3);
  }
}
