import ChildProcess from 'child_process';
import HTTPS from 'https';

const CHANGE_TYPE_HEADER_MARKDOWN = {
	breaking: '### :bomb: Breaking Changes',
	feature: '### :art: Features',
	fix: '### :construction_worker_man: Patch fixes'
};

type IAuthor = { name: string; email: string; githubUsername: string | null };

type IRelease = {
	version: string;
	changes: {
		breaking: Array<{
			taskId: string | null;
			message: string;
			author: IAuthor;
		}>;
		feature: Array<{ taskId: string | null; message: string; author: IAuthor }>;
		fix: Array<{ taskId: string | null; message: string; author: IAuthor }>;
	};
};

type ICommit = {
	message: string;
	author: IAuthor;
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
	 * @param [options.versionHeader] "true" to show version header.
	 * @param [options.author] "githubUsername" or "nameAndEmail".
	 * @returns Release notes.
	 */
	public static async getReleaseNotes(options?: {
		fromVersion?: string;
		toVersion?: string;
		versionHeader?: boolean;
		author?: 'githubUsername' | 'nameAndEmail';
	}): Promise<string> {
		const releases = await this.getReleases(options);
		let output = '';

		for (const release of releases) {
			output += options?.versionHeader || releases.length > 1 ? `#v${release.version}\n\n` : '';

			for (const changeType of Object.keys(release.changes)) {
				if (release.changes[changeType].length) {
					output += `${CHANGE_TYPE_HEADER_MARKDOWN[changeType]}\n`;

					for (const change of release.changes[changeType]) {
						const message = change.message.endsWith('.')
							? change.message.slice(0, -1)
							: change.message;
						const author =
							options?.author === 'githubUsername' && change.author.githubUsername
								? change.author.githubUsername
								: options?.author === 'nameAndEmail'
									? `${change.author.name} (${change.author.email})`
									: null;

						let userAndTask = '';
						if (author && change.taskId) {
							userAndTask = ` - By **@${author}** in task ${change.taskId}`;
						} else if (author) {
							userAndTask = ` - By **@${author}**`;
						} else if (change.taskId) {
							userAndTask = ` - In task ${change.taskId}`;
						}

						output += ` - ${message}${userAndTask}\n`;
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
	 * @param [options.author] "githubUsername" or "nameAndEmail".
	 * @returns Releases.
	 */
	private static async getReleases(options?: {
		fromVersion?: string;
		toVersion?: string;
		author?: 'githubUsername' | 'nameAndEmail';
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

				if (options?.author === 'githubUsername') {
					githubUsernamePromises.push(
						this.getGithubUsername(commit.author.email).then((githubUsername): void => {
							commit.author.githubUsername = githubUsername;
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
						change.message = this.removeEndPunctuation(
							this.capitalizeFirstLetter((messageMatch[3] || messageMatch[5]).trim())
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
										author: commit.author
									});
									break;
								case 'feat':
									release.changes.feature.push({
										taskId: change.taskId,
										message: change.message,
										author: commit.author
									});
									break;
								case 'fix':
									release.changes.fix.push({
										taskId: change.taskId,
										message: change.message,
										author: commit.author
									});
									break;
							}
						}
					}
				} else if (!commit.message.startsWith('Merge ')) {
					const taskIdRegexp = / *\[([^\]]+)\] *| *(#[0-9]+) */;
					const taskIdMatch = commit.message.match(taskIdRegexp);
					const taskId = taskIdMatch ? taskIdMatch[1] || taskIdMatch[2] : null;
					const message = this.removeEndPunctuation(
						this.capitalizeFirstLetter(
							taskIdMatch?.[0]
								? commit.message.replace(taskIdMatch[0], '').trim()
								: commit.message.trim()
						)
					);

					if (message && !allCommitMessages[message]) {
						allCommitMessages[message] = true;

						release.changes.fix.push({
							taskId: taskId || null,
							message: message,
							author: commit.author
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
	private static getGithubUsername(email: string): Promise<string | null> {
		return new Promise((resolve, reject) => {
			HTTPS.get(
				`https://api.github.com/search/users?q=${email}`,
				{
					headers: {
						'User-Agent': 'nodejs'
					}
				},
				(response) => {
					let data = '';
					response.on('data', (chunk) => {
						data += chunk;
					});
					response.on('end', () => {
						const json = <{ items: Array<{ login: string }> }>JSON.parse(data);
						if (!json?.items?.[0]?.login) {
							resolve(null);
						} else {
							resolve(json.items[0].login);
						}
					});
				}
			).on('error', (error) => {
				reject(error);
			});
		});
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
		await this.fetchGitTags();

		const releasedVersions = await this.getGitTags(fromVersion, toVersion);
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
											author: {
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
	 * Returns Git tags.
	 *
	 * @param [fromVersion] From version.
	 * @param [toVersion] To version.
	 * @returns Promise.
	 */
	private static getGitTags(fromVersion?: string, toVersion?: string): Promise<string[]> {
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

	/**
	 * Fetches Git tags from remote source.
	 *
	 * @returns Promise.
	 */
	private static fetchGitTags(): Promise<void> {
		return new Promise((resolve, reject) => {
			ChildProcess.exec(`git fetch --all --tags`, (error) => {
				if (error) {
					reject(error);
				} else {
					resolve();
				}
			});
		});
	}

	/**
	 * Capitalizes first letter.
	 *
	 * @param text Text to use.
	 * @returns String with first letter capitalized.
	 */
	private static capitalizeFirstLetter(text: string): string {
		return text.charAt(0).toUpperCase() + text.slice(1);
	}

	/**
	 * Removes end punctuation (.).
	 *
	 * @param text Text to use.
	 * @returns String without end punctuation.
	 */
	private static removeEndPunctuation(text: string): string {
		return text[text.length - 1] === '.' ? text.slice(0, -1) : text;
	}
}
