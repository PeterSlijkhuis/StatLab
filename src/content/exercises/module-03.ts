import type { ExerciseDef } from '../../r/checker';

/**
 * A made-up five-item survey of 200 people, answered on a 1 to 5 scale. q3 is
 * worded the other way round and q5 barely measures the same thing. The course
 * datasets hold scale scores rather than items, so lesson 3-4 and its two
 * exercises build this one the same way.
 */
const SURVEY =
  'set.seed(34)\n' +
  'n <- 200\n' +
  'trait <- rnorm(n)\n' +
  'likert <- function(x) pmin(5, pmax(1, round(3 + x)))\n' +
  'survey <- data.frame(\n' +
  '  q1 = likert(0.9 * trait + rnorm(n, 0, 0.6)),\n' +
  '  q2 = likert(0.8 * trait + rnorm(n, 0, 0.7)),\n' +
  '  q3 = likert(-0.8 * trait + rnorm(n, 0, 0.7)),\n' +
  '  q4 = likert(0.7 * trait + rnorm(n, 0, 0.8)),\n' +
  '  q5 = likert(0.1 * trait + rnorm(n, 0, 1))\n' +
  ')';

/** The same survey with q3 already reversed, for the alpha exercise. */
const REVERSED = `${SURVEY}\nsurvey$q3_r <- 6 - survey$q3`;

