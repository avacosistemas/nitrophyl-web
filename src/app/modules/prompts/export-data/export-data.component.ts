import { Component, Input, Output, EventEmitter, AfterViewInit, ViewChild } from '@angular/core';
import * as XLSX from 'xlsx-js-style';
import * as FileSaver from 'file-saver';
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

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);

    const headerCellStyle = {
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '2C3344' } },
      alignment: { horizontal: 'center', vertical: 'middle' },
    };

    const bodyCellStyle = {
      fill: { fgColor: { rgb: 'F0F0F0' } },
      alignment: { horizontal: 'center', vertical: 'middle' },
      border: {
        bottom: { style: 'thin', color: { rgb: '565656' } },
      }
    };

    const headerRange = XLSX.utils.decode_range(`A1:${String.fromCharCode(64 + Object.keys(data[0]).length)}1`);
    for (let C = headerRange.s.c; C <= headerRange.e.c; ++C) {
      const headerCellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
      ws[headerCellAddress].s = headerCellStyle;
    }

    const dataRange = XLSX.utils.decode_range(`A2:${String.fromCharCode(64 + Object.keys(data[0]).length)}${data.length + 1}`);

    for (let R = dataRange.s.r; R <= dataRange.e.r; ++R) {
      for (let C = dataRange.s.c; C <= dataRange.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[cellAddress]) ws[cellAddress] = { t: 's', v: '' };
        ws[cellAddress].s = bodyCellStyle;
      }
    }

    XLSX.utils.book_append_sheet(wb, ws, 'Datos');

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array', bookSST: true });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    FileSaver.saveAs(blob, this.getFileName('xlsx'));
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
        halign: 'center'
      },
      headStyles: {
        halign: 'center'
      }
    });

    doc.save(this.getFileName('PDF'));
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