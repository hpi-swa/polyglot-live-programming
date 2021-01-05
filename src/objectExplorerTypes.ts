/*
 * Copyright (c) 2021, Software Architecture Group, Hasso Plattner Institute.
 *
 * Licensed under the MIT License.
 */

export interface ObjectInformation {
    readonly displayString: string;
    readonly error?: string;
    readonly expression?: string;
    readonly interopProperties: string[];
    readonly metaQualifiedName?: string;
    readonly metaSimpleName?: string;
    readonly memberNames?: string[];
    readonly memberDisplayStrings?: string[];
    readonly elements?: string[];
}
