import { SleepInterval } from './sleep-interval.model';

export interface SleepDay {
  date: string; // ГГГГ-ММ-ДД
  intervals: SleepInterval[];

  caffeine: number;
  steps: number;
  inertia: number; 
  note?: string;
}
