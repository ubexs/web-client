"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_1 = require("./base");
const model = require("../models/index");
class Games extends base_1.default {
    constructor(data) {
        super();
        if (data) {
            const updatedBase = new base_1.default(data);
            this.v1 = updatedBase.v1;
            this.v2 = updatedBase.v2;
        }
    }
    async getInfo(gameId) {
        const info = await this.v1.get('/game/' + gameId + '/info');
        return info.data;
    }
    async getGameThumbnail(gameId) {
        const info = await this.v1.get('/game/' + gameId + '/thumbnail');
        return info.data;
    }
    async getMapContent(gameId) {
        const map = await this.v1.get('/game/edit-mode/' + gameId + '/map');
        return map.data;
    }
    async getAllGameScripts(gameId) {
        const map = await this.v1.get('/game/edit-mode/' + gameId + '/scripts');
        return map.data;
    }
    async decodeGameAuthCode(code) {
        const data = await this.v1.get('/game/auth/client/decode?code=' + encodeURIComponent(code));
        return data.data;
    }
    async generateGameAuthCode() {
        const data = await this.v1.get('/game/auth/client/generate');
        return data.data;
    }
    setupGameClient() {
        const GAME_KEY = model.Games.GAME_KEY;
        const COPYRIGHT_DISCLAIMER = `/**
 * Copyright (c) BlocksHub - All Rights Reserved
 * Unauthorized copying of this file, via any medium, is strictly prohibited.
 * You are not allowed to copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software.
 * View our full terms of service here: https://blockshub.net/terms
 */`;
        let dest = this.path.join(__dirname, '../public/client.js');
        let tmpDir = this.path.join(__dirname, './client.tmp.js');
        let simpleCryptoData = model.Games.getSimpleCrypto();
        let gameKeyVar = `window.GAME_KEY = "${GAME_KEY}"; window.simpleCryptoData = {"name": "${simpleCryptoData.name}"};`;
        let gameEngineFile = this.fs.readFileSync(this.path.join(__dirname, '../client/index.js')).toString();
        this.fs.writeFileSync(tmpDir, gameEngineFile);
        let command = 'browserify ' + tmpDir + ' -o ' + tmpDir;
        this.cp.execSync(command);
        gameEngineFile = this.fs.readFileSync(tmpDir).toString();
        let entireString = simpleCryptoData.lib + '\n' + gameKeyVar + '\n' + gameEngineFile + '\n';
        if (process.env.NODE_ENV === 'production') {
        }
        this.fs.writeFileSync(dest, COPYRIGHT_DISCLAIMER + '\n' + entireString);
        this.fs.unlinkSync(tmpDir);
        console.log('[info] new game client created');
    }
}
exports.default = Games;
