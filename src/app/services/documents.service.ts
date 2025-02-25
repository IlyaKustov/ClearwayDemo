import {inject, Injectable} from '@angular/core';
import {map, Observable, switchMap} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {Document} from '../model/document';
import {Page} from '../model/page';
import {Document_comments} from '../model/document_comments';

@Injectable({ providedIn: 'root' })
export class DocumentsService {
    private readonly BASE_URL = 'http://localhost:3000';
    private readonly DOC_URL = '/documents';
    private readonly COMMENTS_URL = '/comments';

    private httpClient: HttpClient = inject(HttpClient);

    public GetAllDocuments(): Observable<Document[]> {
        return this.httpClient.get<Document[]>(this.BASE_URL + this.DOC_URL)
            .pipe(
                map(((docs: Document[]) => {
                    if (!docs || !docs.length)
                        return [];
                    docs.map((doc: Document) => {
                        doc.pages.map((page: Page) => {
                            if (page.imageUrl)
                                page.imageUrl = '/' + page.imageUrl;
                        })
                        doc.pages.sort((a, b) => a.number - b.number);
                    })

                    return docs;
                }))
            )
    }

    public GetDocument(id: number): Observable<Document> {
        return this.httpClient.get<Document>(this.BASE_URL + this.DOC_URL + '/' + id)
            .pipe(
                map((document: Document) => {
                    document.pages.map((page) => {
                        if (page.imageUrl)
                            page.imageUrl = '/' + page.imageUrl;
                        }
                    )
                    document.pages.sort((a, b) => a.number - b.number);
                    return document;
                    }
                )
            )
    }


    public GetAllCommentsForDocument(id: number): Observable<Document_comments[]> {
        return this.httpClient.get<Document_comments[]>(this.BASE_URL + this.COMMENTS_URL, {params:{doc_id:id}});
    }

    public SaveCommentsForDocument(doc_comms: Document_comments):Observable<any>{
        return this.GetAllCommentsForDocument(doc_comms.doc_id)
            .pipe(
                switchMap(commRes => {
                    if(!commRes || !commRes.length){
                        return this.httpClient.post(this.BASE_URL + this.COMMENTS_URL, doc_comms);
                    }else
                        return this.httpClient.patch(this.BASE_URL + this.COMMENTS_URL + '/'+ doc_comms.doc_id, doc_comms);
                })
            )



    }
}
