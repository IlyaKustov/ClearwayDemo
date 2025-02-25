import {Subject} from "rxjs";
import {Injectable} from "@angular/core";

@Injectable({ providedIn: 'root' })
export class AlertsService {
    constructor() {
    }

    public items: AlertElement[] = new Array<AlertElement>();
    public NewAlertAdded: Subject<AlertElement> = new Subject<AlertElement>();

    public AddItem(t: AlertElement) {
        this.NewAlertAdded.next(t);

        let exs: number[] = new Array<number>();
        for (let i = this.items.length - 1; i >= 0; i--) {
            if (this.items[i].text == t.text && this.items[i].type == t.type)
                exs.push(i);
        }
        for (let i of exs) {
            this.items.splice(i, 1);
        }
        this.items.push(t);
    }

    public AddError(text: string, timeout?: number) {
        if (!timeout && timeout != 0)
            timeout = 10000;
        this.AddItem(new AlertElement(text ? text.toString() : "", "danger", timeout, true));
    }


    public AddSuccess(text?: string, timeout?: number) {
        if (!text)
            text = "Success!";
        if (!timeout && timeout != 0)
            timeout = 1500;
        this.AddItem(new AlertElement(text, "success", timeout, true));
    }

    public AddInfo(text: string, timeout?: number) {
        if (!timeout && timeout != 0)
            timeout = 3000;
        this.AddItem(new AlertElement(text, "info", timeout, true));
    }

    public AddWarning(text: string, timeout?: number) {
        if (!timeout && timeout != 0)
            timeout = 7000;
        this.AddItem(new AlertElement(text, "warning", timeout, true));
    }

}

export class AlertElement {
    constructor(text: string, type?: string, dismissOnTimeout?: number, dismissible?: boolean) {
        this.text = text;
        this.type = type ? type : "";
        if (!this.type)
            this.type = "danger";

        this.dismissOnTimeout = dismissOnTimeout;
        this.dismissible = dismissible ? dismissible : false;
    }

    text: string;
    type: string;
    dismissOnTimeout: number | undefined;
    dismissible: boolean = true;
}
