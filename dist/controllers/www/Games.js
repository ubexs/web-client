"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GamesController = void 0;
const base_1 = require("../base");
const common_1 = require("@tsed/common");
const model = require("../../models/index");
const middleware = require("../../middleware/v1");
const YesAuth = middleware.auth.YesAuth;
const swagger_1 = require("@tsed/swagger");
const config_1 = require("../../helpers/config");
let GamesController = class GamesController extends base_1.default {
    redirect(res) {
        res.redirect(302, 'https://www.blockshub.net/');
    }
    async gamePlay(req, userData, gameId) {
        const baseService = new base_1.default({
            cookie: req.headers['cookie'],
        });
        console.log('Loading play page!');
        try {
            const gameInfo = await this.Games.getInfo(gameId);
            if (gameInfo.gameState !== 1) {
                throw Error('Game state does not allow playing');
            }
        }
        catch (e) {
            throw new this.BadRequest('InvalidGameId');
        }
        let authCode = await baseService.Games.generateGameAuthCode();
        let ViewData = new model.WWWTemplate({ 'title': 'Play' });
        ViewData.page = {
            gameId,
            authCode,
            clientUrl: config_1.default.clientUrl,
        };
        return ViewData;
    }
    browserCompatibilityCheck(res) {
        res.set('x-frame-options', 'sameorigin');
        res.send(`<!DOCTYPE html><html><head><title>Checking your browser...</title></head><body><script nonce="${res.locals.nonce}">try{alert("Sorry, your browser is not supported.");window.top.location.href = "/support/browser-not-compatible";}catch(e){}</script></body></html>`);
        return;
    }
    async gamePlaySandbox(res, userData, gameId, authCode) {
        res.set('x-frame-options', 'sameorigin');
        try {
            const gameInfo = await this.Games.getInfo(gameId);
            if (gameInfo.gameState !== 1) {
                throw Error('Game state does not allow playing');
            }
        }
        catch (e) {
            throw new this.BadRequest('InvalidGameId');
        }
        await this.Games.decodeGameAuthCode(authCode);
        let ViewData = new model.WWWTemplate({ 'title': 'Play' });
        ViewData.page = {
            gameId,
            authCode,
            clientUrl: config_1.default.clientUrl,
        };
        return ViewData;
    }
    async gameEdit(req, userInfo, gameId) {
        const baseService = new base_1.default({
            cookie: req.headers['cookie'],
        });
        let gameInfo;
        try {
            gameInfo = await this.Games.getInfo(gameId);
        }
        catch (e) {
            throw new this.BadRequest('InvalidGameId');
        }
        if (gameInfo.creatorType !== 0) {
            throw new this.BadRequest('InvalidGameId');
        }
        if (gameInfo.creatorType === 0 && gameInfo.creatorId !== userInfo.userId) {
            throw new this.BadRequest('InvalidPermissions');
        }
        console.log('getting map');
        const mapScriptContent = await baseService.Games.getMapContent(gameId);
        let ViewData = new model.WWWTemplate({ 'title': 'Edit Game' });
        ViewData.page = {};
        ViewData.page.scripts = {
            map: mapScriptContent,
            server: [],
            client: [],
        };
        console.log('getting all scripts');
        const allScripts = await baseService.Games.getAllGameScripts(gameId);
        for (const script of allScripts) {
            const content = script.content;
            if (script.scriptType === model.Games.ScriptType.server) {
                ViewData.page.scripts.server.push({ content: content, id: script.scriptId });
            }
            else {
                ViewData.page.scripts.client.push({ content: content, id: script.scriptId });
            }
        }
        console.log('returning view');
        ViewData.page.gameInfo = gameInfo;
        ViewData.title = 'Edit: ' + gameInfo.gameName;
        ViewData.page.genres = model.Games.GameGenres;
        return ViewData;
    }
};
__decorate([
    common_1.Get('/'),
    swagger_1.Summary('Redirect to website'),
    __param(0, common_1.Res()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], GamesController.prototype, "redirect", null);
__decorate([
    common_1.Get('/:gameId/play'),
    swagger_1.Summary('Load game play page'),
    common_1.Use(YesAuth),
    common_1.Render('game'),
    __param(0, common_1.Req()),
    __param(1, common_1.Locals('userInfo')),
    __param(2, common_1.PathParams('gameId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, model.UserSession, Number]),
    __metadata("design:returntype", Promise)
], GamesController.prototype, "gamePlay", null);
__decorate([
    common_1.Get('/game-check/browser-compatibility'),
    swagger_1.Summary('Confirm browser respects iframe sandbox attribute'),
    __param(0, common_1.Res()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], GamesController.prototype, "browserCompatibilityCheck", null);
__decorate([
    common_1.Get('/:gameId/sandbox'),
    swagger_1.Summary('Load game play page sandbox'),
    common_1.Use(YesAuth),
    common_1.Render('game_sandbox'),
    __param(0, common_1.Res()),
    __param(1, common_1.Locals('userInfo')),
    __param(2, common_1.PathParams('gameId', Number)),
    __param(3, common_1.Required()),
    __param(3, common_1.QueryParams('authCode', String)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, model.UserSession, Number, String]),
    __metadata("design:returntype", Promise)
], GamesController.prototype, "gamePlaySandbox", null);
__decorate([
    common_1.Get('/:gameId/edit'),
    swagger_1.Summary('Game edit page'),
    common_1.Use(YesAuth),
    common_1.Render('game_edit'),
    __param(0, common_1.Req()),
    __param(1, common_1.Locals('userInfo')),
    __param(2, common_1.PathParams('gameId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, model.UserSession, Number]),
    __metadata("design:returntype", Promise)
], GamesController.prototype, "gameEdit", null);
GamesController = __decorate([
    common_1.Controller('/')
], GamesController);
exports.GamesController = GamesController;
