// src/app/pipes/sleep-bar.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';
import { SleepDay } from '../models/sleep-day.model';
import { SleepInterval } from '../models/sleep-interval.model';

@Pipe({
  name: 'sleepBar',
  standalone: true,
  pure:false
})
export class SleepBarPipe implements PipeTransform {
  transform(day: SleepDay): string {
    if (!day.intervals || day.intervals.length === 0) {
      return '—';
    }

    const hours = new Array(24).fill(false);
    
    for (const interval of day.intervals) {
      this.markSleepHours(hours, interval);
    }
    
    let result = '|';
    for (let i = 0; i < 24; i++) {
      result += hours[i] ? '▰' : '▱';
    }
    result += '|';
    
    return result;
  }

  private markSleepHours(hours: boolean[], interval: SleepInterval): void {
    const start = this.timeToMinutes(interval.start);
    const end = this.timeToMinutes(interval.end);
    
    if (start === null || end === null) return;
    
    if (interval.start === '00:00' && interval.end === '23:59') {
      for (let i = 0; i < 24; i++) hours[i] = true;
      return;
    }
    
    if (end > start) {
      for (let minute = start; minute < end; minute++) {
        const hour = Math.floor(minute / 60) % 24;
        hours[hour] = true;
      }
    } else {
      for (let minute = start; minute < 1440; minute++) {
        const hour = Math.floor(minute / 60) % 24;
        hours[hour] = true;
      }
      for (let minute = 0; minute < end; minute++) {
        const hour = Math.floor(minute / 60) % 24;
        hours[hour] = true;
      }
    }
  }

  private timeToMinutes(time: string): number | null {
    if (!time || time.trim() === '') return null;
    const parts = time.split(':');
    if (parts.length !== 2) return null;
    
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    
    if (isNaN(hours) || isNaN(minutes)) return null;
    
    const normalizedHours = ((hours % 24) + 24) % 24;
    return normalizedHours * 60 + minutes;
  }
}
