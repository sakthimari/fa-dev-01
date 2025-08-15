"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendInvitation = void 0;
const backend_1 = require("@aws-amplify/backend");
exports.sendInvitation = (0, backend_1.defineFunction)({
    name: 'send-invitation',
    entry: './index.ts',
    runtime: 20,
    environment: {
        SES_FROM_EMAIL: 'sakthimari@gmail.com',
        APP_URL: 'http://localhost:5173'
    }
});
