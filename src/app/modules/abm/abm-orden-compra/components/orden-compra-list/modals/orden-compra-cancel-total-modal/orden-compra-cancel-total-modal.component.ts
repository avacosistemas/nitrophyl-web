import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
    selector: 'app-orden-compra-cancel-total-modal',
    templateUrl: './orden-compra-cancel-total-modal.component.html'
})
export class OrdenCompraCancelTotalModalComponent implements OnInit {
    @Input() comprobante: string = '';
    @Input() id!: number;
    form: FormGroup;

    constructor(private _fb: FormBuilder) {
        this.form = this._fb.group({
            motivo: ['', [Validators.required, Validators.minLength(5)]]
        });
    }

    ngOnInit(): void {
        this.form.markAsUntouched();
    }

    getValue(): any {
        if (this.form.valid) {
            return this.form.get('motivo')?.value;
        }
        this.form.markAllAsTouched();
        return null;
    }
}
