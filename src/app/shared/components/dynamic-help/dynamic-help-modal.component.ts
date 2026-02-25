import { Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { HelpService } from 'app/core/services/help.service';
import { PermissionService } from 'app/core/services/permission.service';
import { NotificationService } from 'app/shared/services/notification.service';
import { finalize } from 'rxjs/operators';

export interface HelpModalData {
    path: string;
}

@Component({
    selector: 'app-dynamic-help-modal',
    templateUrl: './dynamic-help-modal.component.html',
    styleUrls: ['./dynamic-help-modal.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class DynamicHelpModalComponent implements OnInit {
    path: string;
    content: string = '';
    isLoading: boolean = true;
    isEditing: boolean = false;
    canEdit: boolean = false;
    editContent: string = '';

    quillModules = {
        toolbar: [
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'header': 1 }, { 'header': 2 }],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            [{ 'color': [] }, { 'background': [] }],
            ['clean']
        ]
    };

    constructor(
        public dialogRef: MatDialogRef<DynamicHelpModalComponent>,
        @Inject(MAT_DIALOG_DATA) public data: HelpModalData,
        private _helpService: HelpService,
        private _permissionService: PermissionService,
        private _notificationService: NotificationService
    ) {
        this.path = data.path;
    }

    ngOnInit(): void {
        this.canEdit = this._permissionService.hasPermission('HELP_MODAL_EDIT');
        this.loadHelp();
    }

    loadHelp(): void {
        this.isLoading = true;
        this._helpService.getHelp(this.path)
            .pipe(finalize(() => this.isLoading = false))
            .subscribe({
                next: (content) => {
                    // Doble validación para evitar el renderizado de la palabra "null"
                    this.content = (content === 'null' || !content) ? '' : content;
                    this.editContent = this.content;
                },
                error: () => {
                    this._notificationService.showError('Error al cargar la ayuda.');
                }
            });
    }

    toggleEdit(): void {
        this.isEditing = !this.isEditing;
        if (this.isEditing) {
            this.editContent = this.content;
        }
    }

    saveHelp(): void {
        this.isLoading = true;
        this._helpService.saveHelp(this.path, this.editContent)
            .pipe(finalize(() => this.isLoading = false))
            .subscribe({
                next: (success) => {
                    if (success) {
                        this.content = this.editContent;
                        this.isEditing = false;
                        this._notificationService.showSuccess('Ayuda guardada correctamente.');
                    } else {
                        this._notificationService.showError('Error al guardar la ayuda.');
                    }
                },
                error: () => {
                    this._notificationService.showError('Error de comunicación con el servidor.');
                }
            });
    }

    onClose(): void {
        this.dialogRef.close();
    }
}
