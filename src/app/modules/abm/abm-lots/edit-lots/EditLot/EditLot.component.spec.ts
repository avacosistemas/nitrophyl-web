/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { EditLotComponent } from './EditLot.component';

describe('EditLotComponent', () => {
  let component: EditLotComponent;
  let fixture: ComponentFixture<EditLotComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EditLotComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditLotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
