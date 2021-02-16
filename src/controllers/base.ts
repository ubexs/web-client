// errors
import errors from '../helpers/errors';
// services
import Users from '../services/Users';
import Games from '../services/Games';
// custom libraries
import * as xss from 'xss';
import * as moment from 'moment';
/**
 * Controller base class
 */
export default class ControllerBase extends errors {
    public Users: Users;
    public Games: Games;
    public xss = xss;
    public moment = moment;
    constructor(data?: {cookie?: string}) {
        super();
        this.Users = new Users(data);
        this.Games = new Games(data);
    }
}