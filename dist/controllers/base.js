"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const errors_1 = require("../helpers/errors");
const Users_1 = require("../services/Users");
const Games_1 = require("../services/Games");
const xss = require("xss");
const moment = require("moment");
class ControllerBase extends errors_1.default {
    constructor(data) {
        super();
        this.xss = xss;
        this.moment = moment;
        this.Users = new Users_1.default(data);
        this.Games = new Games_1.default(data);
    }
}
exports.default = ControllerBase;
