/**
 * @file index.ts
 * @description Utility to read lines from files, without having to load the entire file into memory
 */

import { LineReaderCallback, Options } from './interfaces.js';

export class LineReader {
	private static readonly chunkSize: number = 128 * 1024; // Chunk size to use for reading

	private readonly fileReader: FileReader; // Single file reader instance
	private readonly file: File; // The file to read
	private readonly events: Map<string, (prop: string[] | string) => void>; // Array of events to call
	private decoder: TextDecoder;
	private readPosition: number; // Position of read head
	private chunk: string; // Current chunk text contents
	private lines: string[]; // Array of current lines read
	private reading: boolean;

	public constructor(file: File, options: Options = { encoding: 'utf-8' }) {
		this.fileReader = new FileReader();
		this.readPosition = 0;
		this.file = file;
		this.events = new Map<string, (prop: string[] | string) => void>();
		this.decoder = new TextDecoder(options.encoding ?? 'utf-8');
		this.chunk = '';
		this.lines = [];
		this.reading = false;

		// Attach events to the file reader
		this.fileReader.onerror = (): void =>
			this.emit('error', this.fileReader.error?.message ?? 'Unknown FileReader error');
		this.fileReader.onload = (): void => {
			try {
				this.onLoad();
			} catch (error) {
				this.emit('error', error instanceof Error ? error.message : String(error));
			}
		};
	}

	/**
	 * Read all lines of the file and return when complete
	 * @param {LineReaderCallback} [callback] Function to execute on every line read
	 * @returns {Promise<number>}
	 */
	public readLines(callback?: LineReaderCallback): Promise<number> {
		return this.readNLines(-1, callback);
	}

	/**
	 * Read the first n lines of the file and return when complete.
	 * If n is larger than the number of lines in the file then all lines will
	 * be read.
	 * If n is less than 0, then all lines will be read.
	 *
	 * @param {number} nLines The number of lines to be read
	 * @param {LineReaderCallback} [callback] Function to execute on every line read
	 * @returns {Promise<number>}
	 */
	public readNLines(nLines: number, callback?: LineReaderCallback): Promise<number> {
		if (this.reading) return Promise.reject(new Error('A read is already in progress'));
		if (nLines === 0) return Promise.resolve(0);
		let count = 0;

		return new Promise((resolve, reject): void => {
			this.reading = true;
			this.readPosition = 0;
			this.chunk = '';
			this.lines = [];
			this.on('lines', (lines: string[] | string): void => {
				if (typeof lines === 'string') return;
				for (const line of lines) {
					if (nLines >= 0 && count >= nLines) {
						this.emit('end');
						return;
					}
					callback?.(line);
					count++;
					if (count === nLines) {
						this.emit('end');
						return;
					}
				}
				this.step();
			});
			this.on('end', (): void => {
				this.reading = false;
				this.events.clear();
				resolve(count);
			});
			this.on('error', (error: string[] | string): void => {
				this.reading = false;
				this.events.clear();
				reject(new Error(String(error)));
			});

			try {
				this.read();
			} catch (error) {
				this.emit('error', String(error));
			}
		});
	}

	/**
	 * Operations to perform on a successful file reader load event
	 */
	private onLoad(): void {
		// Store the processed text by appending it to any existing processed text
		const hasMoreData = this.hasMoreData();
		this.chunk += this.decoder.decode(new Uint8Array(this.fileReader.result as ArrayBuffer), {
			stream: hasMoreData,
		});

		// If the processed text contains a newline character
		if (/\r\n|\r|\n/.test(this.chunk)) {
			const endsWithCarriageReturn = hasMoreData && this.chunk.endsWith('\r');
			const data = endsWithCarriageReturn ? this.chunk.slice(0, -1) : this.chunk;
			const endsWithSeparator = /(?:\r\n|\r|\n)$/.test(this.chunk);

			this.lines = data.split(/\r\n|\r|\n/);
			if (hasMoreData) {
				this.chunk = `${this.lines.pop() ?? ''}${endsWithCarriageReturn ? '\r' : ''}`;
			} else {
				this.chunk = '';
				if (endsWithSeparator) this.lines.pop();
			}

			this.step();
			return;
		}

		// If the text did not contain a newline character,
		// start another round of the read process if there is still data to read
		if (this.hasMoreData()) return this.read();

		// If there is no data left to read, but there is still data stored in 'chunk',
		// emit it as a line
		if (this.chunk.length) return this.emit('lines', [this.chunk]);

		// If there is no data stored in 'chunk', emit the end event
		this.emit('end');
	}

	/**
	 * Read a single chunk
	 */
	private read(): void {
		if (!this.reading) return;

		// Extract section of file for reading
		const blob: Blob = this.file.slice(this.readPosition, this.readPosition + LineReader.chunkSize);
		// Update current read position
		this.readPosition += blob.size;
		// Read the blob as text
		this.fileReader.readAsArrayBuffer(blob);
	}

	/**
	 * Step through the current lines and emit them if found.
	 *
	 * If no new lines are found then:
	 * - if we still have file data, continue reading
	 * - if we do not, emit the end event
	 */
	private step(): void {
		if (this.lines.length === 0 && this.hasMoreData()) {
			this.read();
		} else if (this.lines.length === 0 && !this.hasMoreData()) {
			this.emit('end');
		} else {
			this.emit('lines', this.lines.splice(0));
		}
	}

	/**
	 * Check if the read position is less than total file size, thus we have more data
	 * @returns {boolean}
	 */
	private hasMoreData(): boolean {
		return this.readPosition < this.file.size;
	}

	/**
	 * Subscribe to event
	 * @param {string} eventName
	 * @param {Function} callback
	 */
	private on(eventName: string, callback: (prop: string[] | string) => void): void {
		this.events.set(eventName, callback);
	}

	/**
	 * Emit event
	 * @param {string} eventName The name of the event to emit
	 * @param {string} [prop] String property to pass through with the called event
	 */
	private emit(eventName: string, prop: string[] | string = ''): void {
		const callback = this.events.get(eventName);
		if (callback) callback.call(this, prop);
	}
}
