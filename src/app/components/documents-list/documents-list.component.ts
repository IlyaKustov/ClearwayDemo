import {Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {DocumentsStore} from '../../store/documents.store';

@Component({
  selector: 'app-documents-list',
  imports: [CommonModule],
  templateUrl: './documents-list.component.html',
  styleUrl: './documents-list.component.css',
    providers:[DocumentsStore]
})
export class DocumentsListComponent {

    protected readonly documentsStore = inject(DocumentsStore);
}
