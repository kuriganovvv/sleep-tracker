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
    this.selectDate('today');
    this.calculateTotalSleep();
  }

  /* =======================
     ДАТА
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
     ИНТЕРВАЛЫ
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
     РАСЧЁТ ВРЕМЕНИ
  ======================= */

  getIntervalDuration(interval: SleepInterval): string {
    const minutes = this.getIntervalMinutes(interval);
    if (minutes === 0) return '';

    const h = Math.floor(minutes / 60);
    const m = minutes % 60;

    if (m === 0) return `${h}ч`;
    if (h === 0) return `${m}м`;
    return `${h}ч ${m}м`;
  }

  calculateTotalSleep(): void {
    if (this.intervals.length === 0) {
      this.totalSleep = '';
      return;
    }
    
    let totalMinutes = 0;
    
    for (const interval of this.intervals) {
      if (!interval.start || !interval.end) continue;
      
      const start = this.timeToMinutes(interval.start);
      const end = this.timeToMinutes(interval.end);
      
      if (start === null || end === null) continue;
      
      let duration = end - start;
      if (duration < 0) duration += 24 * 60; // сон через полночь
      totalMinutes += duration;
    }
    
    if (totalMinutes === 0) {
      this.totalSleep = '';
      return;
    }
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    // 👇 Сохраняем в формате, который будем показывать в таблице
    if (hours === 0) {
      this.totalSleep = `${minutes}м`;
    } else if (minutes === 0) {
      this.totalSleep = `${hours}ч`;
    } else {
      this.totalSleep = `${hours}ч ${minutes}м`;
    }
  }

  private getIntervalMinutes(interval: SleepInterval): number {
    if (!interval.start || !interval.end) return 0;

    const start = this.timeToMinutes(interval.start);
    const end = this.timeToMinutes(interval.end);
    if (start === null || end === null) return 0;

    let duration = end - start;
    if (duration < 0) duration += 1440; // через полночь

    return duration;
  }

  private timeToMinutes(time: string): number | null {
    const [h, m] = time.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return null;
    return h * 60 + m;
  }

  /* =======================
     КЛЮЧЕВОЕ — РАЗБИЕНИЕ
  ======================= */

  private splitIntervalByMidnight(
    date: string,
    interval: SleepInterval
  ): { date: string; start: string; end: string }[] {

    const startMin = this.timeToMinutes(interval.start);
    const endMin = this.timeToMinutes(interval.end);

    if (startMin === null || endMin === null) return [];

    // не через полночь
    if (endMin > startMin) {
      return [{ date, start: interval.start, end: interval.end }];
    }

    // через полночь
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
        date,
        start: '00:00',
        end: interval.end
      }
    ];
  }

  /* =======================
     СОХРАНЕНИЕ
  ======================= */

  canSave(): boolean {
    return this.intervals.some(i => i.start && i.end) && this.quality > 0;
  }

  private getNightStartDate(): string {
    const wakeUp = new Date(this.selectedDateValue);
    wakeUp.setDate(wakeUp.getDate() - 1);
    return wakeUp.toISOString().split('T')[0];
  }

  saveSleep(): void {
    if (!this.canSave()) return;

    // Фильтруем пустые промежутки
    const validIntervals = this.intervals.filter(interval => 
      interval.start && interval.end && 
      interval.start.trim() !== '' && 
      interval.end.trim() !== ''
    );

    // 👇 ВАЖНО: Сохраняем общее время сна, которое уже рассчитано
    const sleepDay: SleepDay = {
      date: this.selectedDateValue,
      intervals: validIntervals,
      quality: this.quality,
      note: this.note.trim() || undefined,
      totalDuration: this.totalSleep // 👈 Сохраняем рассчитанное общее время
    };

    this.sleepService.saveDay(sleepDay);
    this.clearForm();
    this.saved.emit();
  }


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
      if (!interval.start || !interval.end) return false;

      const start = this.timeToMinutes(interval.start);
      const end = this.timeToMinutes(interval.end);

      return start !== null && end !== null && end < start;
    });

    // Если сон через полночь — показываем диапазон дат
    if (hasOvernightSleep) {
      const prevDate = new Date(date);
      prevDate.setDate(prevDate.getDate() - 1);

      const prev = prevDate.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long'
      });

      const curr = date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long'
      });

      return `${prev} – ${curr}`;
    }

    // Обычный случай
    return date.toLocaleDateString('ru-RU', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
