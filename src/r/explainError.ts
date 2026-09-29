/**
 * Plain-language explanations of the R errors beginners meet most, for the
 * avatar to say when a student's code does not run. R's own wording stays on
 * screen below; this says what it means and what to try.
 *
 * Matched loosely, anywhere in the text: webR may or may not prefix the
 * message with "Error in ...:", and R quotes with straight or curly quotes.
 */

type Rule = { pattern: RegExp; explain: (match: RegExpMatchArray) => string };

const Q = `['‘’"\`]`;
const NAME = `${Q}([^'‘’"\`]+)${Q}`;

const RULES: Rule[] = [
  {
    pattern: new RegExp(`object ${NAME} not found`),
    explain: ([, name]) =>
      `R does not know anything called "${name}". Check the spelling and the capitals (R treats Age and age as different names). ` +
      `If it is a column, it only exists inside its data frame, so write data$${name} or use it inside a function such as mutate() or filter() that knows the data. ` +
      `If you meant it as text, put it in quotes.`,
  },
  {
    pattern: new RegExp(`could not find function ${NAME}`),
    explain: ([, name]) =>
      `R has no function called ${name}(). Either the name is misspelt, or it comes from a package that is not loaded yet. ` +
      `Check the spelling, then load its package with library() before you use it.`,
  },
  {
    pattern: new RegExp(`there is no package called ${NAME}`),
    explain: ([, name]) => `The package ${name} is not installed here. Check the spelling of its name.`,
  },
  {
    pattern: /unexpected end of input/,
    explain: () => 'Your code stops in the middle of something. Usually a bracket or a quote is opened and never closed. Count your ( and ), and your quotes.',
  },
  {
    pattern: /unexpected (string constant|numeric constant|symbol)/,
    explain: ([, what]) => {
      const thing = what === 'symbol' ? 'a name' : what === 'string constant' ? 'a piece of text in quotes' : 'a number';
      return `R found ${thing} where it did not expect one. Most often a comma is missing between two arguments, or an operator such as + or <- is missing between two things.`;
    },
  },
  {
    pattern: /unexpected '?([)\]},=]|else)'?/,
    explain: ([, token]) =>
      `R found a ${token} it did not expect. Check that every bracket you close was opened, and that you have not left an argument empty (as in f(x, )). To test whether two things are equal, use ==, not =.`,
  },
  {
    pattern: /unexpected input/,
    explain: () => 'R found a character it cannot read. Look for curly quotes pasted from a document, or a stray symbol, and retype it.',
  },
  {
    pattern: /non-numeric argument to (binary operator|mathematical function)/,
    explain: () => 'You are doing arithmetic with something that is not a number, most often text. Check the column type with class() or str(); numbers stored as text need as.numeric().',
  },
  {
    pattern: new RegExp(`argument ${NAME} is missing, with no default`),
    explain: ([, name]) => `The function needs a value for its argument "${name}", and you did not give one. Add it inside the brackets.`,
  },
  {
    pattern: /unused argument/,
    explain: () => 'You gave the function an argument it does not have. Check the spelling of the argument name, or open its help page with ?function_name to see what it accepts.',
  },
  {
    pattern: /\$ operator is invalid for atomic vectors/,
    explain: () => 'You used $ on something that is not a data frame or a list. $ picks a column out of a data frame, so check that the thing before $ is the data frame itself.',
  },
  {
    pattern: /object of type 'closure' is not subsettable/,
    explain: () => 'You used [ ] or $ on a function, not on data. This usually means the data frame you meant was never created under that name, and the name is also a built-in function, such as data or df. Check that the read.csv() line ran and what you called the result.',
  },
  {
    pattern: /arguments imply differing number of rows/,
    explain: () => 'You are putting columns of different lengths together. Every column in a data frame needs the same number of values.',
  },
  {
    pattern: /cannot open (file|the connection)|No such file or directory/,
    explain: () => 'R could not find that file. Check the file name, its extension (.csv) and its folder, and that it is in quotes.',
  },
  {
    pattern: /subscript out of bounds|undefined columns selected/,
    explain: () => 'You asked for a row or column that does not exist. Check the column name with names() and the size with dim().',
  },
  {
    pattern: new RegExp(`Column ${NAME} not found|Can't find column|doesn't exist`),
    explain: () => 'That column is not in the data. Check its exact spelling and capitals with names(data).',
  },
  {
    pattern: /missing value where TRUE\/FALSE needed/,
    explain: () => 'An if() or a condition got NA instead of TRUE or FALSE. There are missing values in what you are testing; handle them first, for example with is.na() or na.rm = TRUE.',
  },
];

/** What to say about an R error, or a general nudge if it is not one we know. */
export function explainRError(text: string): string {
  for (const rule of RULES) {
    const match = text.match(rule.pattern);
    if (match) return rule.explain(match);
  }
  return 'R stopped at an error. Read its message below from the end backwards: the last part usually names the problem. Check spelling, brackets and commas on that line first.';
}
