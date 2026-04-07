import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SleepDay, SleepInterval } from '../models';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class SleepService {
  private sleepDays: SleepDay[] = [];
  private sleepDays$ = new BehaviorSubject<SleepDay[]>([]);
  private readonly STORAGE_KEY = 'sleep_tracker_days';

  constructor(private snackBar: MatSnackBar) { this.loadFromStorage(); }

  getDays() { return this.sleepDays$.asObservable(); }

  saveDay(day: SleepDay): void {
    const processedIntervals = this.splitOvernightSleep(day);
    
    for (const item of processedIntervals) {
      const targetDate = item.date;
      const existingIndex = this.sleepDays.findIndex(d => d.date === targetDate);
      
      if (existingIndex >= 0) {
        const targetDay = { ...this.sleepDays[existingIndex] };
        
        this.addIntervalToDay(targetDay, item.interval);
        
        if (targetDate === day.date) {
          targetDay.note = day.note;
          targetDay.quality = day.quality;
        }
        
        this.sleepDays[existingIndex] = targetDay;
        
      } else {
        const newDay: SleepDay = {
          date: targetDate,
          intervals: [item.interval],
          quality: day.quality,
          note: targetDate === day.date ? day.note : undefined
        };
        this.sleepDays.push(newDay);
      }
    }
    
    this.sleepDays.sort((a, b) => b.date.localeCompare(a.date));
    
    this.saveToStorage();
    
    this.sleepDays$.next([...this.sleepDays]);
    
    this.showNotification('Запись сохранена!', 'success');
  }

  private splitOvernightSleep(day: SleepDay): Array<{date: string, interval: SleepInterval}> {
    const result: Array<{date: string, interval: SleepInterval}> = [];
    
    for (const interval of day.intervals) {
      const start = this.timeToMinutes(interval.start);
      const end = this.timeToMinutes(interval.end);
      
      if (start === null || end === null) continue;
      
      if (end > start) {
        result.push({ date: day.date, interval });
      } else {
        result.push({
          date: day.date,
          interval: { start: interval.start, end: '23:59' }
        });
        
        const nextDate = new Date(day.date);
        nextDate.setDate(nextDate.getDate() + 1);
        const nextDateStr = nextDate.toISOString().split('T')[0];
        
        result.push({
          date: nextDateStr,
          interval: { start: '00:00', end: interval.end }
        });
      }
    }
    return result;
  }

  private addIntervalToDay(day: SleepDay, newInterval: SleepInterval): void {
    const start = this.timeToMinutes(newInterval.start)!;
    const end = this.timeToMinutes(newInterval.end)!;

    const isDuplicate = day.intervals.some(i => i.start === newInterval.start && i.end === newInterval.end);
    if (!isDuplicate) {
      day.intervals.push(newInterval);
    }
  }

  private timeToMinutes(time: string): number | null {
    if (!time) return null;
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }

  private minutesToTime(minutes: number): string {
    const h = Math.floor(minutes / 60) % 24;
    const m = minutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }

  private saveToStorage() { localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.sleepDays)); }
  private loadFromStorage() {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      this.sleepDays = JSON.parse(saved);
      this.sleepDays$.next([...this.sleepDays]);
    }
  }
  private showNotification(message: string, type: string) {
    this.snackBar.open(message, '✕', { duration: 3000, panelClass: ['app-theme'] });
  }
  deleteDay(date: string): void {
    this.sleepDays = this.sleepDays.filter(d => d.date !== date);
    this.saveToStorage();
    this.sleepDays$.next([...this.sleepDays]);
    this.showNotification('Запись удалена!', 'success');
  }
}
