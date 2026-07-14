import { Component, Inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import jsPDF from 'jspdf';

@Component({
    selector: 'app-ot-preview-dialog',
    templateUrl: './ot-preview-dialog.component.html',
    styles: [`
        iframe {
            border: none;
            width: 100%;
            height: 75vh;
            background: #525659;
        }
    `]
})
export class OtPreviewDialogComponent implements OnInit {
    @ViewChild('iframe', { static: true }) iframeRef!: ElementRef<HTMLIFrameElement>;

    constructor(
        public dialogRef: MatDialogRef<OtPreviewDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { html: string, title: string }
    ) {}

    ngOnInit(): void {
        this.loadIframeContent();
    }

    loadIframeContent(): void {
        const iframe = this.iframeRef.nativeElement;
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (doc) {
            doc.open();
            doc.write(this.data.html);
            doc.close();
        }
    }

    print(): void {
        const iframe = this.iframeRef.nativeElement;
        if (iframe && iframe.contentWindow) {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
        }
    }

    download(): void {
        const iframe = this.iframeRef.nativeElement;
        const docElement = iframe.contentDocument?.body || iframe.contentWindow?.document.body;
        const iframeWindow = iframe.contentWindow;
        
        if (docElement && iframeWindow) {
            const pages = docElement.querySelectorAll('.a4-page');
            if (pages.length === 0) return;

            let stylesHtml = '';
            const styles = docElement.ownerDocument.getElementsByTagName('style');
            for (let i = 0; i < styles.length; i++) {
                stylesHtml += styles[i].textContent + '\n';
            }

            const pdf = new jsPDF('p', 'mm', 'a4');
            
            const renderPage = (index: number) => {
                if (index >= pages.length) {
                    pdf.save(`${this.data.title || 'OT'}.pdf`);
                    return;
                }
                
                const page = pages[index] as HTMLElement;
                const width = page.offsetWidth;
                const height = page.offsetHeight;
                
                const serializer = new XMLSerializer();
                const tempDiv = page.cloneNode(true) as HTMLElement;
                
                const serializedPage = serializer.serializeToString(tempDiv);
                
                const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <foreignObject width="100%" height="100%">
    <div xmlns="http://www.w3.org/1999/xhtml" style="width: 100%; height: 100%; box-sizing: border-box; background: #fff; font-family: Arial, Helvetica, sans-serif; font-size: 11px; line-height: 1.2; color: #000;">
      <style>
        ${stylesHtml}
        .a4-page { margin: 0 !important; box-shadow: none !important; width: 100% !important; height: 100% !important; }
      </style>
      ${serializedPage}
    </div>
  </foreignObject>
</svg>`;

                const img = new Image();
                const base64Svg = btoa(unescape(encodeURIComponent(svg)));
                const url = `data:image/svg+xml;base64,${base64Svg}`;
                
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = width * 2;
                    canvas.height = height * 2;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.scale(2, 2);
                        ctx.drawImage(img, 0, 0);
                    }
                    
                    if (index > 0) {
                        pdf.addPage();
                    }
                    
                    try {
                        const imgData = canvas.toDataURL('image/jpeg', 0.95);
                        const imgWidth = 210;
                        const imgHeight = 297;
                        pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
                    } catch (e) {
                        console.error('Failed to export page canvas to PDF data', e);
                    }
                    
                    renderPage(index + 1);
                };
                
                img.onerror = (err) => {
                    console.error('Error rendering page to PDF', err);
                    renderPage(index + 1);
                };
                
                img.src = url;
            };
            
            renderPage(0);
        }
    }

    cancel(): void {
        this.dialogRef.close();
    }
}
