import {
    AfterViewInit,
    Component,
    ElementRef,
    inject,
    OnDestroy,
    OnInit,
    signal,
    ViewChild,
    WritableSignal
} from '@angular/core';

import {Document} from '../../model/document';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Canvas, FabricImage} from 'fabric';
import {Page} from '../../model/page';
import {CanvasService, CommentType, ZoomMode} from './document-editor/canvas.service';
import {createComputed} from '@angular/core/primitives/signals';
import {ButtonRadioDirective} from 'ngx-bootstrap/buttons';
import {ActivatedRoute, Params, Router} from '@angular/router';
import {DocumentsService} from '../../services/documents.service';
import {AlertsService} from '../alerts/alerts.service';
import {Title} from '@angular/platform-browser';
import {Observable, Subscription} from 'rxjs';
import {Document_comments} from '../../model/document_comments';
import {CanDeactivateComponent} from '../../can_deactivate_guard';
import {BsModalRef, BsModalService} from 'ngx-bootstrap/modal';

@Component({
    selector: 'app-document',
    imports: [CommonModule, FormsModule, ButtonRadioDirective],
    providers: [CanvasService],
    templateUrl: './document.component.html',
    styleUrl: './document.component.css'
})
export class DocumentComponent implements OnInit, AfterViewInit, OnDestroy, CanDeactivateComponent {

    protected Document = signal<Document | null | undefined>(null);
    public Zoom = createComputed(() => Math.round(this.canvasService.ZoomLevel() * 100));
    protected CreateCommentOnMouseDown: WritableSignal<CommentType>;

    protected readonly CommentType = CommentType;

    @ViewChild('docCanvas')
    canvasT: ElementRef | undefined;

    @ViewChild('mainContainer')
    private _mainContainer: ElementRef | undefined

    @ViewChild('fileSelector')
    private fileSelector: ElementRef | undefined;

    private imagesMap: Map<number, FabricImage> = new Map();
    private maxWidth: number = 0;
    private maxHeight: number = 0;

    private canvas: Canvas | undefined;

    private canvasService: CanvasService = inject(CanvasService);
    private _activatedRoute: ActivatedRoute = inject(ActivatedRoute);
    private docsService: DocumentsService = inject(DocumentsService);
    private router: Router = inject(Router);
    private alertsService: AlertsService = inject(AlertsService);

    private modalService: BsModalService = inject(BsModalService);
    private titleService: Title = inject(Title);

    private _subs: Subscription;

    protected modalRef?: BsModalRef;
    @ViewChild('dialogTemplate')
    private dialogTemplate: any;

    protected isChanged:boolean = false;

    constructor() {
        this.CreateCommentOnMouseDown = this.canvasService.CreateCommentOnMouseDown;

        this._subs = this.canvasService.Error.subscribe({
            next: err => {
                if (err?.length > 0)
                    this.alertsService.AddError(err);
            }
        })
    }

    canDeactivate(): Observable<boolean> | boolean{
        //переход
        if(this.isChanged)
            return this.openModal();
        else return true;
    }
    canExitApp():boolean{
        if(!this.isChanged) return true;

        let sub = this.openModal().subscribe({
            next: err => { sub.unsubscribe() },
        })
        //вкладка
        return false;
    }

    protected openModal():Observable<boolean> {
        return new Observable(observer=>{
            this.modalRef = this.modalService.show(this.dialogTemplate);
            this.modalRef.onHidden?.subscribe(res=>{
                if(this.userSelected == "cancel") {
                    observer.next(false);
                    observer.complete();
                }

                if(this.userSelected == "yes"){
                    this.saveComments();
                }

                observer.next(true);
                observer.complete();
            })
        });
    }

    protected userSelected : 'yes' | 'no' | 'cancel' = 'yes'

    protected yes(){
        this.userSelected = "yes";
        this.modalRef?.hide();
    }

    protected no(){
        this.userSelected = "no";
        this.modalRef?.hide();
    }

    protected cancel(){
        this.userSelected = "cancel";
        this.modalRef?.hide()
    }






    ngOnInit(): void {
        let s = this._activatedRoute.params.subscribe((params: Params) => {
            let id = Number(params['id']);
            if (!Number.isInteger(id))
                this.onNavigateBack();

            let ss = this.docsService.GetDocument(id).subscribe({
                    next: (doc) => {
                        this.Document.set(doc);
                        this.titleService.setTitle(doc.name);
                        this.operateDoc(doc);
                    },
                    error: (error) => {
                        console.error(`[DocumentComponent] GetDocument(${id}) error`, error);
                        this.alertsService.AddError("Document loading error: " + error.statusText);
                        this.onNavigateBack();
                    }
                }
            )
            this._subs.add(ss);
        });
        this._subs.add(s);
    }

