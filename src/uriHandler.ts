/*
 * Copyright (c) 2021, Software Architecture Group, Hasso Plattner Institute.
 *
 * Licensed under the MIT License.
 */

'use strict';

import { URLSearchParams } from 'url';
import * as vscode from 'vscode';

const URI_HANDLERS: { [key: string]: (query: URLSearchParams) => void; } = {};

export class UriHandler implements vscode.UriHandler {
    handleUri(uri: vscode.Uri): vscode.ProviderResult<void> {
        const query = new URLSearchParams(uri.query);
        const handler = URI_HANDLERS[uri.path];
        if (handler) {
            handler(query);
        }
    }

    onPath(path: string, handler: (query: URLSearchParams) => void) {
        URI_HANDLERS[path] = handler;
    }
}
