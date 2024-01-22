#!/usr/bin/env node
'use strict';

/* eslint-disable no-console */

const ConventionalCommitVersion = require('../lib/ConventionalCommitVersion').default;

process.on('unhandledRejection', (reason) => {
	console.error(reason);
	process.exit(1);
});

main();

/**
 * Main method.
 */
async function main() {
	const nextVersion = await ConventionalCommitVersion.getNextVersion();
	if (nextVersion) {
		console.log(nextVersion);
	}
}
