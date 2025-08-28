import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { AfterViewInit, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Cliente } from 'app/shared/models/cliente.model';
import { ClientesService } from 'app/shared/services/clientes.service';
import { NotificationService } from 'app/shared/services/notification.service';

@Component({
  selector: 'abm-clientes-grilla',
  templateUrl: './abm-clientes-grilla.component.html',
  styleUrls: ['./abm-clientes-grilla.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition(
        'expanded <=> collapsed',
        animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')
      ),
    ]),
  ],
})
export class ABMClientesGrillaComponent implements OnInit, AfterViewInit {
  component = 'Grilla';
  clienteForm: FormGroup;
  dataSource;
  columnsToDisplay = ['codigo', 'razonSocial', 'nombre', 'mail', 'cuit'];
  columnsToDisplayWithExpand = [...this.columnsToDisplay, 'expand'];
  expandedElement: Cliente | null;
  provincias = [];
  empresa = [
    { nombre: 'NITROPHYL' },
    { nombre: 'ELASINT' }
  ];

  ingresosBrutos = [
    { id: 1, name: 'Régimen General' },
    { id: 2, name: 'Régimen Simplificado' },
  ];

  constructor(
    private clientesService: ClientesService,
    private formBuilder: FormBuilder,
    private router: Router,
    private notificationService: NotificationService,
  ) {
    this.clienteForm = this.formBuilder.group({
      id: [null],
      codigo: [null],
      razonSocial: [null, [Validators.required]],
      email: [null, [Validators.required]],
      cuit: [null, [Validators.required]],
      domicilio: [null, [Validators.required]],
      codigoPostal: [null, [Validators.required]],
      localidad: [null, [Validators.required]],
      provincia: [null, [Validators.required]],
      empresa: [null, [Validators.required]],
      webSite: [null],
      nombre: [null, [Validators.required]],
      observacionesCobranzas: [null],
      observacionesEntrega: [null],
      observacionesFacturacion: [null],
      telefono: [null, [Validators.required]],
      activo: [null],
    });
  }

  public ngOnInit(): void {
    this._inicializar();
    this.empresa = [
      { nombre: 'NITROPHYL' },
      { nombre: 'ELASINT' }
    ];
  }

  public ngAfterViewInit(): void {
    let top = document.getElementById('top');
    if (top !== null) {
      top.scrollIntoView();
      top = null;
    }
  }

  public updateCliente(): void {
    this.clienteForm.markAllAsTouched();
    if (!this.clienteForm.valid) {
      return;
    }
    const model: Cliente = {
      ...this.clienteForm.getRawValue(),
    };
    this.clientesService.updateCliente(model.id, model).subscribe(
      (d) => {
        if (d.status === 'OK') {
          this.notificationService.showSuccess('Cambios realizados.');
        } else {
          this.notificationService.showError('No se puedieron realizar los cambios.');
        }
      },
      (err) => {
        this.notificationService.showError('No se puedieron realizar los cambios.');
      }
    );
  }

  public verContacto(element): void {
    this.router.navigateByUrl(`/clientes/${element.id}/grid-contactos`);
  }

  public expandRow(element): void {
    this.clienteForm.patchValue({
      id: element.id,
      codigo: element.codigo,
      nombre: element.nombre,
      razonSocial: element.razonSocial,
      email: element.email,
      cuit: element.cuit,
      domicilio: element.domicilio,
      codigoPostal: element.codigoPostal,
      localidad: element.localidad,
      webSite: element.webSite,
      provincia: element.provincia,
      empresa: element.empresa,
      observacionesCobranzas: element.observacionesCobranzas,
      observacionesFacturacion: element.observacionesFacturacion,
      telefono: element.telefono,
      activo: element.activo,
    });
    this.expandedElement = this.expandedElement === element ? null : element;
  }

  private _inicializar(): void {
    this.clientesService.getClientes().subscribe((d) => {
      this.dataSource = d.data;
    });
    this.clientesService.getProvincias().subscribe((d) => {
      this.provincias = d.data;
    });
  }
}