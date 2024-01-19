import ChildProcess from 'child_process';
import StringUtility from '../utilities/StringUtility.js';
import { GlobalWindow } from 'happy-dom';

const CHANGE_TYPE_HEADER_MARKDOWN = {
	breaking: '### :bomb: Breaking Changes',
	feature: '### :art: Features',
	fix: '### :construction_worker_man: Patch fixes'
};

type IUser = { name: string; email: string; githubUsername: string | null };

type IRelease = {
	version: string;
	changes: {
		breaking: Array<{
			taskId: string | null;
			message: string;
			user: IUser;
		}>;
		feature: Array<{ taskId: string | null; message: string; user: IUser }>;
		fix: Array<{ taskId: string | null; message: string; user: IUser }>;
	};
};

type ICommit = {
	message: string;
	user: IUser;
};

/**
 * Conventional commit release notes.
 */
export default class ConventionalCommitReleaseNotes {
	/**
	 * Returns release notes.
	 *
	 * @param [options] Options.
	 * @param [options.fromVersion] From version.
	 * @param [options.toVersion] To version.
	 * @param [options.versionHeader] "true" to use version header.
	 * @param [options.user] "githubUsername" or "nameAndEmail".
	 * @returns Release notes.
	 */
	public static async getReleaseNotes(options?: {
		fromVersion?: string;
		toVersion?: string;
		versionHeader?: boolean;
		user?: 'githubUsername' | 'nameAndEmail';
	}): Promise<string> {
		const releases = await this.getReleases(options);
		let output = '';

		for (const release of releases) {
			output += options?.versionHeader || releases.length > 1 ? `#v${release.version}\n\n` : '';

			for (const changeType of Object.keys(release.changes)) {
				if (release.changes[changeType].length) {
					output += `${CHANGE_TYPE_HEADER_MARKDOWN[changeType]}\n`;

					for (const change of release.changes[changeType]) {
						const task = change.taskId ? ` (${change.taskId})` : '';
						const user =
							options?.user === 'githubUsername' && change.user.githubUsername
								? ` (@${change.user.githubUsername})`
								: options?.user === 'nameAndEmail'
								? ` (${change.user.name} <${change.user.email}>)`
								: '';

						output += ` - ${change.message}${task}${user}\n`;
					}

					output += '\n';
				}
			}

			output += '\n';
		}

		return output.trim();
	}

