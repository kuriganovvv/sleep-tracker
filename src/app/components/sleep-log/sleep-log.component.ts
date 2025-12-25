import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';

import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { SleepService } from '../../services/sleep.service';
import { SleepDay } from '../../models/sleep-day.model';

@Component({
  selector: 'app-sleep-log',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './sleep-log.component.html',
  styleUrls: ['./sleep-log.component.scss']
})
export class SleepLogComponent implements OnInit {

  days$!: Observable<SleepDay[]>;

  displayedColumns: string[] = [
    'date',
    'caffeine',
    'steps',
    'sleep',
    'inertia',
    'note',
    'actions'
  ];

  constructor(private sleepService: SleepService) {}

  ngOnInit(): void {
    this.days$ = this.sleepService.getDays();
  }

  remove(date: string): void {
    this.sleepService.removeDay(date);
  }

  /** Общая длительность сна за день (в минутах) */
  getTotalSleepMinutes(day: SleepDay): number {
    return day.intervals.reduce((total, interval) => {
      const start = this.toMinutes(interval.start);
      const end = this.toMinutes(interval.end);

      if (end >= start) {
        return total + (end - start);
      }
      // сон через полночь
      return total + (24 * 60 - start + end);
    }, 0);
  }

  private toMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }
}
