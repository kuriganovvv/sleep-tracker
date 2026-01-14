import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { SleepService } from '../../services/sleep.service';
import { SleepDay, SleepInterval } from '../../models';
import { MatMenuModule } from '@angular/material/menu';
import { SleepFormComponent } from '../sleep-form/sleep-form.component';

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
    SleepFormComponent
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

  openAddSleepForm(): void {
    this.showAddSleepForm = true;
  }

  closeAddSleepForm(): void {
    this.showAddSleepForm = false;
  }

  onSleepSaved(): void {
    this.closeAddSleepForm();
    this.sleepService.getDays().subscribe(days => {
      this.sleepDays = days;
      this.filterDaysByMonth();
    });
  }

  get currentMonthName(): string {
    return this.monthNames[this.currentMonth];
  }

  private filterDaysByMonth(): void {
    this.filteredDays = this.sleepDays.filter(day => {
      const date = new Date(day.date);
      return date.getMonth() === this.currentMonth && 
             date.getFullYear() === this.currentYear;
    });
    
    this.filteredDays.sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }

  startEdit(index: number, day: SleepDay): void {
    this.editingIndex = index;
    this.editIntervals = [...day.intervals];
    this.editQuality = day.quality || 3;
    this.editNote = day.note || '';
    this.originalDay = { ...day };
  }

  addEditInterval(): void {
    this.editIntervals.push({ start: '22:00', end: '07:00' });
  }

  removeEditInterval(index: number): void {
    if (this.editIntervals.length > 1) {
      this.editIntervals.splice(index, 1);
    }
  }

  canSaveEdit(): boolean {
    return this.editIntervals.every(interval => 
      interval.start && interval.end && 
      interval.start.trim() !== '' && 
      interval.end.trim() !== ''
    ) && this.editQuality > 0;
  }

  saveEdit(): void {
    if (!this.canSaveEdit() || this.editingIndex === -1 || !this.originalDay) return;

    const validIntervals = this.editIntervals.filter(interval => 
      interval.start && interval.end && 
      interval.start.trim() !== '' && 
      interval.end.trim() !== ''
    );

    const updatedDay: SleepDay = {
      date: this.originalDay.date,
      intervals: validIntervals,
      quality: this.editQuality,
      note: this.editNote.trim() || undefined
    };

    this.sleepService.saveDay(updatedDay);
    this.cancelEdit();
    
    this.sleepService.getDays().subscribe(days => {
      this.sleepDays = days;
      this.filterDaysByMonth();
    });
  }

  cancelEdit(): void {
    this.editingIndex = -1;
    this.editIntervals = [];
    this.editQuality = 3;
    this.editNote = '';
    this.originalDay = null;
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

  getDayNumber(dateString: string): string {
    const date = new Date(dateString);
    return date.getDate().toString();
  }

  getDayOfWeek(dateString: string): string {
    const date = new Date(dateString);
    const days = ['ВС', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'];
    return days[date.getDay()];
  }

  getCombinedSleepTime(dateStr: string): string {
    const date = new Date(dateStr);
    
    const currentDay = this.sleepDays.find(d => d.date === dateStr);
    let totalMinutes = 0;
    
    if (currentDay && currentDay.intervals) {
      currentDay.intervals.forEach(interval => {
        const start = this.timeToMinutes(interval.start);
        const end = this.timeToMinutes(interval.end);
        
        if (start !== null && end !== null) {
          if (end < start) {
            totalMinutes += (1440 - start) + end;
          } else {
            totalMinutes += (end - start);
          }
        }
      });
    }
    
    const prevDate = new Date(date);
    prevDate.setDate(prevDate.getDate() - 1);
    const prevDateStr = prevDate.toISOString().split('T')[0];
    
    const prevDay = this.sleepDays.find(d => d.date === prevDateStr);
    if (prevDay && prevDay.intervals) {
      prevDay.intervals.forEach(interval => {
        const start = this.timeToMinutes(interval.start);
        const end = this.timeToMinutes(interval.end);
        
        if (start !== null && end !== null && end < start) {
          totalMinutes += end;
        }
      });
    }
    
    if (totalMinutes === 0) return '';
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours === 0) return `${minutes}м`;
    if (minutes === 0) return `${hours}ч`;
    return `${hours}ч ${minutes}м`;
  }

  get avgQuality(): number {
    if (this.filteredDays.length === 0) return 0;
    const sum = this.filteredDays.reduce((total: number, day: SleepDay) => total + (day.quality || 0), 0);
    return sum / this.filteredDays.length;
  }

  get avgSleepHours(): number {
    if (this.filteredDays.length === 0) return 0;
    
    const totalMinutes = this.filteredDays.reduce((total: number, day: SleepDay) => {
      if (!day.intervals || day.intervals.length === 0) return total;
      
      const dayMinutes = day.intervals.reduce((dayTotal: number, interval: SleepInterval) => {
        const start = this.timeToMinutes(interval.start);
        const end = this.timeToMinutes(interval.end);
        
        if (start === null || end === null) return dayTotal;
        
        if (end < start) {
          return dayTotal + ((1440 - start) + end);
        } else {
          return dayTotal + (end - start);
        }
      }, 0);
      
      return total + dayMinutes;
    }, 0);
    
    return totalMinutes / (this.filteredDays.length * 60);
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

  deleteDay(date: string): void {
    if (confirm('Вы уверены, что хотите удалить эту запись?')) {
      this.sleepService.deleteDay(date);
      
      if (this.editingIndex !== -1 && this.originalDay?.date === date) {
        this.cancelEdit();
      }
    }
  }
  
  calculateDuration(interval: SleepInterval): string {
    const start = this.timeToMinutes(interval.start);
    const end = this.timeToMinutes(interval.end);
    
    if (start === null || end === null) return '';
    
    let durationMinutes: number;
    
    if (end < start) {
      durationMinutes = (1440 - start) + end;
    } else {
      durationMinutes = end - start;
    }
    
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    
    if (hours === 0) {
      return `${minutes}м`;
    } else if (minutes === 0) {
      return `${hours}ч`;
    } else {
      return `${hours}ч ${minutes}м`;
    }
  }
}
