#!/bin/env node
'use strict';

const ConventionalCommitValidator = require('../lib/ConventionalCommitValidator').default;
const ChildProcess = require('child_process');

const SHELL_CODES = {
	reset: '\x1b[0m',
	bold: '\x1b[1m',
	blue: '\x1b[34m',
	red: '\x1b[31m',
	green: '\x1b[32m'
};

/* eslint-disable no-console*/

process.on('unhandledRejection', (error) => {
	console.error(error);
	process.exit(1);
});

async function main() {
	const mainBranch = await getMainBranch();
	const commitMessages = await getCommitMessages(mainBranch);
	let hasErrors = false;

	for (const commitMessage of commitMessages) {
		if (commitMessage) {
			const errorList = ConventionalCommitValidator.validate(commitMessage);

			if (!errorList.length) {
				console.log(SHELL_CODES.green, '✓ ', commitMessage, SHELL_CODES.reset);
			} else {
				console.error(SHELL_CODES.red, '✖ ', commitMessage, SHELL_CODES.reset);
				for (const error of errorList) {
					console.error(SHELL_CODES.red, '    - ', error, SHELL_CODES.reset);
				}
				hasErrors = true;
			}
		}
	}

	if (hasErrors) {
		console.error(SHELL_CODES.red, 'Commit validation failed.', SHELL_CODES.reset);
		process.exit(1);
	}
}

function getCommitMessages(mainBranch) {
	return new Promise((resolve, reject) => {
		ChildProcess.exec(
			`git --no-pager log HEAD..origin/${mainBranch} --pretty=format:"%s"`,
			(error, stdout) => {
				if (error) {
					reject(error);
				} else {
					resolve(stdout.trim().split(/[\n\r]/));
				}
			}
		);
	});
}

function getMainBranch() {
	return new Promise((resolve, reject) => {
		ChildProcess.exec(`git branch -l master main`, (error, stdout) => {
			if (error) {
				reject(error);
			} else {
				resolve(stdout.trim());
			}
		});
	});
}

main();
