/* eslint-disable @typescript-eslint/ban-types */

/**
 * @file index.ts
 * @description Utility to read lines from files, without having to load the entire file into memory
 * TODO: specify concrete accepted function types
 */

import { LineReaderCallback, Options } from './interfaces';

class LineReader {
	private static readonly chunkSize: number = 128 * 1024; // Chunk size to use for reading

	private readonly fileReader: FileReader; // Single file reader instance
	private readonly file: File; // The file to read
	private readonly events: Map<string, Function>; // Array of events to call
	private readPosition: number; // Position of read head
	private chunk: string; // Current chunk text contents
	private lines: string[]; // Array of current lines read
	private options: Options; // Options

	public constructor(file: File, options: Options = { encoding: 'UTF-8' }) {
		this.fileReader = new FileReader();
		this.readPosition = 0;
		this.chunk = '';
		this.lines = [];
		this.file = file;
		this.events = new Map<string, Function>();
		this.options = options;

		// Attach events to the file reader
		this.fileReader.onerror = (): void => this.emit('error', this.fileReader.error.message);
		this.fileReader.onload = (): void => this.onLoad();
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
		let count = 0;

		return new Promise((resolve, reject): void => {
			this.on('lines', (lines: string[]): void => {
				const size = lines.length;
				let index = -1;
				while (++index < size && (count < nLines || nLines < 0)) {
					count++;
					if (typeof callback === 'function') {
						callback(lines[index]);
					}
				}
				if (count === nLines) {
					this.emit('end');
				}

				this.step();
			});
			this.on('end', (): void => resolve(count));
			this.on('error', reject);
			this.read();
		});
	}

	/**
	 * Operations to perform on a successful file reader load event
	 */
	private onLoad(): void {
		// Store the processed text by appending it to any existing processed text
		this.chunk += this.fileReader.result;

		// If the processed text contains a newline character
		if (/\n/.test(this.chunk)) {
			// Split the text into an array of lines
			this.lines = this.chunk.split('\n');

			// If there is still more data to read, save the last line, as it may be incomplete
			if (this.hasMoreData()) this.chunk = this.lines.pop();

			// Start stepping through each line
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
		// Extract section of file for reading
		const blob: Blob = this.file.slice(this.readPosition, this.readPosition + LineReader.chunkSize);
		// Update current read position
		this.readPosition += LineReader.chunkSize;
		// Read the blob as text
		this.fileReader.readAsText(blob, this.options.encoding);
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
		return this.readPosition <= this.file.size;
	}

	/**
	 * Subscribe to event
	 * @param {string} eventName
	 * @param {Function} callback
	 */
	private on(eventName: string, callback: Function): void {
		this.events.set(eventName, callback);
	}

	/**
	 * Emit event
	 * @param {string} eventName The name of the event to emit
	 * @param {string} [prop] String property to pass through with the called event
	 */
	private emit(eventName: string, prop: string[] | string = ''): void {
		this.events.get(eventName).call(this, prop);
	}
}

export default LineReader;
