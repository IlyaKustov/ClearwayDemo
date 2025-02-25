import {Page} from './page';

export class Document {
    public name: string;
    public pages: Page[];
    public id: number

    constructor(name: string) {
        this.name = name;
        this.pages = [];
        this.id = 0;
    }
}
