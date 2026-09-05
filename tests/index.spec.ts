import { TextDecoder } from 'util';
import { LineReader } from '../src/index';
import standardFile from './input/standard';
import emptyFile from './input/empty';
import smallFile from './input/small';

Object.assign(globalThis, { TextDecoder });

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

	test('supports common line separators without trailing carriage returns', async (): Promise<void> => {
		const subject: LineReader = new LineReader(new File(['one\r\ntwo\rthree\n'], 'separators.txt'));
		const lines: string[] = [];

		const count = await subject.readLines((line: string): void => {
			lines.push(line);
		});

		expect(count).toBe(3);
		expect(lines).toEqual(['one', 'two', 'three']);
	});

	test('handles a CRLF separator split across chunks', async (): Promise<void> => {
		const firstLine = 'a'.repeat(131071);
		const subject: LineReader = new LineReader(new File([`${firstLine}\r\nsecond`], 'chunk-boundary.txt'));
		const lines: string[] = [];

		const count = await subject.readLines((line: string): void => {
			lines.push(line);
		});

		expect(count).toBe(2);
		expect(lines).toEqual([firstLine, 'second']);
	});

	test('preserves multibyte characters split across chunks', async (): Promise<void> => {
		const expected = `${'a'.repeat(131071)}😀`;
		const subject: LineReader = new LineReader(new File([expected], 'unicode.txt'));
		const lines: string[] = [];

		await subject.readLines((line: string): void => {
			lines.push(line);
		});

		expect(lines).toEqual([expected]);
	});

	test('stops callbacks at the requested number of lines', async (): Promise<void> => {
		const subject: LineReader = new LineReader(new File(['one\ntwo\nthree'], 'lines.txt'));
		const lines: string[] = [];

		const count = await subject.readNLines(1, (line: string): void => {
			lines.push(line);
		});

		expect(count).toBe(1);
		expect(lines).toEqual(['one']);
	});

	test('can be reused after a completed read', async (): Promise<void> => {
		const subject: LineReader = new LineReader(new File(['one\ntwo'], 'reusable.txt'));

		await expect(subject.readLines()).resolves.toBe(2);
		await expect(subject.readLines()).resolves.toBe(2);
	});

	test('rejects concurrent reads', async (): Promise<void> => {
		const subject: LineReader = new LineReader(new File(['one\ntwo'], 'concurrent.txt'));
		const firstRead = subject.readLines();

		await expect(subject.readLines()).rejects.toThrow('A read is already in progress');
		await expect(firstRead).resolves.toBe(2);
	});

	test('rejects when the callback throws', async (): Promise<void> => {
		const subject: LineReader = new LineReader(new File(['one'], 'callback-error.txt'));

		await expect(
			subject.readLines((): void => {
				throw new Error('callback failed');
			})
		).rejects.toThrow('callback failed');
		await expect(subject.readLines()).resolves.toBe(1);
	});

	test('rejects an invalid encoding', async (): Promise<void> => {
		expect(() => {
			new LineReader(new File(['one'], 'invalid-encoding.txt'), {
				encoding: 'not-an-encoding',
			});
		}).toThrow();
	});
});
