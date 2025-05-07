import { Component, OnInit, ViewChild } from '@angular/core';
import { Pieza } from '../../models/pieza.model';
import { ABMPiezaService } from '../../abm-piezas.service';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'app-abm-piezas-grilla',
  templateUrl: './abm-piezas-grilla.component.html',
  styleUrls: ['./abm-piezas-grilla.component.scss'],
})
export class ABMPiezasGrillaComponent implements OnInit {
  component = "Grilla";
  piezas: Pieza[] = [];
  displayedColumns: string[] = ['nombre', 'formulaCodigo', 'formulaMaterial', 'revision', 'fechaRevision', 'acciones'];
  searchForm: FormGroup;

  totalReg: number = 0;
  pageSize: number = 50;
  pageIndex: number = 0;

  dataSource = new MatTableDataSource<Pieza>([]);

  @ViewChild(MatPaginator) paginator: MatPaginator;

  constructor(
    private abmPiezaService: ABMPiezaService,
    private router: Router,
    private formBuilder: FormBuilder
  ) {
    this.searchForm = this.formBuilder.group({
      nombre: [null],
      formulaCodigo: [null],
      formulaMaterial: [null],
      revision: [null],
    });
  }

  ngOnInit(): void {
    this.cargarPiezas();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    let top = document.getElementById('top');
    if (top !== null) {
      top.scrollIntoView();
      top = null;
    }
  }

  goToEdit(rowId: number): void {
    this.router.navigate(['/procesos-piezas/' + rowId + '/edit']);
  }

  goToView(rowId: number): void {
    this.router.navigate(['/procesos-piezas/' + rowId + '/view']);
  }

  cargarPiezas(): void {
    this.abmPiezaService.getPiezas().subscribe(piezas => {
      this.piezas = piezas;
      this.dataSource = new MatTableDataSource<Pieza>(this.piezas);
      this.dataSource.paginator = this.paginator;
      this.totalReg = this.piezas.length;
    });
  }

  handlePageEvent(e: PageEvent): void {
    this.pageSize = e.pageSize;
    this.pageIndex = e.pageIndex;
    this.cargarPiezas();
  }

  search(): void {
    console.log('Buscar con los filtros:', this.searchForm.value);
  }

  limpiarFiltros(): void {
    this.searchForm.reset();
    this.cargarPiezas();
  }
}