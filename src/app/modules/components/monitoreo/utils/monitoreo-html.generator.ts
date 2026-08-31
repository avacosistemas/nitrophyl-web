import moment from 'moment';
import { MaquinaMonitoreo, OrdenTrabajoDetalle } from '../monitoreo.service';

function formatMaterial(material: string): string {
    if (!material) return '-';
    return material.replace(/Fórmula\s*/gi, '').trim();
}

export function generarHtmlPlanillaMaquina(maquina: MaquinaMonitoreo, ots: OrdenTrabajoDetalle[]): string {
    const fechaImpresion = moment().format('DD/MM/YYYY HH:mm');

    const rowsHtml = ots.map((ot, idx) => `
        <tr>
            <td style="text-align: center; font-weight: bold; padding: 6px; border: 1px solid #000;">${ot.posicion || (idx + 1)}</td>
            <td style="text-align: center; font-weight: bold; color: #000; padding: 6px; border: 1px solid #000;">${ot.of || '-'}</td>
            <td style="text-align: left; padding: 6px; border: 1px solid #000;">${ot.cliente || '-'}</td>
            <td style="text-align: left; font-weight: bold; padding: 6px; border: 1px solid #000;">${ot.pieza || '-'}</td>
            <td style="text-align: center; padding: 6px; border: 1px solid #000;">${formatMaterial(ot.material)}</td>
            <td style="text-align: right; font-weight: bold; padding: 6px; border: 1px solid #000;">${ot.cantidad ?? 0}</td>
            <td style="text-align: center; padding: 6px; border: 1px solid #000;">${ot.fechaEntrega || '-'}</td>
        </tr>
    `).join('');

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Planilla de Órdenes de Trabajo - ${maquina.maquina || ''}</title>
    <style>
        body { font-family: Arial, Helvetica, sans-serif; margin: 0; padding: 0; background-color: #525659; color: #000; font-size: 11px; line-height: 1.2; }
        .a4-page { font-family: Arial, Helvetica, sans-serif; font-size: 11px; line-height: 1.2; color: #000; width: 210mm; min-height: 297mm; margin: 20px auto; background: #fff; padding: 10mm; box-sizing: border-box; box-shadow: 0 0 10px rgba(0,0,0,0.5); display: flex; flex-direction: column; position: relative; }
        .print-bg { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        
        .header-box { border: 2px solid #000; display: flex; margin-bottom: 15px; flex-shrink: 0; position: relative; }
        .header-left { flex: 1; padding: 15px 15px 10px 15px; display: flex; flex-direction: column; justify-content: space-between; }
        .header-left h1 { position: absolute; top: -10px; left: 15px; background: #fff; padding: 0 8px; font-size: 16px; font-weight: bold; margin: 0; letter-spacing: 0.5px; line-height: 1; }
        
        .h-row { display: flex; align-items: flex-end; margin-bottom: 3px; gap: 15px; }
        .h-field { display: flex; align-items: flex-end; flex: 1; }
        .h-lbl { font-weight: bold; font-size: 10px; margin-right: 8px; white-space: nowrap; }
        .h-val { font-size: 13px; border-bottom: 1px solid #000; flex: 1; min-height: 16px; padding-bottom: 2px; }

        .resumen-table { width: 100%; border-collapse: collapse; border: 2px solid #000; margin-top: 10px; }
        .resumen-table th { background-color: #e6e6e6; color: #000; font-weight: bold; text-transform: uppercase; font-size: 9px; padding: 8px 6px; border: 1px solid #000; letter-spacing: 0.5px; }
        .resumen-table td { border: 1px solid #000; font-size: 10.5px; vertical-align: middle; }
        
        @media print {
            @page { margin: 0; size: A4 portrait; }
            body { background: #fff; margin: 0; padding: 0; }
            .a4-page { margin: 0; padding: 10mm; box-shadow: none; width: 210mm; min-height: 297mm; page-break-after: always; box-sizing: border-box; }
        }
    </style>
</head>
<body>
    <div class="a4-page print-bg">
        <div class="header-box">
            <div class="header-left">
                <h1>PLANILLA DE ÓRDENES DE TRABAJO DE MÁQUINA</h1>
                <div class="h-row" style="margin-top: 8px;">
                    <div class="h-field">
                        <span class="h-lbl">MÁQUINA:</span>
                        <div class="h-val" style="font-weight: bold; font-size: 14px;">${maquina.maquina || ''}</div>
                    </div>
                    ${maquina.sector ? `
                    <div class="h-field">
                        <span class="h-lbl">SECTOR:</span>
                        <div class="h-val" style="font-weight: bold; font-size: 13px;">${maquina.sector}</div>
                    </div>` : ''}
                    <div class="h-field" style="flex: 0 0 140px;">
                        <span class="h-lbl">TOTAL OTS:</span>
                        <div class="h-val" style="font-weight: bold; font-size: 13px;">${ots.length}</div>
                    </div>
                    <div class="h-field" style="flex: 0 0 200px;">
                        <span class="h-lbl">IMPRESIÓN:</span>
                        <div class="h-val" style="font-weight: bold; font-size: 12px;">${fechaImpresion}</div>
                    </div>
                </div>
            </div>
        </div>
        
        <table class="resumen-table">
            <thead>
                <tr>
                    <th style="text-align: center; width: 6%;">No.</th>
                    <th style="text-align: center; width: 14%;">OF</th>
                    <th style="text-align: left; width: 25%;">Cliente</th>
                    <th style="text-align: left; width: 25%;">Pieza</th>
                    <th style="text-align: center; width: 12%;">Material</th>
                    <th style="text-align: right; width: 8%;">Cant.</th>
                    <th style="text-align: center; width: 10%;">Fecha Entrega</th>
                </tr>
            </thead>
            <tbody>
                ${rowsHtml.length > 0 ? rowsHtml : `<tr><td colspan="7" style="text-align: center; padding: 12px;">No hay órdenes de trabajo asignadas.</td></tr>`}
            </tbody>
        </table>
    </div>
</body>
</html>`;
}
