import {Document} from '../model/document';
import {patchState, signalStore, withHooks, withMethods, withState} from '@ngrx/signals';
import {inject} from '@angular/core';
import {DocumentsService} from '../services/documents.service';
import {rxMethod} from '@ngrx/signals/rxjs-interop';
import {pipe, switchMap, tap} from 'rxjs';
import {tapResponse} from '@ngrx/operators';
import {Router} from '@angular/router';

type DocumentsStoreState = {
    Documents:Document[],
    isLoading: boolean;
    Error:string;
    SelectedDocument:Document | null;
}

const initialState: DocumentsStoreState = {
    Documents: [],
    isLoading: false,
    Error:'',
    SelectedDocument:null,
}

export const DocumentsStore = signalStore(
    withState(initialState),
    withMethods((store, docService = inject(DocumentsService), router = inject(Router))=> {
        const loadDocuments = rxMethod(
            pipe(
                tap(() => patchState(store, {isLoading: true, Error: ''})),
                switchMap(() => {
                    return docService.GetAllDocuments().pipe(
                        tapResponse({
                            next: (docList) => patchState(store, (state: DocumentsStoreState) => ({
                                Documents: docList,
                                isLoading: false
                            })),
                            error: (err: any) => {
                                patchState(store, {isLoading: false, Error: err?.message});
                                console.error(err);
                            },
                        })
                    );
                })
            )
        )

        function selectDocument(document: Document): void {
            patchState(store, (state) => ({SelectedDocument: document}));
            router.navigateByUrl('/document/' + document.id);
        }

        return {loadDocuments, selectDocument}
    }),

    withHooks((store) => {
        return {
            onInit() {
                store.loadDocuments(null);
            },
            onDestroy() {},
        };
    }),
)
