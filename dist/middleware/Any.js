"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getJavascript = exports.getIp = exports.generateCspWithNonce = exports.version = exports.lbOrigin = exports.getCspString = exports.hostName = exports.environment = exports.processId = exports.csp = void 0;
const crypto = require("crypto");
const os = require("os");
const util = require("util");
const randomBytes = util.promisify(crypto.randomBytes);
const ts_httpexceptions_1 = require("ts-httpexceptions");
const base_1 = require("../controllers/base");
const config_1 = require("../helpers/config");
exports.csp = {
    'form-action': `'self'`,
    'media-src': `'none'`,
    'frame-ancestors': `'self'`,
    'img-src': `'self' https://assets.babylonjs.com/ blob: data: https://cdn.ubexs.com/ https://storage.googleapis.com/ https://www.google-analytics.com/`,
    'connect-src': `'self' ws://localhost:8080/ https://www.ubexs.com https://sentry.io/ https://ka-f.fontawesome.com/releases/v5.13.1/css/free.min.css https://assets.babylonjs.com/ ${config_1.default.baseUrl.backend} ${config_1.default.baseUrl.cdn}`,
    'object-src': `'none'`,
    'base-uri': `'self'`,
};
let cspString = '';
Object.keys(exports.csp).forEach((cspKey) => {
    cspString = cspString + cspKey + ' ' + exports.csp[cspKey] + '; ';
});
exports.processId = process.pid;
exports.environment = process.env.NODE_ENV;
exports.hostName = os.hostname();
exports.getCspString = () => {
    return cspString;
};
exports.lbOrigin = crypto.randomBytes(8).toString('base64');
exports.version = crypto.randomBytes(8).toString('hex');
exports.generateCspWithNonce = async (req, res, next, randomBytesFunction = randomBytes) => {
    res.set({
        'x-lb-origin': exports.lbOrigin,
    });
    res.locals['x-lb-origin'] = exports.lbOrigin;
    if (process.env.NODE_ENV === 'development' && !req.headers['cf-connecting-ip']) {
        req.headers['cf-connecting-ip'] = '127.0.0.1';
    }
    if (req.url === '/docs' || req.url === '/docs/') {
        return next();
    }
    res.set({
        'X-Frame-Options': 'DENY',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'X-Content-Type-Options': 'nosniff',
        'X-XSS-Protection': '0',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'X-Environment': exports.environment,
        'X-Permitted-Cross-Domain-Policies': 'none',
    });
    if (req.url.slice(0, '/api/'.length) === '/api/') {
        return next();
    }
    const nonceBuffer = await randomBytesFunction(48);
    let nonce = nonceBuffer.toString('base64');
    let headerString;
    if (req.originalUrl.match(/\/(\d+)\/sandbox/g)) {
        headerString = 'script-src \'nonce-' + nonce + '\' ' + "'unsafe-eval'; " + exports.getCspString();
    }
    else {
        headerString = 'script-src \'nonce-' + nonce + '\'; ' + exports.getCspString();
    }
    if (req.url.slice(0, '/v1/authenticate-to-service'.length) === '/v1/authenticate-to-service') {
        headerString = headerString.replace(/form-action 'self'; /g, '');
    }
    res.set({
        'Content-Security-Policy': headerString,
    });
    res.locals.version = await randomBytesFunction(8);
    res.locals.nonce = nonce;
    res.locals.javascript = exports.getJavascript(nonce, exports.version);
    next();
};
exports.getIp = (req) => {
    const cloudflareIP = req.get('cf-connecting-ip');
    if (cloudflareIP) {
        return cloudflareIP;
    }
    else {
        if (!req.connection.remoteAddress) {
            return '127.0.0.1';
        }
        return req.connection.remoteAddress;
    }
};
exports.getJavascript = (nonce, version) => {
    return `
        <script nonce="${nonce}" src="/js/warning.js"></script>
        <script nonce="${nonce}" src="/js/bundle/sentry.bundle.js?v=${version}"></script>
        ${config_1.default && config_1.default.sentry && config_1.default.sentry.frontend ? `
        <script nonce="${nonce}">
            Sentry.init({ dsn: '${config_1.default.sentry.frontend}' });
        </script>
        ` : ''}
        <script nonce="${nonce}" src="/js/bundle/main.bundle.js?v=${version}"></script>
        <script nonce="${nonce}" src="/js/bundle/bootstrap.bundle.js?v=${version}"></script>`;
};
exports.default = async (req, res, next) => {
    let doSkip = false;
    await exports.generateCspWithNonce(req, res, () => {
    });
    if (req.query.sort) {
        if (req.query.sort !== 'asc' && req.query.sort !== 'desc') {
            return next(new ts_httpexceptions_1.BadRequest('InvalidSort'));
        }
    }
    if (req.url.slice(0, 4) === '/js/' || req.url.slice(0, 5) === '/css/') {
        return next();
    }
    res.locals.ip = exports.getIp(req);
    const baseService = new base_1.default({
        cookie: req.headers['cookie'],
    });
    try {
        const newUserInfo = await baseService.Users.getAuthenticatedUserInfo();
        console.log('[info] user is logged in. info', newUserInfo);
        res.locals.userInfo = newUserInfo;
    }
    catch (err) {
        if (err.isAxiosError && err.response && err.response.status === 401) {
            console.log('[info] user is not logged in');
        }
        else {
            return next(err);
        }
    }
    next();
};
