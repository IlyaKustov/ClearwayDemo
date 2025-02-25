import {FabricImage, FabricObject} from 'fabric';
import {CommentBase, CommentData} from './comment-base';
import {from, Observable} from 'rxjs';
import {CommentType} from '../canvas.service';

export class CommentImage extends CommentBase {
    override getSaveData(): CommentData {
        let p = super.getSaveData();
        p.type = CommentType.Image;
        p.param = (this.obj as FabricImage).getSrc();
        return p;
    }

    override init(data: CommentData) {
        super.init(data);
        (this.obj as FabricImage).setSrc(data.param);
    }

    createFabricObject(x: number, y: number, param?: any): Observable<FabricObject> {
        return from(FabricImage.fromObject({src: param, left: x, top: y}))
    }
}
