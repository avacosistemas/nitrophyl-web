import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
    selector: 'app-textarea-modal',
    templateUrl: './textarea-modal.component.html'
})
export class TextareaModalComponent implements OnInit {
    form: FormGroup;

    @Input() initialValue: string = '';
    @Input() isRequired: boolean = true;
    @Input() label: string = 'Observación';

    constructor(private fb: FormBuilder) {
        this.form = this.fb.group({
            observation: [''] 
        });
    }

    ngOnInit(): void {
        const validators = this.isRequired ? [Validators.required] : [];
        const observationControl = this.form.get('observation');
        
        observationControl.setValidators(validators);
        observationControl.setValue(this.initialValue || '');
        observationControl.updateValueAndValidity();
    }

    public getValue(): string | null {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return null;
        }
        return this.form.get('observation').value;
    }
}