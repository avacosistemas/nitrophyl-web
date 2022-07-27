import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PartsCrearSimpleComponent } from './parts-crear-simple.component';

describe('PartsCrearSimpleComponent', () => {
  let component: PartsCrearSimpleComponent;
  let fixture: ComponentFixture<PartsCrearSimpleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PartsCrearSimpleComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PartsCrearSimpleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
