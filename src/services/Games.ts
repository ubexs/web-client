import base, { IBaseOptions } from './base';
import * as model from '../models/index';
export default class Games extends base {

    constructor(data?: IBaseOptions) {
        super();
        if (data) {
            const updatedBase = new base(data);

            this.v1 = updatedBase.v1;
            this.v2 = updatedBase.v2;
        }
    }

    /**
     * Get info for the {gameId}
     * @param gameId
     */
    public async getInfo(gameId: number): Promise<model.Games.GameInfo> {
        const info = await this.v1.get('/game/' + gameId + '/info');
        return info.data;
    }

    /**
     * Get game thumbnail for the {gameId}
     * @param gameId
     */
    public async getGameThumbnail(gameId: number): Promise<model.Games.GameThumbnail> {
        const info = await this.v1.get('/game/' + gameId + '/thumbnail');
        return info.data;
    }

    /**
     * Get unobfuscated game map source
     * @param gameId 
     */
    public async getMapContent(gameId: number): Promise<string> {
        const map = await this.v1.get('/game/edit-mode/' + gameId + '/map');
        return map.data;
    }

    /**
     * Get unobfuscated game scripts source
     * @param gameId 
     */
    public async getAllGameScripts(gameId: number): Promise<{ scriptId: number; content: string; scriptType: model.Games.ScriptType }[]> {
        const map = await this.v1.get('/game/edit-mode/' + gameId + '/scripts');
        return map.data;
    }

    /**
     * Decode a client game auth code
     * @param code 
     */
    public async decodeGameAuthCode(code: string): Promise<{ userId: number; username: string; iat: number; }> {
        const data = await this.v1.get('/game/auth/client/decode?code=' + encodeURIComponent(code));
        return data.data;
    }

    /**
     * Generate a game auth code
     */
    public async generateGameAuthCode(): Promise<string> {
        const data = await this.v1.get('/game/auth/client/generate');
        return data.data;
    }

    /**
     * Setup game client
     * Meant for use on app startup
     */
    public setupGameClient(): void {
        const GAME_KEY = model.Games.GAME_KEY;

        const COPYRIGHT_DISCLAIMER = `/**
 * Copyright (c) ubexs.com - All Rights Reserved
 * Unauthorized copying of this file, via any medium, is strictly prohibited.
 * You are not allowed to copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software.
 * View our full terms of service here: https://www.ubexs.com/terms
 */`;
        let dest = this.path.join(__dirname, '../public/client.js');
        let tmpDir = this.path.join(__dirname, './client.tmp.js');
        let simpleCryptoData = model.Games.getSimpleCrypto();
        let gameKeyVar = `window.GAME_KEY = "${GAME_KEY}"; window.simpleCryptoData = {"name": "${simpleCryptoData.name}"};`;
        let gameEngineFile = this.fs.readFileSync(this.path.join(__dirname, '../client/index.js')).toString();
        this.fs.writeFileSync(tmpDir, gameEngineFile);
        let command = 'browserify ' + tmpDir + ' -o ' + tmpDir;
        // exec
        this.cp.execSync(command);
        gameEngineFile = this.fs.readFileSync(tmpDir).toString();
        let entireString = simpleCryptoData.lib + '\n' + gameKeyVar + '\n' + gameEngineFile + '\n';
        if (process.env.NODE_ENV === 'production') {
            // entireString = this.jsObfuscator.obfuscate(entireString, model.Games.scriptOptions).getObfuscatedCode();
        }
        // write the finalized file
        this.fs.writeFileSync(dest, COPYRIGHT_DISCLAIMER + '\n' + entireString);
        // delete the tmp file
        this.fs.unlinkSync(tmpDir);
        console.log('[info] new game client created');
    }

}
