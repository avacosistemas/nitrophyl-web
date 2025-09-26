import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
    selector: 'app-textarea-modal',
    templateUrl: './textarea-modal.component.html'
})
export class TextareaModalComponent implements OnInit {
    form: FormGroup;

    constructor(private fb: FormBuilder) {
        this.form = this.fb.group({
            observation: ['', Validators.required]
        });
    }

    ngOnInit(): void {
        //
    }

    public getValue(): string | null {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return null;
        }
        return this.form.get('observation').value;
    }
}