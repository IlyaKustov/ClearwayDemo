import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterOutlet} from '@angular/router';
import {AlertsComponent} from './components/alerts/alerts.component';
import {CanDeactivateComponent} from './can_deactivate_guard';


@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, AlertsComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
    title = 'ClearwayDemo';
    private _currentComponent:any;

    protected routerActivated(component:any){
        this._currentComponent = component;
    }

    constructor() {
        window.onbeforeunload = (e)=> {
            var cc = this._currentComponent as CanDeactivateComponent;
            if(cc && cc.canExitApp && !cc.canExitApp()) {
                e.returnValue = true;
                return e.returnValue;
            }
        };
    }
}
