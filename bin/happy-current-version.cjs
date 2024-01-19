#!/usr/bin/env node
'use strict';

const ConventionalCommitVersion =
	require('../lib/conventional-commit/ConventionalCommitVersion').default;

process.on('unhandledRejection', reason => {
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
