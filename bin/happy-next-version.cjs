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
 * Returns arguments.
 *
 * @returns {object} Arguments.
 */
function getArguments() {
	const args = {
		allowNonConventionalCommits: false
	};

	for (const arg of process.argv) {
		if (arg.startsWith('--allowNonConventionalCommits')) {
			args.allowNonConventionalCommits = true;
		}
	}

	return args;
}

/**
 * Main method.
 */
async function main() {
	const args = getArguments();
	const nextVersion = await ConventionalCommitVersion.getNextVersion({
		allowNonConventionalCommits: args.allowNonConventionalCommits
	});
	console.log(nextVersion);
}
