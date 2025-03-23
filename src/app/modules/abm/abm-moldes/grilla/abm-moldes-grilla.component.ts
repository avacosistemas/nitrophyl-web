import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup } from "@angular/forms";
import { Molde } from "app/shared/models/molde.model";
import { MoldesService } from "app/shared/services/moldes.service";
import { Router } from "@angular/router";
import { PageEvent } from "@angular/material/paginator";

@Component({
  selector: 'abm-moldes-grilla',
  templateUrl: './abm-moldes-grilla.component.html'
})
export class ABMMoldesGrillaComponent implements OnInit {
  component = "Grilla";
  moldes: Array<Molde> = [];
  displayedColumns: string[] = ['code', 'name', 'status', 'ubicacion', 'alto', 'ancho', 'profundidad', 'diametro', 'acciones'];
  showSuccess: boolean = false;
  showError: boolean = false;
  panelOpenState: boolean = false;
  searchForm: FormGroup;

  totalReg: number = 0;
  pageSize: number = 50;
  pageIndex: number = 0;

  constructor(
    private moldesService: MoldesService,
    private formBuilder: FormBuilder,
    private router: Router
  ) {
    this.searchForm = this.formBuilder.group({
      code: [null],
      name: [null],
      status: [null],
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

  cargarMoldes() {
    const params = {
      first: (this.pageIndex * this.pageSize) + 1,
      rows: this.pageSize,
      codigo: this.searchForm.value.code,
      nombre: this.searchForm.value.name,
      estado: this.searchForm.value.status,
      altomin: this.searchForm.value.altomin,
      altomax: this.searchForm.value.altomax,
      anchomin: this.searchForm.value.anchomin,
      anchomax: this.searchForm.value.anchomax,
      profumin: this.searchForm.value.profumin,
      profumax: this.searchForm.value.profumax,
      diametromin: this.searchForm.value.diametromin,
      diametromax: this.searchForm.value.diametromax,
    };


    Object.keys(params).forEach(key => {
      if (params[key] === null || params[key] === undefined) {
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
}