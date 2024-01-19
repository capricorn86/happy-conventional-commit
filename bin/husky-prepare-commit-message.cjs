#!/usr/bin/env node
'use strict';

/* eslint-disable no-console */
/* eslint-disable no-unused-vars */

const Fs = require('fs');
const Util = require('util');
const Path = require('path');
const exec = Util.promisify(require('child_process').exec);

const COMMIT_TYPE_ARG_NAME = 'commit-type';
const COMMIT_EDIT_MSG_PATH_ARG_NAME = 'commit-edit-msg-path';

process.on('unhandledRejection', reason => {
	console.error(reason);
	process.exit(1);
});

main();

/**
 * Main.
 *
 * @returns {Promise<void>} Promise.
 */
async function main() {
	const commitType = getCommitArgument(COMMIT_TYPE_ARG_NAME);

	if (commitType === '') {
		const commitEditMessageFilepath = getCommitArgument(COMMIT_EDIT_MSG_PATH_ARG_NAME);

		if (!commitEditMessageFilepath) {
			return;
		}

		const taskId = await getTaskId();

		if (taskId) {
			const filepath = Path.resolve(commitEditMessageFilepath);
			const buffer = await Fs.promises.readFile(filepath);
			const content = `chore: [${taskId}] \n${buffer.toString()}`;
			await Fs.promises.writeFile(commitEditMessageFilepath, content);
		}
	}
}

/**
 * Returns commit argument.
 *
 * @param {string} name Name of the argument.
 * @returns {string} Argument Value.
 */
function getCommitArgument(name) {
	const startsWith = `--${name}=`;
	const argv = process.argv.find(text => text.startsWith(startsWith));
	const argument = argv.split(/=/)[1];

	return argument;
}

/**
 * Returns task id.
 *
 * @returns {Promise<string>} Task ID.
 */
async function getTaskId() {
	const branchName = await getBranchName();
	const match = branchName.match(/([A-Z]+-\d+)/);
	return match ? match[1] : null;
}

/**
 * Returns branch name.
 *
 * @returns {Promise<string>} Branch name.
 */
async function getBranchName() {
	const { stdout } = await exec('git symbolic-ref --short HEAD');
	return stdout.toString();
}
