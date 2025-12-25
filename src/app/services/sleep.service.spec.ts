import { TestBed } from '@angular/core/testing';
import { SleepService } from './sleep.service';
import { SleepDay } from '../models/sleep-day.model';

describe('SleepService', () => {
  let service: SleepService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SleepService);
    localStorage.clear();
  });

  it('should add sleep day', () => {
    const day: SleepDay = {
      date: '2025-01-01',
      intervals: [{ start: '23:00', end: '07:00' }],
      caffeine: 2,
      steps: 6000,
      inertia: 3
    };

    service.upsertDay(day);

    expect(service.getSnapshot().length).toBe(1);
  });

  it('should update intervals for same day', () => {
    service.upsertDay({
      date: '2025-01-01',
      intervals: [{ start: '23:00', end: '07:00' }],
      caffeine: 1,
      steps: 4000,
      inertia: 4
    });

    service.upsertDay({
      date: '2025-01-01',
      intervals: [
        { start: '23:00', end: '07:00' },
        { start: '14:00', end: '14:30' }
      ],
      caffeine: 1,
      steps: 4000,
      inertia: 4
    });

    expect(service.getSnapshot()[0].intervals.length).toBe(2);
  });
});
