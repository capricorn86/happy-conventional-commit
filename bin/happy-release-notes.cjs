#!/usr/bin/env node
"use strict";

const ConventionalCommitReleaseNotes =
	require("../lib/conventional-commit/ConventionalCommitReleaseNotes").default;

process.on("unhandledRejection", (reason) => {
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
		fromVersion: null,
		toVersion: null,
		versionHeader: false,
		user: null,
	};

	for (const arg of process.argv) {
		if (arg.startsWith("--fromVersion=")) {
			args.fromVersion = arg.split("=")[1];
		} else if (arg.startsWith("--toVersion=")) {
			args.toVersion = arg.split("=")[1];
		} else if (arg.startsWith("--versionHeader")) {
			args.versionHeader = true;
		} else if (arg.startsWith("--user")) {
			args.user = arg.split("=")[1];
		}
	}

	return args;
}

/**
 * Main method.
 */
async function main() {
	const args = getArguments();

	const releaseNotes = await ConventionalCommitReleaseNotes.getReleaseNotes({
		fromVersion: args.fromVersion ? args.fromVersion : null,
		toVersion: args.toVersion ? args.toVersion : null,
		versionHeader: args.versionHeader,
		user: args.user,
	});

	console.log(releaseNotes);
}
