import errors from '../helpers/errors';
import client from '../helpers/axios';
import Axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as jsObfuscator from 'javascript-obfuscator';
import * as cp from 'child_process';

export interface IBaseOptions {
    cookie?: string;
}
/**
 * Service base class
 */
export default class ServiceBase extends errors {
    private clientOptions: AxiosRequestConfig = {};
    constructor(opts?: IBaseOptions) {
        super();
        const customClientOptions: AxiosRequestConfig = {
            headers: {
                'accept': 'application/json',
            },
            maxRedirects: 0,
        };
        if (opts) {
            if (opts.cookie) {
                customClientOptions.headers['cookie'] = opts.cookie;
            }
        }
        this.clientOptions = customClientOptions;
        this.v1 = client('v1', this.clientOptions);
        this.v2 = client('v2', this.clientOptions);
        this.fs = fs;
        this.path = path;
        this.jsObfuscator = jsObfuscator;
        this.cp = cp;
    }
    /**
     * ubexs V1 API
     */
    public v1: AxiosInstance;
    /**
     * ubexs V2 API
     */
    public v2: AxiosInstance;

    public fs: typeof fs;
    public path: typeof path;
    public jsObfuscator: typeof jsObfuscator;
    public cp: typeof cp;
}
