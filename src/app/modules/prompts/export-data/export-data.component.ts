import { Component, Input, Output, EventEmitter, AfterViewInit, ViewChild } from '@angular/core';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { MatMenuTrigger } from '@angular/material/menu';

@Component({
  selector: 'app-export-data',
  templateUrl: './export-data.component.html',
})

export class ExportDataComponent implements AfterViewInit {
  @Input() showAllOptions: boolean = true;
  @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger;
  @Output() getAllData = new EventEmitter<{ tipo: string; scope: string }>();
  @Input() exporting: boolean = false;

  constructor() { }

  ngAfterViewInit(): void {
  }

  exportar(tipo: string, scope: string): void {
    this.getAllData.emit({ tipo: tipo, scope: scope });
  }

  descargarCsv(data: any[]): void {
    if (!data || data.length === 0) {
      console.warn('No hay datos para exportar a CSV.');
      return;
    }
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    const csvContent = XLSX.utils.sheet_to_csv(ws, { FS: ';' });
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = this.getFileName('CSV');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  descargarExcel(data: any[]): void {
    if (!data || data.length === 0) {
      console.warn('No hay datos para exportar a Excel.');
      return;
    }

    const tableHtml = this.convertJsonToHtmlTable(data);

    const htmlContent = `
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: Arial, sans-serif;
            }
            table {
              border-collapse: collapse;
              width: 100%;
            }
            th {
              background-color:rgb(7, 34, 60) !important; /* Azul Marino Oscuro */
              color: #ffffff !important;
              font-weight: bold !important;
              padding: 10px !important;
              font-size: 12pt !important;
            }
            th, td {
              border: 1px solid #ddd !important;
              padding: 8px !important;
              text-align: left !important;
              white-space: nowrap !important;
              font-size: 10pt !important;
            }
            td {
              background-color: #f9f9f9 !important;
            }
            tr:nth-child(even) td {
              background-color: #f2f2f2 !important;
            }
          </style>
        </head>
        <body>
          <table>
            ${tableHtml}
          </table>
        </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel' });
    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.download = this.getFileName('xls');
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  }

  descargarPdf(data: any[]): void {
    if (!data || data.length === 0) {
      console.warn('No hay datos para exportar a PDF.');
      return;
    }

    const headers = Object.keys(data[0]);
    const body = data.map(item => headers.map(header => item[header]));

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    (doc as any).autoTable({
      head: [headers],
      body: body,
      startY: 20,
      margin: { horizontal: 10 },
      styles: {
        fontSize: 8,
        cellPadding: 2,
        overflow: 'linebreak',
        tableWidth: 'auto',
      },
    });

    doc.save(this.getFileName('PDF'));
  }

  private convertJsonToHtmlTable(data: any[]): string {
    if (!data || data.length === 0) {
      return '';
    }

    let html = '<table><thead><tr>';
    const headers = Object.keys(data[0]);
    headers.forEach((header) => {
      html += `<th>${this.escapeHtml(header)}</th>`;
    });
    html += '</tr></thead><tbody>';

    data.forEach((item) => {
      html += '<tr>';
      headers.forEach((header) => {
        html += `<td>${this.escapeHtml(item[header])}</td>`;
      });
      html += '</tr>';
    });

    html += '</tbody></table>';
    return html;
  }

  private escapeHtml(text: any): string {
    if (text === null || text === undefined) {
      return '';
    }
    const map: any = {
      '&': '&',
      '<': '<',
      '>': '>',
      '"': '"',
      '\'': '\'',
    };

    // eslint-disable-next-line prefer-arrow/prefer-arrow-functions
    return String(text).replace(/[&<>"']/g, function (m) { return map[m]; });
  }

  private getFileName(fileType: string): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const dateTime = `${year}${month}${day}_${hours}${minutes}${seconds}`;
    return `Exportacion_${dateTime}.${fileType.toLowerCase()}`;
  }
}