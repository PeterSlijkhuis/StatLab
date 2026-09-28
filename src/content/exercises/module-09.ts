import type { ExerciseDef } from '../../r/checker';

const LOAD = 'd <- read.csv("data/workplace.csv", stringsAsFactors = TRUE)';

export const module09: ExerciseDef[] = [
  {
    id: 'm9-1-a',
    prompt:
      'What share of employees work remotely, and how precisely does a sample of 480 pin that share down? Store the proportion of remote workers in p_remote, and its 95% confidence interval, as two numbers, in ci_remote. prop.test() gives you the interval.',
    starterCode: `${LOAD}\n\nn_remote <- sum(d$remote == "Yes")\n\np_remote <- \nci_remote <- `,
    solution: `${LOAD}\nn_remote <- sum(d$remote == "Yes")\np_remote <- n_remote / nrow(d)\nci_remote <- prop.test(n_remote, nrow(d))$conf.int`,
    wrongAnswers: [
      // The interval of the office workers' share, not the remote workers'.
      `${LOAD}\np_remote <- mean(d$remote == "Yes")\nci_remote <- prop.test(sum(d$remote == "No"), nrow(d))$conf.int`,
      // The count, not the proportion.
      `${LOAD}\np_remote <- sum(d$remote == "Yes")\nci_remote <- prop.test(sum(d$remote == "Yes"), nrow(d))$conf.int`,
      // The SD of a single yes-or-no answer instead of the standard error of the proportion.
      `${LOAD}\np_remote <- mean(d$remote == "Yes")\nci_remote <- p_remote + c(-1.96, 1.96) * sqrt(p_remote * (1 - p_remote))`,
    ],
    alternateSolutions: [
      // The exact binomial interval.
      `${LOAD}\np_remote <- mean(d$remote == "Yes")\nci_remote <- binom.test(sum(d$remote == "Yes"), nrow(d))$conf.int`,
      // The interval by hand, from the standard error.
      `${LOAD}\np_remote <- mean(d$remote == "Yes")\nse <- sqrt(p_remote * (1 - p_remote) / nrow(d))\nci_remote <- c(p_remote - 1.96 * se, p_remote + 1.96 * se)`,
    ],
    check: `
      d <- read.csv("data/workplace.csv", stringsAsFactors = TRUE)
      n <- nrow(d)
      k <- sum(d$remote == "Yes")
      p <- k / n
      target <- as.vector(prop.test(k, n)$conf.int)
      office <- as.vector(prop.test(n - k, n)$conf.int)
      if (!has_answer("p_remote")) {
        list(pass = FALSE, message = "I could not find an object called p_remote.")
      } else if (!has_answer("ci_remote")) {
        list(pass = FALSE, message = "I could not find an object called ci_remote.")
      } else {
        got_p <- suppressWarnings(as.numeric(answer("p_remote")))
        ci <- suppressWarnings(as.numeric(answer("ci_remote")))
        if (length(got_p) != 1L || is.na(got_p)) {
          list(pass = FALSE, message = "p_remote should be one number: the share of employees who work remotely.")
        } else if (abs(got_p - k) < 1e-6) {
          list(pass = FALSE, message = paste0("p_remote is ", k, ", which is how many people work remotely. A proportion divides that count by the ", n, " employees."))
        } else if (abs(got_p - p) > 1e-6) {
          list(pass = FALSE, message = paste0("p_remote is ", round(got_p, 3), ", but ", k, " of ", n, " employees work remotely, a proportion of ", round(p, 3), "."))
        } else if (length(ci) != 2L || any(is.na(ci))) {
          list(pass = FALSE, message = "ci_remote should be two numbers: the lower and the upper end of the interval. prop.test(...)$conf.int is exactly that.")
        } else if (all(abs(sort(ci) - office) < 0.01)) {
          list(pass = FALSE, message = "That is the interval for the share who work in the office. Count the remote workers, remote == \\"Yes\\", before you hand the count to prop.test().")
        } else if (diff(sort(ci)) > 0.3) {
          list(pass = FALSE, message = paste0("Your interval is ", round(diff(sort(ci)), 2), " wide, far too wide for 480 people. The margin uses the standard error, sqrt(p * (1 - p) / n), not the spread of a single answer, sqrt(p * (1 - p))."))
        } else if (any(abs(sort(ci) - target) > 0.01)) {
          list(pass = FALSE, message = paste0("ci_remote runs from ", round(min(ci), 3), " to ", round(max(ci), 3), ", but the 95% interval for the remote share is about ", round(target[1], 3), " to ", round(target[2], 3), "."))
        } else {
          list(pass = TRUE, message = paste0("Correct: ", round(100 * p, 1), "% work remotely, 95% CI [", round(100 * target[1], 1), "%, ", round(100 * target[2], 1), "%]. The same sample size gives a narrower interval for a share near 0 or 1 than for one near a half."))
        }
      }
    `,
    hints: [
      'sum(d$remote == "Yes") counts the remote workers; divide by nrow(d) for the proportion.',
      'prop.test(count, total) tests a proportion and returns its confidence interval as conf.int.',
      'ci_remote <- prop.test(n_remote, nrow(d))$conf.int',
    ],
  },
  {
    id: 'm9-2-a',
    prompt:
      'Which department loses the most people? Cross department with left_company, then turn the counts into row proportions, so that each department adds up to 1 and the second column is its leaving rate. Store the result in leave_rates.',
    starterCode: `${LOAD}\n\ncounts <- table(d$department, d$left_company)\ncounts\n\nleave_rates <- `,
    solution: `${LOAD}\ncounts <- table(d$department, d$left_company)\nleave_rates <- prop.table(counts, margin = 1)`,
    wrongAnswers: [
      // Every cell as a share of all 480 people.
      `${LOAD}\ncounts <- table(d$department, d$left_company)\nleave_rates <- prop.table(counts)`,
      // Column proportions: which departments the leavers came from.
      `${LOAD}\ncounts <- table(d$department, d$left_company)\nleave_rates <- prop.table(counts, margin = 2)`,
      // The counts, never turned into proportions.
      `${LOAD}\nleave_rates <- table(d$department, d$left_company)`,
    ],
    alternateSolutions: [
      // Dividing each row by its total.
      `${LOAD}\ncounts <- table(d$department, d$left_company)\nleave_rates <- counts / rowSums(counts)`,
      // The leaving rate directly, as the mean of a 0-1 column per department.
      `${LOAD}\nleave_rates <- aggregate(left_company ~ department, data = d, FUN = mean)`,
    ],
    check: `
      d <- read.csv("data/workplace.csv", stringsAsFactors = TRUE)
      counts <- table(d$department, d$left_company)
      rates <- as.vector(prop.table(counts, 1)[, "1"])
      by_column <- as.vector(prop.table(counts, 2)[, "1"])
      if (!has_answer("leave_rates")) {
        list(pass = FALSE, message = "I could not find an object called leave_rates.")
      } else {
        got <- answer("leave_rates")
        values <- if (is.data.frame(got)) unlist(numeric_columns(got)) else suppressWarnings(as.numeric(unclass(got)))
        found <- function(targets) all(vapply(targets, function(r) any(abs(values - r) < 1e-6), logical(1)))
        if (length(values) == 0L || all(is.na(values))) {
          list(pass = FALSE, message = "leave_rates should hold numbers: one leaving rate per department.")
        } else if (found(rates)) {
          top <- levels(d$department)[which.max(rates)]
          list(pass = TRUE, message = paste0("Correct. ", top, " loses ", round(100 * max(rates)), "% of its people and the lowest department ", round(100 * min(rates)), "%. Whether a gap that size could be chance is the next lesson's question."))
        } else if (any(values > 1, na.rm = TRUE)) {
          list(pass = FALSE, message = "Those are still counts. Departments differ in size, so compare proportions: prop.table(counts, margin = 1).")
        } else if (found(by_column)) {
          list(pass = FALSE, message = "Those are column proportions: of everyone who left, which department they came from. The question is about each department's own rate, so divide by the row totals with margin = 1.")
        } else if (abs(sum(values, na.rm = TRUE) - 1) < 1e-6) {
          list(pass = FALSE, message = "Every cell is a share of all 480 employees, so the whole table adds up to 1. Give prop.table() margin = 1 so that each department adds up to 1 instead.")
        } else {
          list(pass = FALSE, message = paste0("I expected the four leaving rates, from ", round(min(rates), 3), " to ", round(max(rates), 3), ", and could not find them in leave_rates."))
        }
      }
    `,
    hints: [
      'prop.table() turns a table of counts into proportions. Its margin argument says what should add up to 1.',
      'margin = 1 means rows: each department then adds up to 1.',
      'leave_rates <- prop.table(counts, margin = 1)',
    ],
  },
  {
    id: 'm9-3-a',
    prompt:
      'Remote workers left at 18% and office workers at 26%. Is that more than chance? Run a chi-square test of independence on the remote by left_company table and store the result in remote_test.',
    starterCode: `${LOAD}\n\nremote_counts <- table(d$remote, d$left_company)\nremote_counts\n\nremote_test <- `,
    solution: `${LOAD}\nremote_counts <- table(d$remote, d$left_company)\nremote_test <- chisq.test(remote_counts)`,
    wrongAnswers: [
      // The department table, from the lesson, not the remote one.
      `${LOAD}\nremote_test <- chisq.test(table(d$department, d$left_company))`,
      // A goodness-of-fit test of remote alone: are there as many remote as office workers?
      `${LOAD}\nremote_test <- chisq.test(table(d$remote))`,
      // A t-test on a 0-1 outcome, which is not the test asked for.
      `${LOAD}\nremote_test <- t.test(left_company ~ remote, data = d)`,
    ],
    alternateSolutions: [
      // Two factors instead of a table; chisq.test() builds the table itself.
      `${LOAD}\nremote_test <- chisq.test(d$remote, d$left_company)`,
      // Without Yates' continuity correction.
      `${LOAD}\nremote_test <- chisq.test(table(d$remote, d$left_company), correct = FALSE)`,
    ],
    check: `
      d <- read.csv("data/workplace.csv", stringsAsFactors = TRUE)
      counts <- table(d$remote, d$left_company)
      yates <- unname(suppressWarnings(chisq.test(counts))$statistic)
      plain <- unname(suppressWarnings(chisq.test(counts, correct = FALSE))$statistic)
      departments <- unname(suppressWarnings(chisq.test(table(d$department, d$left_company)))$statistic)
      if (!has_answer("remote_test")) {
        list(pass = FALSE, message = "I could not find an object called remote_test.")
      } else {
        got <- answer("remote_test")
        if (!inherits(got, "htest")) {
          list(pass = FALSE, message = "remote_test should be the result of chisq.test(): store the whole test, not a number from it.")
        } else if (!grepl("Chi", got$method)) {
          list(pass = FALSE, message = paste0("That is a ", got$method, ". The question is about two categorical variables, so it calls for chisq.test()."))
        } else {
          stat <- unname(got$statistic)
          if (abs(stat - departments) < 1e-6) {
            list(pass = FALSE, message = "That is the department table from the lesson. Cross remote with left_company instead.")
          } else if (abs(stat - yates) > 1e-6 && abs(stat - plain) > 1e-6) {
            list(pass = FALSE, message = "That is a chi-square test, but not of remote by left_company. Give chisq.test() the two-way table of both variables; a table of remote alone only asks whether remote and office workers are equally common.")
          } else {
            list(pass = TRUE, message = paste0("Correct: chi-square(1, N = ", nrow(d), ") = ", round(stat, 2), ", p = ", format(round(got$p.value, 3), nsmall = 3), ". A 7-point gap in leaving rates, and this sample cannot tell it from chance at the .05 level."))
          }
        }
      }
    `,
    hints: [
      'chisq.test() takes a two-way table of counts.',
      'Build the table with remote in one direction and left_company in the other: table(d$remote, d$left_company).',
      'remote_test <- chisq.test(remote_counts)',
    ],
  },
  {
    id: 'm9-3-b',
    prompt:
      'Department and leaving were related, chi-square(3, N = 480) = 9.94, p = .019. How strongly? Compute Cramér\'s V for the department by left_company table and store it in v.',
    starterCode: `${LOAD}\n\ncounts <- table(d$department, d$left_company)\nx2 <- chisq.test(counts)$statistic\n\n# V = sqrt(x2 / (N * (smaller of rows and columns - 1)))\nv <- `,
    solution: `${LOAD}\ncounts <- table(d$department, d$left_company)\nx2 <- chisq.test(counts)$statistic\nv <- sqrt(x2 / (sum(counts) * (min(dim(counts)) - 1)))`,
    wrongAnswers: [
      // No square root.
      `${LOAD}\ncounts <- table(d$department, d$left_company)\nx2 <- chisq.test(counts)$statistic\nv <- x2 / (sum(counts) * (min(dim(counts)) - 1))`,
      // The larger dimension, four departments, instead of the smaller.
      `${LOAD}\ncounts <- table(d$department, d$left_company)\nx2 <- chisq.test(counts)$statistic\nv <- sqrt(x2 / (sum(counts) * (max(dim(counts)) - 1)))`,
      // Divided by the number of cells instead of the number of people.
      `${LOAD}\ncounts <- table(d$department, d$left_company)\nx2 <- chisq.test(counts)$statistic\nv <- sqrt(x2 / length(counts))`,
    ],
    alternateSolutions: [
      // With two columns, min - 1 is 1, so V is sqrt(x2 / N).
      `${LOAD}\nv <- sqrt(chisq.test(table(d$department, d$left_company))$statistic / nrow(d))`,
    ],
    check: `
      d <- read.csv("data/workplace.csv", stringsAsFactors = TRUE)
      counts <- table(d$department, d$left_company)
      x2 <- unname(chisq.test(counts)$statistic)
      target <- sqrt(x2 / nrow(d))
      if (!has_answer("v")) {
        list(pass = FALSE, message = "I could not find an object called v.")
      } else {
        got <- suppressWarnings(as.numeric(answer("v")))
        if (length(got) != 1L || is.na(got)) {
          list(pass = FALSE, message = "v should be a single number between 0 and 1.")
        } else if (abs(got - target^2) < 1e-6) {
          list(pass = FALSE, message = "Nearly: that is V squared. Take the square root of the whole ratio.")
        } else if (abs(got - sqrt(x2 / (nrow(d) * 3))) < 1e-6) {
          list(pass = FALSE, message = "You used the four departments. Cramer's V uses the smaller of the two dimensions, and left_company has only two columns, so min(dim(counts)) - 1 is 1.")
        } else if (abs(got - target) > 1e-4) {
          list(pass = FALSE, message = paste0("v is ", round(got, 3), ", but Cramer's V here is ", round(target, 3), ". Divide chi-square by N, the ", nrow(d), " employees, times the smaller dimension minus 1."))
        } else {
          list(pass = TRUE, message = paste0("Correct: V = ", format(round(target, 2), nsmall = 2), ". Significant, and small: department explains little of who leaves, which is exactly what the p-value alone would never have told you."))
        }
      }
    `,
    hints: [
      'N is the number of people in the table: sum(counts), or nrow(d).',
      'min(dim(counts)) is 2 here, so the term in brackets is 1.',
      'v <- sqrt(x2 / (sum(counts) * (min(dim(counts)) - 1)))',
    ],
  },
];
