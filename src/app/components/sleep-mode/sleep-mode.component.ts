import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { interval, Subscription } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-sleep-mode',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './sleep-mode.component.html',
  styleUrls: ['./sleep-mode.component.scss']
})
export class SleepModeComponent implements OnInit, OnDestroy {
  @ViewChild('fullscreenContent') fullscreenContent!: ElementRef;
  
  currentTime: string = '';
  currentDate: string = '';
  sunrise: string = '';
  sunset: string = '';
  private timer$!: Subscription;
  stars: Array<{top: string, left: string, size: string, duration: string}> = [];
  isFullscreen: boolean = false;

  private readonly API_KEY = '177e95c3633ee749b721a6568d433168';
  private lat = 55.0084;
  private lon = 82.9357;
  
  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.updateTime();
    this.updateDate();
    this.createStars();
    this.getSunTimes();
    
    this.timer$ = interval(1000).subscribe(() => {
      this.updateTime();
      this.updateDate();
    });
    
    document.addEventListener('fullscreenchange', this.onFullscreenChange.bind(this));
    document.addEventListener('webkitfullscreenchange', this.onFullscreenChange.bind(this));
    document.addEventListener('mozfullscreenchange', this.onFullscreenChange.bind(this));
    document.addEventListener('MSFullscreenChange', this.onFullscreenChange.bind(this));
  }

  ngOnDestroy(): void {
    if (this.timer$) {
      this.timer$.unsubscribe();
    }
    
    document.removeEventListener('fullscreenchange', this.onFullscreenChange.bind(this));
    document.removeEventListener('webkitfullscreenchange', this.onFullscreenChange.bind(this));
    document.removeEventListener('mozfullscreenchange', this.onFullscreenChange.bind(this));
    document.removeEventListener('MSFullscreenChange', this.onFullscreenChange.bind(this));
    
    if (this.isFullscreen) {
      this.exitFullscreen();
    }
  }

  toggleFullscreen(): void {
    if (this.isFullscreen) {
      this.exitFullscreen();
    } else {
      this.enterFullscreen();
    }
  }

  private enterFullscreen(): void {
    const element = this.fullscreenContent.nativeElement;
    
    if (element.requestFullscreen) {
      element.requestFullscreen();
    } else if (element.webkitRequestFullscreen) {
      element.webkitRequestFullscreen();
    } else if (element.mozRequestFullScreen) {
      element.mozRequestFullScreen();
    } else if (element.msRequestFullscreen) {
      element.msRequestFullscreen();
    }
  }

  private exitFullscreen(): void {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if ((document as any).webkitExitFullscreen) {
      (document as any).webkitExitFullscreen();
    } else if ((document as any).mozCancelFullScreen) {
      (document as any).mozCancelFullScreen();
    } else if ((document as any).msExitFullscreen) {
      (document as any).msExitFullscreen();
    }
  }

  private onFullscreenChange(): void {
    const fullscreenElement = document.fullscreenElement || 
                             (document as any).webkitFullscreenElement ||
                             (document as any).mozFullScreenElement ||
                             (document as any).msFullscreenElement;
    
    this.isFullscreen = fullscreenElement === this.fullscreenContent.nativeElement;
  }

  @HostListener('document:keydown.escape')
  handleEscapeKey(): void {
    if (this.isFullscreen) {
      this.exitFullscreen();
    }
  }

  private updateTime(): void {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    this.currentTime = `${hours}<span class="time-separator">:</span>${minutes}<span class="time-separator">:</span>${seconds}`;
  }

  private updateDate(): void {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    this.currentDate = now.toLocaleDateString('ru-RU', options);
  }

  private createStars(): void {
    for (let i = 0; i < 50; i++) {
      this.stars.push({
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        size: `${Math.random() * 3 + 1}px`,
        duration: `${Math.random() * 3 + 2}s`
      });
    }
  }

  async getSunTimes(): Promise<void> {
    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${this.lat}&lon=${this.lon}&appid=${this.API_KEY}`;
      const data = await this.http.get<any>(url).toPromise();
      
      this.sunrise = this.formatTime(data.sys.sunrise);
      this.sunset = this.formatTime(data.sys.sunset);
      
    } catch (error) {
      this.sunrise = '09:52';
      this.sunset = '17:04';
    }
  }

  private formatTime(timestamp: number): string {
    console.log('Timestamp to format:', timestamp);
    
    let date: Date;
    
    if (timestamp > 10000000000) {
      date = new Date(timestamp);
    } else {
      date = new Date(timestamp * 1000);
    }
    
    console.log('Formatted date:', date);
    
    const result = date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    console.log('Formatted time:', result);
    return result;
  }

  updateLocation(city: string): void {
    const cities: { [key: string]: { lat: number, lon: number } } = {
      'Москва': { lat: 55.7558, lon: 37.6173 },
      'Санкт-Петербург': { lat: 59.9343, lon: 30.3351 },
      'Новосибирск': { lat: 55.0084, lon: 82.9357 },
      'Екатеринбург': { lat: 56.8389, lon: 60.6057 },
      'Казань': { lat: 55.8304, lon: 49.0661 }
    };
    
    if (cities[city]) {
      this.lat = cities[city].lat;
      this.lon = cities[city].lon;
      this.getSunTimes();
    }
  }
}
