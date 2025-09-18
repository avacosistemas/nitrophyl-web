import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
    selector: 'app-textarea-modal',
    templateUrl: './textarea-modal.component.html'
})
export class TextareaModalComponent implements OnInit {
    form: FormGroup;

    constructor(private fb: FormBuilder) { }

    ngOnInit(): void {
        this.form = this.fb.group({
            observation: ['', Validators.required]
        });
    }

    public getValue(): string | null {
        if (this.form.valid) {
            return this.form.get('observation').value;
        }
        this.form.markAllAsTouched();
        return null;
    }
}