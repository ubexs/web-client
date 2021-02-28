import base from '../base';
import {Controller, Get, Header, HeaderParams, Render, Use, Res, Locals, PathParams, Req, Required, QueryParams} from '@tsed/common';
import * as model from '../../models/index';
import * as middleware from '../../middleware/v1';
const YesAuth = middleware.auth.YesAuth;
import moment = require('moment');
import {Summary} from "@tsed/swagger";
import config from "../../helpers/config";

@Controller('/')
export class GamesController extends base {

    @Get('/')
    @Summary('Redirect to website')
    public redirect(
        @Res() res: Res,
    ) {
        res.redirect(302, 'https://www.ubexs.com/');
    }

    @Get('/:gameId/play')
    @Summary('Load game play page')
    @Use(YesAuth)
    @Render('game')
    public async gamePlay(
        @Req() req: Req,
        @Locals('userInfo') userData: model.UserSession,
        @PathParams('gameId', Number) gameId: number
    ) {
        const baseService = new base({
            cookie: req.headers['cookie'],
        });
        console.log('Loading play page!');
        // Confirm place is valid
        try {
            const gameInfo = await this.Games.getInfo(gameId);
            if (gameInfo.gameState !== 1) {
                throw Error('Game state does not allow playing');
            }
        }catch(e) {
            // Invalid ID
            throw new this.BadRequest('InvalidGameId');
        }
        // generate an auth code
        let authCode = await baseService.Games.generateGameAuthCode();
        let ViewData = new model.WWWTemplate({'title': 'Play'});
        ViewData.page = {
            gameId,
            authCode,
            clientUrl: config.clientUrl,
        }
        return ViewData;
    }

    @Get('/game-check/browser-compatibility')
    @Summary('Confirm browser respects iframe sandbox attribute')
    public browserCompatibilityCheck(
        @Res() res: Res,
    ) {
        res.set('x-frame-options','sameorigin');
        res.send(`<!DOCTYPE html><html><head><title>Checking your browser...</title></head><body><script nonce="${res.locals.nonce}">try{alert("Sorry, your browser is not supported.");window.top.location.href = "/support/browser-not-compatible";}catch(e){}</script></body></html>`);
        return;
    }

    @Get('/:gameId/sandbox')
    @Summary('Load game play page sandbox')
    @Use(YesAuth)
    @Render('game_sandbox')
    public async gamePlaySandbox(
        @Res() res: Res,
        @Locals('userInfo') userData: model.UserSession,
        @PathParams('gameId', Number) gameId: number,
        @Required()
        @QueryParams('authCode', String) authCode: string,
    ) {
        res.set('x-frame-options','sameorigin');
        // Confirm place is valid
        try {
            const gameInfo = await this.Games.getInfo(gameId);
            if (gameInfo.gameState !== 1) {
                throw Error('Game state does not allow playing');
            }
        }catch(e) {
            // Invalid ID
            throw new this.BadRequest('InvalidGameId');
        }
        // verify auth code
        await this.Games.decodeGameAuthCode(authCode);
        // OK, continue
        let ViewData = new model.WWWTemplate({'title': 'Play'});
        ViewData.page = {
            gameId,
            authCode,
            clientUrl: config.clientUrl,
        }
        return ViewData;
    }

    @Get('/:gameId/edit')
    @Summary('Game edit page')
    @Use(YesAuth)
    @Render('game_edit')
    public async gameEdit(
        @Req() req: Req,
        @Locals('userInfo') userInfo: model.UserSession,
        @PathParams('gameId', Number) gameId: number,
    ) {
        const baseService = new base({
            cookie: req.headers['cookie'],
        });
        // Confirm place is valid
        let gameInfo;
        try {
            gameInfo = await this.Games.getInfo(gameId);
        }catch(e) {
            // Invalid ID
            throw new this.BadRequest('InvalidGameId');
        }
        if (gameInfo.creatorType !== 0) {
            // temp until group perms are sorted out
            throw new this.BadRequest('InvalidGameId');
        }
        if (gameInfo.creatorType === 0 && gameInfo.creatorId !== userInfo.userId) {
            // no edit perms
            throw new this.BadRequest('InvalidPermissions');
        }
        // Grab Map Script
        console.log('getting map');
        const mapScriptContent = await baseService.Games.getMapContent(gameId);
        let ViewData = new model.WWWTemplate({'title': 'Edit Game'});
        ViewData.page = {};
        ViewData.page.scripts = {
            map: mapScriptContent,
            server: [] as {content: string; id: number}[],
            client: [] as {content: string; id: number}[],
        };
        console.log('getting all scripts');

        const allScripts = await baseService.Games.getAllGameScripts(gameId);
        for (const script of allScripts) {
            const content = script.content;
            if (script.scriptType === model.Games.ScriptType.server) {
                ViewData.page.scripts.server.push({content: content, id: script.scriptId});
            }else{
                ViewData.page.scripts.client.push({content: content, id: script.scriptId});
            }
        }
        console.log('returning view');
        ViewData.page.gameInfo = gameInfo;
        ViewData.title = 'Edit: ' + gameInfo.gameName;
        ViewData.page.genres = model.Games.GameGenres;
        return ViewData;
    }
}
