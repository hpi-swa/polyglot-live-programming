/*
 * Copyright (c) 2021, Software Architecture Group, Hasso Plattner Institute.
 *
 * Licensed under the MIT License.
 */

export interface GraalVMExtension {
    onClientNotification(method: string, handler: { /* GenericNotificationHandler */ (...params: any[]): void }): Promise<boolean>;
}
