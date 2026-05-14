import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';

export class CrossFieldErrorStateMatcher implements ErrorStateMatcher {
    isErrorState(control: any | null, form: any | null): boolean {
        return !!(control && control.invalid && (control.dirty || control.touched));
    }
}

@Component({
    selector: 'app-orden-compra-cancel-modal',
    templateUrl: './orden-compra-cancel-modal.component.html',
})
export class OrdenCompraCancelModalComponent implements OnInit {
    form: FormGroup;
    @Input() comprobante: string;
    @Input() id: number;
    matcher = new CrossFieldErrorStateMatcher();

    constructor(private _fb: FormBuilder) {
        this.form = this._fb.group({
            observaciones: ['', [Validators.required, Validators.minLength(5)]]
        });
    }

    ngOnInit(): void {
        this.form.markAsUntouched();
    }

    getValue(): any {
        if (this.form.valid) {
            return this.form.get('observaciones').value;
        } else {
            return null;
        }
    }
}
