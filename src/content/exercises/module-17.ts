import type { ExerciseDef } from '../../r/checker';

const LOAD = 'd <- read.csv("data/workplace.csv", stringsAsFactors = TRUE)';

/**
 * Six made-up questionnaire items answered on a 1 to 7 scale by 300 people:
 * three about work pressure and three about support from a manager. The course
 * datasets hold no items, so Lesson 17-2 and its exercise build this one.
 */
const ITEMS =
  'set.seed(172)\n' +
  'n <- 300\n' +
  'pressure <- rnorm(n)\n' +
  'support <- 0.3 * pressure + rnorm(n, 0, 0.95)\n' +
  'item <- function(f, load) round(pmin(7, pmax(1, 4 + 1.3 * (load * f + rnorm(n, 0, sqrt(1 - load^2))))))\n' +
  'items <- data.frame(\n' +
  '  deadlines = item(pressure, 0.80), overtime = item(pressure, 0.75), too_much = item(pressure, 0.70),\n' +
  '  help = item(support, 0.80), listened = item(support, 0.75), feedback = item(support, 0.65)\n' +
  ')';

export const module17: ExerciseDef[] = [
  {
    id: 'm17-1-a',
    prompt:
      'Does workload lower performance through wellbeing? Fit the a path (wellbeing on workload) and the b path (performance on wellbeing, holding workload constant), then store the indirect effect, a times b, in indirect.',
    starterCode: `${LOAD}\n\npath_a <- lm(wellbeing ~ workload, data = d)\npath_b <- lm(performance ~ wellbeing + workload, data = d)\n\nindirect <- `,
    solution: `${LOAD}\npath_a <- lm(wellbeing ~ workload, data = d)\npath_b <- lm(performance ~ wellbeing + workload, data = d)\nindirect <- coef(path_a)["workload"] * coef(path_b)["wellbeing"]`,
    wrongAnswers: [
      // The total effect of workload on performance.
      `${LOAD}\nindirect <- coef(lm(performance ~ workload, data = d))["workload"]`,
      // The b path without workload in the model.
      `${LOAD}\nindirect <- coef(lm(wellbeing ~ workload, data = d))["workload"] * coef(lm(performance ~ wellbeing, data = d))["wellbeing"]`,
      // The direct effect, what remains once wellbeing is held constant.
      `${LOAD}\nindirect <- coef(lm(performance ~ wellbeing + workload, data = d))["workload"]`,
    ],
    alternateSolutions: [
      // Total minus direct, which equals a times b for linear models fitted to the same rows.
      `${LOAD}\ntotal <- coef(lm(performance ~ workload, data = d))["workload"]\ndirect <- coef(lm(performance ~ wellbeing + workload, data = d))["workload"]\nindirect <- total - direct`,
    ],
    check: `
      d <- read.csv("data/workplace.csv", stringsAsFactors = TRUE)
      a <- unname(coef(lm(wellbeing ~ workload, data = d))["workload"])
      b <- unname(coef(lm(performance ~ wellbeing + workload, data = d))["wellbeing"])
      b_alone <- unname(coef(lm(performance ~ wellbeing, data = d))["wellbeing"])
      total <- unname(coef(lm(performance ~ workload, data = d))["workload"])
      direct <- unname(coef(lm(performance ~ wellbeing + workload, data = d))["workload"])
      if (!has_answer("indirect")) {
        list(pass = FALSE, message = "I could not find an object called indirect.")
      } else {
        got <- suppressWarnings(as.numeric(answer("indirect")))
        if (length(got) != 1L || is.na(got)) {
          list(pass = FALSE, message = "indirect should be one number: a times b.")
        } else if (abs(got - total) < 1e-6) {
          list(pass = FALSE, message = "That is the total effect of workload on performance. The indirect effect is the part of it that runs through wellbeing: a times b.")
        } else if (abs(got - direct) < 1e-6) {
          list(pass = FALSE, message = "That is the direct effect, what is left once wellbeing is held constant. Multiply the a path by the b path instead.")
        } else if (abs(got - a * b_alone) < 1e-6) {
          list(pass = FALSE, message = "Nearly. The b path has to hold workload constant: fit performance ~ wellbeing + workload, not performance ~ wellbeing alone.")
        } else if (abs(got - a * b) > 1e-6) {
          list(pass = FALSE, message = paste0("indirect is ", round(got, 3), ", but a times b is ", round(a * b, 3), "."))
        } else {
          list(pass = TRUE, message = paste0("Correct: a = ", round(a, 2), ", b = ", round(b, 2), ", indirect = ", round(a * b, 2), ". The total effect is ", round(total, 2), " and the indirect effect ", round(a * b, 2), " is even larger in size, because the direct effect, ", round(direct, 2), ", points the other way and is small: workload's link with performance runs through wellbeing."))
        }
      }
    `,
    hints: [
      'coef(path_a)["workload"] is the a path.',
      'coef(path_b)["wellbeing"] is the b path: wellbeing\'s slope with workload held constant.',
      'indirect <- coef(path_a)["workload"] * coef(path_b)["wellbeing"]',
    ],
  },
  {
    id: 'm17-2-a',
    prompt:
      'Fit an exploratory factor analysis with two factors to the six items, letting the factors correlate (rotation = "promax"). Store the result in efa.',
    starterCode:
      '# items is already in your environment.\nround(cor(items), 2)\n\nefa <- ',
    setupCode: ITEMS,
    solution: 'efa <- factanal(items, factors = 2, rotation = "promax")',
    wrongAnswers: [
      // One factor, which the correlations do not support.
      'efa <- factanal(items, factors = 1)',
      // Principal components, a different method.
      'efa <- prcomp(items, scale. = TRUE)',
      // Two factors forced to be uncorrelated.
      'efa <- factanal(items, factors = 2, rotation = "varimax")',
    ],
    alternateSolutions: [
      // Naming every argument.
      'efa <- factanal(x = items, factors = 2, rotation = "promax", scores = "regression")',
    ],
    check: `
      if (!has_answer("efa")) {
        list(pass = FALSE, message = "I could not find an object called efa.")
      } else {
        got <- answer("efa")
        if (inherits(got, "prcomp")) {
          list(pass = FALSE, message = "That is a principal component analysis. Components summarise all the variance; factors model only what the items share. Use factanal().")
        } else if (!inherits(got, "factanal")) {
          list(pass = FALSE, message = "efa should be the result of factanal().")
        } else if (got$factors != 2L) {
          list(pass = FALSE, message = paste0("You extracted ", got$factors, " factor", if (got$factors == 1L) "" else "s", ". The correlation table shows two blocks of three items: ask for factors = 2."))
        } else if (!identical(as.character(got$call$rotation), "promax")) {
          list(pass = FALSE, message = "Two factors, good. Let them correlate with rotation = \\"promax\\": pressure and support are unlikely to be unrelated.")
        } else {
          list(pass = TRUE, message = paste0("Correct. The chi-square test of fit gives p = ", format(round(got$PVAL, 2), nsmall = 2), ", so there is no evidence that two factors fall short. Print it with print(efa, cutoff = 0.3) to see which items load where."))
        }
      }
    `,
    hints: [
      'factanal() takes the data and the number of factors.',
      'rotation = "promax" lets the factors correlate.',
      'efa <- factanal(items, factors = 2, rotation = "promax")',
    ],
  },
];
