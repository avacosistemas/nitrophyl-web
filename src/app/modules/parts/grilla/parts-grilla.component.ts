import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { PartsService } from 'app/shared/services/parts.service';
import { PartsEventService } from '../parts-event.service';

@Component({
  selector: 'app-parts-grilla',
  templateUrl: './parts-grilla.component.html',
  styleUrls: ['./parts-grilla.component.scss']
})
export class PartsGrillaComponent implements OnInit {

  component = "Grilla";
  parts = [];
  partsBackup = [];
  displayedColumns: string[] = ['code', 'type', 'acciones'];
  searchForm: FormGroup;

  constructor(
    private partsService: PartsService,
    private partsEventService: PartsEventService,
    private _formBuilder: FormBuilder
  ) {
    this.searchForm = this._formBuilder.group({
      codigo: [''],
      tipo: ['']
    });
  }

  ngOnInit(): void {
    localStorage.removeItem("navPiezas");
    this.partsService.getParts().subscribe(d => {
      this.parts = d.data;
      this.partsBackup = this.parts;
    })
  }

  ngAfterViewInit() {
    let top = document.getElementById('top');
    if (top !== null) {
      top.scrollIntoView();
      top = null;
    }
}

  search() {
    let searchProducts = [];
    if(this.searchForm.controls.tipo.value == 'SIMPLE') {
      searchProducts = this.partsBackup.filter(p => p.tipo == 'SIMPLE');
    } else if (this.searchForm.controls.tipo.value == 'COMPUESTA') {
      searchProducts = this.partsBackup.filter(p => p.tipo == 'COMPUESTA');
    } else {
      searchProducts = this.partsBackup;
    };
    this.parts = searchProducts.filter(element => element.codigoPieza.toLowerCase().includes(this.searchForm.controls.codigo.value.toLowerCase()));
  }

  openPart(id: number) {
    if (id == 1) {
      //Editar
      this.partsEventService.setMode("Edit");
    } else {
      //Ver
      this.partsEventService.setMode("View");
    }
  }

}
