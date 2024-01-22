#!/usr/bin/env node
'use strict';

/* eslint-disable no-console */
/* eslint-disable no-unused-vars */

const Fs = require('fs');
const Util = require('util');
const Path = require('path');
const exec = Util.promisify(require('child_process').exec);

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
		commitType: null,
		commitFile: null
	};

	for (const arg of process.argv) {
		if (arg.startsWith('--commitType=')) {
			args.commitType = arg.split('=')[1];
		} else if (arg.startsWith('--commitFile=')) {
			args.commitFile = arg.split('=')[1];
		}
	}

	return args;
}

/**
 * Main.
 *
 * @returns {Promise<void>} Promise.
 */
async function main() {
	const args = getArguments();

	if (args.commitType === null || !args.commitFile) {
		throw new Error('Invalid arguments. Expected "--commitType={type}" and "--commitFile={path}".');
	}

	if (args.commitType === '') {
		const taskId = await getTaskId();

		if (taskId) {
			const filepath = Path.resolve(args.commitFile);
			const buffer = await Fs.promises.readFile(filepath);
			const content = `fix: [${taskId}] \n${buffer.toString()}`;
			await Fs.promises.writeFile(filepath, content);
		}
	}
}

/**
 * Returns task id.
 *
 * @returns {Promise<string>} Task ID.
 */
async function getTaskId() {
	const branchName = await getBranchName();
	const match = branchName
		.split('/')
		.reverse()[0]
		.match(/^([A-Z]+-\d+)-|^(\d+)-/);
	return match ? match[1] || match[2] : null;
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
