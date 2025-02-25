import { Routes } from '@angular/router';
import {DocumentsListComponent} from './components/documents-list/documents-list.component';
import {DocumentComponent} from './components/document/document.component';
import {CanDeactivateGuard} from './can_deactivate_guard';

export const routes: Routes = [
  { path: 'home', component: DocumentsListComponent, title: 'Home' },
  { path: 'document/:id', component: DocumentComponent, canDeactivate:[CanDeactivateGuard] },
  { path: '', redirectTo: 'home',  pathMatch: 'full' },
  { path: '**', redirectTo: 'home'}
];
