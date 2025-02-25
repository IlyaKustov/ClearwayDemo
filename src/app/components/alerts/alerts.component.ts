import {AlertsService} from "./alerts.service";
import {Component, inject} from "@angular/core";
import {AlertComponent} from 'ngx-bootstrap/alert';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'alerts',
  imports: [
    AlertComponent, CommonModule, FormsModule
  ],
  templateUrl: 'alerts.component.html'
})

export class AlertsComponent {
    protected _alertsService: AlertsService = inject(AlertsService)
}
