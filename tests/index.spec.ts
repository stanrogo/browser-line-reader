import { default as LineReader } from '../src/index';
import standardFile from './input/standard';
import emptyFile from './input/empty';
import smallFile from './input/small';

describe('browser line reader tests', (): void => {
	test('reads the correct number of lines', (): Promise<void> => {
		const subject: LineReader = new LineReader(standardFile);
		return subject.readLines().then((numLines: number): void => {
			expect(numLines).toBe(21251);
		});
	});

	describe('reading a specific number of lines', (): void => {
		test('reads the first n lines', (): Promise<void> => {
			const subject: LineReader = new LineReader(standardFile);
			return subject.readNLines(10).then((numLines: number): void => {
				expect(numLines).toBe(10);
			});
		});

		test('reads at most the first n lines', (): Promise<void> => {
			const subject: LineReader = new LineReader(standardFile);
			return subject.readNLines(30000).then((numLines: number): void => {
				expect(numLines).toBe(21251);
			});
		});

		test('reads at most the first n lines', (): Promise<void> => {
			const subject: LineReader = new LineReader(standardFile);
			return subject.readNLines(-1).then((numLines: number): void => {
				expect(numLines).toBe(21251);
			});
		});
	});

	test('accepts an empty file', (): Promise<void> => {
		const subject: LineReader = new LineReader(emptyFile);
		return subject.readLines().then((numLines: number): void => {
			expect(numLines).toBe(0);
		});
	});

	test('reads lines correctly', (): Promise<void> => {
		const subject: LineReader = new LineReader(smallFile);
		const lines: string[] = ['7,6,1', '0 0 4 .', '1 0 3 .', '1 0 5 .', '1 0 4 .', '2 0 6 .', '2 0 4 .'];
		const readLines: string[] = [];
		return subject
			.readLines((line: string): void => {
				readLines.push(line);
			})
			.then((): void => {
				readLines.forEach((readLine, index): void => {
					expect(readLine).toEqual(lines[index]);
				});
			});
	});
});
