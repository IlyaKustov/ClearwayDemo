import {Injectable, OnDestroy, signal} from '@angular/core';
import {Canvas, FabricObject, Point, Textbox, util} from 'fabric';
import {CommentBase, CommentData} from './comments/comment-base';
import {BehaviorSubject, fromEvent, Subscription} from 'rxjs';
import {CommentText} from './comments/comment-text';
import {CommentImage} from './comments/comment-image';
import {CommentHighlight} from './comments/comment-highlight';

@Injectable()
export class CanvasService implements OnDestroy {
    public ZoomLevel = signal(1);
    public CreateCommentOnMouseDown = signal(CommentType.None);
    public Error: BehaviorSubject<string> = new BehaviorSubject<string>('');

    public CommentParam: any;

    private canvas: Canvas | undefined;

    private readonly _zoomMultiplier = 1.18;
    private _scrollY = 0;
    private _scrollX = 0;
    private _scrollYAnimationID = 0;
    private _scrollXAnimationID = 0;
    private _touchPanStart: { x: number; y: number; } | null = null;
    private _isMovingViewPort = false;
    private _mouseDownPoint = new Point(0, 0);

    private _maxHeight = -1;
    private _maxWidth = -1;

    private _subs: Subscription;

    private commentsMap: Map<FabricObject, CommentBase> = new Map();

    constructor() {
        this._subs = fromEvent(document, 'keyup').subscribe((e: Event) => {
            this.setCursors(e as KeyboardEvent);
        });

        let t = fromEvent(document, 'keydown').subscribe((e: Event) => {

            let event = e as KeyboardEvent;
            if (!event)
                return;

            this.setCursors(event);

            let objs = this.canvas?.getActiveObjects();
            if (objs) {
                if (event.code === 'Delete') {
                    console.warn("DELETE", objs);

                    if (objs.length == 1 && objs[0] instanceof Textbox && (objs[0] as Textbox).isEditing) return;

                    objs.forEach(obj => {
                        this.commentsMap.delete(obj);
                        this.canvas?.discardActiveObject();
                        this.canvas?.remove(obj);
                    });
                }

                if (event.code === 'Escape') {
                    this.canvas?.discardActiveObject();
                    this.canvas?.renderAll();
                }
            }
        });
        this._subs.add(t);
    }

    ngOnDestroy(): void {
        console.log("CanvasService ngOnDestroy");
        this._subs.unsubscribe();
    }

    public init(canvas: Canvas) {
        this.canvas = canvas;
        if (!this.canvas)
            return;

        this.canvas.on('mouse:move', (e: any) => this.onMouseMove(e));
        this.canvas.on('mouse:up:before', (e: any) => this.onMouseUp(e));
        this.canvas.on('mouse:down:before', (e: any) => this.onMouseDown(e));
        this.canvas.on('mouse:wheel', (e: any) => this.onMouseWheel(e));
        this.canvas.on('contextmenu', (e: any) => e.e.preventDefault());
    }

    public setMaxDimensions(width: number, height: number) {
        this._maxWidth = width;
        this._maxHeight = height;
        this.centerViewOnCanvas();
    }

    public zoom(mode: ZoomMode, pointer?: { x: number; y: number; }) {
        if (!this.canvas)
            return;

        let canvas = this.canvas;
        let point: Point;
        if (pointer)
            point = new Point(pointer.x, pointer.y);
        else
            point = new Point(canvas.width / 2, canvas.height / 2);

        let prevZoomVal = this.ZoomLevel();
        switch (mode) {
            case ZoomMode.ZoomIn:
                this.setZoomLevel(prevZoomVal * this._zoomMultiplier);
                break;
            case ZoomMode.ZoomOut:
                this.setZoomLevel(prevZoomVal / this._zoomMultiplier);
                break;
            case ZoomMode.Reset:
                this.ZoomLevel.set(1);
                break;
            // case  ZoomMode.FitWindow:
            //   this.setZoomLevel(this.getScaleToFitSchemeToWindow());
            //   break;
        }
        let newZoomVal = this.ZoomLevel();

        let x1 = this._scrollX;
        let y1 = this._scrollY;
        let pp = this.limitPan(this._scrollX, 0, true);
        let x2 = pp.x;
        let y2 = pp.y

        util.animate({
            startValue: 0,
            endValue: 1,
            byValue: 0,
            duration: 400,
            easing: util.ease.easeOutQuart,
            onChange: (v) => {
                let z = (newZoomVal - prevZoomVal) * v + prevZoomVal;
                this.canvas?.zoomToPoint(point, z);

                let x, y;
                if (mode == ZoomMode.Reset || mode == ZoomMode.FitWindow) {
                    x = v * x2 + (1 - v) * x1;
                    y = v * y2 + (1 - v) * y1;
                } else {
                    let pan = this.limitPan(canvas.viewportTransform[4], canvas.viewportTransform[5], false);
                    x = pan.x;
                    y = pan.y;
                }

                canvas.absolutePan(new Point(-x, -y));
                this._scrollX = x;
                this._scrollY = y;
            }
        });
    }

