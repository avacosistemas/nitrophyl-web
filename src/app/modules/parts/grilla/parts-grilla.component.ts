import { Component, OnInit } from '@angular/core';
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
  displayedColumns: string[] = ['code', 'type', 'acciones'];

  constructor(
    private partsService: PartsService,
    private partsEventService: PartsEventService
  ) { }

  ngOnInit(): void {
    localStorage.removeItem("navPiezas");
    this.partsService.getParts().subscribe(d => {
      this.parts = d.data;
    })
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
