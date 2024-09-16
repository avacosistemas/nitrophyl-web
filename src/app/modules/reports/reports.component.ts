import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss']
})
export class ReportsComponent implements OnInit {
  @ViewChild('tituloComponenteHijo') tituloComponenteHijo: ElementRef;

  title: string = 'Informes';
  subtitle: string = '';

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.firstChild?.data.subscribe((data) => {
      this.subtitle = data['subtitle'];
    });
  }

}
