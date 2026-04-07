import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { MatMenuModule } from '@angular/material/menu';

import { SleepService } from '../../services/sleep.service';
import { SleepDay, SleepInterval } from '../../models';
import { SleepFormComponent } from '../sleep-form/sleep-form.component';
import { SleepBarPipe } from '../../pipes/sleep-bar.pipe'; 
@Component({
  selector: 'app-sleep-log',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    FormsModule,
    MatMenuModule,
    SleepFormComponent,
    SleepBarPipe
  ],
  templateUrl: './sleep-log.component.html',
  styleUrls: ['./sleep-log.component.scss']
})
export class SleepLogComponent implements OnInit {
  sleepDays: SleepDay[] = [];
  filteredDays: SleepDay[] = [];
  
  currentMonth: number = new Date().getMonth();
  currentYear: number = new Date().getFullYear();
  
  monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];
  
  editingIndex: number = -1;
  editIntervals: SleepInterval[] = [];
  editQuality: number = 3;
  editNote: string = '';
  originalDay: SleepDay | null = null;
  
  showAddSleepForm: boolean = false;

  constructor(private sleepService: SleepService) {}

  ngOnInit(): void {
    this.sleepService.getDays().subscribe(days => {
      this.sleepDays = days;
      this.filterDaysByMonth();
    });
  }

  /* =======================
      УПРАВЛЕНИЕ ФОРМОЙ
  ======================= */

  openAddSleepForm(): void {
    this.showAddSleepForm = true;
  }

  closeAddSleepForm(): void {
    this.showAddSleepForm = false;
  }

  onSleepSaved(): void {
    this.closeAddSleepForm();
  }

  /* =======================
      ФИЛЬТРАЦИЯ И НАВИГАЦИЯ
  ======================= */

  get currentMonthName(): string {
    return this.monthNames[this.currentMonth];
  }

  private filterDaysByMonth(): void {
    this.filteredDays = this.sleepDays.filter(day => {
      const date = new Date(day.date);
      return date.getMonth() === this.currentMonth && 
             date.getFullYear() === this.currentYear;
    });
    
    this.filteredDays.sort((a, b) => b.date.localeCompare(a.date));
  }

  previousMonth(): void {
    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
    this.filterDaysByMonth();
    this.cancelEdit();
  }

  nextMonth(): void {
    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
    this.filterDaysByMonth();
    this.cancelEdit();
  }

  /* =======================
      РЕДАКТИРОВАНИЕ
  ======================= */

  startEdit(index: number, day: SleepDay): void {
    this.editingIndex = index;
    this.editIntervals = JSON.parse(JSON.stringify(day.intervals));
    this.editQuality = day.quality || 3;
    this.editNote = day.note || '';
    this.originalDay = { ...day };
  }

  cancelEdit(): void {
    this.editingIndex = -1;
    this.editIntervals = [];
    this.editQuality = 3;
    this.editNote = '';
    this.originalDay = null;
  }

  saveEdit(): void {
    if (!this.canSaveEdit() || this.editingIndex === -1 || !this.originalDay) return;

    const updatedDay: SleepDay = {
      date: this.originalDay.date,
      intervals: this.editIntervals.filter(i => i.start && i.end),
      quality: this.editQuality,
      note: this.editNote.trim() || undefined
    };

    this.sleepService.deleteDay(this.originalDay.date);
    this.sleepService.saveDay(updatedDay);
    
    this.cancelEdit();
  }

  canSaveEdit(): boolean {
    return this.editIntervals.some(i => i.start && i.end) && this.editQuality > 0;
  }

  addEditInterval(): void {
    this.editIntervals.push({ start: '', end: '' });
  }

  removeEditInterval(index: number): void {
    if (this.editIntervals.length > 1) {
      this.editIntervals.splice(index, 1);
    }
  }

  deleteDay(date: string): void {
    if (confirm('Вы уверены, что хотите удалить эту запись?')) {
      this.sleepService.deleteDay(date);
      if (this.editingIndex !== -1 && this.originalDay?.date === date) {
        this.cancelEdit();
      }
    }
  }

  /* =======================
      РАСЧЕТЫ И ОТОБРАЖЕНИЕ
  ======================= */

  /**
   * Суммирует время сна строго за ОДИН календарный день.
   * Т.к. сервис уже разделил интервалы, нам не нужно искать "хвосты" в соседних днях.
   */
  getCombinedSleepTime(dateStr: string): string {
    const day = this.sleepDays.find(d => d.date === dateStr);
    if (!day || !day.intervals) return '';

    let totalMinutes = 0;
    day.intervals.forEach(interval => {
      const start = this.timeToMinutes(interval.start);
      let end = this.timeToMinutes(interval.end);
      
      if (start !== null && end !== null) {
        if (interval.end === '23:59') end = 1440;
        totalMinutes += (end - start);
      }
    });

    return this.formatMinutes(totalMinutes);
  }

  calculateDuration(interval: SleepInterval): string {
    const start = this.timeToMinutes(interval.start);
    let end = this.timeToMinutes(interval.end);
    if (start === null || end === null) return '';

    if (interval.end === '23:59') end = 1440;
    
    const diff = end - start;
    return this.formatMinutes(diff);
  }

  /* =======================
      СТАТИСТИКА
  ======================= */

  get avgQuality(): number {
    if (this.filteredDays.length === 0) return 0;
    const sum = this.filteredDays.reduce((total, day) => total + (day.quality || 0), 0);
    return sum / this.filteredDays.length;
  }

  get avgSleepHours(): number {
    if (this.filteredDays.length === 0) return 0;
    
    const totalMinutes = this.filteredDays.reduce((total, day) => {
      let dayMin = 0;
      day.intervals.forEach(i => {
        const s = this.timeToMinutes(i.start);
        let e = this.timeToMinutes(i.end);
        if (s !== null && e !== null) {
          if (i.end === '23:59') e = 1440;
          dayMin += (e - s);
        }
      });
      return total + dayMin;
    }, 0);
    
    return totalMinutes / (this.filteredDays.length * 60);
  }

  /* =======================
      ВСПОМОГАТЕЛЬНЫЕ
  ======================= */

  private timeToMinutes(time: string): number | null {
    if (!time) return null;
    const [h, m] = time.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return null;
    return h * 60 + m;
  }

  private formatMinutes(totalMinutes: number): string {
    if (totalMinutes <= 0) return '';
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    if (h === 0) return `${m}м`;
    if (m === 0) return `${h}ч`;
    return `${h}ч ${m}м`;
  }

  getDayNumber(dateString: string): string {
    return new Date(dateString).getDate().toString();
  }

  getDayOfWeek(dateString: string): string {
    const days = ['ВС', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'];
    return days[new Date(dateString).getDay()];
  }
}
