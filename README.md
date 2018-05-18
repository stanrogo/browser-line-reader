# browser-line-reader
An asynchronous line by line file reader for the browser.

This is a project I have been working on since I have found
the lack of asynchronous, promise aware, typescript based file reader
solutions lacking when it comes to the browser.

This module is designed to read a File object, using the standard
FileReader, one line at a time. In order to achieve this, the file is
actually subject to multiple reads, in "chunks", which can contain
any number of lines.

What this means is that there is no need for the entire file to be stored
in browser memory, and lines can be processed and then discarded. I find
that this is especially useful when reading in large files spanning many
hundreds of megabytes.

## Installation
```
npm install browser-line-reader --save
```

## Usage

Currently, there is only one function accessible, ```readLines```,
which will read all the lines of a file, one by one. The usage
can be described by the below code example:

```typescript
import LineReader from 'browser-line-reader';
const myFile: File = new File(['My name is...'], 'SlimShady');
const lineReader: LineReader = new LineReader(myFile);
lineReader.readLines((line: string) => {
	// Efficiently store this line in a good data structure
	console.log(line);
}).then((numLinesRead: number) => {
	console.log(`Finished and read ${numLinesRead} lines`);
}).catch((err) => {
	console.log(err);
});
```

- The line reader accepts one argument of type ```File```,
which is the File object to read.
- The ```readLines``` function accepts a callback with
one parameter of type ```string```, which is the line just read.
- The ```readLines``` function returns a promise with return type
```Promise<number|string>```, where on success, the total number of
lines read is returned, and on failure, an error message.

## TODO

There are a number of items I would still like to implement.
This list is growing and feel free to send me suggestions if you
find this tool useful.

- Support for different file encodings
- Support for different kinds of line separators
- Support for separate read header action
- Support for reading a certain number of lines
- Efficiency optimisations
- Benchmarking against standard FileReader API