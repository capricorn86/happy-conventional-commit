/**
 * String utility.
 */
export default class StringUtility {
  /**
   * Capitalizes first letter.
   *
   * @param text Text to use.
   * @returns String with first letter capitalized.
   */
  public static capitalizeFirstLetter(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  /**
   * Trims a text on the right side.
   *
   * @param text Text.
   * @param char Character to trim.
   * @returns Trimmed text.
   */
  public static trimEnd(text: string, char: string): string {
    while (text.length > 0 && text[text.length - 1] === char) {
      return text.slice(0, -1);
    }

    return text;
  }
}
