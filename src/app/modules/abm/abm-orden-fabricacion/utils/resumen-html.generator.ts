import moment from 'moment';

export interface ResumenItem {
    pieza: string;
    formula: string;
    hp: string;
    numeroOt: string;
    ordenCompra: string;
    fechaEntrega: string;
    sector: string;
    maquina: string;
    cantidadTotal: number;
    cantidadFabricada: number;
}

export function generarHtmlResumen(data: { [cliente: string]: ResumenItem[] } | ResumenItem[]): string {
    const fechaImpresion = moment().format('DD/MM/YYYY HH:mm');

    let customerGroups: { cliente: string; items: ResumenItem[] }[] = [];

    if (Array.isArray(data)) {
        customerGroups = [{ cliente: '', items: data }];
    } else if (data && typeof data === 'object') {
        customerGroups = Object.entries(data).map(([cliente, items]) => ({
            cliente,
            items: Array.isArray(items) ? items : []
        }));
    }

    const pagesHtml = customerGroups.map(({ cliente, items }) => {
        const rowsHtml = items.map((item) => `
            <tr>
                <td style="text-align: left; font-weight: bold; padding: 6px; border: 1px solid #000;">${item.pieza || '-'}</td>
                <td style="text-align: center; padding: 6px; border: 1px solid #000;">${item.formula || '-'}</td>
                <td style="text-align: center; padding: 6px; border: 1px solid #000;">${item.hp || '-'}</td>
                <td style="text-align: center; font-weight: bold; padding: 6px; border: 1px solid #000;">${item.numeroOt || '-'}</td>
                <td style="text-align: center; padding: 6px; border: 1px solid #000;">${item.ordenCompra || '-'}</td>
                <td style="text-align: center; padding: 6px; border: 1px solid #000;">${item.fechaEntrega || '-'}</td>
                <td style="text-align: left; padding: 6px; border: 1px solid #000;">${item.sector || '-'}</td>
                <td style="text-align: left; padding: 6px; border: 1px solid #000;">${item.maquina || '-'}</td>
                <td style="text-align: right; font-weight: bold; padding: 6px; border: 1px solid #000;">${item.cantidadTotal ?? 0}</td>
                <td style="text-align: right; font-weight: bold; padding: 6px; border: 1px solid #000; color: #000;">${item.cantidadFabricada ?? 0}</td>
            </tr>
        `).join('');

        const clienteHeaderHtml = cliente ? `
            <div class="h-field" style="margin-bottom: 0;">
                <span class="h-lbl">CLIENTE:</span>
                <div class="h-val" style="font-weight: bold; font-size: 13px;">${cliente}</div>
            </div>
        ` : '';

        return `
        <div class="a4-page">
            <div class="header-box">
                <div class="header-left">
                    <h1>RESUMEN DE ÓRDENES DE FABRICACIÓN</h1>
                    <div class="h-row" style="margin-top: 5px; align-items: flex-end;">
                        ${clienteHeaderHtml}
                        <div class="h-field" style="flex: 0 0 220px; margin-bottom: 0;">
                            <span class="h-lbl">EMISIÓN / IMPRESIÓN:</span>
                            <div class="h-val" style="font-weight: bold; font-size: 12px;">${fechaImpresion}</div>
                        </div>
                    </div>
                </div>
            </div>
            <table class="resumen-table">
                <thead>
                    <tr>
                        <th style="text-align: left; width: 22%;">Pieza</th>
                        <th style="text-align: center; width: 10%;">Fórmula</th>
                        <th style="text-align: center; width: 8%;">HP</th>
                        <th style="text-align: center; width: 10%;">N° OT</th>
                        <th style="text-align: center; width: 10%;">Orden Compra</th>
                        <th style="text-align: center; width: 10%;">F. Entrega</th>
                        <th style="text-align: left; width: 10%;">Sector</th>
                        <th style="text-align: left; width: 10%;">Máquina</th>
                        <th style="text-align: right; width: 5%;">Total</th>
                        <th style="text-align: right; width: 5%;">Fabr.</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml}
                </tbody>
            </table>
        </div>
        `;
    }).join('');

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Resumen de Órdenes de Fabricación</title>
    <style>
        body { font-family: Arial, Helvetica, sans-serif; margin: 0; padding: 0; background-color: #525659; color: #000; font-size: 11px; line-height: 1.2; }
        .a4-page { font-family: Arial, Helvetica, sans-serif; font-size: 11px; line-height: 1.2; color: #000; width: 210mm; min-height: 297mm; margin: 20px auto; background: #fff; padding: 10mm; box-sizing: border-box; box-shadow: 0 0 10px rgba(0,0,0,0.5); display: flex; flex-direction: column; position: relative; page-break-after: always; }
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
        
        .badge-formula { background-color: #e6e6e6; padding: 2px 6px; border-radius: 2px; font-size: 10px; font-weight: bold; border: 1px solid #000; }

        @media print {
            @page { margin: 0; size: A4 portrait; }
            body { background: #fff; margin: 0; padding: 0; }
            .a4-page { margin: 0; padding: 10mm; box-shadow: none; width: 210mm; min-height: 297mm; page-break-after: always; box-sizing: border-box; }
        }
    </style>
</head>
<body>
    ${pagesHtml}
</body>
</html>`;
}
