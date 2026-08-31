export interface OTCabecera {
    numero_ot: string;
    cliente: string;
    oc: string;
    prensa: string;
    fecha_emision: string;
    fecha_entrega: string;
    observaciones: string;
    sector?: string;
    telefonoCliente?: string;
    emailCliente?: string;
    tipoDespacho?: string;
    empresaTransporte?: string | null;
    mediosEnvio?: string[] | null;
    domicilioEnvio?: string | null;
}

export interface OTControlCalidad {
    tipo: string;
    valor: string;
}

export interface OTEntrega {
    fecha: string;
    cantidad: number;
    lote: string;
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
    identificacion?: string;
    identficacion?: string;
    ubicacion: string;
    pc: string;
    observaciones_item: string;
    control_calidad: OTControlCalidad[];
    cotizacion?: number;
    fechaCotizacion?: string;
    descuento?: number;
    precio_descuento?: number;
    observacionDescuento?: string;
    observacionesDescuento?: string;
    descuentoObservacion?: string;
    descuento_observacion?: string;
    descuento_observaciones?: string;
    entregas?: OTEntrega[];
    entregas_parciales?: OTEntrega[];
}

export interface OTData {
    cabecera: OTCabecera;
    items: OTItem[];
}

function formatTipoDespacho(tipo?: string): string {
    if (!tipo) return '';
    switch (tipo) {
        case 'RETIRO_CLIENTE': return 'Retira Cliente';
        case 'RETIRO_TRANSPORTE': return 'Retira Empresa de Transporte';
        case 'ENVIO': return 'Envía Nitro';
        default: return tipo;
    }
}

function renderEntregasTableRows(entregas?: OTEntrega[]): string {
    const list = entregas || [];
    const maxRows = 5;
    const rows: string[] = [];

    for (let i = 0; i < maxRows; i++) {
        const ent = list[i];
        if (ent) {
            rows.push(`<tr>
                <td style="text-align: center; font-size: 10px; font-weight: bold;">${ent.fecha || ''}</td>
                <td style="text-align: center; font-size: 10px; font-weight: bold;">${ent.cantidad ?? ''}</td>
                <td style="text-align: center; font-size: 10px; font-weight: bold;">${ent.lote || ''}</td>
            </tr>`);
        } else {
            rows.push(`<tr><td></td><td></td><td></td></tr>`);
        }
    }
    return rows.join('');
}