    public centerViewOnCanvas() {
        let pan = this.limitPan(this._scrollX, this._scrollY);
        this._scrollX = pan.x;
        this._scrollY = pan.y;
        this.canvas?.absolutePan(new Point(-pan.x, -pan.y));
    }

    public loadComments(comments: CommentData[]) {
        comments.forEach(commentData => {
            if (commentData != null) {
                let c = this.createComment(commentData.type as CommentType);
                if (c) {
                    c.createFabricObjectWithParam(0, 0).subscribe({
                        next: (el) => {
                            this.commentsMap.set(el, c);
                            c.init(commentData);
                            this.canvas?.add(el);
                        },
                        error: (err) => {
                            console.error("Error while creating comment", err);
                            this.Error.next("Error while creating comment");
                        }
                    })
                }
            }
        })
    }

    private onMouseDown(e: any) {
        if (!this.canvas)
            return;

        if (e.e instanceof MouseEvent) {
            if (e.e.button == 0) {
                this._touchPanStart = null;

                var me = e.e as MouseEvent;
                me.preventDefault();
                me.stopPropagation();

                if (e.e.ctrlKey || e.e.metaKey) {

                    var pointer = this.canvas.getPointer(me, true);
                    if (!me.altKey)
                        this.zoom(ZoomMode.ZoomIn, pointer);
                    else
                        this.zoom(ZoomMode.ZoomOut, pointer);
                    return;
                } else if (this.CreateCommentOnMouseDown() != CommentType.None) {
                    let comment = this.createComment(this.CreateCommentOnMouseDown());
                    if (comment != null) {
                        comment.createFabricObjectWithParam(e.absolutePointer.x, e.absolutePointer.y, this.CommentParam).subscribe({
                            next: (el) => {
                                this.commentsMap.set(el, comment);
                                this.canvas?.add(el);
                                this.canvas?.setActiveObject(el);

                                if (el instanceof Textbox) {
                                    let tb = el as Textbox;

                                    setTimeout(() => {
                                        this.canvas?.setActiveObject(el);
                                        tb.enterEditing();
                                        //b.setSelectionEnd(100);
                                        //tb.setSelectionStart(0);
                                    }, 100);

                                    //tb.setSelectionEnd()
                                }
                            },
                            error: (err) => {
                                console.error("Error while creating comment", err);
                                this.Error.next("Error while creating comment");
                            }
                        })
                    }
                    this.CreateCommentOnMouseDown.set(CommentType.None);
                    this.CommentParam = null;
                    return;
                }
            } else if (e.e.buttons > 1) {
                this.canvas.defaultCursor = (this.canvas as any).upperCanvasEl.style.cursor = "grab";
            }
        }

        this._touchPanStart = {x: this.canvas.viewportTransform[4], y: this.canvas.viewportTransform[5]};
        this._mouseDownPoint = e.pointer;
    }

    private onMouseMove(e: any) {
        if (!this.canvas)
            return;

        this.canvas.defaultCursor = (this.canvas as any).upperCanvasEl.style.cursor = this.CreateCommentOnMouseDown() == CommentType.None ? "default" : "copy";
        if (e.e instanceof MouseEvent && e.e.buttons > 1) {
            if (e.e instanceof Event) {
                var te = e.e as Event;
                te.preventDefault();
                te.stopPropagation();
            }

            if (this._touchPanStart) {
                var tx = e.pointer.x - this._mouseDownPoint.x;
                var ty = e.pointer.y - this._mouseDownPoint.y;
                if (!this._isMovingViewPort) {
                    var td = Math.sqrt(tx * tx + ty * ty);
                    if (td < 4)
                        return;
                }

                this._isMovingViewPort = true;

                this.canvas.defaultCursor = (this.canvas as any).upperCanvasEl.style.cursor = "-moz-grabbing";
                this.canvas.defaultCursor = (this.canvas as any).upperCanvasEl.style.cursor = "-webkit-grabbing";
                this.canvas.defaultCursor = (this.canvas as any).upperCanvasEl.style.cursor = "grabbing";

                let x = this._touchPanStart.x + tx;
                let y = this._touchPanStart.y + ty;

                let pan = this.limitPan(x, y);

                this._scrollX = pan.x;
                this._scrollY = pan.y;
                this.canvas.absolutePan(new Point(-pan.x, -pan.y));
            }
            return;
        } else if (!this._isMovingViewPort)
            this._touchPanStart = null;
    }

    private onMouseUp(e: any) {
        if (!this.canvas)
            return;

        this._isMovingViewPort = false;
        this.canvas.defaultCursor = (this.canvas as any).upperCanvasEl.style.cursor = "default";
    }

