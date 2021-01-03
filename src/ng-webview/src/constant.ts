declare global {
    interface Window {
        acquireVsCodeApi(): any;
    }
}

export const vscode = window.acquireVsCodeApi();

export interface MessagePoster {
	/**
	 * Post a message to the html extension
	 */
	postMessage(body: object): void;


	/**
	 * Post a command to be executed to the html extension
	 */
	postCommand(command: string, args: any[]): void;
}