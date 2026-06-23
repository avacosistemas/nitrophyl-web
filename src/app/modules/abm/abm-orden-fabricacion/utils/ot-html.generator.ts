export interface OTCabecera {
    numero_ot: string;
    cliente: string;
    oc: string;
    prensa: string;
    fecha_emision: string;
    fecha_entrega: string;
    observaciones: string;
}

export interface OTControlCalidad {
    tipo: string;
    valor: string;
}

export interface OTItem {
    id_item: number;
    titulo: string;
    cantidad_total: number;
    material: string;
    formula: string;
    batch: string;
    fabrico: string;
    hp: string;
    plano_rev: string;
    matriz: string;
    identicacion: string;
    ubicacion: string;
    pc: string;
    observaciones_item: string;
    control_calidad: OTControlCalidad[];
}

export interface OTData {
    cabecera: OTCabecera;
    items: OTItem[];
}

export function generarHtmlOT(data: OTData): string {
    const { cabecera, items } = data;

    const itemsHtml = items.map((item, index) => {
        const ccItems = (item.control_calidad || []).map(cc => `
                <div class="qc-item">${cc.tipo}: <span class="val">${cc.valor}</span>
                    <div class="checkbox"></div>
                </div>`).join('');

        return `
            <div class="item-card">
                <div class="item-head print-bg">
                    <div class="item-head-left">
                        <div class="badge-black print-bg">ÍTEM ${item.id_item ?? index + 1}</div>
                        <div class="item-title">${item.titulo || ''}</div>
                    </div>
                    <div class="badge-cant"><span>Cant.:</span> <span class="badge-cant-value">${item.cantidad_total ?? ''}</span></div>
                </div>
                <div class="item-subhead">
                    <div class="pill-group"><span class="lbl">MATERIAL</span>
                        <div class="pill-box">${item.material || ''}</div>
                    </div>
                    <div class="pill-group"><span class="lbl">FÓRMULA</span>
                        <div class="pill-box">${item.formula || ''}</div>
                    </div>
                    <div class="pill-group"><span class="lbl">BATCH</span>
                        <div class="pill-box">${item.batch || ''}</div>
                    </div>
                    <div class="vertical-sep print-bg"></div>
                    <div class="fabrico-group"><span class="lbl">FABRICÓ</span>
                        <div class="line">${item.fabrico || ''}</div>
                    </div>
                </div>
                <div class="item-body">
                    <div class="item-left">
                        <div class="data-row">
                            <div class="d-field"><span class="lbl">HP:</span><span class="val">${item.hp || ''}</span></div>
                            <div class="d-field"><span class="lbl">PLANO/REV:</span><span class="val">${item.plano_rev || ''}</span></div>
                        </div>
                        <div class="data-row">
                            <div class="d-field"><span class="lbl">MATRIZ:</span><span class="val">${item.matriz || ''}</span></div>
                            <div class="d-field"><span class="lbl">UBICACIÓN:</span><span class="val">${item.ubicacion || ''}</span></div>
                        </div>
                        ${item.identicacion ? `
                        <div class="data-row">
                            <div class="d-field"><span class="lbl">IDENT:</span><span class="val">${item.identicacion}</span></div>
                        </div>` : ''}
                        ${item.pc ? `
                        <div class="data-row">
                            <div class="d-field"><span class="lbl">PC:</span><span class="val">${item.pc}</span></div>
                        </div>` : ''}
                        ${item.observaciones_item ? `
                        <div class="obs-container">
                            <div class="obs-box">Obs: ${item.observaciones_item}</div>
                        </div>` : ''}
                        ${ccItems ? `
                        <div class="qc-row print-bg">
                            ${ccItems}
                        </div>` : ''}
                    </div>
                    <div class="item-right">
                        <div class="entregas-title print-bg">ENTREGAS</div>
                        <div class="entregas-table-wrap">
                            <table class="entregas-table">
                                <thead>
                                    <tr>
                                        <th>Fecha</th>
                                        <th>Cant.</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr><td></td><td></td></tr>
                                    <tr><td></td><td></td></tr>
                                    <tr><td></td><td></td></tr>
                                    <tr><td></td><td></td></tr>
                                    <tr><td></td><td></td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>`;
    }).join('');

    const fechaEmision = cabecera.fecha_emision || '__ / __ / ____';
    const fechaEntrega = cabecera.fecha_entrega || '__ / __ / ____';

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Orden de Fabricación - ${cabecera.numero_ot || ''}</title>
    <style>
        body { font-family: Arial, Helvetica, sans-serif; margin: 0; padding: 0; background-color: #525659; color: #000; font-size: 11px; line-height: 1.2; }
        .a4-page { font-family: Arial, Helvetica, sans-serif; font-size: 11px; line-height: 1.2; color: #000; width: 210mm; height: 297mm; margin: 20px auto; background: #fff; padding: 10mm; box-sizing: border-box; box-shadow: 0 0 10px rgba(0,0,0,0.5); display: flex; flex-direction: column; position: relative; overflow: hidden; }
        #raw-content { position: absolute; left: -9999px; top: 0; width: 210mm; box-sizing: border-box; padding: 10mm; display: flex; flex-direction: column; }
        .print-bg { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        .header-box { border: 2px solid #000; display: flex; margin-bottom: 12px; flex-shrink: 0; }
        .header-left { flex: 1; padding: 10px 15px; border-right: 2px solid #000; display: flex; flex-direction: column; justify-content: space-between; }
        .header-left h1 { font-size: 20px; margin: 0 0 15px 0; letter-spacing: 0.5px; }
        .h-row { display: flex; align-items: flex-end; margin-bottom: 8px; gap: 10px; }
        .h-row:last-child { margin-bottom: 0; }
        .h-field { border-bottom: 1px solid #000; padding-bottom: 2px; margin-bottom: 8px; flex: 1; }
        .h-field.fixed { flex: 0 0 150px; }
        .h-lbl { font-weight: bold; font-size: 10px; margin-right: 8px; white-space: nowrap; display: inline; }
        .h-val { font-size: 13px; display: inline; }
        .header-right { width: 220px; display: flex; flex-direction: column; }
        .ot-section { background-color: #e6e6e6; flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; border-bottom: 2px solid #000; padding: 10px; }
        .ot-section .lbl { font-size: 10px; font-weight: bold; }
        .ot-section .val { font-size: 26px; font-weight: bold; margin-top: 4px; }
        .date-section { display: flex; height: 45px; }
        .date-col { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 5px; }
        .date-col:first-child { border-right: 1px solid #000; }
        .date-lbl { font-size: 10px; margin-bottom: 4px; }
        .date-line { font-size: 12px; font-weight: bold; letter-spacing: 1px; }
        .items-container { display: flex; flex-direction: column; gap: 15px; }
        .item-card { border: 2px solid #000; display: flex; flex-direction: column; page-break-inside: avoid; }
        .item-head { background-color: #e6e6e6; padding: 6px 12px; display: flex; justify-content: space-between; align-items: center; }
        .item-head-left { display: flex; align-items: center; gap: 15px; }
        .badge-black { background-color: #000; color: #fff; padding: 4px 8px; font-size: 12px; font-weight: bold; }
        .item-title { font-size: 14px; font-weight: bold; letter-spacing: 0.5px; }
        .badge-cant { background-color: #fff; border: 2px solid #000; border-radius: 4px; padding: 4px 8px; line-height: 1; }
        .badge-cant span { font-size: 13px; font-weight: normal; vertical-align: middle; }
        .badge-cant-value { font-size: 16px !important; font-weight: bold !important; vertical-align: middle; }
        .item-subhead { display: flex; align-items: center; padding: 10px 12px; border-bottom: 2px solid #000; gap: 10px; }
        .pill-group { display: flex; flex-direction: column; gap: 2px; }
        .pill-group .lbl { font-size: 10px; letter-spacing: 1px; }
        .pill-box { border-bottom: 1px solid #000; padding: 3px 0px; font-size: 14px; font-weight: bold; min-width: 90px; min-height: 16px; }
        .vertical-sep { height: 20px; width: 1px; background-color: #000; margin: 0 5px; }
        .fabrico-group { flex: 1; display: flex; align-items: flex-end; }
        .fabrico-group .lbl { font-size: 10px; margin-right: 6px; padding-bottom: 2px; letter-spacing: 1px; }
        .fabrico-group .line { border-bottom: 1px solid #000; flex: 1; height: 20px; font-size: 17px; }
        .item-body { display: flex; }
        .item-left { flex: 1; display: flex; flex-direction: column; padding: 10px; padding-top: 20px; border-right: 1px solid #000; }
        .data-row { display: flex; gap: 15px; margin-bottom: 12px; }
        .d-field { border-bottom: 1px solid #000; padding-bottom: 2px; margin-bottom: 6px; flex: 1; }
        .d-field.narrow { flex: 0 0 120px; }
        .d-field.stacked { display: flex; flex-direction: column; gap: 4px; margin-bottom: 10px; }
        .d-field.stacked:last-child { margin-bottom: 0; }
        .d-field.stacked .lbl { font-size: 10px; padding-bottom: 2px; }
        .d-field.stacked .val { border-bottom: 1px solid #000; font-size: 12px; font-weight: bold; min-height: 16px; padding-bottom: 2px; width: 100%; }
        .d-field .lbl { font-size: 10px; margin-right: 6px; white-space: nowrap; display: inline; }
        .d-field .val { font-size: 12px; font-weight: bold; display: inline; }
        .fields-grid { display: flex; gap: 12px; margin-bottom: 12px; }
        .fields-col-left { width: 90px; flex-shrink: 0; display: flex; flex-direction: column; justify-content: flex-start; border-right: 1px dashed #ccc; padding-right: 10px; }
        .fields-col-right { flex: 1; display: flex; flex-direction: column; }
        .obs-container { display: flex; gap: 6px; margin-bottom: 10px; }
        .obs-box { flex: 1; background-color: #e6e6e6; border: 1px solid #000; padding: 4px 6px; font-size: 12px; font-weight: bold; }
        .qc-row { background-color: #f9f9f9; border: 1px solid #000; padding: 6px 10px; }
        .qc-item { display: inline-block; width: 32%; vertical-align: middle; font-size: 11px; margin-bottom: 4px; box-sizing: border-box; }
        .qc-item .val { font-weight: bold; font-size: 12px; display: inline-block; vertical-align: middle; }
        .checkbox { width: 12px; height: 12px; border: 1px solid #000; background-color: #fff; display: inline-block; vertical-align: middle; margin-left: 6px; }
        .item-right { width: 150px; display: flex; flex-direction: column; }
        .entregas-title { background-color: #e6e6e6; text-align: center; font-size: 10px; font-weight: bold; padding: 4px 0; border-bottom: 1px solid #000; }
        .entregas-table-wrap { flex: 1; display: flex; flex-direction: column; }
        .entregas-table { width: 100%; height: 100%; border-collapse: collapse; table-layout: fixed; }
        .entregas-table thead { display: table-header-group; }
        .entregas-table tbody { display: table-row-group; }
        .entregas-table th { font-size: 10px; border-bottom: 1px solid #000; padding: 4px; }
        .entregas-table th:first-child { border-right: 1px solid #000; width: 60%; }
        .entregas-table td { border-bottom: 1px solid #000; }
        .entregas-table td:first-child { border-right: 1px solid #000; }
        .entregas-table tr:last-child td { border-bottom: none; }
        @media print {
            @page { margin: 0; size: A4 portrait; }
            body { background: #fff; margin: 0; padding: 0; }
            .a4-page { margin: 0; padding: 10mm; box-shadow: none; width: 210mm; height: 297mm; page-break-after: always; box-sizing: border-box; overflow: hidden; }
        }
    </style>
</head>
<body>
    <div id="raw-content">
        <div class="header-box">
            <div class="header-left">
                <h1>ORDEN DE FABRICACIÓN</h1>
                <div class="h-row">
                    <div class="h-field"><span class="h-lbl">CLIENTE:</span>
                        <div class="h-val">${cabecera.cliente || ''}</div>
                    </div>
                    <div class="h-field fixed"><span class="h-lbl">OC:</span>
                        <div class="h-val">${cabecera.oc || ''}</div>
                    </div>
                </div>
                <div class="h-row">
                    <div class="h-field"><span class="h-lbl">PRENSA:</span>
                        <div class="h-val">${cabecera.prensa || ''}</div>
                    </div>
                </div>
                <div class="h-row">
                    <div class="h-field"><span class="h-lbl">OBSERVACIONES:</span>
                        <div class="h-val">${cabecera.observaciones || ''}</div>
                    </div>
                </div>
            </div>
            <div class="header-right">
                <div class="ot-section print-bg">
                    <div class="lbl">N° OT</div>
                    <div class="val">${cabecera.numero_ot || ''}</div>
                </div>
                <div class="date-section">
                    <div class="date-col">
                        <div class="date-lbl">EMISIÓN</div>
                        <div class="date-line">${fechaEmision}</div>
                    </div>
                    <div class="date-col">
                        <div class="date-lbl">ENTREGA</div>
                        <div class="date-line">${fechaEntrega}</div>
                    </div>
                </div>
            </div>
        </div>
        <div class="items-container">
            ${itemsHtml}
        </div>
    </div>

    <script>
        window.addEventListener('load', function() {
            paginate();
        });

        function paginate() {
            const rawContent = document.getElementById('raw-content');
            if (!rawContent) return;

            const header = rawContent.querySelector('.header-box');
            const items = Array.from(rawContent.querySelectorAll('.item-card'));
            
            const maxInnerHeight = 1046; 
            
            function createPage() {
                const page = document.createElement('div');
                page.className = 'a4-page print-bg';
                document.body.appendChild(page);
                
                const container = document.createElement('div');
                container.className = 'items-container';
                page.appendChild(container);
                
                return { page, container };
            }
            
            let current = createPage();
            
            if (header) {
                current.page.insertBefore(header.cloneNode(true), current.container);
            }
            
            for (let i = 0; i < items.length; i++) {
                const item = items[i].cloneNode(true);
                current.container.appendChild(item);
                
                const headerEl = current.page.querySelector('.header-box');
                const headerHeight = headerEl ? headerEl.offsetHeight : 0;
                const itemsHeight = current.container.offsetHeight;
                
                let totalHeight = headerHeight + itemsHeight;
                if (headerEl && itemsHeight > 0) {
                    totalHeight += 12;
                }
                
                if (totalHeight > maxInnerHeight) {
                    if (current.container.children.length > 1) {
                        current.container.removeChild(item);
                        
                        current = createPage();
                        
                        current.container.appendChild(item);
                    }
                }
            }
            
            rawContent.remove();
        }
    </script>
</body>
</html>`;
}

