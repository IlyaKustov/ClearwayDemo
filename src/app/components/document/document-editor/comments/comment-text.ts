import {CommentBase, CommentData} from './comment-base';
import {FabricObject, Textbox} from 'fabric';
import {Observable, of} from 'rxjs';
import {CommentType} from '../canvas.service';

export class CommentText extends CommentBase {

    override getSaveData(): CommentData {
        let s = super.getSaveData();
        s.type = CommentType.Text;
        s.param = (this.obj as Textbox).text;
        return s;
    }

    override init(data: CommentData) {
        super.init(data);
        console.debug("[DocumentComponent] Init", data.param);
        (this.obj as Textbox).set('text', data.param);
        (this.obj as FabricObject).skewX

    }

    createFabricObject(x: number, y: number, param?: any): Observable<FabricObject> {
        if (!param) param = '';
        let obj = new Textbox(param, {
            left: x,
            top: y,
            fill: 'blue',
            backgroundColor: 'rgba(139,139,139, 0.2)',
            fontSize: 18,
            hasBorders: true,
            padding: 5,
            width: 100
        });
        return of(obj);
    }
}
