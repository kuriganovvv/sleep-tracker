import { TestBed } from '@angular/core/testing';
import { SleepService } from './sleep.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';
import { SleepDay } from '../models/sleep-day.model';
import { SleepInterval } from '../models/sleep-interval.model';

describe('SleepService', () => {
  let service: SleepService;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;

  beforeEach(() => {
    const snackBarMock = jasmine.createSpyObj('MatSnackBar', ['open']);
    
    TestBed.configureTestingModule({
      providers: [
        SleepService,
        { provide: MatSnackBar, useValue: snackBarMock }
      ]
    });
    
    service = TestBed.inject(SleepService);
    snackBarSpy = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('должен создаваться', () => {
    expect(service).toBeTruthy();
  });

  it('должен сохранять день сна', () => {
    const day: SleepDay = {
      date: '2024-12-27',
      intervals: [{ start: '22:00', end: '07:00' }],
      quality: 4
    };

    service.saveDay(day);
    const days = service.getAllDays();

    expect(days.length).toBe(2);
    expect(snackBarSpy.open).toHaveBeenCalled();
  });

  it('должен разделять ночной сон на два дня', () => {
    const day: SleepDay = {
      date: '2024-12-27',
      intervals: [{ start: '22:00', end: '07:00' }],
      quality: 5,
      note: 'Хороший сон'
    };

    service.saveDay(day);
    const days = service.getAllDays();

    expect(days.length).toBe(2);
    expect(days[0].date).toBe('2024-12-28');
    expect(days[1].date).toBe('2024-12-27');
  });

  it('должен очищать все данные', () => {
    const day1: SleepDay = {
      date: '2024-12-25',
      intervals: [{ start: '22:00', end: '07:00' }],
      quality: 4
    };

    const day2: SleepDay = {
      date: '2024-12-26',
      intervals: [{ start: '23:00', end: '08:00' }],
      quality: 3
    };

    service.saveDay(day1);
    service.saveDay(day2);
    service.clearAll();

    expect(service.getAllDays().length).toBe(0);
  });

  it('должен возвращать данные через Observable', (done) => {
    const day: SleepDay = {
      date: '2024-12-27',
      intervals: [{ start: '22:00', end: '07:00' }],
      quality: 3
    };

    let callCount = 0;
    service.getDays().subscribe(days => {
      callCount++;
      // Пропускаем первый пустой вызов
      if (callCount > 1 && days.length > 0) {
        expect(days[0].date).toBe('2024-12-28');
        done();
      }
    });

    service.saveDay(day);
  });

  it('должен загружать данные из localStorage', () => {
    const mockData: SleepDay[] = [{
      date: '2024-11-29',
      intervals: [{ start: '21:30', end: '06:30' }],
      quality: 4
    }];

    localStorage.setItem('sleep_tracker_days', JSON.stringify(mockData));
    
    const newService = new SleepService(snackBarSpy);
    
    expect(newService.getAllDays().length).toBe(1);
    expect(newService.getAllDays()[0].date).toBe('2024-11-29');
  });
});
