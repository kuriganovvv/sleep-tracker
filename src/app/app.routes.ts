import { Routes } from '@angular/router';
import { SleepFormComponent } from './components/sleep-form/sleep-form.component';
import { SleepLogComponent } from './components/sleep-log/sleep-log.component';
import { SleepModeComponent } from './components/sleep-mode/sleep-mode.component';

export const routes: Routes = [
  { path: '', component: SleepLogComponent },
  { path: 'add', component: SleepFormComponent },
  { path: 'sleep', component: SleepModeComponent },
  { path: '**', redirectTo: '' }
];