export const module03: ExerciseDef[] = [
  {
    id: 'm3-1-a',
    prompt:
      'Summarise the wellbeing column. Store a one-row data frame in wellbeing_summary with the columns mean_wellbeing, sd_wellbeing and n.',
    starterCode:
      'library(dplyr)\nemployees <- read.csv("data/workplace.csv", stringsAsFactors = TRUE)\n\nwellbeing_summary <- employees %>%\n  ',
    solution:
      'library(dplyr)\nemployees <- read.csv("data/workplace.csv", stringsAsFactors = TRUE)\nwellbeing_summary <- employees %>%\n  summarise(mean_wellbeing = mean(wellbeing), sd_wellbeing = sd(wellbeing), n = n())',
    wrongAnswers: [
      // The variance, which is the SD squared and is not what anyone reports.
      'library(dplyr)\nemployees <- read.csv("data/workplace.csv", stringsAsFactors = TRUE)\nwellbeing_summary <- employees %>%\n  summarise(mean_wellbeing = mean(wellbeing), sd_wellbeing = var(wellbeing), n = n())',
      // n() forgotten, so the summary never says how many people it describes.
      'library(dplyr)\nemployees <- read.csv("data/workplace.csv", stringsAsFactors = TRUE)\nwellbeing_summary <- employees %>%\n  summarise(mean_wellbeing = mean(wellbeing), sd_wellbeing = sd(wellbeing))',
      // mutate() repeats the summary on all 480 rows instead of collapsing them.
      'library(dplyr)\nemployees <- read.csv("data/workplace.csv", stringsAsFactors = TRUE)\nwellbeing_summary <- employees %>%\n  mutate(mean_wellbeing = mean(wellbeing), sd_wellbeing = sd(wellbeing), n = n())',
    ],
    alternateSolutions: [
      // The SD written as the square root of the variance.
      'library(dplyr)\nemployees <- read.csv("data/workplace.csv", stringsAsFactors = TRUE)\nwellbeing_summary <- employees %>%\n  summarise(mean_wellbeing = mean(wellbeing), sd_wellbeing = sqrt(var(wellbeing)), n = length(wellbeing))',
      // Base R: a one-row data frame built by hand.
      'employees <- read.csv("data/workplace.csv", stringsAsFactors = TRUE)\nwellbeing_summary <- data.frame(\n  mean_wellbeing = mean(employees$wellbeing),\n  sd_wellbeing = sd(employees$wellbeing),\n  n = nrow(employees)\n)',
    ],
    check: `
      if (!has_answer("wellbeing_summary")) {
        list(pass = FALSE, message = "I could not find an object called wellbeing_summary.")
      } else {
        got <- answer("wellbeing_summary")
        d <- read.csv("data/workplace.csv", stringsAsFactors = TRUE)
        needed <- c("mean_wellbeing", "sd_wellbeing", "n")
        if (!is.data.frame(got)) {
          list(pass = FALSE, message = "wellbeing_summary should be a data frame - the one-row table summarise() returns.")
        } else if (nrow(got) == nrow(d)) {
          list(pass = FALSE, message = paste0("wellbeing_summary has ", nrow(d), " rows: the same summary repeated once per employee. mutate() adds a column to every row; summarise() collapses the table to one row."))
        } else if (nrow(got) != 1L) {
          list(pass = FALSE, message = paste0("wellbeing_summary has ", nrow(got), " rows, but a summary of one column is a single row."))
        } else if (!all(needed %in% names(got))) {
          list(pass = FALSE, message = paste0("wellbeing_summary is missing the column(s): ", paste(setdiff(needed, names(got)), collapse = ", "), ".", if (!("n" %in% names(got))) " A summary without n does not say how many people it describes, which is why every APA table has one." else ""))
        } else if (!isTRUE(all.equal(as.vector(got$mean_wellbeing), mean(d$wellbeing), tolerance = 1e-6, check.attributes = FALSE))) {
          list(pass = FALSE, message = paste0("mean_wellbeing is ", round(as.vector(got$mean_wellbeing), 3), ", but the mean of the wellbeing column is ", round(mean(d$wellbeing), 3), "."))
        } else if (isTRUE(all.equal(as.vector(got$sd_wellbeing), var(d$wellbeing), tolerance = 1e-6, check.attributes = FALSE))) {
          list(pass = FALSE, message = paste0("That is the variance, ", round(var(d$wellbeing), 2), ". The standard deviation is its square root, ", round(sd(d$wellbeing), 2), ", and it is the one you report because it is in the same units as the scores."))
        } else if (!isTRUE(all.equal(as.vector(got$sd_wellbeing), sd(d$wellbeing), tolerance = 1e-6, check.attributes = FALSE))) {
          list(pass = FALSE, message = paste0("sd_wellbeing is ", round(as.vector(got$sd_wellbeing), 3), ", but the standard deviation of wellbeing is ", round(sd(d$wellbeing), 3), "."))
        } else if (!isTRUE(all.equal(as.vector(got$n), nrow(d), tolerance = 1e-6, check.attributes = FALSE))) {
          list(pass = FALSE, message = paste0("n is ", as.vector(got$n), ", but the summary describes ", nrow(d), " employees."))
        } else {
          list(pass = TRUE, message = paste0("Correct: M = ", round(mean(d$wellbeing), 2), ", SD = ", round(sd(d$wellbeing), 2), ", n = ", nrow(d), ". Those three numbers together are what a results section reports - a mean with no SD and no n cannot be judged."))
        }
      }
    `,
    hints: [
      'summarise() turns a whole table into one row: employees %>% summarise(...).',
      'Inside summarise() you name each new column: mean_wellbeing = mean(wellbeing).',
      'n() counts the rows that went into the summary, and takes no arguments.',
    ],
  },
  {
    id: 'm3-1-b',
    prompt:
      'How spread out is wellbeing? Store a one-row data frame in spread with sd_wellbeing (the standard deviation), iqr_wellbeing (the interquartile range) and range_wellbeing (the largest score minus the smallest).',
    starterCode:
      'library(dplyr)\nemployees <- read.csv("data/workplace.csv", stringsAsFactors = TRUE)\n\nspread <- employees %>%\n  ',
    solution:
      'library(dplyr)\nemployees <- read.csv("data/workplace.csv", stringsAsFactors = TRUE)\nspread <- employees %>%\n  summarise(\n    sd_wellbeing = sd(wellbeing),\n    iqr_wellbeing = IQR(wellbeing),\n    range_wellbeing = max(wellbeing) - min(wellbeing)\n  )',
    wrongAnswers: [
      // The standard error of the mean, not the spread of the scores.
      'library(dplyr)\nemployees <- read.csv("data/workplace.csv", stringsAsFactors = TRUE)\nspread <- employees %>%\n  summarise(\n    sd_wellbeing = sd(wellbeing) / sqrt(n()),\n    iqr_wellbeing = IQR(wellbeing),\n    range_wellbeing = max(wellbeing) - min(wellbeing)\n  )',
      // The upper quartile instead of the distance between the quartiles.
      'library(dplyr)\nemployees <- read.csv("data/workplace.csv", stringsAsFactors = TRUE)\nspread <- employees %>%\n  summarise(\n    sd_wellbeing = sd(wellbeing),\n    iqr_wellbeing = quantile(wellbeing, 0.75),\n    range_wellbeing = max(wellbeing) - min(wellbeing)\n  )',
      // The largest score, with the subtraction forgotten.
      'library(dplyr)\nemployees <- read.csv("data/workplace.csv", stringsAsFactors = TRUE)\nspread <- employees %>%\n  summarise(\n    sd_wellbeing = sd(wellbeing),\n    iqr_wellbeing = IQR(wellbeing),\n    range_wellbeing = max(wellbeing)\n  )',
    ],
    alternateSolutions: [
      // The IQR written out as the gap between the quartiles, and diff(range()).
      'library(dplyr)\nemployees <- read.csv("data/workplace.csv", stringsAsFactors = TRUE)\nspread <- employees %>%\n  summarise(\n    sd_wellbeing = sd(wellbeing),\n    iqr_wellbeing = quantile(wellbeing, 0.75) - quantile(wellbeing, 0.25),\n    range_wellbeing = diff(range(wellbeing))\n  )',
      // Base R, same three numbers.
      'employees <- read.csv("data/workplace.csv", stringsAsFactors = TRUE)\nspread <- data.frame(\n  sd_wellbeing = sd(employees$wellbeing),\n  iqr_wellbeing = IQR(employees$wellbeing),\n  range_wellbeing = max(employees$wellbeing) - min(employees$wellbeing)\n)',
    ],
    check: `
      if (!has_answer("spread")) {
        list(pass = FALSE, message = "I could not find an object called spread.")
      } else {
        got <- answer("spread")
        d <- read.csv("data/workplace.csv", stringsAsFactors = TRUE)
        needed <- c("sd_wellbeing", "iqr_wellbeing", "range_wellbeing")
        if (!is.data.frame(got) || nrow(got) != 1L) {
          list(pass = FALSE, message = "spread should be a one-row data frame with three columns.")
        } else if (!all(needed %in% names(got))) {
          list(pass = FALSE, message = paste0("spread is missing the column(s): ", paste(setdiff(needed, names(got)), collapse = ", "), "."))
        } else if (isTRUE(all.equal(as.vector(got$sd_wellbeing), sd(d$wellbeing) / sqrt(nrow(d)), tolerance = 1e-6, check.attributes = FALSE))) {
          list(pass = FALSE, message = paste0("You divided by the square root of n, which gives the standard error of the mean (", round(sd(d$wellbeing) / sqrt(nrow(d)), 3), "). That says how precisely you know the average; the standard deviation (", round(sd(d$wellbeing), 2), ") says how much employees differ from each other. Module 7 is about the difference."))
        } else if (!isTRUE(all.equal(as.vector(got$sd_wellbeing), sd(d$wellbeing), tolerance = 1e-6, check.attributes = FALSE))) {
          list(pass = FALSE, message = paste0("sd_wellbeing should be ", round(sd(d$wellbeing), 3), "."))
        } else if (isTRUE(all.equal(as.vector(got$iqr_wellbeing), as.vector(quantile(d$wellbeing, 0.75)), tolerance = 1e-6, check.attributes = FALSE))) {
          list(pass = FALSE, message = paste0("That is the upper quartile: the score three quarters of the way up. The interquartile range is the distance between the quartiles, ", round(IQR(d$wellbeing), 2), " - the width of the middle half of the company."))
        } else if (!isTRUE(all.equal(as.vector(got$iqr_wellbeing), IQR(d$wellbeing), tolerance = 1e-6, check.attributes = FALSE))) {
          list(pass = FALSE, message = paste0("iqr_wellbeing should be ", round(IQR(d$wellbeing), 3), "."))
        } else if (isTRUE(all.equal(as.vector(got$range_wellbeing), max(d$wellbeing), tolerance = 1e-6, check.attributes = FALSE))) {
          list(pass = FALSE, message = paste0("That is the highest score on its own. The range is a distance: the highest minus the lowest, ", round(max(d$wellbeing) - min(d$wellbeing), 2), "."))
        } else if (!isTRUE(all.equal(as.vector(got$range_wellbeing), max(d$wellbeing) - min(d$wellbeing), tolerance = 1e-6, check.attributes = FALSE))) {
          list(pass = FALSE, message = paste0("range_wellbeing should be ", round(max(d$wellbeing) - min(d$wellbeing), 3), "."))
        } else {
          list(pass = TRUE, message = paste0("Correct: SD ", round(sd(d$wellbeing), 2), ", IQR ", round(IQR(d$wellbeing), 2), ", range ", round(max(d$wellbeing) - min(d$wellbeing), 2), ". The range is built from the two most extreme people in the company, so it moves whenever either of them does; the IQR ignores them both."))
        }
      }
    `,
    hints: [
      'sd() gives the standard deviation, IQR() the interquartile range.',
      'R has a function called range(), but it returns two numbers - the smallest and the largest. Here you want the distance between them.',
      'max(wellbeing) - min(wellbeing) is that distance in one expression.',
    ],
  },
  {
    id: 'm3-2-a',
    prompt:
      'Describe wellbeing department by department. Store a data frame in by_department with one row per department and the columns mean_wellbeing, sd_wellbeing and n.',
    starterCode:
      'library(dplyr)\nemployees <- read.csv("data/workplace.csv", stringsAsFactors = TRUE)\n\nby_department <- employees %>%\n  ',
    solution:
      'library(dplyr)\nemployees <- read.csv("data/workplace.csv", stringsAsFactors = TRUE)\nby_department <- employees %>%\n  group_by(department) %>%\n  summarise(mean_wellbeing = mean(wellbeing), sd_wellbeing = sd(wellbeing), n = n())',
    wrongAnswers: [
      // No grouping: one row describing the whole company.
      'library(dplyr)\nemployees <- read.csv("data/workplace.csv", stringsAsFactors = TRUE)\nby_department <- employees %>%\n  summarise(mean_wellbeing = mean(wellbeing), sd_wellbeing = sd(wellbeing), n = n())',
      // Grouped, but with mutate(), so the summary is pasted onto all 480 rows.
      'library(dplyr)\nemployees <- read.csv("data/workplace.csv", stringsAsFactors = TRUE)\nby_department <- employees %>%\n  group_by(department) %>%\n  mutate(mean_wellbeing = mean(wellbeing), sd_wellbeing = sd(wellbeing), n = n())',
      // Grouped by one variable too many: a row per department and site.
      'library(dplyr)\nemployees <- read.csv("data/workplace.csv", stringsAsFactors = TRUE)\nby_department <- employees %>%\n  group_by(department, site) %>%\n  summarise(mean_wellbeing = mean(wellbeing), sd_wellbeing = sd(wellbeing), n = n())',
    ],
    alternateSolutions: [
      // length() instead of n(): the same count, written differently.
      'library(dplyr)\nemployees <- read.csv("data/workplace.csv", stringsAsFactors = TRUE)\nby_department <- employees %>%\n  group_by(department) %>%\n  summarise(mean_wellbeing = mean(wellbeing), sd_wellbeing = sd(wellbeing), n = length(wellbeing))',
      // Base R with tapply(), which is what group_by() replaced.
      'employees <- read.csv("data/workplace.csv", stringsAsFactors = TRUE)\nby_department <- data.frame(\n  department = levels(employees$department),\n  mean_wellbeing = as.vector(tapply(employees$wellbeing, employees$department, mean)),\n  sd_wellbeing = as.vector(tapply(employees$wellbeing, employees$department, sd)),\n  n = as.vector(table(employees$department))\n)',
    ],
    check: `
      if (!has_answer("by_department")) {
        list(pass = FALSE, message = "I could not find an object called by_department.")
      } else {
        got <- answer("by_department")
        d <- read.csv("data/workplace.csv", stringsAsFactors = TRUE)
        needed <- c("mean_wellbeing", "sd_wellbeing", "n")
        n_groups <- nlevels(d$department)
        if (!is.data.frame(got)) {
          list(pass = FALSE, message = "by_department should be a data frame.")
        } else if (nrow(got) == 1L) {
          list(pass = FALSE, message = "by_department has a single row, which describes the whole company. group_by(department) before summarise() gives one row per department.")
        } else if (nrow(got) == nrow(d)) {
          list(pass = FALSE, message = paste0("by_department has ", nrow(d), " rows: each employee, with their department's mean written beside them. That is what mutate() does. summarise() collapses each group to one row."))
        } else if (!("department" %in% names(got))) {
          list(pass = FALSE, message = "by_department has no department column, so there is no way to tell which row is which. group_by() keeps the grouping column in the result.")
        } else if (nrow(got) != n_groups) {
          list(pass = FALSE, message = paste0("by_department has ", nrow(got), " rows, but there are ", n_groups, " departments. Check how many variables you grouped by - each extra one multiplies the rows."))
        } else if (!all(needed %in% names(got))) {
          list(pass = FALSE, message = paste0("by_department is missing the column(s): ", paste(setdiff(needed, names(got)), collapse = ", "), "."))
        } else {
          key <- as.character(got$department)
          means <- tapply(d$wellbeing, d$department, mean)
          sds <- tapply(d$wellbeing, d$department, sd)
          counts <- table(d$department)
          if (!all(key %in% names(means))) {
            list(pass = FALSE, message = "The department column does not hold the four department names.")
          } else if (!isTRUE(all.equal(as.vector(got$mean_wellbeing), as.vector(means[key]), tolerance = 1e-6, check.attributes = FALSE))) {
            list(pass = FALSE, message = "mean_wellbeing does not match the mean wellbeing of each department. Check that you are averaging wellbeing, and that the grouping happened before the summary.")
          } else if (!isTRUE(all.equal(as.vector(got$sd_wellbeing), as.vector(sds[key]), tolerance = 1e-6, check.attributes = FALSE))) {
            list(pass = FALSE, message = "sd_wellbeing does not match the standard deviation within each department.")
          } else if (!isTRUE(all.equal(as.vector(got$n), as.vector(counts[key]), tolerance = 1e-6, check.attributes = FALSE))) {
            list(pass = FALSE, message = paste0("n should be the size of each department (", paste(as.vector(counts), collapse = ", "), "), not the size of the company. n() counts the rows in the group it is called on."))
          } else {
            list(pass = TRUE, message = paste0("Correct - four departments, ", paste(as.vector(counts), collapse = ", "), " employees. The departments differ by ", round(max(as.vector(means)) - min(as.vector(means)), 1), " points at the extremes, while individuals within each department differ by far more than that, as the SDs show. Lesson 3-3 asks whether the means are telling the truth."))
          }
        }
      }
    `,
    hints: [
      'group_by(department) tells the next verb to work inside each department separately.',
      'summarise() then returns one row per group, with the grouping column kept.',
      'n() counts the rows of the group it is called in, so it gives a department size here.',
    ],
  },
  {
    id: 'm3-2-b',
    prompt:
      'Do remote employees report higher wellbeing? Store by_remote (one row per level of remote, with mean_wellbeing and n), and store the difference remote minus office in remote_gap.',
    starterCode:
      'library(dplyr)\nemployees <- read.csv("data/workplace.csv", stringsAsFactors = TRUE)\n\nby_remote <- employees %>%\n  \nremote_gap <- ',
    solution:
      'library(dplyr)\nemployees <- read.csv("data/workplace.csv", stringsAsFactors = TRUE)\nby_remote <- employees %>%\n  group_by(remote) %>%\n  summarise(mean_wellbeing = mean(wellbeing), n = n())\nremote_gap <- with(by_remote, mean_wellbeing[remote == "Yes"] - mean_wellbeing[remote == "No"])',
    wrongAnswers: [
      // Office minus remote: the right size, the wrong sign, the opposite conclusion.
      'library(dplyr)\nemployees <- read.csv("data/workplace.csv", stringsAsFactors = TRUE)\nby_remote <- employees %>%\n  group_by(remote) %>%\n  summarise(mean_wellbeing = mean(wellbeing), n = n())\nremote_gap <- with(by_remote, mean_wellbeing[remote == "No"] - mean_wellbeing[remote == "Yes"])',
      // Medians in a column called mean_wellbeing.
      'library(dplyr)\nemployees <- read.csv("data/workplace.csv", stringsAsFactors = TRUE)\nby_remote <- employees %>%\n  group_by(remote) %>%\n  summarise(mean_wellbeing = median(wellbeing), n = n())\nremote_gap <- with(by_remote, mean_wellbeing[remote == "Yes"] - mean_wellbeing[remote == "No"])',
      // nrow(employees) inside summarise ignores the grouping entirely.
      'library(dplyr)\nemployees <- read.csv("data/workplace.csv", stringsAsFactors = TRUE)\nby_remote <- employees %>%\n  group_by(remote) %>%\n  summarise(mean_wellbeing = mean(wellbeing), n = nrow(employees))\nremote_gap <- with(by_remote, mean_wellbeing[remote == "Yes"] - mean_wellbeing[remote == "No"])',
    ],
    alternateSolutions: [
      // tapply() for the gap, dplyr for the table.
      'library(dplyr)\nemployees <- read.csv("data/workplace.csv", stringsAsFactors = TRUE)\nby_remote <- employees %>%\n  group_by(remote) %>%\n  summarise(mean_wellbeing = mean(wellbeing), n = n())\nmeans <- tapply(employees$wellbeing, employees$remote, mean)\nremote_gap <- as.vector(means[["Yes"]] - means[["No"]])',
      // Two filtered means, subtracted.
      'library(dplyr)\nemployees <- read.csv("data/workplace.csv", stringsAsFactors = TRUE)\nby_remote <- employees %>%\n  group_by(remote) %>%\n  summarise(mean_wellbeing = mean(wellbeing), n = n())\nremote_gap <- mean(filter(employees, remote == "Yes")$wellbeing) - mean(filter(employees, remote == "No")$wellbeing)',
    ],
    check: `
      if (!has_answer("by_remote") || !has_answer("remote_gap")) {
        list(pass = FALSE, message = "I need by_remote (the two-row summary) and remote_gap (the difference between the two means).")
      } else {
        got <- answer("by_remote")
        gap <- as.vector(answer("remote_gap"))
        d <- read.csv("data/workplace.csv", stringsAsFactors = TRUE)
        means <- tapply(d$wellbeing, d$remote, mean)
        medians <- tapply(d$wellbeing, d$remote, median)
        counts <- table(d$remote)
        expected_gap <- as.vector(means[["Yes"]] - means[["No"]])
        if (!is.data.frame(got)) {
          list(pass = FALSE, message = "by_remote should be a data frame.")
        } else if (!all(c("remote", "mean_wellbeing", "n") %in% names(got))) {
          list(pass = FALSE, message = "by_remote needs the columns remote, mean_wellbeing and n.")
        } else if (nrow(got) != 2L) {
          list(pass = FALSE, message = paste0("by_remote has ", nrow(got), " rows. remote has two levels, so grouping by it gives two rows."))
        } else {
          key <- as.character(got$remote)
          if (!setequal(key, names(means))) {
            list(pass = FALSE, message = "The remote column should hold No and Yes.")
          } else if (isTRUE(all.equal(as.vector(got$mean_wellbeing), as.vector(medians[key]), tolerance = 1e-6, check.attributes = FALSE)) &&
                     !isTRUE(all.equal(as.vector(medians[key]), as.vector(means[key]), tolerance = 1e-6, check.attributes = FALSE))) {
            list(pass = FALSE, message = "Those are the medians. The column is called mean_wellbeing, and lesson 3-3 is about how much the choice between them can change a story - so it is worth being exact about which one you computed.")
          } else if (!isTRUE(all.equal(as.vector(got$mean_wellbeing), as.vector(means[key]), tolerance = 1e-6, check.attributes = FALSE))) {
            list(pass = FALSE, message = "mean_wellbeing does not match the mean wellbeing of the two groups.")
          } else if (!isTRUE(all.equal(as.vector(got$n), as.vector(counts[key]), tolerance = 1e-6, check.attributes = FALSE))) {
            list(pass = FALSE, message = paste0("n should be the size of each group (", paste(as.vector(counts), collapse = " and "), "). nrow(employees) ignores the grouping and reports the whole company in both rows; n() respects it."))
          } else if (!is.numeric(gap) || length(gap) != 1L) {
            list(pass = FALSE, message = "remote_gap should be a single number.")
          } else if (isTRUE(all.equal(gap, -expected_gap, tolerance = 1e-6, check.attributes = FALSE))) {
            list(pass = FALSE, message = paste0("Right size, wrong sign: you computed office minus remote. The question asks for remote minus office, which is ", round(expected_gap, 2), ". A sign is a conclusion, so this is worth being careful about."))
          } else if (!isTRUE(all.equal(gap, expected_gap, tolerance = 1e-6, check.attributes = FALSE))) {
            list(pass = FALSE, message = paste0("remote_gap is ", round(gap, 3), ", but the two means differ by ", round(expected_gap, 3), "."))
          } else {
            list(pass = TRUE, message = paste0("Correct: remote employees average ", round(expected_gap, 2), " points more wellbeing. That is a description of these 480 people, not yet a claim about anyone else - Module 8 is where you learn what would justify the stronger sentence."))
          }
        }
      }
    `,
    hints: [
      'group_by(remote) then summarise() gives one row per level of remote.',
      'n() inside summarise counts the rows of the current group; nrow(employees) would ignore the grouping.',
      'To pick one row of the result, index by the level name: with(by_remote, mean_wellbeing[remote == "Yes"]) is the remote mean.',
    ],
  },
  {
    id: 'm3-3-a',
    prompt:
      'Compare the two summaries side by side. Store department_shape with one row per department and the columns mean_wellbeing, median_wellbeing and n, then store the name of the department with the highest median wellbeing in highest_median.',
    starterCode:
      'library(dplyr)\nemployees <- read.csv("data/workplace.csv", stringsAsFactors = TRUE)\n\ndepartment_shape <- employees %>%\n  \nhighest_median <- ',
    solution:
      'library(dplyr)\nemployees <- read.csv("data/workplace.csv", stringsAsFactors = TRUE)\ndepartment_shape <- employees %>%\n  group_by(department) %>%\n  summarise(mean_wellbeing = mean(wellbeing), median_wellbeing = median(wellbeing), n = n())\nhighest_median <- department_shape %>%\n  slice_max(median_wellbeing, n = 1) %>%\n  pull(department) %>%\n  as.character()',
    wrongAnswers: [
      // The department with the highest MEAN, which is the whole point of the lesson.
      'library(dplyr)\nemployees <- read.csv("data/workplace.csv", stringsAsFactors = TRUE)\ndepartment_shape <- employees %>%\n  group_by(department) %>%\n  summarise(mean_wellbeing = mean(wellbeing), median_wellbeing = median(wellbeing), n = n())\nhighest_median <- department_shape %>%\n  slice_max(mean_wellbeing, n = 1) %>%\n  pull(department) %>%\n  as.character()',
      // slice_min: the lowest median rather than the highest.
      'library(dplyr)\nemployees <- read.csv("data/workplace.csv", stringsAsFactors = TRUE)\ndepartment_shape <- employees %>%\n  group_by(department) %>%\n  summarise(mean_wellbeing = mean(wellbeing), median_wellbeing = median(wellbeing), n = n())\nhighest_median <- department_shape %>%\n  slice_min(median_wellbeing, n = 1) %>%\n  pull(department) %>%\n  as.character()',
      // The median column filled with means, so the two columns say the same thing.
      'library(dplyr)\nemployees <- read.csv("data/workplace.csv", stringsAsFactors = TRUE)\ndepartment_shape <- employees %>%\n  group_by(department) %>%\n  summarise(mean_wellbeing = mean(wellbeing), median_wellbeing = mean(wellbeing), n = n())\nhighest_median <- department_shape %>%\n  slice_max(median_wellbeing, n = 1) %>%\n  pull(department) %>%\n  as.character()',
    ],
    alternateSolutions: [
      // which.max() on the column, which is what slice_max() does underneath.
      'library(dplyr)\nemployees <- read.csv("data/workplace.csv", stringsAsFactors = TRUE)\ndepartment_shape <- employees %>%\n  group_by(department) %>%\n  summarise(mean_wellbeing = mean(wellbeing), median_wellbeing = median(wellbeing), n = n())\nhighest_median <- as.character(department_shape$department[which.max(department_shape$median_wellbeing)])',
      // Sort, then take the top row.
      'library(dplyr)\nemployees <- read.csv("data/workplace.csv", stringsAsFactors = TRUE)\ndepartment_shape <- employees %>%\n  group_by(department) %>%\n  summarise(mean_wellbeing = mean(wellbeing), median_wellbeing = median(wellbeing), n = n()) %>%\n  arrange(desc(median_wellbeing))\nhighest_median <- as.character(department_shape$department[1])',
    ],
    check: `
      if (!has_answer("department_shape") || !has_answer("highest_median")) {
        list(pass = FALSE, message = "I need department_shape (the table) and highest_median (one department name).")
      } else {
        got <- answer("department_shape")
        top <- as.character(as.vector(answer("highest_median")))
        d <- read.csv("data/workplace.csv", stringsAsFactors = TRUE)
        means <- tapply(d$wellbeing, d$department, mean)
        medians <- tapply(d$wellbeing, d$department, median)
        counts <- table(d$department)
        top_median <- names(medians)[which.max(medians)]
        top_mean <- names(means)[which.max(means)]
        needed <- c("department", "mean_wellbeing", "median_wellbeing", "n")
        if (!is.data.frame(got)) {
          list(pass = FALSE, message = "department_shape should be a data frame.")
        } else if (!all(needed %in% names(got))) {
          list(pass = FALSE, message = paste0("department_shape is missing the column(s): ", paste(setdiff(needed, names(got)), collapse = ", "), "."))
        } else if (nrow(got) != nlevels(d$department)) {
          list(pass = FALSE, message = paste0("department_shape has ", nrow(got), " rows, but there are ", nlevels(d$department), " departments."))
        } else if (!all(as.character(got$department) %in% names(means))) {
          list(pass = FALSE, message = "The department column does not hold the department names.")
        } else if (!isTRUE(all.equal(as.vector(got$mean_wellbeing), as.vector(means[as.character(got$department)]), tolerance = 1e-6, check.attributes = FALSE))) {
          list(pass = FALSE, message = "mean_wellbeing does not match the mean wellbeing of each department.")
        } else if (isTRUE(all.equal(as.vector(got$median_wellbeing), as.vector(means[as.character(got$department)]), tolerance = 1e-6, check.attributes = FALSE))) {
          list(pass = FALSE, message = "median_wellbeing holds the means again, so the two columns cannot disagree - and the disagreement is exactly what this lesson is about. Use median() for the second column.")
        } else if (!isTRUE(all.equal(as.vector(got$median_wellbeing), as.vector(medians[as.character(got$department)]), tolerance = 1e-6, check.attributes = FALSE))) {
          list(pass = FALSE, message = "median_wellbeing does not match the median wellbeing of each department.")
        } else if (!isTRUE(all.equal(as.vector(got$n), as.vector(counts[as.character(got$department)]), tolerance = 1e-6, check.attributes = FALSE))) {
          list(pass = FALSE, message = "n should be the number of employees in each department.")
        } else if (length(top) != 1L || is.na(top)) {
          list(pass = FALSE, message = "highest_median should be a single department name.")
        } else if (identical(top, top_mean) && !identical(top_mean, top_median)) {
          list(pass = FALSE, message = paste0("You found the department with the highest MEAN. The question asks for the highest median, and in this company they are not the same department - which is the entire point of the lesson. Sort by median_wellbeing instead."))
        } else if (identical(top, names(medians)[which.min(medians)]) && !identical(top, top_median)) {
          list(pass = FALSE, message = "That is the lowest median, not the highest. slice_max() takes the top; slice_min() takes the bottom.")
        } else if (!identical(top, top_median)) {
          list(pass = FALSE, message = paste0("highest_median is ", top, ", but the highest median wellbeing belongs to a different department."))
        } else {
          list(pass = TRUE, message = paste0(top_median, " has the highest median wellbeing (", round(max(medians), 1), "), while the highest mean belongs to ", top_mean, " (", round(max(means), 1), "). Two honest summaries of the same column, two different answers to \\"which department is doing best\\" - which is why you report both, or show the distribution."))
        }
      }
    `,
    hints: [
      'Add median_wellbeing = median(wellbeing) beside the mean in the same summarise() call.',
      'slice_max(median_wellbeing, n = 1) keeps the row with the largest median.',
      'pull(department) turns that one-cell column into a value; as.character() drops the factor labelling.',
    ],
  },
  {
    id: 'm3-4-a',
    prompt:
      'Agreeing with q3 means LOW wellbeing, so it has to be turned round before it joins the others. Store the reversed item in survey$q3_r, on the same 1 to 5 scale, then store each person\'s scale score, the mean of q1, q2, q3_r, q4 and q5, in survey$score.',
    starterCode:
      '# survey is already in your environment.\nhead(survey)\n\nsurvey$q3_r <- \nsurvey$score <- ',
    setupCode: SURVEY,
    solution:
      'survey$q3_r <- 6 - survey$q3\nsurvey$score <- rowMeans(survey[, c("q1", "q2", "q3_r", "q4", "q5")])',
    wrongAnswers: [
      // 5 - q3 puts the item on 0 to 4, so every score is 0.2 too low.
      'survey$q3_r <- 5 - survey$q3\nsurvey$score <- rowMeans(survey[, c("q1", "q2", "q3_r", "q4", "q5")])',
      // Never reversed: q3 cancels the other items out.
      'survey$q3_r <- survey$q3\nsurvey$score <- rowMeans(survey[, c("q1", "q2", "q3", "q4", "q5")])',
      // The sum rather than the mean, which leaves the 1 to 5 scale.
      'survey$q3_r <- 6 - survey$q3\nsurvey$score <- rowSums(survey[, c("q1", "q2", "q3_r", "q4", "q5")])',
    ],
    alternateSolutions: [
      // The mean written out by hand.
      'survey$q3_r <- 6 - survey$q3\nsurvey$score <- (survey$q1 + survey$q2 + survey$q3_r + survey$q4 + survey$q5) / 5',
    ],
    check: `
      if (!has_answer("survey")) {
        list(pass = FALSE, message = "The survey has gone missing. Press Reset and try again.")
      } else {
        s <- answer("survey")
        reversed <- 6 - s$q3
        target <- (s$q1 + s$q2 + reversed + s$q4 + s$q5) / 5
        if (!is.data.frame(s) || !all(c("q3_r", "score") %in% names(s))) {
          list(pass = FALSE, message = "Add two columns to survey: q3_r and score.")
        } else if (isTRUE(all.equal(as.numeric(s$q3_r), s$q3))) {
          list(pass = FALSE, message = "q3_r is the same as q3. Reversing a 1 to 5 item turns 1 into 5 and 5 into 1: 6 - q3.")
        } else if (isTRUE(all.equal(as.numeric(s$q3_r), 5 - s$q3))) {
          list(pass = FALSE, message = "5 - q3 turns the item into 0 to 4. On a 1 to 5 scale the reversed item is (lowest + highest) - q3, so 6 - q3.")
        } else if (!isTRUE(all.equal(as.numeric(s$q3_r), reversed))) {
          list(pass = FALSE, message = "q3_r should be 6 - q3, so that a 1 becomes a 5 and a 5 becomes a 1.")
        } else if (isTRUE(all.equal(as.numeric(s$score), target * 5))) {
          list(pass = FALSE, message = "That is the sum of the items. Take the mean, so the score stays on the 1 to 5 scale the items were answered on.")
        } else if (!isTRUE(all.equal(as.numeric(s$score), target))) {
          list(pass = FALSE, message = "score should be the mean of q1, q2, q3_r, q4 and q5: the reversed q3, not the original.")
        } else {
          list(pass = TRUE, message = paste0("Correct. Scores run from ", min(target), " to ", max(target), ", on the same 1 to 5 scale as the answers. Next: do the five items deserve to be averaged at all?"))
        }
      }
    `,
    hints: [
      'On a 1 to 5 scale, 6 - x turns 1 into 5, 2 into 4 and leaves 3 where it is.',
      'rowMeans() takes the mean across the columns you give it, one value per person.',
      'survey$score <- rowMeans(survey[, c("q1", "q2", "q3_r", "q4", "q5")])',
    ],
  },
  {
    id: 'm3-4-b',
    prompt:
      'How consistently do the five items measure one thing? Compute Cronbach\'s alpha for q1, q2, q3_r, q4 and q5 and store it in alpha. The formula is in the starter code.',
    starterCode:
      '# survey, with q3_r already added, is in your environment.\nitems <- survey[, c("q1", "q2", "q3_r", "q4", "q5")]\nk <- ncol(items)\n\n# alpha = k / (k - 1) * (1 - sum of the item variances / variance of the total)\nalpha <- ',
    setupCode: REVERSED,
    solution:
      'items <- survey[, c("q1", "q2", "q3_r", "q4", "q5")]\nk <- ncol(items)\nalpha <- k / (k - 1) * (1 - sum(apply(items, 2, var)) / var(rowSums(items)))',
    wrongAnswers: [
      // The original q3, so the reversed item pulls against the rest.
      'items <- survey[, c("q1", "q2", "q3", "q4", "q5")]\nk <- ncol(items)\nalpha <- k / (k - 1) * (1 - sum(apply(items, 2, var)) / var(rowSums(items)))',
      // Standard deviations where the formula has variances.
      'items <- survey[, c("q1", "q2", "q3_r", "q4", "q5")]\nk <- ncol(items)\nalpha <- k / (k - 1) * (1 - sum(apply(items, 2, sd)) / sd(rowSums(items)))',
      // The variance of the mean score instead of the total.
      'items <- survey[, c("q1", "q2", "q3_r", "q4", "q5")]\nk <- ncol(items)\nalpha <- k / (k - 1) * (1 - sum(apply(items, 2, var)) / var(rowMeans(items)))',
    ],
    alternateSolutions: [
      // From the covariance matrix: its diagonal holds the item variances, its sum the variance of the total.
      'C <- cov(survey[, c("q1", "q2", "q3_r", "q4", "q5")])\nalpha <- ncol(C) / (ncol(C) - 1) * (1 - sum(diag(C)) / sum(C))',
    ],
    check: `
      if (!has_answer("survey")) {
        list(pass = FALSE, message = "The survey has gone missing. Press Reset and try again.")
      } else if (!has_answer("alpha")) {
        list(pass = FALSE, message = "I could not find an object called alpha.")
      } else {
        s <- answer("survey")
        alpha_of <- function(items) {
          k <- ncol(items)
          k / (k - 1) * (1 - sum(apply(items, 2, var)) / var(rowSums(items)))
        }
        items <- data.frame(s$q1, s$q2, 6 - s$q3, s$q4, s$q5)
        target <- alpha_of(items)
        unreversed <- alpha_of(data.frame(s$q1, s$q2, s$q3, s$q4, s$q5))
        got <- suppressWarnings(as.numeric(answer("alpha")))
        if (length(got) != 1L || is.na(got)) {
          list(pass = FALSE, message = "alpha should be a single number.")
        } else if (abs(got - unreversed) < 1e-6) {
          list(pass = FALSE, message = paste0("alpha is ", round(got, 2), ", close to nothing, because q3 still points the other way and cancels the rest out. Use q3_r."))
        } else if (abs(got - target) > 1e-6) {
          list(pass = FALSE, message = paste0("alpha is ", round(got, 3), ", but it should be ", round(target, 3), ". The formula uses variances, var(), both for the items and for the total, rowSums()."))
        } else {
          list(pass = TRUE, message = paste0("Correct: alpha = ", format(round(target, 2), nsmall = 2), ". Acceptable, and the lesson shows which item is holding it back."))
        }
      }
    `,
    hints: [
      'apply(items, 2, var) gives the variance of each column; sum() adds them up.',
      'The total is rowSums(items): each person\'s five answers added together.',
      'alpha <- k / (k - 1) * (1 - sum(apply(items, 2, var)) / var(rowSums(items)))',
    ],
  },
];
