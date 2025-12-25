import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SleepDay } from '../models/sleep-day.model';

@Injectable({
  providedIn: 'root'
})
export class SleepService {

  private readonly STORAGE_KEY = 'sleep_days';

  private days$ = new BehaviorSubject<SleepDay[]>(this.load());

  /** Подписка для компонентов */
  getDays() {
    return this.days$.asObservable();
  }

  /** Синхронный доступ */
  getSnapshot(): SleepDay[] {
    return this.days$.value;
  }

  /** Получить день по дате */
  getDay(date: string): SleepDay | undefined {
    return this.days$.value.find(d => d.date === date);
  }

  /** Добавить или обновить день */
  upsertDay(day: SleepDay): void {
    const days = this.days$.value;
    const index = days.findIndex(d => d.date === day.date);

    if (index !== -1) {
      days[index] = day;
      this.save([...days]);
    } else {
      this.save([...days, day]);
    }
  }

  /** Удалить день */
  removeDay(date: string): void {
    this.save(this.days$.value.filter(d => d.date !== date));
  }

  /** Очистить все данные */
  clear(): void {
    this.save([]);
  }



  private save(days: SleepDay[]): void {
    this.days$.next(days);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(days));
  }

  private load(): SleepDay[] {
    const raw = localStorage.getItem(this.STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  }
}
