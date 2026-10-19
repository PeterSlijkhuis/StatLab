import type { ExerciseDef } from '../../r/checker';

const POPULATION = 'library(dplyr)\npopulation <- read.csv("data/wellbeing-population.csv", stringsAsFactors = TRUE)';

const REGIONS = `library(dplyr)
library(tidyr)
library(janitor)
reduced <- data.frame(
  money       = c("high", "high", "high", "high", "low", "low", "low", "low"),
  support     = c("high", "high", "low", "low", "high", "high", "low", "low"),
  development = c("low", "high", "low", "high", "low", "high", "low", "high"),
  n           = c(10, 60, 60, 80, 2, 13, 95, 40)
)
regions <- reduced %>% uncount(n)`;

const WORKPLACE = 'd <- read.csv("data/workplace.csv", stringsAsFactors = TRUE)';

export const moduleRm: ExerciseDef[] = [
  {
    id: 'mrm-2-a',
    prompt:
      'Height is a ratio variable, so a mean makes sense. What is the mean height of the Star Wars characters? A few heights are missing. Store the mean in mean_height.',
    starterCode: 'library(dplyr)\n\nmean_height <- ',
    solution: 'library(dplyr)\nmean_height <- mean(starwars$height, na.rm = TRUE)',
    wrongAnswers: [
      // The missing heights make the mean NA.
      'library(dplyr)\nmean_height <- mean(starwars$height)',
      // The median, not the mean.
      'library(dplyr)\nmean_height <- median(starwars$height, na.rm = TRUE)',
      // The wrong column.
      'library(dplyr)\nmean_height <- mean(starwars$mass, na.rm = TRUE)',
    ],
    alternateSolutions: [
      'library(dplyr)\nmean_height <- starwars %>% summarise(mean_height = mean(height, na.rm = TRUE))',
      'library(dplyr)\nmean_height <- mean(na.omit(starwars$height))',
    ],
    check: `
      target <- mean(dplyr::starwars$height, na.rm = TRUE)
      if (!has_answer("mean_height")) {
        list(pass = FALSE, message = "I could not find an object called mean_height.")
      } else {
        got <- answer("mean_height")
        value <- if (is.data.frame(got)) unlist(numeric_columns(got)) else suppressWarnings(as.numeric(got))
        if (length(value) != 1L) {
          list(pass = FALSE, message = "mean_height should be one number.")
        } else if (is.na(value)) {
          list(pass = FALSE, message = "mean_height is NA, because some heights are missing and R will not guess them. Add na.rm = TRUE to mean() to leave them out.")
        } else if (abs(value - median(dplyr::starwars$height, na.rm = TRUE)) < 1e-6) {
          list(pass = FALSE, message = "That is the median height. The question asks for the mean.")
        } else if (abs(value - target) > 0.01) {
          list(pass = FALSE, message = paste0("mean_height is ", round(value, 1), ", but the mean of the height column, without the missing values, is ", round(target, 1), ". Check that you used height."))
        } else {
          list(pass = TRUE, message = paste0("Correct: ", round(target, 1), " cm, over the ", sum(!is.na(dplyr::starwars$height)), " characters whose height is known. Saying how many values a mean rests on is part of reporting it."))
        }
      }
    `,
    hints: [
      'starwars$height picks the height column.',
      'mean() returns NA when any value is missing, unless you add na.rm = TRUE.',
      'mean_height <- mean(starwars$height, na.rm = TRUE)',
    ],
  },
  {
    id: 'mrm-3-a',
    prompt:
      'Draw a stratified sample: 50 Business and 50 Psychology students, each drawn at random within their programme. Store the 100 rows in stratified.',
    starterCode: `${POPULATION}\nset.seed(1)\n\nstratified <- `,
    solution: `${POPULATION}\nset.seed(1)\nstratified <- population %>% group_by(programme) %>% slice_sample(n = 50) %>% ungroup()`,
    wrongAnswers: [
      // A simple random sample: the programme counts are left to chance.
      `${POPULATION}\nset.seed(1)\nstratified <- population %>% slice_sample(n = 50)`,
      // The first 50 per programme: fixed numbers, but not drawn at random.
      `${POPULATION}\nstratified <- population %>% group_by(programme) %>% slice_head(n = 50) %>% ungroup()`,
      // One programme only.
      `${POPULATION}\nset.seed(1)\nstratified <- population %>% filter(programme == "Business") %>% slice_sample(n = 100)`,
    ],
    alternateSolutions: [
      `${POPULATION}\nset.seed(1)\nstratified <- population %>% slice_sample(n = 50, by = programme)`,
      `${POPULATION}\nset.seed(1)\nstratified <- do.call(rbind, lapply(split(population, population$programme), function(g) g[sample(nrow(g), 50), ]))`,
    ],
    check: `
      population <- read.csv("data/wellbeing-population.csv", stringsAsFactors = TRUE)
      first <- unlist(lapply(split(population$id, population$programme), head, 50))
      if (!has_answer("stratified")) {
        list(pass = FALSE, message = "I could not find an object called stratified.")
      } else {
        got <- as.data.frame(answer("stratified"))
        if (!all(c("id", "programme") %in% names(got))) {
          list(pass = FALSE, message = "stratified should hold rows of the population, with all its columns, including id and programme.")
        } else if (anyDuplicated(got$id) > 0) {
          list(pass = FALSE, message = "Some students appear more than once. A sample draws each person at most once, so leave out replace = TRUE.")
        } else if (nrow(got) != 100L) {
          list(pass = FALSE, message = paste0("stratified has ", nrow(got), " rows; it should have 100, 50 per programme. Group by programme before you draw, so n counts within each group."))
        } else if (any(table(factor(got$programme, levels = levels(population$programme))) != 50L)) {
          list(pass = FALSE, message = "The programmes are not 50 each. Group by programme first, so slice_sample() draws within each programme.")
        } else if (setequal(got$id, first)) {
          list(pass = FALSE, message = "Those are the first 50 rows of each programme, not a random draw. Use slice_sample() instead of slice_head().")
        } else {
          list(pass = TRUE, message = "Correct: 50 per programme, each drawn at random within its group. That makes it a stratified sample, and every student in the frame had a known chance of being selected.")
        }
      }
    `,
    hints: [
      'group_by(programme) makes the next step work within each programme.',
      'slice_sample(n = 50) then draws 50 rows from each group.',
      'stratified <- population %>% group_by(programme) %>% slice_sample(n = 50) %>% ungroup()',
    ],
  },
  {
    id: 'mrm-4-a',
    prompt:
      'Is economic development related to support for the EU? Make the crosstab with support in the rows and development in the columns, with column percentages, and store it in ty.',
    starterCode: `${REGIONS}\n\nty <- `,
    solution: `${REGIONS}\nty <- regions %>% tabyl(support, development) %>% adorn_percentages("col")`,
    wrongAnswers: [
      // Row percentages: of each support level, which development it came from.
      `${REGIONS}\nty <- regions %>% tabyl(support, development) %>% adorn_percentages("row")`,
      // The money table from the lesson, not the development one.
      `${REGIONS}\nty <- regions %>% tabyl(support, money) %>% adorn_percentages("col")`,
      // Counts, never turned into percentages.
      `${REGIONS}\nty <- regions %>% tabyl(support, development)`,
    ],
    alternateSolutions: [
      `${REGIONS}\nty <- regions %>% tabyl(support, development) %>% adorn_percentages("col") %>% adorn_pct_formatting(digits = 1)`,
      `${REGIONS}\nty <- prop.table(table(regions$support, regions$development), margin = 2)`,
    ],
    check: `
      values_of <- function(x) {
        if (!is.data.frame(x)) return(suppressWarnings(as.numeric(unclass(x))))
        out <- c()
        for (column in x) {
          if (is.numeric(column)) out <- c(out, column)
          else if (is.character(column) && any(grepl("%", column))) out <- c(out, suppressWarnings(as.numeric(sub("%", "", column))) / 100)
        }
        out
      }
      if (!has_answer("ty")) {
        list(pass = FALSE, message = "I could not find an object called ty.")
      } else {
        values <- values_of(answer("ty"))
        values <- values[!is.na(values)]
        # Proportions or percentages both count.
        found <- function(targets, tol = 0.006) all(vapply(targets, function(r) any(abs(values - r) < tol | abs(values / 100 - r) < tol), logical(1)))
        if (length(values) == 0L) {
          list(pass = FALSE, message = "ty should hold the percentages of the table.")
        } else if (found(c(12 / 167, 73 / 193))) {
          list(pass = TRUE, message = "Correct: 7% of low-development regions show high support, against 38% of high-development ones, a difference of 31 points. Development is related to support, and the lesson showed it is related to EU money too, which is why it is worth checking as a test variable.")
        } else if (found(c(12 / 85, 155 / 275))) {
          list(pass = FALSE, message = "Those are row percentages: of the regions with high support, how many are developed. Development is the independent variable here, so it goes in the columns and the percentages add up within columns: adorn_percentages(\\"col\\").")
        } else if (found(c(15 / 150, 70 / 210))) {
          list(pass = FALSE, message = "That is the money table from the lesson. Put development in the columns instead: tabyl(support, development).")
        } else if (any(values > 1)) {
          list(pass = FALSE, message = "Those are still counts. Low- and high-development groups differ in size, so turn them into column percentages with adorn_percentages(\\"col\\").")
        } else {
          list(pass = FALSE, message = "I could not find the column percentages of support by development in ty. Use tabyl(support, development) and then adorn_percentages(\\"col\\").")
        }
      }
    `,
    hints: [
      'tabyl() takes the row variable first and the column variable second.',
      'adorn_percentages("col") makes each column add up to 100%.',
      'ty <- regions %>% tabyl(support, development) %>% adorn_percentages("col")',
    ],
  },
  {
    id: 'mrm-5-a',
    prompt:
      'Assign the 480 employees at random to two equal groups of 240: "treatment" and "control". Store the labels, one per employee, in group.',
    starterCode: `${WORKPLACE}\nset.seed(5)\n\ngroup <- `,
    solution: `${WORKPLACE}\nset.seed(5)\ngroup <- sample(rep(c("treatment", "control"), each = 240))`,
    wrongAnswers: [
      // Not shuffled: the first 240 employees all get the treatment.
      `${WORKPLACE}\ngroup <- rep(c("treatment", "control"), each = 240)`,
      // A coin flip per person: random, but the groups are not equal in size.
      `${WORKPLACE}\nset.seed(5)\ngroup <- sample(c("treatment", "control"), 480, replace = TRUE)`,
      // One group too small.
      `${WORKPLACE}\nset.seed(5)\ngroup <- sample(rep(c("treatment", "control"), each = 120))`,
    ],
    alternateSolutions: [
      `${WORKPLACE}\nset.seed(5)\ngroup <- ifelse(sample(nrow(d)) <= 240, "treatment", "control")`,
      `${WORKPLACE}\nset.seed(5)\ngroup <- sample(rep(c("control", "treatment"), times = nrow(d) / 2))`,
    ],
    check: `
      if (!has_answer("group")) {
        list(pass = FALSE, message = "I could not find an object called group.")
      } else {
        got <- as.character(answer("group"))
        counts <- table(factor(got, levels = c("treatment", "control")))
        if (length(got) != 480L) {
          list(pass = FALSE, message = paste0("group has ", length(got), " labels; it needs one for each of the 480 employees."))
        } else if (!all(got %in% c("treatment", "control"))) {
          list(pass = FALSE, message = "Use exactly the labels \\"treatment\\" and \\"control\\".")
        } else if (any(counts != 240L)) {
          list(pass = FALSE, message = paste0("The groups have ", counts[["treatment"]], " and ", counts[["control"]], " people. Shuffle a vector of exactly 240 of each label, rep(..., each = 240), instead of drawing a label per person."))
        } else if (all(got[1:240] == got[1]) || all(got[seq(1, 479, 2)] == got[1])) {
          list(pass = FALSE, message = "The labels follow the order of the data, so they are not random. Shuffle them with sample().")
        } else {
          list(pass = TRUE, message = "Correct: 240 in each group, assigned by chance. Whatever differences remain between the groups before the intervention are now due to chance alone.")
        }
      }
    `,
    hints: [
      'rep(c("treatment", "control"), each = 240) makes the 480 labels in order.',
      'sample() with one vector shuffles it.',
      'group <- sample(rep(c("treatment", "control"), each = 240))',
    ],
  },
];
