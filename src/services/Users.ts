import base, { IBaseOptions } from './base';
import * as model from '../models/index';
export default class Users extends base {

    constructor(data?: IBaseOptions) {
        super();
        if (data) {
            const updatedBase = new base({
                cookie: data.cookie,
            });

            this.v1 = updatedBase.v1;
            this.v2 = updatedBase.v2;
        }
    }
    /**
     * Get info for the {userId}
     * @param userId 
     */
    public async getInfo(userId: number): Promise<model.Users.Info> {
        const info = await this.v1.get('/user/'+userId+'/info');
        return info.data;
    }

    /**
     * Get the authenticated user session info
     */
    public async getAuthenticatedUserInfo(): Promise<model.Users.AuthenticatedInfo> {
        const info = await this.v1.get('/auth/current-user');
        return info.data;
    }

}