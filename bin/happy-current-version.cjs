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
	const currentVersion = await ConventionalCommitVersion.getCurrentVersion();
	console.log(currentVersion);
}
