import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { Router } from '@angular/router';
import { Cliente } from 'app/shared/models/cliente.model';
import { ClientesService } from 'app/shared/services/clientes.service';
import { NotificationService } from 'app/shared/services/notification.service';
import { animate, state, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'abm-clientes-grilla',
  templateUrl: './abm-clientes-grilla.component.html',
  styleUrls: ['./abm-clientes-grilla.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class ABMClientesGrillaComponent implements OnInit, AfterViewInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;

  private _allClientes: Cliente[] = [];
  public filteredClientes: Cliente[] = [];
  public dataSource: Cliente[] = [];

  public totalRecords: number = 0;
  public pageSize: number = 10;
  public pageIndex: number = 0;

  component = 'Grilla';
  clienteForm: FormGroup;
  filterForm: FormGroup;

  columnsToDisplay = ['razonSocial', 'nombre', 'mail', 'cuit'];
  columnsToDisplayWithExpand = [...this.columnsToDisplay, 'expand'];
  expandedElement: Cliente | null;

  provincias = [];
  empresa = [{ nombre: 'NITROPHYL' }, { nombre: 'ELASINT' }];
  panelOpenState: boolean = false;

  constructor(
    private clientesService: ClientesService,
    private formBuilder: FormBuilder,
    private router: Router,
    private notificationService: NotificationService,
  ) {
    this._createForms();
  }

  public ngOnInit(): void {
    this._loadStaticData();
    this._inicializar();
  }

  private _inicializar(): void {
    this.clientesService.getClientes().subscribe((d) => {
      this._allClientes = d.data || [];
      this.applyFilters();
    });

    this.clientesService.getProvincias().subscribe((d) => {
      this.provincias = d.data;
    });
  }

  public applyFilters(): void {
    const filters = this.filterForm.value;
    const searchStr = filters.busquedaRapida ? filters.busquedaRapida.toLowerCase() : '';
    const soloActivos = filters.activo;

    this.filteredClientes = this._allClientes.filter((cliente: any) => {
      const matchesActivo = soloActivos ? cliente.activo === true : true;

      const matchesSearch = !searchStr ||
        (cliente.nombre?.toLowerCase().includes(searchStr)) ||
        (cliente.razonSocial?.toLowerCase().includes(searchStr)) ||
        (cliente.domicilio?.toLowerCase().includes(searchStr));

      return matchesActivo && matchesSearch;
    });

    this.totalRecords = this.filteredClientes.length;
    this.pageIndex = 0;
    this.paginate();
  }

  public paginate(): void {
    const startIndex = this.pageIndex * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.dataSource = this.filteredClientes.slice(startIndex, endIndex);

    this.expandedElement = null;
  }

  public onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
    this.paginate();
  }

  public search(): void {
    this.applyFilters();
  }

  public clearFilters(): void {
    this.filterForm.patchValue({
      busquedaRapida: null,
      activo: true
    });
    this.applyFilters();
  }

  public updateCliente(): void {
    this.clienteForm.markAllAsTouched();
    if (!this.clienteForm.valid) return;

    const model: Cliente = { ...this.clienteForm.getRawValue() };
    this.clientesService.updateCliente(model.id, model).subscribe(
      (d) => {
        if (d.status === 'OK') {
          this.notificationService.showSuccess('Cambios realizados.');
          this._inicializar();
        }
      }
    );
  }

  ngAfterViewInit(): void {
    let top = document.getElementById('top');
    if (top !== null) { top.scrollIntoView(); }
  }

  private _createForms(): void {
    this.clienteForm = this.formBuilder.group({
      id: [null],
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

    this.filterForm = this.formBuilder.group({
      busquedaRapida: [null],
      activo: [true]
    });
  }

  private _loadStaticData(): void {
    this.clientesService.getProvincias().subscribe((d) => {
      this.provincias = d.data;
    });
  }

  public expandRow(element): void {
    if (this.expandedElement === element) {
      this.expandedElement = null;
    } else {
      this.clienteForm.patchValue({ ...element });
      this.expandedElement = element;
    }
  }



  public verContacto(element): void { this.router.navigateByUrl(`/clientes/${element.id}/grid-contactos`); }
  public verDomicilio(element): void { this.router.navigateByUrl(`/clientes/${element.id}/grid-domicilios`); }
}