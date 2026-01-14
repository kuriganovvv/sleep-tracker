import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SleepFormComponent } from './sleep-form.component';
import { SleepService } from '../../services/sleep.service';
import { FormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('SleepFormComponent', () => {
  let component: SleepFormComponent;
  let fixture: ComponentFixture<SleepFormComponent>;
  let sleepServiceSpy: jasmine.SpyObj<SleepService>;

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('SleepService', ['saveDay']);
    
    await TestBed.configureTestingModule({
      imports: [
        SleepFormComponent,
        FormsModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: SleepService, useValue: spy }
      ]
    }).compileComponents();

    sleepServiceSpy = TestBed.inject(SleepService) as jasmine.SpyObj<SleepService>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SleepFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('должен создаваться', () => {
    expect(component).toBeTruthy();
  });

  it('должен инициализироваться с дефолтными значениями', () => {
    expect(component.selectedDate).toBe('today');
    expect(component.intervals.length).toBe(1);
    expect(component.quality).toBe(3);
    expect(component.note).toBe('');
  });

  it('должен добавлять интервал сна', () => {
    const initialCount = component.intervals.length;
    component.addInterval();
    
    expect(component.intervals.length).toBe(initialCount + 1);
  });

  it('должен удалять интервал сна', () => {
    component.addInterval();
    const initialCount = component.intervals.length;
    
    component.removeInterval(1);
    
    expect(component.intervals.length).toBe(initialCount - 1);
  });

  it('должен рассчитывать длительность интервала', () => {
    const interval = { start: '22:00', end: '07:00' };
    const duration = component.getIntervalDuration(interval);
    
    expect(duration).toBe('9ч');
  });

  it('должен рассчитывать общее время сна', () => {
    component.intervals = [
      { start: '22:00', end: '07:00' },
      { start: '14:00', end: '15:00' }
    ];
    
    component.calculateTotalSleep();
    
    expect(component.totalSleep).toBe('10ч');
  });

  it('должен проверять возможность сохранения', () => {
    component.intervals = [{ start: '', end: '' }];
    expect(component.canSave()).toBeFalse();
    
    component.intervals = [{ start: '22:00', end: '07:00' }];
    component.quality = 3;
    expect(component.canSave()).toBeTrue();
  });

  it('должен сохранять сон', () => {
    const emitSpy = spyOn(component.saved, 'emit');
    component.intervals = [{ start: '22:00', end: '07:00' }];
    component.quality = 4;
    
    component.saveSleep();
    
    expect(sleepServiceSpy.saveDay).toHaveBeenCalled();
    expect(emitSpy).toHaveBeenCalled();
  });

  it('должен очищать форму', () => {
    component.intervals = [{ start: '23:00', end: '08:00' }];
    component.quality = 2;
    component.note = 'Тест';
    
    component.clearForm();
    
    expect(component.intervals.length).toBe(1);
    expect(component.intervals[0].start).toBe('22:00');
    expect(component.note).toBe('');
  });
});
