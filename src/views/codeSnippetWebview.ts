'use strict';

import { window, WebviewPanel, ViewColumn, Uri, commands } from 'vscode';
import { BaseWebview } from './baseWebview';
import * as Constants from '../constants';
import * as path from 'path';

const hljs = require('highlight.js');
const codeHighlightLinenums = require('code-highlight-linenums');

export class CodeSnippetWebview extends BaseWebview {

    private readonly codeSnippetPreviewActiveContextKey = 'codeSnippetPreviewFocus';

    protected get viewType(): string {
        return 'rest-code-snippet';
    }

    public constructor() {
        super();
    }

    public render(convertResult: string, title: string, lang: string) {
        let panel: WebviewPanel;
        if (this.panels.length === 0) {
            panel = window.createWebviewPanel(
                this.viewType,
                title,
                ViewColumn.Two,
                {
                    enableFindWidget: true,
                    retainContextWhenHidden: true,
                    localResourceRoots: [
                        Uri.file(path.join(this.extensionPath, 'styles'))
                    ]
                });

                panel.onDidDispose(() => {
                    this.panels.pop();
                    this._onDidCloseAllWebviewPanels.fire();
                });

                panel.onDidChangeViewState(({ webviewPanel }) => {
                    commands.executeCommand('setContext', this.codeSnippetPreviewActiveContextKey, webviewPanel.visible);
                });

                this.panels.push(panel);
        } else {
            panel = this.panels[0];
            panel.title = title;
        }

        panel.webview.html = this.getHtmlForWebview(convertResult, lang);

        commands.executeCommand('setContext', this.codeSnippetPreviewActiveContextKey, true);

        panel.reveal(ViewColumn.Two);
    }

    public dispose() {
        this.panels.forEach(p => p.dispose());
    }

    private getHtmlForWebview(convertResult: string, lang: string): string {
        const styleFilePath = Uri.file(path.join(this.extensionPath, Constants.CSSFolderName, Constants.CSSFileName)).with({ scheme: 'vscode-resource' });
        return `
            <head>
                <link rel="stylesheet" href="${styleFilePath}">
            </head>
            <body>
                <div>
                    <pre><code>${codeHighlightLinenums(convertResult, { hljs, lang: this.getHighlightJsLanguageAlias(lang), start: 1 })}</code></pre>
                    <a id="scroll-to-top" role="button" aria-label="scroll to top" onclick="scroll(0,0)"><span class="icon"></span></a>
                </div>
            </body>`;
    }

    private getHighlightJsLanguageAlias(lang: string) {
        if (!lang || lang === 'shell') {
            return 'bash';
        }

        if (lang === 'node') {
            return 'javascript';
        }

        return lang;
    }
}
