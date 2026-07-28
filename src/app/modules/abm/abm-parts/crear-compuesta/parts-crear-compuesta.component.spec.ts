import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PartsCrearCompuestaComponent } from './parts-crear-compuesta.component';

describe('PartsCrearCompuestaComponent', () => {
  let component: PartsCrearCompuestaComponent;
  let fixture: ComponentFixture<PartsCrearCompuestaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PartsCrearCompuestaComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PartsCrearCompuestaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
