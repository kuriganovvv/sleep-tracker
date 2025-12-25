import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { SleepService } from '../../services/sleep.service';
import { SleepDay } from '../../models/sleep-day.model';

@Component({
  selector: 'app-sleep-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './sleep-form.component.html',
  styleUrls: ['./sleep-form.component.scss']
})
export class SleepFormComponent {

  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private sleepService: SleepService
  ) {
    this.form = this.fb.group({
      date: ['', Validators.required],
      caffeine: [0, [Validators.min(0)]],
      steps: [0, [Validators.min(0)]],
      inertia: [0, [Validators.min(0), Validators.max(5)]],
      note: [''],
      intervals: this.fb.array([])
    });

    // по умолчанию один интервал
    this.addInterval();
  }

  // ======= intervals =======

  get intervals(): FormArray {
    return this.form.get('intervals') as FormArray;
  }

  addInterval(): void {
    this.intervals.push(
      this.fb.group({
        start: ['', Validators.required],
        end: ['', Validators.required]
      })
    );
  }

  removeInterval(index: number): void {
    this.intervals.removeAt(index);
  }

  // ======= submit =======

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value: SleepDay = this.form.value;
    this.sleepService.upsertDay(value);

    this.form.reset({
      caffeine: 0,
      steps: 0,
      inertia: 0
    });
    this.intervals.clear();
    this.addInterval();
  }
}
