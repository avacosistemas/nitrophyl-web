import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

interface DialogData {
  imgSrc: string;
  imgAlt: string;
  imgExtension: string;
}

@Component({
  selector: 'app-modal-foto',
  templateUrl: './modal-foto.component.html',
  styleUrls: ['./modal-foto.component.scss']
})
export class ModalFotoComponent implements OnInit {
  base64ImageSrc: string = '';
  imgAlt: string;

  constructor(
    public dialogRef: MatDialogRef<ModalFotoComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
  ) {
    this.imgAlt = data.imgAlt;
  }

  ngOnInit(): void {

    this.base64ImageSrc = `data:image/${this.data.imgExtension};base64,${this.data.imgSrc}`;
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}