import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

import { SleepService } from '../../services/sleep.service';
import { SleepDay, SleepInterval } from '../../models';

@Component({
  selector: 'app-sleep-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  templateUrl: './sleep-form.component.html',
  styleUrls: ['./sleep-form.component.scss']
})
export class SleepFormComponent implements OnInit {

  selectedDate: 'today' | 'yesterday' | 'custom' = 'today';
  selectedCustomDate?: Date;
  showDatePicker = false;

  intervals: SleepInterval[] = [
    { start: '22:00', end: '07:00' }
  ];

  quality = 3;
  note = '';
  totalSleep = '';

  qualityTexts = [
    '😫 Очень плохо',
    '😞 Плохо',
    '😐 Нормально',
    '🙂 Хорошо',
    '😊 Отлично'
  ];

  @Output() saved = new EventEmitter<void>();
  @Output() canceled = new EventEmitter<void>();

  constructor(private sleepService: SleepService) {}

  ngOnInit(): void {
    this.calculateTotalSleep();
  }

  /* =======================
      ВЫБОР ДАТЫ
  ======================= */

  selectDate(type: 'today' | 'yesterday'): void {
    this.selectedDate = type;
    this.selectedCustomDate = undefined;
    this.showDatePicker = false;
  }

  onDateChange(event: any): void {
    this.selectedDate = 'custom';
    this.selectedCustomDate = event.value;
    this.showDatePicker = false;
  }

  get selectedDateValue(): string {
    if (this.selectedDate === 'custom' && this.selectedCustomDate) {
      return this.selectedCustomDate.toISOString().split('T')[0];
    }

    const date = new Date();
    if (this.selectedDate === 'yesterday') {
      date.setDate(date.getDate() - 1);
    }
    return date.toISOString().split('T')[0];
  }

  /* =======================
      УПРАВЛЕНИЕ ИНТЕРВАЛАМИ
  ======================= */

  addInterval(): void {
    this.intervals.push({ start: '', end: '' });
  }

  removeInterval(index: number): void {
    if (this.intervals.length > 1) {
      this.intervals.splice(index, 1);
      this.calculateTotalSleep();
    }
  }

  /* =======================
      РАСЧЁТЫ ВРЕМЕНИ
  ======================= */

  calculateTotalSleep(): void {
    let totalMinutes = 0;
    
    for (const interval of this.intervals) {
      const duration = this.getIntervalMinutes(interval);
      totalMinutes += duration;
    }
    
    if (totalMinutes === 0) {
      this.totalSleep = '';
      return;
    }
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours === 0) {
      this.totalSleep = `${minutes}м`;
    } else if (minutes === 0) {
      this.totalSleep = `${hours}ч`;
    } else {
      this.totalSleep = `${hours}ч ${minutes}м`;
    }
  }

  getIntervalDuration(interval: SleepInterval): string {
    const minutes = this.getIntervalMinutes(interval);
    if (minutes === 0) return '';

    const h = Math.floor(minutes / 60);
    const m = minutes % 60;

    if (m === 0) return `${h}ч`;
    if (h === 0) return `${m}м`;
    return `${h}ч ${m}м`;
  }

  private getIntervalMinutes(interval: SleepInterval): number {
    if (!interval.start || !interval.end) return 0;

    const start = this.timeToMinutes(interval.start);
    const end = this.timeToMinutes(interval.end);
    if (start === null || end === null) return 0;

    let duration = end - start;
    if (duration < 0) duration += 1440; 

    return duration;
  }

  private timeToMinutes(time: string): number | null {
    if (!time) return null;
    const parts = time.split(':').map(Number);
    if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) return null;
    return parts[0] * 60 + parts[1];
  }

  /* =======================
      СОХРАНЕНИЕ С РАЗБИЕНИЕМ
  ======================= */

  canSave(): boolean {
    return this.intervals.some(i => i.start && i.end) && this.quality > 0;
  }

  saveSleep(): void {
    if (!this.canSave()) return;

    const baseDate = this.selectedDateValue;
    const validIntervals = this.intervals.filter(i => i.start && i.end);

    validIntervals.forEach(interval => {
      const segments = this.splitIntervalByMidnight(baseDate, interval);

      segments.forEach(segment => {
        const sleepDay: SleepDay = {
          date: segment.date,
          intervals: [{ start: segment.start, end: segment.end }],
          quality: this.quality,
          note: segment.date === baseDate ? this.note.trim() : undefined
        };
        this.sleepService.saveDay(sleepDay);
      });
    });

    this.clearForm();
    this.saved.emit();
  }

  private splitIntervalByMidnight(date: string, interval: SleepInterval) {
    const startMin = this.timeToMinutes(interval.start);
    const endMin = this.timeToMinutes(interval.end);

    if (startMin === null || endMin === null) return [];

    if (endMin < startMin) {
      const current = new Date(date);
      const prev = new Date(current);
      prev.setDate(prev.getDate() - 1);

      return [
        {
          date: prev.toISOString().split('T')[0],
          start: interval.start,
          end: '23:59'
        },
        {
          date: date,
          start: '00:00',
          end: interval.end
        }
      ];
    }

    return [{ date, start: interval.start, end: interval.end }];
  }

  /* =======================
      ВСПОМОГАТЕЛЬНЫЕ
  ======================= */

  cancelForm(): void {
    this.clearForm();
    this.canceled.emit();
  }

  clearForm(): void {
    this.selectedDate = 'today';
    this.selectedCustomDate = undefined;
    this.intervals = [{ start: '22:00', end: '07:00' }];
    this.quality = 3;
    this.note = '';
    this.totalSleep = '';
    this.showDatePicker = false;
    this.calculateTotalSleep();
  }

  getQualityText(): string {
    return this.qualityTexts[this.quality - 1] || '';
  }

  getDisplayDateWithCorrectNight(): string {
    const date = new Date(this.selectedDateValue);
    const hasOvernightSleep = this.intervals.some(interval => {
      const start = this.timeToMinutes(interval.start);
      const end = this.timeToMinutes(interval.end);
      return start !== null && end !== null && end < start;
    });

    if (hasOvernightSleep) {
      const prevDate = new Date(date);
      prevDate.setDate(prevDate.getDate() - 1);
      const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' };
      return `${prevDate.toLocaleDateString('ru-RU', options)} – ${date.toLocaleDateString('ru-RU', options)}`;
    }

    return date.toLocaleDateString('ru-RU', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
