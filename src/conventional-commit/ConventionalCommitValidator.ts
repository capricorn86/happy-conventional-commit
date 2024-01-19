const REGEXP = /^([^:]+): \[[A-Z]{2,}-\d+\] (.+)/;
const VERSION_TYPE = ["chore", "fix", "feat", "BREAKING CHANGE"];

/**
 * Conventional commit validator.
 */
export default class ConventionalCommitValidator {
  /**
   * Validates commit.
   *
   * @param commitMessage Commit message.
   * @returns Error list.
   */
  public static validateCommitMessage(commitMessage: string): string[] {
    if (commitMessage.startsWith("Merge ")) {
      return [];
    }

    const match = commitMessage.match(REGEXP);

    if (!match) {
      return [
        `Wrong format. Use the format: "{version type}: [{taskId}] {description}". Acceptable version types: "${VERSION_TYPE.join(
          '", "'
        )}".`,
      ];
    }

    const [_commit, versionType, description] = match;
    const errorList: string[] = [];

    if (!VERSION_TYPE.includes(versionType)) {
      errorList.push(
        `Unknown version type. Acceptable version types: ${VERSION_TYPE.join(
          ", "
        )}.`
      );
    }

    if (description[0].toUpperCase() !== description[0]) {
      errorList.push(
        "The description should start with an upper case character."
      );
    }

    if (description[description.length - 1] !== ".") {
      errorList.push("The description should end with a punctuation (.).");
    }

    return errorList;
  }
}
