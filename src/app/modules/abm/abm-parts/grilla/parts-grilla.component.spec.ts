import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PartsGrillaComponent } from './parts-grilla.component';

describe('PartsGrillaComponent', () => {
  let component: PartsGrillaComponent;
  let fixture: ComponentFixture<PartsGrillaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PartsGrillaComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PartsGrillaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
