import * as vscode from 'vscode';
import { activate as activateImpl, deactivate as deactivateImpl } from './activation/activate';

export async function activate(context: vscode.ExtensionContext): Promise<void> {
    return activateImpl(context);
}

export async function deactivate(): Promise<void> {
    return deactivateImpl();
}
