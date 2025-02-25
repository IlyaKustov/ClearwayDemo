import {CommentData} from '../components/document/document-editor/comments/comment-base';

export class Document_comments {
    id: number;
    doc_id: number;
    data: CommentData[];

    constructor(id: number) {
        this.id = id;
        this.doc_id = id;
        this.data = [];
    }
}
