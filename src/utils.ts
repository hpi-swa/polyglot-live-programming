/*
 * Copyright (c) 2021, Software Architecture Group, Hasso Plattner Institute.
 *
 * Licensed under the MIT License.
 */

'use strict';

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

let extensionPath: string | undefined;

export function initializeUtils(context: vscode.ExtensionContext) {
    extensionPath = context.extensionPath;
}

export async function suggestToInstallLiveComponent() {
    const guPath = getGUPath();
    if (guPath) {
        const pick = await vscode.window.showInformationMessage('Would you like to install the Live component with the GraalVM Updater (gu)?', 'Yes', 'No');
        if (pick === 'Yes') {
            installLiveComponent(guPath);
        }
    } else {
        vscode.window.showErrorMessage('Could not find GraalVM home directory.');
    }
}

export async function runInTerminal(command: string) {
    let terminal: vscode.Terminal | undefined = vscode.window.activeTerminal;
    if (!terminal) {
        terminal = vscode.window.createTerminal();
	}
    terminal.show();
	terminal.sendText(command);
}

function installLiveComponent(guPath: string) {
    const installablePath = getInstallablePath();
    if (installablePath) {
        runInTerminal(`${guPath} install -f -L "${installablePath}"`).then(() => {
            vscode.window.showWarningMessage('Please restart GraalLS and VS Code.');
        });
    } else {
        vscode.window.showErrorMessage('Could not find Live installable.');
    }
}

function getInstallablePath(): string | undefined {
    if (extensionPath) {
        const installablePath = path.join(extensionPath, 'live-installable-java11.jar');
        if (fs.existsSync(installablePath)) {
            return installablePath;
        }
    }
    return undefined;
    
}

function getGUPath(): string | undefined {
    const graalVMHome = vscode.workspace.getConfiguration('graalvm').get('home') as string;
    if (graalVMHome) {
        let executablePath = path.join(graalVMHome, 'bin', 'gu');
        if (process.platform === 'win32') {
            if (fs.existsSync(executablePath + '.cmd')) {
                return executablePath + '.cmd';
            }
            if (fs.existsSync(executablePath + '.exe')) {
                return executablePath + '.exe';
            }
        } else if (fs.existsSync(executablePath)) {
            return executablePath;
        }
    }
    return undefined;
}
