// src/app/pipes/sleep-bar.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';
import { SleepDay } from '../models/sleep-day.model';
import { SleepInterval } from '../models/sleep-interval.model';

@Pipe({
  name: 'sleepBar',
  standalone: true
})
export class SleepBarPipe implements PipeTransform {
  transform(day: SleepDay): string {
    if (!day.intervals || day.intervals.length === 0) {
      return '—';
    }

    // Создаем массив из 24 часов, все false изначально
    const hours = new Array(24).fill(false);
    
    // Заполняем часы, когда был сон
    for (const interval of day.intervals) {
      this.markSleepHours(hours, interval);
    }
    
    // Преобразуем в строку с символами
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
    
    // Для интервала "00:00" - "23:59" отмечаем все часы
    if (interval.start === '00:00' && interval.end === '23:59') {
      for (let i = 0; i < 24; i++) hours[i] = true;
      return;
    }
    
    // Обрабатываем сон, который может переходить через полночь
    if (end > start) {
      // Обычный случай: сон в пределах одних суток
      for (let minute = start; minute < end; minute++) {
        const hour = Math.floor(minute / 60) % 24;
        hours[hour] = true;
      }
    } else {
      // Сон через полночь (например, 23:00 - 07:00)
      // Первая часть: от start до конца суток (1440 минут)
      for (let minute = start; minute < 1440; minute++) {
        const hour = Math.floor(minute / 60) % 24;
        hours[hour] = true;
      }
      // Вторая часть: от начала суток до end
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
    
    // Нормализуем часы (0-23)
    const normalizedHours = ((hours % 24) + 24) % 24;
    return normalizedHours * 60 + minutes;
  }
}
