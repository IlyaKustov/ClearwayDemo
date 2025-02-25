import {FabricObject} from 'fabric';
import {Observable, tap} from 'rxjs';

export abstract class CommentBase {
    protected obj: FabricObject | undefined;

    protected abstract createFabricObject(x: number, y: number, param?:any): Observable<FabricObject>;

    public createFabricObjectWithParam(x: number, y: number, param?:any): Observable<FabricObject>{
        return this.createFabricObject(x, y, param)
            .pipe(
                tap((ob) => this.obj = ob)
            )
    }

    getSaveData(): CommentData{
        let res = new CommentData();
        res.x = this.obj?.getX()
        res.y = this.obj?.getY();
        res.scaleY = this.obj?.scaleY;
        res.scaleX = this.obj?.scaleX;
        res.width = this.obj?.width;
        res.height = this.obj?.height;
        res.angle = this.obj?.angle;
        res.skewX= this.obj?.skewX;
        res.skewY= this.obj?.skewY;
        return res;
    }

    init(data:CommentData){
        if(this.obj){
            if (data?.x != null) this.obj.setX(data.x);
            if (data?.y != null) this.obj.setY(data.y);
            if (data?.width != null) this.obj.width = data.width;
            if (data?.height != null) this.obj.height = data.height;
            if (data?.angle != null) this.obj.angle = data.angle;
            if (data?.scaleY != null) this.obj.scaleY = data.scaleY;
            if (data?.scaleX != null) this.obj.scaleX = data.scaleX;
            if (data?.skewX != null) this.obj.skewX = data.skewX;
            if (data?.skewY != null) this.obj.skewY = data.skewY;
        }
    }
}

export class CommentData {
    public x: number | undefined;
    public y: number | undefined;
    public type: number | undefined;
    public width: number | undefined;
    public height: number | undefined;
    public angle: number | undefined;
    public scaleX: number | undefined;
    public scaleY: number | undefined;
    public skewX:number | undefined;
    public skewY:number | undefined;
    public param: any | undefined;
}
