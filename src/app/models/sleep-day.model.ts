import { SleepInterval } from './sleep-interval.model';

export interface SleepDay {
  date: string;           // '2024-12-25'
  intervals: SleepInterval[];
  quality: number;        // 1-5 звезд
  note?: string;
  totalDuration?: string;

  caffeine?: number;      // чашки кофе
  steps?: number;         // количество шагов
  inertia?: number;       // сонная инерция 0-5
}