    ngAfterViewInit() {
        this.canvas = new Canvas(this.canvasT?.nativeElement, {});
        this.canvas.on("object:modified", ()=> {this.isChanged = true;});
        this.canvas.on("object:added", ()=> {this.isChanged = true;});
        this.canvas.on("object:removed", ()=> {this.isChanged = true;});

        this.canvasService.init(this.canvas);

        window.onresize = () => this.setDimensions();
        this.setDimensions();

        this.alertsService.AddInfo("=== Controls ===\n" +
            "Zoom In at point:   Ctrl + mouse wheel or Ctrl + mouse left btn click\n" +
            "Zoom Out at point:   Ctrl + mouse wheel or Ctrl + Alt + mouse left btn click\n" +
            "Scroll Y:   Mouse wheel\n" +
            "Scroll X:   Shift + Mouse wheel\n" +
            "Grab:   Mouse scroll or right btn down and drag\n" +
            "Item selection: click on object\n" +
            "Group selection: click with 'shift' key on objects or select by mouse frame", 0);
    }

    ngOnDestroy(): void {
        this._subs.unsubscribe();
    }

    private operateDoc(doc: Document | null | undefined) {
        let cur = 0;
        let all = doc?.pages.length;
        if (!all) all = 0;

        let op = () => {
            cur++;
            if (cur >= all) {
                this.imagesMap.forEach((image: FabricImage) => {
                    if (image.width > this.maxWidth) {
                        this.maxWidth = image.width;
                    }

                    this.maxHeight += image.height + 10;
                })

                this.maxWidth += 20;
                this.maxHeight += 20;

                this.canvasService.setMaxDimensions(this.maxWidth, this.maxHeight);

                let currHPosition = 10;

                for (let i = 1; i <= this.imagesMap.size; i++) {
                    let image = this.imagesMap.get(i);
                    if (image) {
                        image.left = 10;
                        image.top = currHPosition;
                        image.selectable = false;

                        this.canvas?.add(image);
                        this.canvas?.sendObjectToBack(image);
                        this.canvas?.getObjects()

                        currHPosition += image.height + 10;
                    }
                }
                this.canvas?.renderAll();
                this.isChanged = false;

            }
        }

        doc?.pages.forEach(async (page: Page) => {
            let picture = await this.loadImage(page.imageUrl);
            this.imagesMap.set(page.number, picture);
            op();
        })

        if (doc?.id != null || doc?.id != undefined) {
            this.docsService.GetAllCommentsForDocument(doc?.id).subscribe({
                next: (docs) => {
                    if (docs && docs.length)
                        this.canvasService.loadComments(docs[0].data);

                    this.isChanged = false;
                },
                error: (error) => {
                    console.error(`[DocumentComponent] GetDocument(${doc.id}) error`, error);
                    this.alertsService.AddError("Failed to download comments for the document");
                },
            })
        }
    }

    private async loadImage(url: string | undefined | null) {
        return await FabricImage.fromURL(<string>url, {}, {});
    }

    private setDimensions() {
        this.canvas?.setDimensions({
            width: this._mainContainer?.nativeElement.offsetWidth,
            height: this._mainContainer?.nativeElement.offsetHeight
        });
        this.canvasService.centerViewOnCanvas();
    }

    protected zoomIn() {
        this.canvasService.zoom(ZoomMode.ZoomIn);
    }

    protected zoomOut() {
        this.canvasService.zoom(ZoomMode.ZoomOut);
    }

    protected zoom100() {
        this.canvasService.zoom(ZoomMode.Reset);
    }

    protected onNavigateBack() {
        this.router.navigateByUrl('home');
    }

    selectFile() {
        this.fileSelector?.nativeElement.click();
    }

    loadLocalFile(e: any) {
        let reader = new FileReader();

        reader.onloadend = (param) => {
            this.canvasService.CommentParam = <string>param.target?.result;

            if (this.fileSelector)
                this.fileSelector.nativeElement.value = '';
        }
        reader.onerror = (param) => {
            console.error("onerror", param);

            this.alertsService.AddError("Can't load selected file");
            this.CreateCommentOnMouseDown.set(CommentType.None);
        }
        reader.readAsDataURL(e.target.files[0]);
    }

    saveComments() {
        let comms = this.canvasService.GetAllComments();

        let f = comms.map(comment => comment.getSaveData());

        let doc = this.Document();

        if (doc) {
            let docComm = new Document_comments(doc.id);
            docComm.data = f;

            this.docsService.SaveCommentsForDocument(docComm).subscribe({
                next: (doc) => {
                    this.isChanged = false;
                },
                error: (error) => {
                    console.error("SAVED", error)
                }
            })

        }

    }
}
