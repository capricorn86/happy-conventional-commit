const MESSAGE_REGEXP = /^([^:]+): \[[#a-zA-Z0-9-]+\] (.+)/;
const TYPE_REGEXP =
	/(chore|fix|feat|BREAKING CHANGE)\[[a-zA-Z-]+\]|(chore|fix|feat|BREAKING CHANGE)/;
const TYPES = ['chore', 'fix', 'feat', 'BREAKING CHANGE'];

/**
 * Conventional commit validator.
 */
export default class ConventionalCommitValidator {
	/**
	 * Validates commit message.
	 *
	 * @param commitMessage Commit message.
	 * @returns Error list.
	 */
	public static validate(commitMessage: string): string[] {
		if (commitMessage.startsWith('Merge ')) {
			return [];
		}

		const match = commitMessage.match(MESSAGE_REGEXP);

		if (!match) {
			return [
				`Wrong format. Use the format: "{type}: [{taskID}] {description}". Acceptable types: "${TYPES.join(
					'", "'
				)}".`
			];
		}

		const [_commit, type, description] = match;
		const typeMatch = type.match(TYPE_REGEXP);
		const errorList: string[] = [];

		if (!typeMatch) {
			errorList.push(`Unknown commit type. Acceptable types: "${TYPES.join('", "')}".`);
		}

		if (description[0].toUpperCase() !== description[0]) {
			errorList.push('The description should start with an upper case character.');
		}

		if (
			description[description.length - 1] === '.' &&
			description.indexOf('.') === description.length - 1
		) {
			errorList.push(
				'The description should not end with a punctuation (.), unless there are multiple sentences.'
			);
		}

		return errorList;
	}
}
