import {FabricObject, Rect} from 'fabric';
import {CommentBase, CommentData} from './comment-base';
import {Observable, of} from 'rxjs';
import {CommentType} from '../canvas.service';

export class CommentHighlight extends CommentBase {
    override getSaveData(): CommentData {
        let s = super.getSaveData();
        s.type = CommentType.Highlight;
        return s;
    }

    createFabricObject(x: number, y: number): Observable<FabricObject> {
      return of( new Rect({
        width: 450,
        height: 30,
        left: x,
        top: y,
        fill: 'rgba(212,197,73,0.37)',
        hasBorders: true,
      }));
    }
}
