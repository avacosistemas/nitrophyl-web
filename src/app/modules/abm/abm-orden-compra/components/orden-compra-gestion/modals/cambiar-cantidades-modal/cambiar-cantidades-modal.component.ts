import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
    selector: 'app-cambiar-cantidades-modal',
    templateUrl: './cambiar-cantidades-modal.component.html'
})
export class CambiarCantidadesModalComponent implements OnInit {
    @Input() grupo: any;
    @Input() batch: any;
    form!: FormGroup;

    constructor(private _fb: FormBuilder) {}

    ngOnInit(): void {
        this.form = this._fb.group({
            nuevaCantidad: [this.batch?.cantidadSolicitada || 1, [Validators.required, Validators.min(1)]],
            motivo: ['', [Validators.required, Validators.minLength(5)]]
        });
        this.form.markAsUntouched();
    }

    getValue(): any {
        if (this.form && this.form.valid) {
            return this.form.value;
        }
        if (this.form) {
            this.form.markAllAsTouched();
        }
        return null;
    }
}
