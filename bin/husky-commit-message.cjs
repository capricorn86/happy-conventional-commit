#!/usr/bin/env node
'use strict';

/* eslint-disable no-console */
/* eslint-disable no-unused-vars */

const FS = require('fs');
const Path = require('path');
const ConventionalCommitValidator =
	require('../lib/conventional-commit/ConventionalCommitValidator').default;

const RESET_COLOR_CODE = '\x1b[0m';
const RED_COLOR_CODE = '\x1b[31m';
const EXAMPLE_COMMIT_MESSAGE = 'chore: [ABC-1234] My description';

process.on('uncaughtException', error => {
	console.error(error);
	process.exit(1);
});

main();

async function main() {
	const cliarg = process.argv.find(text => text.startsWith('--commit='));
	const filepath = cliarg
		.split(/=/)[1]
		.replace('%HUSKY_GIT_PARAMS%', '')
		.replace('$HUSKY_GIT_PARAMS', '');

	if (!filepath) {
		throw new Error('CLI arg "--commit=" was not provided');
	}

	const commitBuffer = await FS.promises.readFile(Path.resolve(filepath));
	const commitMessage = commitBuffer.toString();
	const errorList = ConventionalCommitValidator.validateCommitMessage(commitMessage);

	if (errorList.length !== 0) {
		console.error(RED_COLOR_CODE, '\nCommit message validation failed\n');

		for (const error of errorList) {
			console.error(RED_COLOR_CODE, '✖', error, RESET_COLOR_CODE);
		}

		console.log(`\n\nExample:\n${EXAMPLE_COMMIT_MESSAGE}\n\n`);

		process.exit(1);
	}
}
