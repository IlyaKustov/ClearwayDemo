import {Component, inject, OnInit, signal} from '@angular/core';
import {DocumentsService} from '../../services/documents.service';
import {Document} from '../../model/document';
import {CommonModule} from '@angular/common';
import {Router} from '@angular/router';
import {AlertsService} from '../alerts/alerts.service';

@Component({
  selector: 'app-documents-list',
  imports: [CommonModule],
  templateUrl: './documents-list.component.html',
  styleUrl: './documents-list.component.css'
})
export class DocumentsListComponent implements OnInit {

    private service: DocumentsService = inject(DocumentsService);
    private alertsService: AlertsService = inject(AlertsService);
    private router: Router = inject(Router);

    protected docList = signal<Document[]>([]);

    ngOnInit(): void {
        this.service.GetAllDocuments().subscribe({
            next: data => this.docList.set(data),
            error: err => {
                console.error("[DocumentsListComponent] GetAllDocuments error", err);
                this.alertsService.AddError("An error occurred while retrieving of list documents: " + err.statusText);
            }
        })
    }

    protected onItemClick(doc: Document): void {
        this.router.navigateByUrl('/document/' + doc.id);
    }
}
