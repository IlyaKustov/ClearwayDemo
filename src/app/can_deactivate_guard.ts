import {Observable} from "rxjs";
import {CanDeactivate} from "@angular/router";
import {Injectable} from "@angular/core";

export interface CanDeactivateComponent {
    canDeactivate: () => Observable<boolean> | boolean;
    canExitApp: () => boolean;
}

@Injectable({ providedIn: 'root' })
export class CanDeactivateGuard implements CanDeactivate<CanDeactivateComponent> {
    canDeactivate(component: CanDeactivateComponent): Observable<boolean> | boolean {
        return component.canDeactivate ? component.canDeactivate() : true;
    }
}
