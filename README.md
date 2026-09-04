# browser-line-reader
An asynchronous line by line file reader for the browser.

This project addresses the lack of asynchronous, promise aware, typescript based file reader solutions specifically
crafted for the browser.

This module reads a `File` object, using the standard `FileReader`, one line at a time.
In order to achieve this, the file is subject to multiple reads, in 'chunks', which can contain any number of lines.

The advantage of this method is that there is no need for the entire file to be stored in browser memory,
and lines can be processed and then discarded.
This is especially useful when reading in large files spanning many hundreds of megabytes.

## Installation
```
npm install browser-line-reader --save
```

## Usage
The following types are used in the type signatures below:

```typescript
interface Options {
	encoding?: string;
}

type LineReaderCallback = (line: string) => void;
```

To get started, import the named `LineReader` export.

```typescript
import { LineReader } from 'browser-line-reader';
```

CommonJS consumers can use the same named export:

```javascript
const { LineReader } = require('browser-line-reader');
```

### constructor
Type: `(file: File) => LineReader`

The `LineReader` class constructor accepting the File object to read.


```typescript
const myFile: File = new File(['My name is...'], 'SlimShady');
const lineReader: LineReader = new LineReader(myFile);
```

### readLines
Type: `(callback?: LineReaderCallback) => Promise<number>`

Read all the lines of a file, one by one.
Accepts a callback with one parameter of type `string`, which is the line just read.
Returns a promise containing the total number of lines read.
Throws an error passed through from the internal `FileReader.prototype.onerror` event.

```typescript
lineReader.readLines((line: string) => {
	console.log(line);
}).then((numLinesRead: number) => {
	console.log(`Finished and read ${numLinesRead} lines`);
}).catch((err) => {
	console.log(err);
});
```

### readNLines
Type: `(nLines: number, callback?: LineReaderCallback) => Promise<number>`

Read the first `n` lines of a file of `k` lines, or all lines if `n > k` or `n < 0`.
Return and exceptions are identical to `Linereader.prototype.readLines`.

```typescript
lineReader.readNLines(10, (line: string) => {
	console.log(line);
});
```

## Missing Features

- Support for different kinds of line separators
- Support for separate read header action
- Efficiency optimisationss
- Benchmarking against standard FileReader API
- Add contributing guidelines

Please suggest or implement these or any other features you feel are missing.

## Publishing a release

The publish workflow publishes to npm and creates a GitHub release whenever a version tag is pushed. It uses npm trusted publishing, so no long-lived npm token is stored in GitHub.

Before the first release, open the package's **Settings** page on npmjs.com, select **Trusted Publisher**, choose **GitHub Actions**, and enter:

- Organization or user: `stanrogo`
- Repository: `browser-line-reader`
- Workflow filename: `publish.yml`
- Environment: leave blank

Allow `npm stage publish` for this trusted publisher, but do not allow direct `npm publish`. The workflow's `id-token: write` permission lets npm authenticate it with a short-lived GitHub OIDC credential.

1. Update the version, commit the generated package metadata, and create a matching tag:

```sh
npm version patch
```

Use `minor` or `major` instead of `patch` when appropriate.

2. Push the commit and tag:

```sh
git push origin HEAD --follow-tags
```

The `v*` tag starts `.github/workflows/publish.yml`. It installs the dependencies, runs lint and tests, builds, and stages the package on npm, then creates a GitHub release for the tag with automatically generated release notes. The workflow uses short-lived OIDC authentication for npm and the repository's built-in `GITHUB_TOKEN` for the release.

After the workflow succeeds, review the staged package on npmjs.com or with `npm stage view <stage-id>`. Approve it with 2FA to make it live:

```sh
npm stage approve <stage-id>
```