	/**
	 * Returns releases.
	 *
	 * @param [options] Options.
	 * @param [options.fromVersion] From version.
	 * @param [options.toVersion] To version.
	 * @param [options.versionHeader] "true" to use version header.
	 * @param [options.user] "githubUsername" or "nameAndEmail".
	 * @returns Releases.
	 */
	private static async getReleases(options?: {
		fromVersion?: string;
		toVersion?: string;
		versionHeader?: boolean;
		user?: 'githubUsername' | 'nameAndEmail';
	}): Promise<IRelease[]> {
		const commitGroups = await this.getCommitsGroupedByVersion(
			options?.fromVersion,
			options?.toVersion
		);
		const messageRegExp =
			/[ ]*(chore|fix|feat|BREAKING CHANGE): *\[([^\]]+)\] *([^(]+)|[ ]*(chore|fix|feat|BREAKING CHANGE): *([^(]+)/;
		const releases: IRelease[] = [];
		const githubUsernamePromises: Promise<void>[] = [];

		commitGroups.reverse();

		for (const commitGroup of commitGroups) {
			const release: IRelease = {
				version: commitGroup.version,
				changes: {
					breaking: [],
					feature: [],
					fix: []
				}
			};

			const allCommitMessages: { [k: string]: boolean } = {};

			for (const commit of commitGroup.commits) {
				const messageMatch = commit.message.match(messageRegExp);

				if (options?.user === 'githubUsername') {
					githubUsernamePromises.push(
						this.getGithubUsername(commit.user.email).then((githubUsername): void => {
							commit.user.githubUsername = githubUsername;
						})
					);
				}

				if (messageMatch) {
					const change: {
						taskId: string | null;
						message: string | null;
					} = {
						taskId: null,
						message: null
					};

					if (messageMatch[2]) {
						change.taskId = messageMatch[2];
					}

					if (messageMatch[3] || messageMatch[5]) {
						change.message = StringUtility.capitalizeFirstLetter(
							(messageMatch[3] || messageMatch[5]).trim()
						);
					}

					if (change.message && !allCommitMessages[change.message]) {
						allCommitMessages[change.message] = true;

						if (messageMatch[1] || messageMatch[4]) {
							switch (messageMatch[1] || messageMatch[4]) {
								case 'BREAKING CHANGE':
									release.changes.breaking.push({
										taskId: change.taskId,
										message: change.message,
										user: commit.user
									});
									break;
								case 'feat':
									release.changes.feature.push({
										taskId: change.taskId,
										message: change.message,
										user: commit.user
									});
									break;
								case 'fix':
									release.changes.fix.push({
										taskId: change.taskId,
										message: change.message,
										user: commit.user
									});
									break;
							}
						}
					}
				} else if (!commit.message.startsWith('Merge ')) {
					const taskIdRegexp = /\[{0,1}([A-Z]{2,}-[0-9]+)\]{0,1}:{0,1} */;
					const taskIdMatch = commit.message.match(taskIdRegexp);
					const taskId = taskIdMatch ? taskIdMatch[1] : null;
					const message = StringUtility.capitalizeFirstLetter(
						taskIdMatch?.[0]
							? commit.message.replace(taskIdMatch[0], '').trim()
							: commit.message.trim()
					);

					if (message && !allCommitMessages[message]) {
						allCommitMessages[message] = true;

						release.changes.fix.push({
							taskId: taskId || null,
							message: message,
							user: commit.user
						});
					}
				}
			}

			releases.push(release);
		}

		await Promise.all(githubUsernamePromises);

		return releases;
	}

	/**
	 * Returns github username.
	 *
	 * @param email Email.
	 * @returns Github username.
	 */
	private static async getGithubUsername(email: string): Promise<string | null> {
		const window = new GlobalWindow();
		const response = await window.fetch(`https://api.github.com/search/users?q=${email}`);
		const json = <{ items: Array<{ login: string }> }>await response.json();
		return json?.items?.[0]?.login || null;
	}

	/**
	 * Returns commits grouped by version.
	 *
	 * @param [fromVersion] From version.
	 * @param [toVersion] To version.
	 * @returns Promise.
	 */
	private static async getCommitsGroupedByVersion(
		fromVersion?: string,
		toVersion?: string
	): Promise<
		Array<{
			version: string;
			commits: ICommit[];
		}>
	> {
		const releasedVersions = await this.getReleasedVersions(fromVersion, toVersion);
		const promises: Promise<{ version: string; commits: ICommit[] }>[] = [];

		for (let i = 0; i < releasedVersions.length; i++) {
			const from = releasedVersions[i];
			const to = releasedVersions[i + 1];

			if (to) {
				const promise: Promise<{
					version: string;
					commits: ICommit[];
				}> = new Promise((resolve, reject) => {
					ChildProcess.exec(
						`git --no-pager log ${from}..${to} --pretty=format:"%s|%cn|%ce"`,
						(error, stdout) => {
							if (error) {
								reject(error);
							} else {
								const rows = stdout.trim().split(/[\n\r]/);
								const commits: ICommit[] = [];
								for (const row of rows) {
									const [message, userName, userEmail] = row.trim().split('|');
									if (message) {
										commits.push(<ICommit>{
											message,
											user: {
												name: userName,
												email: userEmail,
												githubUsername: null
											}
										});
									}
								}
								resolve({
									version: to.replace('v', ''),
									commits
								});
							}
						}
					);
				});

				promises.push(promise);
			}
		}

		return await Promise.all(promises);
	}

	/**
	 * Returns tag names.
	 *
	 * @param [fromVersion] From version.
	 * @param [toVersion] To version.
	 * @returns Promise.
	 */
	private static getReleasedVersions(fromVersion?: string, toVersion?: string): Promise<string[]> {
		return new Promise((resolve, reject) => {
			ChildProcess.exec(`git --no-pager tag -l --sort -version:refname`, (error, stdout) => {
				if (error) {
					reject(error);
				} else {
					const tags = stdout.trim().split(/[\n\r]/);
					const releasedTags: string[] = [];
					let hasToVersion = false;

					for (let i = 0, max = tags.length; i < max; i++) {
						const isPreRelease = tags[i].includes('-');

						if (!toVersion) {
							toVersion = tags[i];
						}

						if (hasToVersion && !fromVersion && !isPreRelease) {
							fromVersion = tags[i];
						}

						if (hasToVersion || toVersion === tags[i]) {
							hasToVersion = true;
							if (toVersion === tags[i] || !isPreRelease) {
								releasedTags.push(tags[i]);
							}
						}

						if (tags[i] === fromVersion) {
							break;
						}
					}

					resolve(releasedTags.reverse());
				}
			});
		});
	}
}
