import base, { IBaseOptions } from './base';
import * as model from '../models/index';
export default class Groups extends base {

    constructor(data?: IBaseOptions) {
        super();
        if (data) {
            const updatedBase = new base(data);

            this.v1 = updatedBase.v1;
            this.v2 = updatedBase.v2;
        }
    }
    /**
     * Get info for the {groupId}
     * @param groupId
     */
    public async getInfo(groupId: number): Promise<model.Groups.groupDetails> {
        const info = await this.v1.get('/group/'+groupId+'/info');
        return info.data;
    }

}