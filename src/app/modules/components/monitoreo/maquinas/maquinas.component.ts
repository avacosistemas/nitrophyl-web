import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexPlotOptions,
  ApexDataLabels,
  ApexTitleSubtitle
} from 'ng-apexcharts';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  plotOptions: ApexPlotOptions;
  dataLabels: ApexDataLabels;
  colors: string[];
  title: ApexTitleSubtitle;
};

interface MaquinaProceso {
  maquina: string;
  cantidad: number;
}

@Component({
  selector: 'app-maquinas-monitoreo',
  templateUrl: './maquinas.component.html',
  styleUrls: []
})
export class MaquinasComponent implements OnInit {
  isLoading = true;
  errorLoading = false;
  chartOptions!: Partial<ChartOptions>;
  maquinas: MaquinaProceso[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadMaquinaData();
  }

  handleAction(action: string): void {
    if (action === 'refresh') {
      this.loadMaquinaData();
    }
  }

  loadMaquinaData(): void {
    this.isLoading = true;
    this.errorLoading = false;

    this.getMaquinasProcesosMock().subscribe({
      next: (response: any) => {
        if (response && response.status === 'OK' && response.data) {
          this.processData(response.data);
        } else {
          this.isLoading = false;
          this.errorLoading = true;
        }
      },
      error: () => {
        this.isLoading = false;
        this.errorLoading = true;
      }
    });

    /*
    this.getMaquinasProcesosReal().subscribe({
      next: (response: any) => {
        if (response && response.status === 'OK' && response.data) {
          this.processData(response.data);
        }
      },
      error: () => { this.isLoading = false; this.errorLoading = true; }
    });
    */
  }

  getMaquinasProcesosMock(): Observable<any> {
    return this.http.get<any>('assets/mock-monitoreo-maquinas.json');
  }

  /*
  getMaquinasProcesosReal(): Observable<any> {
    return this.http.get<any>('/api/monitoreo/maquinas');
  }
  */

  private processData(data: MaquinaProceso[]): void {
    this.isLoading = false;
    if (!data || data.length === 0) {
      this.maquinas = [];
      return;
    }

    this.maquinas = [...data].sort((a, b) => b.cantidad - a.cantidad);

    const barColors = this.maquinas.map((item) => {
      if (item.cantidad > 10) {
        return '#ef4444';
      } else if (item.cantidad >= 5) {
        return '#f97316';
      } else {
        return '#3b82f6';
      }
    });

    this.chartOptions = {
      series: [
        {
          name: 'Procesos Activos',
          data: this.maquinas.map((item) => item.cantidad)
        }
      ],
      chart: {
        type: 'bar',
        height: 450,
        toolbar: {
          show: true
        }
      },
      plotOptions: {
        bar: {
          horizontal: true,
          distributed: true,
          barHeight: '60%',
          borderRadius: 4
        }
      },
      colors: barColors,
      dataLabels: {
        enabled: true,
        style: {
          colors: ['#fff']
        },
        formatter: (val: any) => {
          return `${val} proc.`;
        }
      },
      xaxis: {
        categories: this.maquinas.map((item) => item.maquina),
        labels: {
          style: {
            fontSize: '12px'
          }
        }
      },
      title: {
        text: 'Carga de Procesos por Máquina',
        align: 'left',
        style: {
          fontSize: '16px',
          fontWeight: 'bold',
          color: '#1f2937'
        }
      }
    };
  }
}
