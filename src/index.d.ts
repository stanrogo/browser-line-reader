// Type definitions for browser-line-reader 0.02
// Project: browser-line-reader
// Definitions by: Stanley Clark <me@stanrogo.com>

import { Options } from './interfaces';

declare class LineReader {
	constructor(file: File, options: Options);

	private static readonly chunkSize: number;
	private readonly fileReader: FileReader;
	private readonly file: File;
	private readonly events: Map<string, Function>;
	private readPosition: number;
	private chunk: string;
	private lines: string[];

	public readLines(callback?: Function): Promise<number | string>;
	private onLoad(): void;
	private read(): void;
	private step(): void;
	private hasMoreData(): boolean;
	private on(eventName: string, callback: Function) : void;
	private emit(eventName: string, prop?: string) : void;
}

export default LineReader;
