import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup } from "@angular/forms";
import { Molde } from "app/shared/models/molde.model";
import { MoldesService } from "app/shared/services/moldes.service";
import { Router } from "@angular/router";
import { PageEvent } from "@angular/material/paginator";
import { ABMPiezaService } from "app/modules/abm/abm-piezas/abm-piezas.service";
import { ClientesService } from "app/shared/services/clientes.service";
import { Cliente } from "app/shared/models/cliente.model";
import { Observable, of } from "rxjs";
import { map, startWith } from "rxjs/operators";

@Component({
  selector: 'abm-moldes-grilla',
  templateUrl: './abm-moldes-grilla.component.html',
  styleUrls: ['./abm-moldes-grilla.component.scss']
})
export class ABMMoldesGrillaComponent implements OnInit {
  component = "Grilla";
  moldes: Array<Molde> = [];
  displayedColumns: string[] = ['statusIcon', 'code', 'name', 'ubicacion', 'alto', 'ancho', 'profundidad', 'diametro', 'acciones'];
  showSuccess: boolean = false;
  showError: boolean = false;
  panelOpenState: boolean = false;
  searchForm: FormGroup;
  tiposPieza: { id: number; nombre: string }[] = [];
  clientes: Cliente[] = [];
  filteredClientes$: Observable<Cliente[]>;

  totalReg: number = 0;
  pageSize: number = 50;
  pageIndex: number = 0;

  constructor(
    private moldesService: MoldesService,
    private abmPiezaService: ABMPiezaService,
    private clientesService: ClientesService,
    private formBuilder: FormBuilder,
    private router: Router
  ) {
    this.searchForm = this.formBuilder.group({
      code: [null],
      name: [null],
      status: [null],
      tiposPieza: [null],
      idCliente: [null],
      altomin: [null],
      altomax: [null],
      anchomin: [null],
      anchomax: [null],
      profumin: [null],
      profumax: [null],
      diametromin: [null],
      diametromax: [null],
    });
  }

  ngOnInit(): void {
    this.inicializar();
    this.cargarTiposPieza();
    this.cargarClientes();
  }

  ngAfterViewInit() {
    let top = document.getElementById('top');
    if (top !== null) {
      top.scrollIntoView();
      top = null;
    }
  }

  goToEdit(rowId: number): void {
    this.router.navigate(['moldes/molde/editar', rowId]);
  }

  goToView(rowId: number): void {
    this.router.navigate(['moldes/molde/ver', rowId]);
  }

  goToIngresosEgresos(rowId: number): void {
    this.router.navigate(['moldes/ingresos-egresos', rowId]);
  }

  inicializar() {
    this.cargarMoldes();
  }

  cargarTiposPieza(): void {
    this.abmPiezaService.getPiezaTipo().subscribe(data => {
      this.tiposPieza = data;
    });
  }

  cargarClientes(): void {
    this.clientesService.getClientes().subscribe(response => {
      this.clientes = response.data || [];
      this.setupClienteFilter();
    });
  }

  setupClienteFilter(): void {
    this.filteredClientes$ = this.searchForm.get('idCliente').valueChanges.pipe(
      startWith(''),
      map(value => this._filterClientes(value))
    );
  }

  private _filterClientes(value: string | Cliente): Cliente[] {
    const filterValue = (typeof value === 'string' ? value : (value?.nombre || '')).toLowerCase();
    if (!filterValue) {
      return this.clientes;
    }
    return this.clientes.filter(cliente =>
      cliente.nombre.toLowerCase().includes(filterValue) ||
      (cliente.codigo && cliente.codigo.toLowerCase().includes(filterValue))
    );
  }

  cargarMoldes() {
    const formValues = this.searchForm.value;
    const params = {
      first: (this.pageIndex * this.pageSize) + 1,
      rows: this.pageSize,
      codigo: formValues.code,
      nombre: formValues.name,
      estado: formValues.status,
      idTipoPieza: formValues.tiposPieza ? formValues.tiposPieza.join(',') : null,
      idCliente: formValues.idCliente ? formValues.idCliente.id : null,
      altomin: formValues.altomin,
      altomax: formValues.altomax,
      anchomin: formValues.anchomin,
      anchomax: formValues.anchomax,
      profumin: formValues.profumin,
      profumax: formValues.profumax,
      diametromin: formValues.diametromin,
      diametromax: formValues.diametromax,
    };

    Object.keys(params).forEach(key => {
      if (params[key] === null || params[key] === undefined || params[key] === '') {
        delete params[key];
      }
    });
    this.moldesService.getMoldes(params).subscribe(response => {
      this.moldes = response.data.page;
      this.totalReg = response.data.totalReg;
    });
  }

  handlePageEvent(e: PageEvent) {
    this.pageSize = e.pageSize;
    this.pageIndex = e.pageIndex;
    this.cargarMoldes();
  }

  search() {
    this.pageIndex = 0;
    this.cargarMoldes();
  }

  limpiarFiltros() {
    this.searchForm.reset();
    this.pageIndex = 0;
    this.cargarMoldes();
  }

  displayCliente(cliente: Cliente): string {
    return cliente && cliente.nombre ? cliente.nombre : '';
  }

  clearClienteInput(): void {
    this.searchForm.get('idCliente').setValue(null);
  }
}