export function generarHtmlOT(data: OTData): string {
    const { cabecera, items } = data;

    const itemsHtmlPlanta = items.map((item, index) => {
        const ccItems = (item.control_calidad || []).map(cc => `
                <div class="control-row">
                    <span class="control-lbl">${cc.tipo || ''}:</span>
                    <span class="control-val">${cc.valor || ''}</span>
                    <div class="checkbox"></div>
                </div>`).join('');

        const ident = item.identificacion || item.identicacion || item.identficacion;
        const entregasRows = renderEntregasTableRows(item.entregas || item.entregas_parciales);

        return `
            <div class="item-card">
                <div class="item-head print-bg">
                    <div class="item-head-left">
                        <div class="badge-black print-bg">PIEZA</div>
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
                    <div class="pill-group"><span class="lbl">HP</span>
                        <div class="pill-box">${item.hp || ''}</div>
                    </div>
                    <div class="vertical-sep print-bg"></div>
                    <div class="fabrico-group"><span class="lbl">FABRICÓ</span>
                        <div class="line">${item.fabrico || ''}</div>
                    </div>
                </div>
                <div class="item-body">
                    <div class="item-left">
                        <div class="data-row">
                            <div class="d-field" style="flex: 3;"><span class="lbl">MATRIZ:</span><span class="val">${item.matriz || ''}${item.ubicacion ? ` (${item.ubicacion})` : ''}</span></div>
                            <div class="d-field" style="flex: 1;"><span class="lbl">PLANO/REV:</span><span class="val">${item.plano_rev || ''}</span></div>
                        </div>
                        ${ident ? `
                        <div class="data-row">
                            <div class="d-field"><span class="lbl">IDENTIFICACIÓN:</span><span class="val">${ident}</span></div>
                        </div>` : ''}
                        ${item.pc ? `
                        <div class="data-row">
                            <div class="d-field"><span class="lbl">PC:</span><span class="val">${item.pc}</span></div>
                        </div>` : ''}
                        <div class="obs-container">
                            <div class="obs-box" style="background-color: #fff; min-height: 45px; font-weight: normal;">Obs: </div>
                        </div>
                    </div>
                    <div class="item-right">
                        <div class="entregas-title print-bg">ENTREGAS</div>
                        <div class="entregas-table-wrap">
                            <table class="entregas-table">
                                <thead>
                                    <tr>
                                        <th style="width: 40%;">Fecha</th>
                                        <th style="width: 25%;">Cant.</th>
                                        <th style="width: 35%;">Lote</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${entregasRows}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                ${ccItems ? `
                <div class="controls-section">
                    <fieldset class="controls-fieldset">
                        <legend class="controls-legend">Controles</legend>
                        <div class="controls-list">
                            ${ccItems}
                        </div>
                    </fieldset>
                </div>` : ''}
            </div>`;
    }).join('');

    const itemsHtmlAdmin = items.map((item, index) => {
        const obsDescuento = item.observacionDescuento || item.observacionesDescuento || item.descuentoObservacion || item.descuento_observacion || item.descuento_observaciones || '';
        const hasDiscount = (item.descuento !== undefined && item.descuento !== null) || !!obsDescuento;
        const entregasRows = renderEntregasTableRows(item.entregas || item.entregas_parciales);

        return `
            <div class="item-card">
                <div class="item-head print-bg">
                    <div class="item-head-left">
                        <div class="badge-black print-bg">PIEZA</div>
                        <div class="item-title">${item.titulo || ''}</div>
                    </div>
                    <div class="badge-cant"><span>Cant.:</span> <span class="badge-cant-value">${item.cantidad_total ?? ''}</span></div>
                </div>
                <div class="item-subhead">
                    <div class="pill-group"><span class="lbl">MAT.</span>
                        <div class="pill-box">${item.material || ''}</div>
                    </div>
                    <div class="pill-group"><span class="lbl">FÓRMULA</span>
                        <div class="pill-box">${item.formula || ''}</div>
                    </div>
                    <div class="pill-group"><span class="lbl">COTIZACIÓN</span>
                        <div class="pill-box">${item.cotizacion !== undefined && item.cotizacion !== null && !isNaN(Number(item.cotizacion)) ? `U$D ${Number(item.cotizacion).toFixed(3)}` : ''}</div>
                    </div>
                    <div class="pill-group"><span class="lbl">FECHA COT.</span>
                        <div class="pill-box">${item.fechaCotizacion || ''}</div>
                    </div>
                    ${item.descuento !== undefined && item.descuento !== null ? `
                    <div class="pill-group"><span class="lbl">DESCUENTO %</span>
                        <div class="pill-box">${item.descuento} %</div>
                    </div>
                    ` : ''}
                    ${item.precio_descuento !== undefined && item.precio_descuento !== null && !isNaN(Number(item.precio_descuento)) ? `
                    <div class="pill-group"><span class="lbl">PRECIO DESC.</span>
                        <div class="pill-box">U$D ${item.precio_descuento}</div>
                    </div>
                    ` : ''}
                </div>
                <div class="item-body">
                    <div class="item-left" style="padding-top: 10px;">
                        <div class="data-row">
                            <div class="d-field"><span class="lbl">TIPO DESPACHO:</span><span class="val">${formatTipoDespacho(cabecera.tipoDespacho)}</span></div>
                        </div>
                        ${hasDiscount ? `
                        <div class="data-row">
                            <div class="d-field"><span class="lbl">OBSERVACIÓN DESCUENTO:</span><span class="val">${obsDescuento}</span></div>
                        </div>` : ''}
                        ${cabecera.empresaTransporte ? `
                        <div class="data-row">
                            <div class="d-field"><span class="lbl">TRANSPORTE:</span><span class="val">${cabecera.empresaTransporte}</span></div>
                        </div>` : ''}
                        ${cabecera.mediosEnvio && cabecera.mediosEnvio.length > 0 ? `
                        <div class="data-row">
                            <div class="d-field"><span class="lbl">MEDIOS ENVÍO:</span><span class="val">${cabecera.mediosEnvio.join(', ')}</span></div>
                        </div>` : ''}
                        ${cabecera.domicilioEnvio ? `
                        <div class="data-row">
                            <div class="d-field"><span class="lbl">DOMICILIO ENVÍO:</span><span class="val">${cabecera.domicilioEnvio}</span></div>
                        </div>` : ''}
                    </div>
                    <div class="item-right">
                        <div class="entregas-title print-bg">ENTREGAS</div>
                        <div class="entregas-table-wrap">
                            <table class="entregas-table">
                                <thead>
                                    <tr>
                                        <th style="width: 40%;">Fecha</th>
                                        <th style="width: 25%;">Cant.</th>
                                        <th style="width: 35%;">Lote</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${entregasRows}
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
        .header-box { border: 2px solid #000; display: flex; margin-bottom: 12px; flex-shrink: 0; position: relative; }
        .header-left { flex: 1; padding: 15px 15px 10px 15px; border-right: 2px solid #000; display: flex; flex-direction: column; justify-content: space-between; }
        .header-left h1 { position: absolute; top: -10px; left: 15px; background: #fff; padding: 0 8px; font-size: 16px; font-weight: bold; margin: 0; letter-spacing: 0.5px; line-height: 1; }
        .h-row { display: flex; align-items: flex-end; margin-bottom: 3px; gap: 10px; }
        .h-row:last-child { margin-bottom: 0; }
        .h-row:first-of-type { margin-top: 5px; }
        .h-field { display: flex; align-items: flex-end; margin-bottom: 8px; flex: 1; }
        .h-field.fixed { flex: 0 0 150px; }
        .h-lbl { font-weight: bold; font-size: 10px; margin-right: 8px; white-space: nowrap; }
        .h-val { font-size: 13px; border-bottom: 1px solid #000; flex: 1; min-height: 16px; padding-bottom: 2px; }
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
        .item-left { flex: 1; display: flex; flex-direction: column; padding: 10px; padding-top: 15px; border-right: 1px solid #000; }
        .data-row { display: flex; gap: 15px; margin-bottom: 12px; }
        .d-field { display: flex; align-items: flex-end; margin-bottom: 6px; flex: 1; }
        .d-field.narrow { flex: 0 0 120px; }
        .d-field.stacked { display: flex; flex-direction: column; gap: 4px; margin-bottom: 10px; }
        .d-field.stacked:last-child { margin-bottom: 0; }
        .d-field.stacked .lbl { font-size: 10px; padding-bottom: 2px; }
        .d-field.stacked .val { border-bottom: 1px solid #000; font-size: 12px; font-weight: bold; min-height: 16px; padding-bottom: 2px; width: 100%; }
        .d-field .lbl { font-size: 10px; margin-right: 6px; white-space: nowrap; }
        .d-field .val { font-size: 12px; font-weight: bold; border-bottom: 1px solid #000; flex: 1; min-height: 14px; padding-bottom: 2px; }
        .fields-grid { display: flex; gap: 12px; margin-bottom: 12px; }
        .fields-col-left { width: 90px; flex-shrink: 0; display: flex; flex-direction: column; justify-content: flex-start; border-right: 1px dashed #ccc; padding-right: 10px; }
        .fields-col-right { flex: 1; display: flex; flex-direction: column; }
        .obs-container { display: flex; gap: 6px; }
        .obs-box { flex: 1; border: 1px solid #000; padding: 4px 6px; font-size: 12px; font-weight: bold; }
        .item-right { width: 210px; display: flex; flex-direction: column; }
        .entregas-title { background-color: #e6e6e6; text-align: center; font-size: 10px; font-weight: bold; padding: 4px 0; border-bottom: 1px solid #000; }
        .entregas-table-wrap { flex: 1; display: flex; flex-direction: column; }
        .entregas-table { width: 100%; height: 100%; border-collapse: collapse; table-layout: fixed; }
        .entregas-table thead { display: table-header-group; }
        .entregas-table tbody { display: table-row-group; }
        .entregas-table th { font-size: 10px; border-bottom: 1px solid #000; border-right: 1px solid #000; padding: 4px; text-align: center; }
        .entregas-table th:last-child { border-right: none; }
        .entregas-table td { border-bottom: 1px solid #000; border-right: 1px solid #000; height: 20px; }
        .entregas-table td:last-child { border-right: none; }
        .entregas-table tr:last-child td { border-bottom: none; }
        .controls-section { border-top: 1px solid #000; }
        .controls-fieldset { border: 1px solid #000; margin: 10px; padding: 5px 12px; border-radius: 4px; background-color: #fff; }
        .controls-legend { font-size: 10px; font-weight: bold; padding: 0 6px; text-transform: uppercase; }
        .controls-list { display: flex; flex-direction: column; }
        .control-row { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed #ccc; padding: 4px 0; font-size: 11px; }
        .control-row:last-child { border-bottom: none; }
        .control-lbl { font-weight: bold; margin-right: 8px; }
        .control-val { flex: 1; }
        .checkbox { width: 12px; height: 12px; border: 1px solid #000; background-color: #fff; display: inline-block; vertical-align: middle; margin-left: 6px; flex-shrink: 0; }
        .admin-header-sep {
            margin-top: 50px !important;
        }
        @media print {
            @page { margin: 0; size: A4 portrait; }
            body { background: #fff; margin: 0; padding: 0; }
            .a4-page { margin: 0; padding: 10mm; box-shadow: none; width: 210mm; height: 297mm; page-break-after: always; box-sizing: border-box; overflow: hidden; }
        }
    </style>
</head>
<body>
    <div id="raw-content">
        <!-- PLANTA DOCUMENT -->
        <div class="section-group" data-section="planta">
            <div class="header-box planta-header">
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
                        <div class="h-field"><span class="h-lbl">SECTOR:</span>
                            <div class="h-val">${cabecera.sector || ''}</div>
                        </div>
                        <div class="h-field"><span class="h-lbl">MÁQUINA:</span>
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
                ${itemsHtmlPlanta}
            </div>
        </div>

        <!-- ADMINISTRACION DOCUMENT -->
        <div class="section-group" data-section="admin">
            <div class="header-box admin-header">
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
                        <div class="h-field"><span class="h-lbl">TELÉFONO:</span>
                            <div class="h-val">${cabecera.telefonoCliente || ''}</div>
                        </div>
                        <div class="h-field"><span class="h-lbl">EMAIL:</span>
                            <div class="h-val">${cabecera.emailCliente || ''}</div>
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
                ${itemsHtmlAdmin}
            </div>
        </div>
    </div>

    <script>
        window.addEventListener('load', function() {
            paginate();
        });

        function paginate() {
            const rawContent = document.getElementById('raw-content');
            if (!rawContent) return;

            const plantaHeader = rawContent.querySelector('.planta-header');
            const plantaItems = Array.from(rawContent.querySelectorAll('[data-section="planta"] .item-card'));
            
            const adminHeader = rawContent.querySelector('.admin-header');
            const adminItems = Array.from(rawContent.querySelectorAll('[data-section="admin"] .item-card'));
            
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
            let currentHeaderEl = plantaHeader.cloneNode(true);
            current.page.insertBefore(currentHeaderEl, current.container);
            
            for (let i = 0; i < plantaItems.length; i++) {
                const item = plantaItems[i].cloneNode(true);
                current.container.appendChild(item);
                
                const headerHeight = currentHeaderEl.offsetHeight;
                const itemsHeight = current.container.offsetHeight;
                let totalHeight = headerHeight + itemsHeight;
                if (current.container.children.length > 1) {
                    totalHeight += 12;
                }
                
                if (totalHeight > maxInnerHeight) {
                    if (current.container.children.length > 1) {
                        current.container.removeChild(item);
                        
                        current = createPage();
                        currentHeaderEl = plantaHeader.cloneNode(true);
                        current.page.insertBefore(currentHeaderEl, current.container);
                        
                        current.container.appendChild(item);
                    }
                }
            }

            if (adminItems.length > 0) {
                const adminHeaderClone = adminHeader.cloneNode(true);
                adminHeaderClone.classList.add('admin-header-sep');
                
                const adminContainer = document.createElement('div');
                adminContainer.className = 'items-container admin-items-container';
                
                current.page.appendChild(adminHeaderClone);
                current.page.appendChild(adminContainer);
                
                const firstAdminItem = adminItems[0].cloneNode(true);
                adminContainer.appendChild(firstAdminItem);
                
                let totalPageHeight = 0;
                Array.from(current.page.children).forEach(child => {
                    totalPageHeight += child.offsetHeight;
                });
                totalPageHeight += 15;
                
                if (totalPageHeight > maxInnerHeight) {
                    adminContainer.removeChild(firstAdminItem);
                    current.page.removeChild(adminContainer);
                    current.page.removeChild(adminHeaderClone);
                    
                    current = createPage();
                    currentHeaderEl = adminHeader.cloneNode(true);
                    current.page.insertBefore(currentHeaderEl, current.container);
                    current.container.appendChild(firstAdminItem);
                    
                    for (let i = 1; i < adminItems.length; i++) {
                        const item = adminItems[i].cloneNode(true);
                        current.container.appendChild(item);
                        
                        const headerHeight = currentHeaderEl.offsetHeight;
                        const itemsHeight = current.container.offsetHeight;
                        let totalH = headerHeight + itemsHeight;
                        if (current.container.children.length > 1) {
                            totalH += 12;
                        }
                        
                        if (totalH > maxInnerHeight) {
                            if (current.container.children.length > 1) {
                                current.container.removeChild(item);
                                current = createPage();
                                currentHeaderEl = adminHeader.cloneNode(true);
                                current.page.insertBefore(currentHeaderEl, current.container);
                                current.container.appendChild(item);
                            }
                        }
                    }
                } else {
                    for (let i = 1; i < adminItems.length; i++) {
                        const item = adminItems[i].cloneNode(true);
                        adminContainer.appendChild(item);
                        
                        let totalPageH = 0;
                        Array.from(current.page.children).forEach(child => {
                            totalPageH += child.offsetHeight;
                        });
                        totalPageH += 15;
                        
                        if (totalPageH > maxInnerHeight) {
                            if (adminContainer.children.length > 1) {
                                adminContainer.removeChild(item);
                                
                                current = createPage();
                                currentHeaderEl = adminHeader.cloneNode(true);
                                current.page.insertBefore(currentHeaderEl, current.container);
                                current.container.appendChild(item);
                            }
                        }
                    }
                }
            }
            
            rawContent.remove();
        }
    </script>
</body>
</html>`;
}
