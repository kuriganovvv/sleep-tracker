// src/app/services/sleep.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SleepDay, SleepInterval } from '../models';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class SleepService {
  private sleepDays: SleepDay[] = [];
  private sleepDays$ = new BehaviorSubject<SleepDay[]>([]);
  private readonly STORAGE_KEY = 'sleep_tracker_days';
  

  constructor(private snackBar: MatSnackBar) {
    this.loadFromStorage();
  }

  getAllDays(): SleepDay[] {
    return [...this.sleepDays];
  }

  getDays() {
    return this.sleepDays$.asObservable();
  }

  saveDay(day: SleepDay): void {
    const processedIntervals = this.splitOvernightSleep(day);
    
    for (const interval of processedIntervals) {
      const targetDate = interval.date;
      const targetDay = this.sleepDays.find(d => d.date === targetDate);
      
      if (targetDay) {
        this.addIntervalToDay(targetDay, interval.interval);
        if (targetDate === day.date){
          targetDay.note = day.note;  
          targetDay.quality = day.quality;
        }
      } else {
        const newDay: SleepDay = {
          date: targetDate,
          intervals: [interval.interval],
          quality: day.quality,
          note: targetDate === day.date ? day.note : undefined // Примечание только к основному дню
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
    
    for (const originalInterval of day.intervals) {
      const start = this.timeToMinutes(originalInterval.start);
      const end = this.timeToMinutes(originalInterval.end);
      
      if (start === null || end === null) continue;
      
      if (end > start) {
        result.push({
          date: day.date,
          interval: originalInterval
        });
      } else {
        const baseDate = new Date(day.date);
        
        result.push({
          date: day.date,
          interval: {
            start: originalInterval.start,
            end: '23:59'
          }
        });
        
        const nextDate = new Date(baseDate);
        nextDate.setDate(nextDate.getDate() + 1);
        const nextDateStr = nextDate.toISOString().split('T')[0];
        
        result.push({
          date: nextDateStr,
          interval: {
            start: '00:00',
            end: originalInterval.end
          }
        });
      }
    }
    
    return result;
  }

  private addIntervalToDay(day: SleepDay, newInterval: SleepInterval): void {
    const newStart = this.timeToMinutes(newInterval.start);
    const newEnd = this.timeToMinutes(newInterval.end);
    
    if (newStart === null || newEnd === null) return;
    

    const overlappingIndices: number[] = [];
    
    for (let i = 0; i < day.intervals.length; i++) {
      const existing = day.intervals[i];
      const existingStart = this.timeToMinutes(existing.start);
      const existingEnd = this.timeToMinutes(existing.end);
      
      if (existingStart === null || existingEnd === null) continue;
      

      if (this.intervalsOverlap(newStart, newEnd, existingStart, existingEnd)) {
        overlappingIndices.push(i);
      }
    }
    
    if (overlappingIndices.length === 0) {

      day.intervals.push(newInterval);
    } else {

      const mergedIntervals = [newInterval];
      
      for (const index of overlappingIndices.sort((a, b) => b - a)) {
        mergedIntervals.push(day.intervals[index]);
        day.intervals.splice(index, 1);
      }
      

      let minStart = newStart;
      let maxEnd = newEnd;
      
      for (const interval of mergedIntervals) {
        const start = this.timeToMinutes(interval.start);
        const end = this.timeToMinutes(interval.end);
        
        if (start !== null && start < minStart) minStart = start;
        if (end !== null && end > maxEnd) maxEnd = end;
      }
      

      day.intervals.push({
        start: this.minutesToTime(minStart),
        end: this.minutesToTime(maxEnd)
      });
    }
  }


  private intervalsOverlap(start1: number, end1: number, start2: number, end2: number): boolean {

    if (end1 >= start1 && end2 >= start2) {
      return start1 < end2 && start2 < end1;
    }

    return true;
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

  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60) % 24;
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }


  upsertDay(day: SleepDay): void {
    this.saveDay(day);
  }

  deleteDay(date: string): void {
    this.sleepDays = this.sleepDays.filter(d => d.date !== date);
    this.saveToStorage();
    this.sleepDays$.next([...this.sleepDays]);
    this.showNotification('Запись удалена!', 'success');
  }

  clearAll(): void {
    this.sleepDays = [];
    this.saveToStorage();
    this.sleepDays$.next([]);
  }

  getSnapshot(): SleepDay[] {
    return [...this.sleepDays];
  }

  private saveToStorage(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.sleepDays));
  }

  private loadFromStorage(): void {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      try {
        this.sleepDays = JSON.parse(saved);
        this.sleepDays$.next([...this.sleepDays]);
      } catch (e) {
        console.error('Error loading sleep data:', e);
        this.sleepDays = [];
      }
    }
  }
  private showNotification(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    this.snackBar.open(message, '✕', { 
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: ['app-theme'],
    });
  }
}
