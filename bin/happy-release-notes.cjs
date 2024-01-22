#!/usr/bin/env node
'use strict';

/* eslint-disable no-console */

const ConventionalCommitReleaseNotes = require('../lib/ConventionalCommitReleaseNotes').default;

process.on('unhandledRejection', (reason) => {
	console.error(reason);
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
		from: null,
		to: null,
		versionHeader: false,
		author: null
	};

	for (const arg of process.argv) {
		if (arg.startsWith('--from=')) {
			args.from = arg.split('=')[1];
		} else if (arg.startsWith('--to=')) {
			args.to = arg.split('=')[1];
		} else if (arg.startsWith('--author=')) {
			args.author = arg.split('=')[1];
		} else if (arg.startsWith('--versionHeader')) {
			args.versionHeader = true;
		}
	}

	return args;
}

/**
 * Main method.
 */
async function main() {
	const args = getArguments();

	if (args.author && args.author !== 'githubUsername' && args.author !== 'nameAndEmail') {
		throw new Error(
			'Invalid "author" argument. Valid values are "githubUsername" or "nameAndEmail".'
		);
	}

	const releaseNotes = await ConventionalCommitReleaseNotes.getReleaseNotes({
		fromVersion: args.from ? args.from : null,
		toVersion: args.to ? args.to : null,
		versionHeader: args.versionHeader,
		author: args.author
	});

	console.log(releaseNotes);
}