    private setZoomLevel(value: number) {
        const MinZoomLevel = 0.2;
        const MaxZoomLevel = 6.5;
        if (value > MaxZoomLevel)
            value = MaxZoomLevel;
        else if (value < MinZoomLevel)
            value = MinZoomLevel;

        this.ZoomLevel.set(value);
    }

    protected onMouseWheel(e: any) {
        let options = e.e as WheelEvent;
        if (!options)
            return;

        if (options.ctrlKey || options.metaKey) {
            var delta = options.deltaY;
            if (options.altKey)
                delta = -delta;
            if (delta != 0) {
                options.preventDefault();
                var pointer = this.canvas?.getPointer(options, true);
                if (pointer) {
                    if (delta < 0)
                        this.zoom(ZoomMode.ZoomIn, pointer);
                    else if (delta > 0)
                        this.zoom(ZoomMode.ZoomOut, pointer);
                }
            }
            return;
        }

        this.pan(options);
    }

    private pan(options: WheelEvent) {
        if (!this.canvas)
            return;

        var t = options.deltaY ? options.deltaY : options.deltaX;
        const deltaw = t < 0 ? 80 : -80;

        let y = this._scrollY;
        let x = this._scrollX;

        if (options.shiftKey) x += deltaw;
        else y += deltaw;

        let pan = this.limitPan(x, y, options.shiftKey);
        x = pan.x;
        y = pan.y;

        let nx: number;
        let ny: number;
        if (options.shiftKey) {
            this._scrollXAnimationID++;
            nx = this._scrollXAnimationID;
            this._scrollX = x;

        } else {
            this._scrollYAnimationID++;
            ny = this._scrollYAnimationID;
            this._scrollY = y;
        }

        let stV: number;
        let enV: number;
        if (options.shiftKey) {
            stV = this.canvas.viewportTransform[4];
            enV = x;
        } else {
            stV = this.canvas.viewportTransform[5];
            enV = y;
        }

        util.animate({
            startValue: stV,
            endValue: enV,
            byValue: 0,
            duration: 500,
            easing: util.ease.easeOutQuart,
            onChange: (v) => {
                if (options.shiftKey) {
                    if (this._scrollXAnimationID == nx) {
                        this.canvas?.absolutePan(new Point(-v, -y));
                    }

                } else {
                    if (this._scrollYAnimationID == ny) {
                        this.canvas?.absolutePan(new Point(-x, -v));
                    }

                }
            },
        });
        options.preventDefault();
    }

    private limitPan(x: number, y: number, needCorrectX: boolean = true): { x: number, y: number } {
        if (needCorrectX && this._maxWidth > 0) {
            let cw = this.canvas ? this.canvas.width : 0;
            if (cw <= this._maxWidth * this.ZoomLevel()) {
                if (x > 0) x = 0;

                let maxX = -this._maxWidth * this.ZoomLevel() + cw;
                if (maxX > 0) {
                    maxX = 0;
                }
                if (x < maxX) x = maxX;
            } else {

                let center = (-this._maxWidth * this.ZoomLevel() + cw) / 2;
                if (Math.abs(center - x) >= Math.abs(center - this._scrollX))
                    x = center;
            }
        }

        if (y > 0) y = 0;
        if (this._maxHeight > 0) {
            let ch = this.canvas ? this.canvas.height : 0;
            let maxY = -this._maxHeight * this.ZoomLevel() + ch;
            if (maxY > 0) maxY = 0;
            if (y < maxY) y = maxY;
        }

        return {x: x, y: y};
    }

    private setCursors(event?: KeyboardEvent, forced?: boolean) {
        if (!this.canvas)
            return;

        var overrideCursor: string = '';
        if (event) {
            if ((event.ctrlKey || event.metaKey)) {
                if (event.altKey)
                    overrideCursor = "zoom-out";
                else
                    overrideCursor = "zoom-in";
            }
            // else if(event.shiftKey)
            //   overrideCursor = "copy";
        }

        if (overrideCursor) {
            event?.stopPropagation();
            //event.preventDefault();
        }

        var c = overrideCursor ? overrideCursor : ("default");
        if (!forced && c == this.canvas.defaultCursor)
            return;

        this.canvas.defaultCursor = c;
        (this.canvas as any).upperCanvasEl.style.cursor = c;

        this.canvas.forEachObject((o: any) => {
            if (o.Properties) o.hoverCursor = c;
        });
    }

    private createComment(commentType: CommentType): CommentBase | null {
        switch (commentType) {
            case CommentType.Text:
                return new CommentText();
            case CommentType.Image:
                return new CommentImage();
            case CommentType.Highlight:
                return new CommentHighlight();
        }
        return null;
    }

    public GetAllComments(): CommentBase[] {
        return Array.from(this.commentsMap.values());
    }
}

export enum ZoomMode {
    ZoomIn, ZoomOut, Reset, FitWindow
}

export enum CommentType {
    None = 0, Text = 1, Image = 2, Highlight
}
