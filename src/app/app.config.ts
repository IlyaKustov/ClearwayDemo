import {APP_INITIALIZER, ApplicationConfig, provideZoneChangeDetection} from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import {provideHttpClient} from '@angular/common/http';
import {provideAnimationsAsync} from '@angular/platform-browser/animations/async';
import {BsModalService} from 'ngx-bootstrap/modal';

export const appConfig: ApplicationConfig = {
    providers: [
        provideAnimationsAsync(),

        provideZoneChangeDetection({eventCoalescing: true}),
        provideRouter(routes),
        provideHttpClient(),
        BsModalService,
        {
            provide: APP_INITIALIZER,
            multi: true,
            deps: [BsModalService],
            useFactory: (bsModalService: BsModalService) => {
                return () => {
                    bsModalService.config.animated = true;
                    bsModalService.config.focus = true;
                    bsModalService.config.ignoreBackdropClick = false;
                    bsModalService.config.keyboard = true;
                    bsModalService.config.class = "modal-xs";
                };
            }
        }
    ]
};
