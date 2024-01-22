#!/usr/bin/env node
'use strict';

/* eslint-disable no-console */
/* eslint-disable no-unused-vars */

const FS = require('fs');
const Path = require('path');
const ConventionalCommitValidator = require('../lib/ConventionalCommitValidator').default;

const SHELL_CODES = {
	reset: '\x1b[0m',
	bold: '\x1b[1m',
	blue: '\x1b[34m',
	red: '\x1b[31m',
	green: '\x1b[32m'
};
const EXAMPLE_COMMIT_MESSAGE = 'chore: [#123] My description';

process.on('unhandledRejection', (reason) => {
	console.error('');
	console.error(SHELL_CODES.red, reason, SHELL_CODES.reset);
	console.error('');
	process.exit(1);
});

main();

/**
 * Returns arguments.
 *
 * @returns {object} Arguments.
 */
function getArguments() {
	const args = {
		commitFile: null
	};

	for (const arg of process.argv) {
		if (arg.startsWith('--commitFile=')) {
			args.commitFile = arg.split('=')[1];
		}
	}

	return args;
}

async function main() {
	const args = getArguments();

	if (!args.commitFile) {
		throw new Error('Invalid arguments. Expected "--commitFile={path}".');
	}

	const commitBuffer = await FS.promises.readFile(Path.resolve(args.commitFile));
	const commitMessage = commitBuffer.toString();
	const errorList = ConventionalCommitValidator.validate(commitMessage);

	if (errorList.length !== 0) {
		console.error(SHELL_CODES.red, '\nCommit message validation failed\n', SHELL_CODES.reset);

		for (const error of errorList) {
			console.error(SHELL_CODES.red, '✖', error, SHELL_CODES.reset);
		}

		console.log(SHELL_CODES.blue, `\n\nExample:\n${EXAMPLE_COMMIT_MESSAGE}\n\n`, SHELL_CODES.reset);

		process.exit(1);
	}
}
