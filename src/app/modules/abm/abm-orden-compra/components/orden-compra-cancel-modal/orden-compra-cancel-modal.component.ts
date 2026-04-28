import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
    selector: 'app-orden-compra-cancel-modal',
    templateUrl: './orden-compra-cancel-modal.component.html',
})
export class OrdenCompraCancelModalComponent implements OnInit {
    form: FormGroup;
    @Input() comprobante: string;
    @Input() id: number;

    constructor(private _fb: FormBuilder) {
        this.form = this._fb.group({
            observaciones: ['', [Validators.required, Validators.minLength(5)]]
        });
    }

    ngOnInit(): void {}

    getValue(): any {
        if (this.form.valid) {
            return this.form.get('observaciones').value;
        } else {
            this.form.markAllAsTouched();
            return null;
        }
    }
}
