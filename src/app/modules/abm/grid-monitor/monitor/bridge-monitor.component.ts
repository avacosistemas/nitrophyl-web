import { Component, ViewChild, ElementRef, OnInit } from '@angular/core';

@Component({
  selector: 'bridge-monitor',
  templateUrl: './bridge-monitor.component.html'
})
export class BridgeMonitorComponent implements OnInit {

  constructor() { }

  ngOnInit() {
    this.abrirEnPantallaCompleta();
  }
  
  abrirEnPantallaCompleta() {
    const url = '/monitor/grid'; // Ruta de la página en pantalla completa
    const nuevaPestana = window.open(url, '_blank');
    if (nuevaPestana) {
     nuevaPestana.document.documentElement.requestFullscreen();
    } else {
      console.error('No se pudo abrir la nueva pestaña.');
    }
  }
}