import { Component, Inject, OnInit } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";

@Component({
    selector: 'img-modal-dialog',
    templateUrl: 'img-modal.component.html',
    styleUrls: ['./img-modal.component.scss']
})

export class ImgModalDialogComponent implements OnInit {
    comments: string;
    imgAlt: string;
    imgSrc;

    constructor(
        public dialogRef: MatDialogRef<ImgModalDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data,
    ) { }

    ngOnInit(): void {
        this.imgAlt = this.data.imgAlt;
        if (this.data.imgType == "blob") {
            const reader = new FileReader();
            reader.readAsDataURL(this.data.src);
            reader.onload = _event => {
                let url = reader.result;
                this.imgSrc = url;
            };
        } else if (this.data.imgType == "array") {
            this.imgSrc = 'data:image/' + this.data.imgExtension + ';base64,' + this.data.src
        } else if (this.data.imgType == "url") {
            this.imgSrc = this.data.imgSrc;
        } else {
            return;
        }
    }

    save() {
        this.dialogRef.close(true)
    }

    close() {
        this.dialogRef.close(false)
    }
}