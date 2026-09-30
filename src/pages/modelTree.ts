import { browserSupport } from '../r/packages';

/**
 * The decision tree behind the model chooser. Everything here is data: the
 * page in ModelChooser.tsx only walks it. Leaves are "answers"; every answer
 * has an id, which is what the page's ?model= link and the tests refer to.
 */
export type Node = Question | Answer;

export type Question = {
  kind: 'question';
  text: string;
  /** A sentence under the question for the student who is not sure which option fits. */
  help?: string;
  options: Option[];
};

export type Option = {
  /** Short, plain words a first-year understands. The page's walk and the tests follow it. */
  label: string;
  /** One concrete research question this choice fits, shown under the label. */
  example: string;
  /** The technical name, shown small, for the student who knows it. */
  tech: string;
  /** Starts a section of the "every model on this page" index. The deepest group on a path wins. */
  group?: string;
  next: Node;
};

export type Answer = {
  kind: 'answer';
  /** Stable and URL-safe: /which-model?model=<id> opens this answer directly. */
  id: string;
  /** The model's name, as the course teaches it. */
  model: string;
  /** One sentence: the situation this model fits. */
  when: string;
  /** Course-style R, one statement per line. Its library() calls decide where it can run. */
  rCode: string;
  /** What to check before trusting the result; names the alternative where one exists. */
  check: string;
  /** The traditional test this model reproduces, with its R call, when there is one. */
  traditional?: string;
  /** How to read the result. */
  note: string;
  /** The lesson that teaches this model. Set only when a lesson really does. */
  lessonId?: string;
  /** For a model the course does not teach: the lesson it extends, if one does. */
  buildsOn?: string;
  /** For a model the course does not teach: where to learn it. */
  further?: string;
};

/**
 * R's recommended packages: installed with R itself, so library() works in
 * RStudio without install.packages(). This site does not have them.
 */
export const SHIPS_WITH_R = ['MASS', 'nnet', 'survival', 'mgcv', 'cluster', 'nlme', 'boot', 'lattice', 'Matrix', 'rpart', 'class', 'KernSmooth', 'foreign', 'spatial', 'codetools'];

/** Every package the snippet attaches or calls with ::, in order of first mention. */
export function packagesIn(rCode: string): string[] {
  const found: string[] = [];
  for (const match of rCode.matchAll(/\blibrary\(\s*([A-Za-z][\w.]*)\s*\)|\b([A-Za-z][\w.]*)::/g)) {
    const name = match[1] ?? match[2];
    if (!found.includes(name)) found.push(name);
  }
  return found;
}

/** The packages a snippet needs that the R Workspace cannot load. Empty means it runs there. */
export function packagesMissingHere(answer: Pick<Answer, 'rCode'>): string[] {
  return packagesIn(answer.rCode).filter((name) => !['installed', 'recommended'].includes(browserSupport(name)));
}

/** The packages the R Workspace downloads the first time the snippet runs. */
export function packagesDownloaded(answer: Pick<Answer, 'rCode'>): string[] {
  return packagesIn(answer.rCode).filter((name) => browserSupport(name) === 'recommended');
}

/**
 * The sections of the "browse every model" list, in the order a student meets
 * them in the questions. Each answer's section is the deepest `group` on the
 * path to it, and every name used as a group must appear here.
 */
export const GROUPS: { name: string; blurb: string }[] = [
  { name: 'Numeric outcome: one sample or numeric predictors', blurb: 'A score, time or amount, explained by other numbers.' },
  { name: 'Numeric outcome: comparing groups', blurb: 'Differences between conditions, groups or categories.' },
  { name: 'Repeated measures and nested data', blurb: 'The same people measured more than once, or people in teams, classes or sites.' },
  { name: 'Yes-or-no outcomes', blurb: 'Passed or failed, left or stayed, and other two-way outcomes.' },
  { name: 'Categorical outcomes', blurb: 'Ordered ratings, unordered choices and cross-tables.' },
  { name: 'Count outcomes', blurb: 'How often something happened: 0, 1, 2 and so on.' },
  { name: 'Time to an event', blurb: 'How long until something happens, when not everyone has had it yet.' },
  { name: 'Mediation and measurement', blurb: 'Effects through a third variable, and how well items measure a construct.' },
  { name: 'Dimension reduction and clustering', blurb: 'Many variables summarised by a few, or cases sorted into groups.' },
  { name: 'Time series', blurb: 'One series measured at regular intervals.' },
  { name: 'Prediction', blurb: 'Accurate predictions for new cases.' },
  { name: 'Bayesian analysis', blurb: 'Probabilities for the unknowns, and evidence for or against an effect.' },
];

export const TREE: Question = {
  kind: 'question',
  text: 'What do you want to find out?',
  help: 'Pick the one closest to your research question. Most questions are the first kind.',
  options: [
    {
      label: 'How one outcome differs, or what predicts it',
      example: 'Do remote workers report higher wellbeing than office workers?',
      tech: 'lm(), glm() and lmer()',
      next: {
        kind: 'question',
        text: 'What does your outcome look like?',
        help: 'The outcome is what you want to explain. A total or average of questionnaire items is a number. A rating with only 3 or 4 levels (never, sometimes, often) is a few ordered levels. Successes out of a fixed number of tries, such as 7 correct out of 10, is yes or no, not a count.',
        options: [
          {
            label: 'A number or score',
            example: 'Does autonomy go with higher wellbeing scores?',
            tech: 'Numeric outcome',
            group: 'Numeric outcome: one sample or numeric predictors',
            next: {
              kind: 'question',
              text: 'Who gave the scores?',
              help: 'This matters most of all. If people share a team, class or site that could make them alike, choose that option, even when each person gave one score.',
              options: [
                {
                  label: 'Different people, one score each',
                  example: 'Do remote and office workers differ in wellbeing?',
                  tech: 'Independent observations',
                  next: {
                    kind: 'question',
                    text: 'What do you compare or predict with?',
                    options: [
                      {
                        label: 'Nothing: compare the average with a fixed number',
                        example: 'Is the average exam score different from 70?',
                        tech: 'Traditional one-sample t-test',
                        next: {
                          kind: 'answer',
                          id: 'mean-vs-value',
                          model: 'Intercept-only linear model',
                          when: 'One set of scores, and the question is whether their mean differs from a fixed value such as a scale midpoint or a published norm.',
                          rCode: `library(dplyr)
library(broom)
d <- read.csv("data/wellbeing-population.csv", stringsAsFactors = TRUE)
model <- lm(I(exam_score - 70) ~ 1, data = d)
model %>% tidy(conf.int = TRUE)`,
                          check:
                            'Independent scores and no extreme outliers; roughly normal scores, which matters mainly in small samples. For a small, clearly skewed sample, the traditional one-sample Wilcoxon signed-rank test: wilcox.test(d$exam_score, mu = 70).',
                          traditional: 'The traditional one-sample t-test: t.test(d$exam_score, mu = 70). Same t, same p.',
                          note: 'Here the question is whether the mean exam score differs from 70; put your own comparison value in its place. ~ 1 means a model with no predictors, so the intercept is how far the mean lies from that value, with its confidence interval.',
                          buildsOn: '08-3',
                          further: 'Van den Berg, Analysing Data Using Linear Models, section 5.15, The intercept only model.',
                        },
                      },
                      {
                        label: 'Numbers',
                        example: 'Does more autonomy go with higher wellbeing?',
                        tech: 'Regression',
                        next: {
                          kind: 'question',
                          text: 'Which fits your predictors?',
                          options: [
                            {
                              label: 'One number',
                              example: 'Does autonomy predict wellbeing?',
                              tech: 'Simple regression, correlation',
                              next: {
                                kind: 'answer',
                                id: 'simple-regression',
                                model: 'Simple linear regression',
                                when: 'One numeric outcome and one numeric predictor, and the relationship looks roughly like a straight line.',
                                rCode: `library(dplyr)
library(broom)
d <- read.csv("data/workplace.csv", stringsAsFactors = TRUE)
model <- lm(wellbeing ~ autonomy, data = d)
model %>% tidy()
model %>% glance()`,
                                check:
                                  "A scatterplot with geom_smooth(method = lm) shows a roughly straight-line pattern; no extreme outliers; residuals with similar spread along the whole line; residuals roughly normal, which matters mainly in small samples. For a curved-but-consistent pattern, ranks or outliers, the traditional Spearman correlation test: cor.test(d$wellbeing, d$autonomy, method = \"spearman\").",
                                traditional: "The traditional Pearson correlation test: cor.test(d$wellbeing, d$autonomy). Its t and p match the slope's.",
                                note: 'The slope b is the difference in predicted outcome (here wellbeing) between people who differ by one unit on the predictor (autonomy).',
                                lessonId: '10-2',
                              },
                            },
                            {
                              label: 'Several predictors at once',
                              example: 'Do autonomy and workload each predict wellbeing, controlling for tenure?',
                              tech: 'Multiple regression',
                              next: {
                                kind: 'answer',
                                id: 'multiple-regression',
                                model: 'Multiple linear regression',
                                when: 'One numeric outcome and several predictors, and you want the effect of each one with the others held constant.',
                                rCode: `library(dplyr)
library(broom)
d <- read.csv("data/workplace.csv", stringsAsFactors = TRUE)
model <- lm(wellbeing ~ autonomy + workload + tenure_years, data = d)
model %>% tidy()
model %>% glance()`,
                                check:
                                  'Roughly linear relationships; no extreme outliers; residuals with similar spread across the fitted values; residuals roughly normal (mainly a concern in small samples); predictors not almost perfectly correlated with each other.',
                                note: 'Each b is the difference in predicted outcome for a one-unit higher value of that predictor, with the other predictors held constant. Report R², F and each b with its SE, t and p. Predictors can be numbers or groups: a factor enters the formula the same way, as + remote would.',
                                lessonId: '11-1',
                              },
                            },
                            {
                              label: 'The pattern bends',
                              example: 'Does more sleep help exam scores only up to a point?',
                              tech: 'Polynomial regression',
                              next: {
                                kind: 'answer',
                                id: 'curved-relationship',
                                model: 'Polynomial regression',
                                when: 'A scatterplot shows a bend, for example a benefit that levels off or a middle value that works best.',
                                rCode: `library(dplyr)
library(broom)
d <- read.csv("data/wellbeing-population.csv", stringsAsFactors = TRUE)
straight <- lm(exam_score ~ sleep_hours, data = d)
curved <- lm(exam_score ~ poly(sleep_hours, 2), data = d)
anova(straight, curved)
curved %>% glance()`,
                                check:
                                  'Plot first: geom_smooth() without method = lm shows the shape. A squared term fits one bend. For a more complex shape, or to let the data find it, a generalised additive model: mgcv::gam(exam_score ~ s(sleep_hours), data = d) in RStudio.',
                                note: 'anova() tests whether the bend improves the fit beyond a straight line. poly() keeps the linear and squared terms uncorrelated, which makes the fit stable but the coefficients hard to read, so describe the curve from a plot of the predictions.',
                                buildsOn: '11-3',
                                further:
                                  "For smooth curves of any shape, Simon Wood's book Generalized Additive Models: An Introduction with R, and the mgcv package that comes with R.",
                              },
                            },
                            {
                              label: 'One effect depends on something else',
                              example: 'Is the effect of workload on wellbeing weaker for people with more autonomy?',
                              tech: 'Moderation (interaction)',
                              next: {
                                kind: 'answer',
                                id: 'continuous-moderation',
                                model: 'Linear model with a continuous interaction (moderation)',
                                when: 'You expect the effect of one numeric predictor to be stronger or weaker depending on the value of another, for example workload hurting wellbeing more when autonomy is low.',
                                rCode: `library(dplyr)
library(broom)
library(emmeans)
d <- read.csv("data/workplace.csv", stringsAsFactors = TRUE)
d <- d %>% mutate(workload_c = workload - mean(workload), autonomy_c = autonomy - mean(autonomy))
model <- lm(wellbeing ~ workload_c * autonomy_c, data = d)
model %>% tidy(conf.int = TRUE)
s <- sd(d$autonomy_c)
emtrends(model, ~ autonomy_c, var = "workload_c", at = list(autonomy_c = c(-s, 0, s)))`,
                                check:
                                  'The same as for multiple regression. Interactions need much larger samples to detect than main effects, so a non-significant interaction is weak evidence that there is none.',
                                traditional: 'Moderation analysis, as in PROCESS model 1.',
                                note: 'The workload_c:autonomy_c coefficient is the moderation: how much the slope of workload changes for each one-unit increase in autonomy. Centring makes each main effect the slope at the other variable\'s mean. emtrends() gives the simple slopes: the slope of workload at one SD below mean autonomy, at the mean, and one SD above. With a group as the moderator, leave it uncentred: lm(wellbeing ~ workload_c * remote, data = d), where workload_c:remoteYes is the difference between the two groups\' slopes.',
                                buildsOn: '13-1',
                                further:
                                  'Andrew Hayes, Introduction to Mediation, Moderation, and Conditional Process Analysis, which also covers the Johnson-Neyman technique for finding where the slope stops being significant.',
                              },
                            },
                          ],
                        },
                      },
                      {
                        label: 'Groups',
                        example: 'Do wellbeing scores differ between departments?',
                        tech: 'Group comparison (traditional t-test, ANOVA)',
                        group: 'Numeric outcome: comparing groups',
                        next: {
                          kind: 'question',
                          text: 'Which fits your groups?',
                          options: [
                            {
                              label: 'Two groups',
                              example: 'Do remote workers report higher wellbeing than office workers?',
                              tech: 'Traditional independent t-test',
                              next: {
                                kind: 'answer',
                                id: 'two-groups',
                                model: 'Linear model with a two-group predictor',
                                when: 'Two independent groups, such as a treatment and a control group, compared on one numeric outcome.',
                                rCode: `library(dplyr)
library(broom)
d <- read.csv("data/workplace.csv", stringsAsFactors = TRUE)
model <- lm(wellbeing ~ remote, data = d)
model %>% tidy()
d %>% group_by(remote) %>% summarise(mean = mean(wellbeing), sd = sd(wellbeing))`,
                                check:
                                  'Similar spread in each group, which matters especially when group sizes differ. Residuals roughly normal, which matters mainly in small samples; with large groups the Central Limit Theorem covers moderate skew. For a small, clearly skewed sample or extreme outliers, the traditional Mann-Whitney test: wilcox.test(wellbeing ~ remote, data = d).',
                                traditional:
                                  'The traditional independent-samples t-test: t.test(wellbeing ~ remote, data = d, var.equal = TRUE). Same t with the sign reversed, because t.test subtracts the groups the other way round, and the same p. When the spreads differ, leave out var.equal = TRUE to get the traditional Welch test.',
                                note: 'The slope is the difference between the two group means. Always look at the means: the sign of b depends on which group R took as the reference.',
                                lessonId: '12-1',
                              },
                            },
                            {
                              label: 'Three or more groups',
                              example: 'Do wellbeing scores differ between departments?',
                              tech: 'Traditional one-way ANOVA',
                              next: {
                                kind: 'answer',
                                id: 'several-groups',
                                model: 'Linear model with a categorical predictor',
                                when: 'Three or more independent groups compared on one numeric outcome.',
                                rCode: `library(dplyr)
library(broom)
library(emmeans)
d <- read.csv("data/workplace.csv", stringsAsFactors = TRUE)
model <- lm(wellbeing ~ department, data = d)
model %>% glance()
model %>% tidy()
emmeans(model, pairwise ~ department, adjust = "tukey")`,
                                check:
                                  'Similar spread in each group, which matters especially when group sizes differ. Residuals roughly normal, which matters mainly in small samples; with large groups the Central Limit Theorem covers moderate skew. For a small, clearly skewed sample or extreme outliers, the traditional Kruskal-Wallis test: kruskal.test(wellbeing ~ department, data = d).',
                                traditional: 'The traditional one-way ANOVA: summary(aov(wellbeing ~ department, data = d)). Same F, same p.',
                                note: 'Each b compares one group with the reference group. glance() gives the overall F; emmeans gives every pairwise comparison, corrected for multiple testing.',
                                lessonId: '12-2',
                              },
                            },
                            {
                              label: 'Groups, adjusting for a number',
                              example: 'Are trained employees more engaged, adjusting for how engaged they were before?',
                              tech: 'Traditional ANCOVA',
                              next: {
                                kind: 'answer',
                                id: 'groups-with-covariate',
                                model: 'Linear model with a group and a covariate',
                                when: 'Groups compared on an outcome while holding a numeric variable constant, such as a pre-test score or age.',
                                rCode: `library(dplyr)
library(broom)
library(emmeans)
d <- read.csv("data/workplace.csv", stringsAsFactors = TRUE)
model <- lm(engagement_t2 ~ engagement_t1 + training, data = d)
model %>% tidy(conf.int = TRUE)
emmeans(model, pairwise ~ training)`,
                                check:
                                  'The covariate relates to the outcome in a roughly straight line with a similar slope in every group: fit lm(engagement_t2 ~ engagement_t1 * training, data = d) and check that the interaction is small. The covariate is measured before the groups could have changed it. If the slopes clearly differ, that difference is your finding: see the moderation model under numeric predictors.',
                                traditional: 'The traditional ANCOVA: anova(model) gives the F test for the groups, adjusted for the covariate entered before them.',
                                note: 'The group coefficients are differences between groups at the same value of the covariate: here, trained and untrained employees who started with the same engagement. emmeans gives each group\'s adjusted mean, its predicted mean at the average covariate, and the pairwise differences between them.',
                                lessonId: '11-2',
                              },
                            },
                            {
                              label: 'Two kinds of groups together',
                              example: 'Do training and mentoring work better in combination?',
                              tech: 'Traditional factorial ANOVA',
                              next: {
                                kind: 'answer',
                                id: 'factorial',
                                model: 'Linear model with an interaction (factorial design)',
                                when: 'Two grouping variables crossed with each other, such as training (yes or no) by mentoring (yes or no), and the question includes whether their effects combine.',
                                rCode: `library(car)
library(emmeans)
d <- read.csv("data/workplace.csv", stringsAsFactors = TRUE)
d$change <- d$engagement_t2 - d$engagement_t1
model <- lm(change ~ training * mentoring, data = d,
            contrasts = list(training = contr.sum, mentoring = contr.sum))
Anova(model, type = "III")
emmeans(model, pairwise ~ training:mentoring, adjust = "tukey")`,
                                check:
                                  'Similar spread in each cell, which matters especially when group sizes differ. Residuals roughly normal, which matters mainly in small samples. Plot the cell means before interpreting main effects.',
                                traditional: 'The traditional two-way (factorial) ANOVA. Anova(model, type = "III") gives its F tests for each main effect and the interaction.',
                                // Type III main-effect tests are only meaningful with sum-to-zero contrasts. Under R's
                                // default treatment contrasts they test each factor at the other's reference level.
                                note: 'The contrasts = list(...) line matters: type III tests of the main effects are only correct with sum-to-zero contrasts, and R does not use those by default. An interaction means the effect of one factor depends on the level of the other: in an interaction plot, the lines are not parallel.',
                                lessonId: '13-2',
                              },
                            },
                            {
                              label: 'Groups on several outcomes at once',
                              example: 'Do departments differ in both wellbeing and engagement?',
                              tech: 'Traditional MANOVA',
                              next: {
                                kind: 'answer',
                                id: 'several-outcomes',
                                model: 'Multivariate linear model (traditional MANOVA)',
                                when: 'Several related numeric outcomes, such as three subscales of one questionnaire, and the question is whether the groups differ on them taken together.',
                                rCode: `d <- read.csv("data/workplace.csv", stringsAsFactors = TRUE)
model <- manova(cbind(wellbeing, engagement_t2, performance) ~ department, data = d)
summary(model, test = "Pillai")
summary.aov(model)`,
                                check:
                                  "The outcomes correlate moderately with each other; if they do not, analyse them one at a time. No extreme outliers, more cases in every group than there are outcomes, and similar variances and correlations of the outcomes in every group. Pillai's trace is the most robust of the four test statistics when that last condition fails.",
                                traditional: 'The traditional one-way MANOVA.',
                                note: 'The overall test asks whether the groups differ on the combination of outcomes. summary.aov() then gives one traditional ANOVA per outcome; correct those for multiple testing, for example with p.adjust(p, method = "holm").',
                                buildsOn: '12-2',
                                further: 'Field, Miles and Field, Discovering Statistics Using R, has a chapter on the traditional MANOVA and the discriminant analysis that often follows it.',
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
                {
                  label: 'The same people, more than once',
                  example: 'Did engagement rise from the first to the second measurement?',
                  tech: 'Repeated measures',
                  group: 'Repeated measures and nested data',
                  next: {
                    kind: 'question',
                    text: 'How often were they measured?',
                    help: 'All of these need one row per person per measurement (long format), which pivot_longer() makes. Matched pairs, such as twins or couples, count as one unit measured twice: give each pair its own id.',
                    options: [
                      {
                        label: 'Twice, such as before and after',
                        example: 'Did engagement rise from the first to the second measurement?',
                        tech: 'Traditional paired t-test',
                        next: {
                          kind: 'answer',
                          id: 'before-after',
                          model: 'Linear mixed-effects model for two time points',
                          when: 'Each person measured twice, and the question is whether their scores changed.',
                          rCode: `library(dplyr)
library(tidyr)
library(lmerTest)
d <- read.csv("data/workplace.csv", stringsAsFactors = TRUE)
long_d <- d %>% pivot_longer(cols = c(engagement_t1, engagement_t2), names_to = "time", values_to = "engagement") %>%
  mutate(time = factor(time))
model <- lmer(engagement ~ time + (1 | employee_id), data = long_d)
summary(model)`,
                          check:
                            'Data in long format: one row per person per measurement. Residuals roughly normal, which matters mainly in small samples. With skewed differences in a small sample, the traditional Wilcoxon signed-rank test: wilcox.test(d$engagement_t2, d$engagement_t1, paired = TRUE).',
                          traditional: 'The traditional paired-samples t-test: t.test(d$engagement_t2, d$engagement_t1, paired = TRUE). Same t, same p, when nobody is missing a measurement and the two measurements correlate positively (no singular fit).',
                          note: '(1 | employee_id) gives every employee their own starting level, so the model knows which scores belong together. engagement_t1 sorts first, so it is the reference and the time coefficient is the change from the first measurement to the second. Unlike the traditional paired t-test, it keeps people who missed a measurement.',
                          lessonId: '14-3',
                        },
                      },
                      {
                        label: 'Three or more times',
                        example: 'Does stress change across three exam weeks?',
                        tech: 'Traditional repeated-measures ANOVA',
                        next: {
                          kind: 'answer',
                          id: 'repeated-measures',
                          model: 'Linear mixed-effects model',
                          when: 'Each person measured under three or more conditions or at three or more time points.',
                          rCode: `library(dplyr)
library(lmerTest)
library(emmeans)
# The course data has only two time points, so this uses ChickWeight, built into R: chicks weighed as they grow.
long_d <- ChickWeight %>% filter(Time %in% c(0, 10, 21)) %>% mutate(time = factor(Time))
model <- lmer(weight ~ time + (1 | Chick), data = long_d)
anova(model)
emmeans(model, pairwise ~ time, adjust = "holm")`,
                          check:
                            'Data in long format: one row per case per measurement, which ChickWeight already is. Residuals roughly normal, which matters mainly in small samples. The model assumes the same spread at every time point and the same correlation between every pair of them. Compare the SDs per time point first: in ChickWeight they grow from about 1 g at hatching to about 72 g at day 21, so read its p-values with care. For a growth process like this, a growth-curve model with random slopes fits better. For a small, clearly skewed sample, the traditional Friedman test, which needs every chick at every time point, so keep only the complete ones first: complete <- long_d %>% group_by(Chick) %>% filter(n() == 3) %>% ungroup() %>% droplevels(), then friedman.test(weight ~ time | Chick, data = complete).',
                          traditional: 'The traditional repeated-measures ANOVA. With complete data and no singular fit, the model\'s F matches its uncorrected F. The model assumes equal variances and correlations at every time point (compound symmetry), which is stricter than the sphericity the traditional F needs.',
                          note: 'anova() tests whether weight differs across the time points at all; emmeans then compares each pair of time points. (1 | Chick) lets each chick have its own level, as (1 | id) would for people. Unlike the traditional repeated-measures ANOVA, the model keeps the chicks that missed a weighing.',
                          lessonId: '14-4',
                        },
                      },
                      {
                        label: 'Over time, in different groups',
                        example: 'Did engagement rise more for trained employees than for others?',
                        tech: 'Traditional mixed ANOVA',
                        next: {
                          kind: 'answer',
                          id: 'time-by-group',
                          model: 'Linear mixed-effects model with a time-by-group interaction',
                          when: 'A mixed design: everyone measured more than once, and people belong to different groups, such as a treatment and a control group measured before and after.',
                          rCode: `library(dplyr)
library(tidyr)
library(lmerTest)
library(emmeans)
d <- read.csv("data/workplace.csv", stringsAsFactors = TRUE)
long_d <- d %>% pivot_longer(cols = c(engagement_t1, engagement_t2), names_to = "time", values_to = "engagement") %>%
  mutate(time = factor(time))
model <- lmer(engagement ~ time * training + (1 | employee_id), data = long_d)
anova(model)
emmeans(model, pairwise ~ training | time)`,
                          check:
                            'Data in long format, with time and group (here training) as factors. Residuals with similar spread in each group, and roughly normal in small samples.',
                          traditional: 'The traditional mixed (split-plot) ANOVA.',
                          note: 'The time:training interaction is usually the question: did the trained employees change differently from the others? In a randomised trial it is the treatment effect. emmeans compares the groups at each time point.',
                          lessonId: '14-4',
                        },
                      },
                      {
                        label: 'Many times, each at their own pace',
                        example: 'Do some chicks grow faster than others over 21 days?',
                        tech: 'Growth curve (random slopes)',
                        next: {
                          kind: 'answer',
                          id: 'growth-curve',
                          model: 'Linear mixed-effects model with random slopes (growth curve)',
                          when: 'Several measurements per person over time, and the question is about the rate of change and how much people differ in it.',
                          rCode: `library(lmerTest)
# The course data has only two time points, so this uses ChickWeight, built into R: each chick weighed up to 12 times.
model <- lmer(weight ~ Time + (Time | Chick), data = ChickWeight)
summary(model)`,
                          check:
                            'Time coded as a number that starts at 0 (in ChickWeight, days since hatching), so the intercept is the starting level; at least three time points per person. If R reports a singular fit, the data cannot support a separate slope for each person: go back to (1 | Chick).',
                          note: '(Time | Chick) gives every chick its own starting weight and its own growth rate, as (time | id) would for people. The fixed effect of Time is the average gain per day; the random-effect variance for Time shows how much chicks differ in it.',
                          buildsOn: '14-4',
                          further: 'Singer and Willett, Applied Longitudinal Data Analysis, the standard text on growth models.',
                        },
                      },
                      {
                        label: 'Each person rates many items',
                        example: 'Do students rate some lecturers higher, across many ratings each?',
                        tech: 'Crossed random effects',
                        next: {
                          kind: 'answer',
                          id: 'crossed-random-effects',
                          model: 'Linear mixed-effects model with crossed random effects',
                          when: 'Every participant responds to many items (words, images, vignettes), every item is seen by many participants, and you want conclusions that hold for new people and new items.',
                          rCode: `library(dplyr)
library(lmerTest)
# The course data has no ratings of many items, so this uses InstEval from lme4: students rating their lecturers.
ratings <- lme4::InstEval[1:5000, ] %>% rename(student = s, lecturer = d)
model <- lmer(y ~ service + (1 | student) + (1 | lecturer), data = ratings)
summary(model)`,
                          check:
                            'One row per participant per item (here, per rating). Enough participants and enough items, since both are samples. Add random slopes, such as (service | student), when the design supports them.',
                          traditional: 'Separate by-participant and by-item traditional ANOVAs (F1 and F2), which this model replaces.',
                          note: 'Both participants and items vary, here students and lecturers, so both get their own random intercept, and the effect of service (a course taught for another department) then generalises across both. Averaging over items first, as F1 analyses did, treats the items as if they were the only ones possible. The first 5000 ratings keep the example quick.',
                          buildsOn: '14-3',
                          further: 'Baayen, Davidson and Bates (2008), Mixed-effects modeling with crossed random effects for subjects and items, Journal of Memory and Language.',
                        },
                      },
                    ],
                  },
                },
                {
                  label: 'People within teams, classes or sites',
                  example: 'Does autonomy predict wellbeing when staff work at different sites?',
                  tech: 'Multilevel (nested) data',
                  group: 'Repeated measures and nested data',
                  next: {
                    kind: 'answer',
                    id: 'nested-groups',
                    model: 'Linear mixed-effects model with a grouping factor',
                    when: 'People belong to clusters, such as pupils in classes or employees in sites, so people in the same cluster are more alike than people in different ones.',
                    rCode: `library(lmerTest)
d <- read.csv("data/workplace.csv", stringsAsFactors = TRUE)
model <- lmer(wellbeing ~ autonomy + workload + (1 | site), data = d)
summary(model)`,
                    check: 'Enough groups to estimate how they vary: a handful at the very least, and ideally twenty or more. With only 6 sites, as here, the site SD is estimated imprecisely and may come out as 0 (a singular fit). Residuals roughly normal, which matters mainly in small samples.',
                    note: 'Employees at the same site are more alike than employees at different sites; (1 | site) accounts for that. If people are also measured repeatedly, nest them: (1 | site/employee_id). If a predictor\'s effect may differ between sites, add a random slope: (autonomy | site).',
                    lessonId: '14-3',
                  },
                },
              ],
            },
          },
          {
            label: 'Yes or no',
            example: 'Does workload predict whether employees leave?',
            tech: 'Binary outcome',
            group: 'Yes-or-no outcomes',
            next: {
              kind: 'question',
              text: 'Who gave the answers?',
              help: 'If the same people answer more than once, or people share a team, class or site, choose the second option, even when each row is a different person.',
              options: [
                {
                  label: 'Different people, one answer each',
                  example: 'Are remote workers less likely to leave?',
                  tech: 'Independent observations',
                  next: {
                    kind: 'question',
                    text: 'What do you compare or predict with?',
                    options: [
                      {
                        label: 'Numbers, groups or both',
                        example: 'Does workload predict whether employees leave?',
                        tech: 'Logistic regression',
                        next: {
                          kind: 'answer',
                          id: 'logistic-regression',
                          model: 'Logistic regression',
                          when: 'A yes-or-no outcome, such as passed or failed, and one or more predictors of any kind.',
                          rCode: `d <- read.csv("data/workplace.csv", stringsAsFactors = TRUE)
model <- glm(left_company ~ wellbeing + tenure_years, data = d, family = binomial)
summary(model)
exp(cbind(OR = coef(model), confint(model)))`,
                          check:
                            'Independent observations, numeric predictors that relate in a straight line to the log odds, and enough cases of the rarer outcome: a common rule of thumb is at least 10 per estimated coefficient (a factor with k levels uses k − 1). If R warns that fitted probabilities of 0 or 1 occurred, a predictor separates the outcomes perfectly; Firth\'s method, logistf::logistf(), handles that in RStudio.',
                          traditional:
                            'With one categorical predictor, such as remote, the traditional chi-square test of independence: chisq.test(table(d$left_company, d$remote), correct = FALSE), which matches anova(glm(left_company ~ remote, data = d, family = binomial), test = "Rao").',
                          note: 'The intercept is in log odds and each slope is a difference in log odds (a log odds ratio). exp() turns the slopes into odds ratios: above 1, the outcome becomes more likely; below 1, less likely.',
                          lessonId: '15-2',
                        },
                      },
                      {
                        label: 'One other category (a cross-table)',
                        example: 'Does the share who leave differ between departments?',
                        tech: 'Traditional chi-square test',
                        next: crossTable(),
                      },
                      {
                        label: 'Nothing: compare one percentage with a fixed value',
                        example: 'Do more than half of the students pass?',
                        tech: 'Traditional binomial test',
                        next: {
                          kind: 'answer',
                          id: 'proportion-vs-value',
                          model: 'Traditional exact binomial test',
                          when: 'One yes-or-no variable, and the question is whether the proportion of yes differs from a fixed value, such as 50% or a known pass rate.',
                          rCode: `d <- read.csv("data/workplace.csv", stringsAsFactors = TRUE)
successes <- sum(d$left_company == 1)
binom.test(successes, nrow(d), p = 0.2)`,
                          check: 'Independent cases, each counted once, and no missing values in the outcome (nrow() would count them).',
                          traditional: 'The traditional large-sample version is prop.test(successes, nrow(d), p = 0.2, correct = FALSE). As a model, an intercept-only logistic regression tests the same value only with an offset: glm(left_company ~ 1, offset = rep(qlogis(0.2), nrow(d)), data = d, family = binomial), whose intercept is the difference in log odds from 20%. Without the offset it tests 50%.',
                          note: 'Here the question is whether the share of employees who left differs from 20%. For your own data, count your own level in place of left_company == 1 and use your own proportion in place of 0.2. The output gives the observed proportion with its exact 95% confidence interval.',
                          lessonId: '09-1',
                        },
                      },
                    ],
                  },
                },
                {
                  label: 'Same people more than once, or grouped in sites',
                  example: 'Did the same students pass more often on the second try?',
                  tech: 'Mixed-effects logistic regression',
                  next: {
                    kind: 'answer',
                    id: 'repeated-binary',
                    model: 'Mixed-effects logistic regression',
                    when: 'A yes-or-no outcome measured repeatedly for each person, or for people in clusters such as classes or sites.',
                    rCode: `library(lme4)
d <- read.csv("data/workplace.csv", stringsAsFactors = TRUE)
model <- glmer(left_company ~ wellbeing + (1 | site), data = d, family = binomial)
summary(model)
exp(fixef(model))`,
                    check:
                      'For repeated measurements, long format: one row per person per measurement. Clustered data, such as employees in sites, is already in shape. With few clusters or a rare outcome the model may fail to converge; simplify the random part first.',
                    traditional: "For one yes-or-no answer at two time points, the traditional McNemar test: mcnemar.test(table(before, after)). It asks the same question; the mixed model gives a similar but not identical p.",
                    note: 'exp() turns the coefficients into odds ratios for people in the same cluster, here the same site, holding its random intercept fixed. These are usually further from 1 than the population-average odds ratios an ordinary logistic regression gives.',
                    buildsOn: '14-2',
                    further: 'Gelman and Hill, Data Analysis Using Regression and Multilevel/Hierarchical Models.',
                  },
                },
                {
                  label: 'Successes out of a number of tries',
                  example: 'Does practice raise the number correct out of 10 questions?',
                  tech: 'Binomial regression',
                  next: {
                    kind: 'answer',
                    id: 'successes-of-trials',
                    model: 'Binomial regression for successes out of trials',
                    when: 'Each row records how many of a number of trials succeeded, such as items correct on a test or seeds that germinated in a tray.',
                    rCode: `library(dplyr)
d <- read.csv("data/workplace.csv", stringsAsFactors = TRUE)
teams <- d %>% group_by(department, site) %>%
  summarise(left = sum(left_company), staff = n(), wellbeing = mean(wellbeing), .groups = "drop")
model <- glm(cbind(left, staff - left) ~ wellbeing, data = teams, family = binomial)
summary(model)
exp(cbind(OR = coef(model), confint(model)))`,
                    check:
                      'Trials independent within a row. If the residual deviance is much larger than its degrees of freedom, the proportions vary more than a binomial allows: refit with family = quasibinomial.',
                    note: 'Here each row is one department at one site, made by counting how many of its staff left. cbind() gives the successes and failures, so a team where 3 of 20 left weighs twenty employees. The coefficients are log odds of a success, here leaving, read exactly as in logistic regression. Because wellbeing is now a team average, its odds ratio compares teams, not individual employees.',
                    buildsOn: '15-2',
                    further: 'Dunn and Smyth, Generalized Linear Models With Examples in R.',
                  },
                },
              ],
            },
          },
          {
            label: 'A few ordered levels',
            example: 'Do departments differ in satisfaction rated low, medium or high?',
            tech: 'Ordinal outcome',
            group: 'Categorical outcomes',
            next: {
              kind: 'question',
              text: 'What do you want to know about it?',
              options: [
                {
                  label: 'Do groups differ, or do two things go together?',
                  example: 'Do the departments differ in their satisfaction rating?',
                  tech: 'Traditional rank tests: Mann-Whitney, Kruskal-Wallis, Spearman',
                  next: {
                    kind: 'answer',
                    id: 'rank-tests',
                    model: 'Traditional rank-based tests',
                    when: 'An ordered outcome, or a numeric one that is clearly skewed or has extreme outliers, and the question is whether groups differ or whether two variables go together.',
                    rCode: `d <- read.csv("data/workplace.csv", stringsAsFactors = TRUE)
wilcox.test(wellbeing ~ remote, data = d)
kruskal.test(wellbeing ~ department, data = d)
cor.test(~ autonomy + wellbeing, data = d, method = "spearman", exact = FALSE)`,
                    check:
                      'Independent cases, each counted once. The group tests compare whole distributions; read them as a difference in medians only when the groups have a similar shape and spread. When the same people are measured more than once, use a test built on within-person comparisons instead: the traditional Wilcoxon signed-rank test (which ranks each person\'s difference) for two measurements, wilcox.test(d$engagement_t2, d$engagement_t1, paired = TRUE), and the traditional Friedman test (which ranks within each person) for three or more.',
                    traditional:
                      "The traditional Mann-Whitney test, Kruskal-Wallis test and Spearman rank correlation test. After a significant traditional Kruskal-Wallis test, pairwise.wilcox.test(d$wellbeing, d$department, p.adjust.method = \"holm\", exact = FALSE) compares every pair of groups.",
                    note: 'wilcox.test() compares two groups, kruskal.test() three or more, and cor.test() with method = "spearman" gives rho, the correlation between the ranks; method = "kendall" gives Kendall\'s tau instead. These tests work on ranks, so report each group\'s median alongside them. To add predictors or covariates, use ordinal regression.',
                    lessonId: '12-4',
                  },
                },
                {
                  label: 'Several predictors at once',
                  example: 'Do workload and autonomy predict the satisfaction level?',
                  tech: 'Ordinal regression',
                  next: {
                    kind: 'answer',
                    id: 'ordinal-regression',
                    model: 'Ordinal logistic regression (proportional odds)',
                    when: 'An outcome with a few ordered categories where the distances between them are not equal or not known, such as never, sometimes, often.',
                    rCode: `library(MASS)
# The course data has no ordered ratings, so this uses housing from MASS: how satisfied 1681 tenants were (low, medium, high).
model <- polr(Sat ~ Infl + Type, data = housing, weights = Freq, Hess = TRUE)
summary(model)
exp(cbind(OR = coef(model), confint(model)))`,
                    check:
                      'Proportional odds: each predictor multiplies the odds of being above any cut-off by the same factor (the same odds ratio at every cut-off). The ordinal package tests it: ordinal::nominal_test(ordinal::clm(Sat ~ Infl + Type, data = housing, weights = Freq)), where a small p flags a predictor that breaks the assumption. A total of many Likert items is usually analysed as a number instead. MASS hides dplyr\'s select(), so attach MASS before dplyr, or write dplyr::select().',
                    note: 'Each row of housing is one combination of answers, and Freq says how many tenants gave it, hence weights = Freq; with one row per person, leave it out. Your own outcome needs to be a factor with its levels in order: factor(x, levels = c("low", "medium", "high"), ordered = TRUE). An odds ratio above 1 means that predictor goes with higher categories of the outcome. The intercepts (the zeta values in the output) are the cut-offs between adjacent categories.',
                    buildsOn: '15-2',
                    further: 'Alan Agresti, Analysis of Ordinal Categorical Data, and the ordinal package\'s vignettes.',
                  },
                },
              ],
            },
          },
          {
            label: 'Categories with no order',
            example: 'Does age predict how people travel to work: car, bike or train?',
            tech: 'Nominal outcome',
            group: 'Categorical outcomes',
            next: {
              kind: 'question',
              text: 'What do you want to know about the categories?',
              options: [
                {
                  label: 'Which category, from other variables',
                  example: 'Does age predict how people travel to work?',
                  tech: 'Multinomial regression',
                  next: {
                    kind: 'answer',
                    id: 'multinomial-regression',
                    model: 'Multinomial logistic regression',
                    when: 'An outcome with three or more unordered categories, such as department or how people travel to work, and predictors of any kind.',
                    rCode: `library(nnet)
library(broom)
d <- read.csv("data/workplace.csv", stringsAsFactors = TRUE)
d$department <- relevel(d$department, ref = "Sales")
model <- multinom(department ~ autonomy + workload, data = d)
tidy(model, conf.int = TRUE, exponentiate = TRUE)`,
                    check:
                      'Enough cases in every category, including the rarest. The odds between two categories do not depend on which other categories are on offer (independence of irrelevant alternatives).',
                    note: 'Sales is the category every other department is compared with; for your own data, pick the reference that makes the comparisons easiest to read. The model fits one comparison per category against that reference; an odds ratio above 1 means the predictor makes that category more likely relative to the reference.',
                    buildsOn: '15-2',
                    further: 'Alan Agresti, An Introduction to Categorical Data Analysis.',
                  },
                },
                {
                  label: 'Linked to one other category',
                  example: 'Is the way people travel to work linked to their department?',
                  tech: 'Traditional chi-square test of independence',
                  next: crossTable(),
                },
                {
                  label: 'Do the shares match what you expect?',
                  example: 'Are the four entrances of the building used equally often?',
                  tech: 'Traditional chi-square goodness of fit',
                  next: {
                    kind: 'answer',
                    id: 'goodness-of-fit',
                    model: 'Traditional chi-square goodness-of-fit test',
                    when: 'One categorical variable, and the question is whether its categories occur in the proportions you expected, such as equal shares or last year\'s figures.',
                    rCode: `d <- read.csv("data/workplace.csv", stringsAsFactors = TRUE)
counts <- table(d$department)
counts
chisq.test(counts, p = c(0.3, 0.2, 0.3, 0.2))`,
                    check: 'Each case counted once. Expected counts of at least 5 in every category; chisq.test() warns when they are lower.',
                    note: 'p lists the expected share of each category, in the order table() prints them (here Engineering, Marketing, Sales, Support), and must add up to 1. Leave p out to test for equal shares.',
                    buildsOn: '09-3',
                    further: 'Alan Agresti, An Introduction to Categorical Data Analysis.',
                  },
                },
              ],
            },
          },
          {
            label: 'A count of how often',
            example: 'Does workload predict the number of sick days?',
            tech: 'Count outcome',
            group: 'Count outcomes',
            next: {
              kind: 'question',
              text: 'What do the counts look like?',
              help: 'Start with the first option. Its check tells you whether you need the second.',
              options: [
                {
                  label: 'Ordinary counts, or not sure (start here)',
                  example: 'Does workload predict the number of sick days?',
                  tech: 'Poisson regression',
                  next: {
                    kind: 'answer',
                    id: 'poisson-regression',
                    model: 'Poisson regression',
                    when: 'The outcome counts how often something happened, such as sick days, errors or visits, and cannot be negative.',
                    rCode: `library(dplyr)
library(broom)
# The course data has no counts, so this uses warpbreaks, built into R: yarn breaks per loom, by wool type and tension.
model <- glm(breaks ~ wool + tension, data = warpbreaks, family = poisson)
model %>% tidy(conf.int = TRUE, exponentiate = TRUE)
sum(residuals(model, type = "pearson")^2) / df.residual(model)`,
                    check:
                      'Whole-number counts, independent between cases. The last line estimates the dispersion: near 1 is fine; clearly above 1 (say, 1.5 or more) means overdispersion, and the negative binomial model is the better choice. If cases were observed for different lengths of time, add + offset(log(exposure)) to the formula.',
                    note: 'exponentiate = TRUE turns the coefficients into rate ratios: 1.20 means 20% more events for each one-unit increase in a numeric predictor, or than in the reference level of a factor. For warpbreaks the dispersion comes out near 4.3, so its confidence intervals are too narrow: go on to the negative binomial model. For counts measured repeatedly or in groups, lme4\'s glmer(..., family = poisson) adds a random intercept.',
                    lessonId: '15-4',
                  },
                },
                {
                  label: 'Much more spread than the average suggests',
                  example: 'Most people take 0 to 3 sick days, but a few take 40: what predicts them?',
                  tech: 'Overdispersion: negative binomial',
                  next: {
                    kind: 'answer',
                    id: 'negative-binomial',
                    model: 'Negative binomial regression',
                    when: 'Count data where the Poisson dispersion check came out well above 1, which is common: a few cases with very many events.',
                    rCode: `library(MASS)
# warpbreaks, built into R: its counts vary far more than a Poisson model allows.
model <- glm.nb(breaks ~ wool + tension, data = warpbreaks)
summary(model)
exp(cbind(RR = coef(model), confint(model)))`,
                    check: 'Whole-number counts, independent between cases. Compare with the Poisson model: AIC(glm(breaks ~ wool + tension, data = warpbreaks, family = poisson), model), lower is better.',
                    note: 'Read the exponentiated coefficients as rate ratios, exactly as in Poisson regression. theta in the output measures the extra spread: the smaller it is, the more overdispersed the counts.',
                    buildsOn: '15-4',
                    further: 'Dunn and Smyth, Generalized Linear Models With Examples in R.',
                  },
                },
                {
                  label: 'Lots of extra zeros',
                  example: 'How many cigarettes do people smoke a day, when most smoke none?',
                  tech: 'Zero-inflated model',
                  next: {
                    kind: 'answer',
                    id: 'zero-inflated',
                    model: 'Zero-inflated negative binomial regression',
                    when: 'Many zeros come from cases that could never have an event, such as non-smokers asked how many cigarettes they smoked.',
                    rCode: `library(pscl)
# The course data has no counts, so this uses bioChemists from pscl: articles published by 915 PhD students.
data("bioChemists", package = "pscl")
model <- zeroinfl(art ~ ment + kid5 | ment, data = bioChemists, dist = "negbin")
summary(model)`,
                    check:
                      'A real reason for the extra zeros. Compare with a plain negative binomial model by AIC(): it often copes with many zeros on its own. If every zero comes from the same process, a hurdle model, pscl::hurdle(), fits better.',
                    note: 'The formula has two parts. Before the | is the count model for cases that could have events; after it is the model for the chance of being a structural zero. Both parts take their own predictors: here the mentor\'s articles (ment) and young children (kid5) in the count part, and the mentor\'s articles in the zero part.',
                    buildsOn: '15-4',
                    further: 'Zuur, Savel\'ev and Ieno, A Beginner\'s Guide to Zero-Inflated Models with R.',
                  },
                },
              ],
            },
          },
          {
            label: 'Time until something happens',
            example: 'Do remote workers stay longer before they leave?',
            tech: 'Survival analysis',
            group: 'Time to an event',
            next: {
              kind: 'question',
              text: 'What do you want to know?',
              help: 'Some people have not had the event yet when the study ends. These models use that information; a traditional t-test on the times would not.',
              options: [
                {
                  label: 'Do groups differ in how long it takes?',
                  example: 'Do remote workers stay longer than office workers?',
                  tech: 'Kaplan-Meier, traditional log-rank test',
                  next: {
                    kind: 'answer',
                    id: 'survival-curves',
                    model: 'Kaplan-Meier estimate and traditional log-rank test',
                    when: 'Time to an event, such as leaving a job or relapse, compared between groups, with some cases censored.',
                    rCode: `library(survival)
d <- read.csv("data/workplace.csv", stringsAsFactors = TRUE)
fit <- survfit(Surv(tenure_years, left_company) ~ remote, data = d)
summary(fit)$table
survdiff(Surv(tenure_years, left_company) ~ remote, data = d)`,
                    check:
                      'Censoring unrelated to the outcome: cases whose follow-up ends early (censored, here still employed when the data were collected) are no more or less likely to have the event than cases followed for longer. The traditional log-rank test has most power when one group\'s risk is a constant multiple of the other\'s; when the curves cross it can miss a real difference.',
                    traditional: 'The traditional log-rank test is the score test of a Cox model with the group as its only predictor: summary(coxph(Surv(tenure_years, left_company) ~ remote, data = d, ties = "exact"))$sctest. With no tied event times, any ties option gives the same value.',
                    note: 'Surv(tenure_years, left_company) pairs each employee\'s years at the company with whether they left (1) or still work there, which makes them censored (0). summary(fit)$table gives each group\'s median time to the event; survdiff() is the traditional log-rank test; plot(fit) draws the curves.',
                    further: 'Kleinbaum and Klein, Survival Analysis: A Self-Learning Text, and the survival package\'s vignettes.',
                  },
                },
                {
                  label: 'What makes it happen sooner or later?',
                  example: 'Do wellbeing and working remotely predict how soon people leave?',
                  tech: 'Cox regression',
                  next: {
                    kind: 'answer',
                    id: 'cox-regression',
                    model: 'Cox proportional hazards regression',
                    when: 'Time to an event, with censoring, and several predictors of any kind.',
                    rCode: `library(survival)
library(broom)
d <- read.csv("data/workplace.csv", stringsAsFactors = TRUE)
model <- coxph(Surv(tenure_years, left_company) ~ wellbeing + remote, data = d)
tidy(model, conf.int = TRUE, exponentiate = TRUE)
cox.zph(model)`,
                    check:
                      'Proportional hazards: each predictor multiplies the risk by the same factor at every point in time. cox.zph() tests this for each predictor; a small p flags a problem. Roughly 10 events or more per predictor.',
                    note: 'The exponentiated coefficients are hazard ratios: 1.5 means a 50% higher hazard (the rate of the event at any moment, among those who have not had it yet) for each one-unit increase in the predictor.',
                    further: 'Kleinbaum and Klein, Survival Analysis: A Self-Learning Text, and the survival package\'s vignettes.',
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      label: 'An effect through a middle step, or questionnaire items',
      example: 'Does training raise performance by raising engagement?',
      tech: 'Mediation and measurement',
      group: 'Mediation and measurement',
      next: {
        kind: 'question',
        text: 'Which is closest to your question?',
        help: 'A middle step (a mediator) carries the effect. If a third variable changes how strong an effect is, that is moderation instead: go back to the first question and choose the first option.',
        options: [
          {
            label: 'An effect through a middle step',
            example: 'Does training raise performance through higher engagement?',
            tech: 'Mediation',
            next: {
              kind: 'answer',
              id: 'mediation',
              model: 'Mediation model',
              when: 'You expect a predictor to affect an outcome partly or wholly through a third variable, such as training raising engagement, which raises performance.',
              rCode: `library(lavaan)
d <- read.csv("data/workplace.csv", stringsAsFactors = TRUE)
d$trained <- as.numeric(d$training == "Yes")
model <- "
  engagement_t2 ~ a * trained
  performance ~ b * engagement_t2 + c * trained
  indirect := a * b
  total := c + a * b
"
set.seed(1)
fit <- sem(model, data = d, se = "bootstrap", bootstrap = 1000)
parameterEstimates(fit, boot.ci.type = "perc")`,
              check:
                'Mediation is a causal claim: the predictor comes before the mediator, and the mediator before the outcome, ideally measured at different times. With data from one moment, say the pattern is consistent with mediation rather than that it shows it. It also assumes no unmeasured variable affects both the mediator and the outcome; randomising the predictor does not guarantee this, and the bootstrap cannot fix it.',
              traditional: 'Mediation analysis, as in PROCESS model 4. The older Baron and Kenny steps and the traditional Sobel test are no longer recommended.',
              note: 'lavaan needs numbers, so trained codes training as 1 for Yes and 0 for No. The indirect effect a × b is the part of the effect that runs through the mediator; it is supported when its bootstrap confidence interval excludes 0. c is the direct effect that remains, and total is their sum.',
              lessonId: '17-1',
            },
          },
          {
            label: 'Do my questionnaire items hang together?',
            example: 'Do the five wellbeing items measure the same thing reliably?',
            tech: "Reliability, Cronbach's alpha",
            next: {
              kind: 'answer',
              id: 'scale-reliability',
              model: "Scale reliability (Cronbach's alpha)",
              when: 'Several items meant to measure one thing, and you need to know whether their total or mean is reliable enough to use.',
              rCode: `library(dplyr)
library(psych)
# The course data has no questionnaire items, so this uses HolzingerSwineford1939 from lavaan: ability tests taken by 301 pupils.
items <- lavaan::HolzingerSwineford1939 %>% select(x4:x6)
psych::alpha(items)`,
              check:
                'Reverse-worded items recoded first (on a 1 to 5 scale, 6 minus the score). Alpha rises with the number of items, so a long scale can reach .80 without measuring one thing; a confirmatory factor analysis checks that.',
              note: "Here x4 to x6 are three verbal tests meant to measure one ability. raw_alpha is Cronbach's alpha: .70 is a common minimum for research, .80 is better. The table of reliability if an item is dropped points to items that weaken the scale. psych::omega(items, nfactors = 1) gives McDonald's omega, which many journals now prefer.",
              lessonId: '03-4',
            },
          },
          {
            label: 'Do my items measure the factors I expect?',
            example: 'Do the 9 test items split into the 3 abilities they were written for?',
            tech: 'Confirmatory factor analysis',
            next: {
              kind: 'answer',
              id: 'confirmatory-factors',
              model: 'Confirmatory factor analysis (CFA)',
              when: 'A questionnaire with a known structure, such as six items meant to measure two traits, and you want to test that the data fit it.',
              rCode: `library(lavaan)
# The course data has no questionnaire items, so this uses HolzingerSwineford1939 from lavaan: ability tests taken by 301 pupils.
model <- "
  visual =~ x1 + x2 + x3
  textual =~ x4 + x5 + x6
"
fit <- cfa(model, data = HolzingerSwineford1939)
summary(fit, fit.measures = TRUE, standardized = TRUE)`,
              check:
                'At least three items per factor, and a sample of 200 or more is a common guide. Items are treated as continuous; for items with few response options, add ordered = TRUE to cfa() to treat them as ordinal.',
              note: 'Common rules of thumb for good fit are CFI and TLI of .95 or more, RMSEA of .06 or less and SRMR of .08 or less (Hu and Bentler, 1999). Standardised loadings (the Std.all column) above about .5 show that an item reflects its factor.',
              buildsOn: '17-2',
              further: 'Timothy Brown, Confirmatory Factor Analysis for Applied Research, and the lavaan tutorial at lavaan.ugent.be.',
            },
          },
          {
            label: 'A theory linking several traits',
            example: 'Does one ability explain another, when each is measured with several items?',
            tech: 'Structural equation model',
            next: {
              kind: 'answer',
              id: 'structural-equation-model',
              model: 'Structural equation model (SEM)',
              when: 'A theory with several constructs, each measured by items, and paths between them, tested as one model.',
              rCode: `library(lavaan)
# The course data has no questionnaire items, so this uses HolzingerSwineford1939 from lavaan: ability tests taken by 301 pupils.
model <- "
  visual =~ x1 + x2 + x3
  textual =~ x4 + x5 + x6
  textual ~ visual + ageyr
"
fit <- sem(model, data = HolzingerSwineford1939)
summary(fit, fit.measures = TRUE, standardized = TRUE)`,
              check:
                'A model specified before looking at the data: SEM tests the paths you draw and nothing else. Check that the measurement part fits as a CFA before trusting the paths. Samples of a few hundred are typical.',
              note: '=~ defines a latent variable measured by items; ~ is a regression. Paths between latent variables are free of the measurement error that weakens correlations between scale totals. Judge the fit as for a CFA.',
              further: 'Rex Kline, Principles and Practice of Structural Equation Modeling, and the lavaan tutorial at lavaan.ugent.be.',
            },
          },
        ],
      },
    },
    {
      label: 'Summing up many variables, or finding types',
      example: 'Can 20 questionnaire items be summed up as a few traits?',
      tech: 'Dimension reduction, clustering',
      group: 'Dimension reduction and clustering',
      next: {
        kind: 'question',
        text: 'What do you want to sum up or sort?',
        options: [
          {
            label: 'Many numbers into a few summary scores',
            example: 'Can ten fitness measures be summed up in two or three scores?',
            tech: 'Principal component analysis',
            next: {
              kind: 'answer',
              id: 'principal-components',
              model: 'Principal component analysis (PCA)',
              when: 'Many correlated numeric variables, and you want a few scores that keep most of their information, for description or as predictors in a later model.',
              rCode: `library(dplyr)
d <- read.csv("data/workplace.csv", stringsAsFactors = TRUE)
numbers <- d %>% select(tenure_years:autonomy, wellbeing:performance)
pca <- prcomp(numbers, scale. = TRUE)
summary(pca)
pca$rotation[, 1:2]`,
              check:
                'Numeric variables that correlate with each other. scale. = TRUE puts them on a common scale, which you want unless they share units. No missing values: prcomp() stops on NA, so drop or impute them first.',
              note: 'summary() shows how much of the total variance each component explains; keep the components before the explained variance levels off, which screeplot(pca) draws. The rotation matrix gives each variable\'s loading on each component. Components are summaries, not measured traits: for traits, use factor analysis.',
              buildsOn: '17-2',
              further: 'James, Witten, Hastie and Tibshirani, An Introduction to Statistical Learning (free online), the chapter on unsupervised learning.',
            },
          },
          {
            label: 'Questionnaire items into the traits behind them',
            example: 'Which traits lie behind the 20 personality items?',
            tech: 'Exploratory factor analysis',
            next: {
              kind: 'answer',
              id: 'exploratory-factors',
              model: 'Exploratory factor analysis (EFA)',
              when: 'Many items and no settled idea of their structure, and you want to find the few underlying traits that explain how they correlate.',
              rCode: `library(dplyr)
# The course data has no questionnaire items, so this uses HolzingerSwineford1939 from lavaan: ability tests taken by 301 pupils.
items <- lavaan::HolzingerSwineford1939 %>% select(x1:x9)
efa <- factanal(items, factors = 3, rotation = "promax")
print(efa, cutoff = 0.3, sort = TRUE)`,
              check:
                'A sample of 200 or so, and at least five cases per item. Choose the number of factors before fitting, with a scree plot or parallel analysis: psych::fa.parallel(items).',
              note: 'promax lets the factors correlate, which is realistic for psychological traits. An item loading above about .3 on one factor and weakly on the others helps define that factor. To confirm the structure, fit a CFA on new data.',
              lessonId: '17-2',
            },
          },
          {
            label: 'People or cases into types',
            example: 'Are there distinct types of employees, based on their survey answers?',
            tech: 'Cluster analysis',
            next: {
              kind: 'answer',
              id: 'cluster-analysis',
              model: 'Cluster analysis (k-means)',
              when: 'You want to find groups of similar people or cases from several numeric variables, without a grouping known in advance.',
              rCode: `library(dplyr)
d <- read.csv("data/workplace.csv", stringsAsFactors = TRUE)
scaled <- d %>% select(workload, autonomy, wellbeing, performance) %>% scale()
set.seed(1)
clusters <- kmeans(scaled, centers = 3, nstart = 25)
clusters$size
d <- d %>% mutate(cluster = factor(clusters$cluster))
d %>% group_by(cluster) %>% summarise(across(c(workload, autonomy, wellbeing, performance), mean))`,
              check:
                'Numeric variables on comparable scales, which scale() provides. k-means looks for round clusters of similar size and needs the number of clusters in advance: compare several, for example by how kmeans(...)$tot.withinss falls as centers goes from 1 to 8.',
              note: 'nstart = 25 runs the algorithm from 25 random starts and keeps the best. The last line describes each cluster by its means. For a tree of nested groupings instead, hierarchical clustering: hclust(dist(scaled), method = "ward.D2"), then cutree() to cut it into groups. Clusters describe this sample; they do not prove that distinct types exist.',
              further: 'An Introduction to Statistical Learning, the chapter on unsupervised learning; for model-based clusters (latent profile analysis), the mclust package.',
            },
          },
        ],
      },
    },
    {
      label: 'One series measured over time',
      example: 'Did monthly sick leave drop after the new policy started?',
      tech: 'Time series',
      group: 'Time series',
      next: {
        kind: 'question',
        text: 'What do you want to know about the series?',
        help: 'This is for one long series measured at regular intervals, such as monthly sales. Many people each measured a few times is a repeated-measures design instead.',
        options: [
          {
            label: 'Describe it and forecast what comes next',
            example: 'How many visitors can the museum expect next year?',
            tech: 'ARIMA',
            next: {
              kind: 'answer',
              id: 'forecast-series',
              model: 'ARIMA model',
              when: 'One series measured at regular intervals, and you want to model how each value depends on the ones before and forecast the next.',
              rCode: `# The course data is not a time series, so this uses LakeHuron, built into R: the lake's level each year from 1875 to 1972.
series <- LakeHuron
model <- arima(series, order = c(2, 0, 0), xreg = time(series) - 1920)
model
predict(model, n.ahead = 10, newxreg = 1973:1982 - 1920)`,
              check:
                'Equally spaced observations with no gaps. A trend or a seasonal pattern needs differencing, a trend regressor (as xreg does here) or a seasonal term; plot(series) and acf(series) show both. In RStudio, forecast::auto.arima(series) chooses the orders for you.',
              note: 'order = c(p, d, q) sets the autoregressive terms, the number of differences and the moving-average terms. xreg adds a straight-line trend in years, centred on 1920; predict() needs the future years in newxreg. predict() gives forecasts with standard errors, which grow the further ahead you look. Compare candidate orders with the same d by AIC: lower is better. For your own data, ts(d$value, start = c(2020, 1), frequency = 12) turns a column of monthly values into a series.',
              further: 'Hyndman and Athanasopoulos, Forecasting: Principles and Practice (free online at otexts.com), which uses the fable package.',
            },
          },
          {
            label: 'Did something change it at a known moment?',
            example: 'Did monthly sick leave drop after the new policy started?',
            tech: 'Interrupted time series',
            next: {
              kind: 'answer',
              id: 'interrupted-time-series',
              model: 'Segmented regression (interrupted time series)',
              when: 'A series measured before and after a change, such as a new policy, with no control group, and the question is whether the change shifted the level or the trend.',
              rCode: `library(dplyr)
library(broom)
# The course data is not a time series, so this uses Nile, built into R: the river's yearly flow from 1871 to 1970.
# The flow drops after 1898. The change is usually attributed to a shift in rainfall, although work on the
# first Aswan dam also began that year: an ITS alone cannot tell which change caused it.
d <- data.frame(year = 1871:1970, flow = as.numeric(Nile)) %>%
  mutate(time = year - 1870, after = as.numeric(year >= 1899), time_after = pmax(0, year - 1899))
model <- lm(flow ~ time + after + time_after, data = d)
model %>% tidy(conf.int = TRUE)
acf(residuals(model), plot = FALSE)`,
              check:
                'Enough time points before and after, at least eight on each side as a common guide. Values next to each other in time are often correlated, which makes the standard errors too small: if acf() shows autocorrelation, fit nlme::gls(..., correlation = nlme::corAR1()) in RStudio instead.',
              note: 'time is the trend before the change, after is the jump in the first year after it, and time_after (0 up to and including that year) is the change in slope afterwards. Here 1899 is the first year after the change; use the first time point after your own intervention.',
              buildsOn: '11-1',
              further: 'Bernal, Cummins and Gasparrini (2017), Interrupted time series regression for the evaluation of public health interventions: a tutorial, International Journal of Epidemiology.',
            },
          },
        ],
      },
    },
    {
      label: 'Predicting new cases as well as possible',
      example: 'Which employees are most likely to leave next year?',
      tech: 'Prediction, machine learning',
      group: 'Prediction',
      next: {
        kind: 'question',
        text: 'What matters most?',
        help: 'Prediction asks how well a model does on cases it has not seen, not whether an effect is significant. Every answer here tests the model on held-out data.',
        options: [
          {
            label: 'A simple model with only the useful predictors',
            example: 'Which few of 50 survey questions predict turnover best?',
            tech: 'Lasso',
            next: {
              kind: 'answer',
              id: 'lasso',
              model: 'Penalised regression (the lasso)',
              when: 'Many candidate predictors, possibly more than you have cases, and you want a model that picks the useful ones and predicts well.',
              rCode: `library(dplyr)
library(glmnet)
d <- read.csv("data/workplace.csv", stringsAsFactors = TRUE) %>% select(-employee_id)
x <- model.matrix(performance ~ ., data = d)[, -1]
y <- d$performance
set.seed(1)
cv <- cv.glmnet(x, y, alpha = 1)
coef(cv, s = "lambda.1se")`,
              check:
                'Complete cases only, since model.matrix() drops rows with missing values. glmnet standardises the predictors for you. For a yes-or-no outcome, add family = "binomial". Avoid stepwise selection: its p-values come out too small and its R² too large.',
              note: 'The lasso shrinks coefficients towards zero and sets the weakest to exactly zero, so the predictors left over are the selection. lambda.1se is the simplest model whose cross-validated error is within one standard error of the best. The coefficients are shrunk on purpose, so they come without p-values.',
              further: 'An Introduction to Statistical Learning, the chapter on linear model selection and regularisation.',
            },
          },
          {
            label: 'The best accuracy, even if hard to explain',
            example: 'Which students will drop out, as accurately as possible?',
            tech: 'Random forest',
            next: {
              kind: 'answer',
              id: 'random-forest',
              model: 'Random forest',
              when: 'Enough data to learn complex, non-linear patterns and interactions, and accurate prediction matters more than a readable equation.',
              rCode: `library(dplyr)
library(randomForest)
d <- read.csv("data/workplace.csv", stringsAsFactors = TRUE) %>% select(-employee_id)
set.seed(1)
model <- randomForest(performance ~ ., data = d, importance = TRUE)
model
sort(importance(model, type = 1)[, 1], decreasing = TRUE)`,
              check:
                'Hundreds of cases or more. No missing values: randomForest() stops on NA unless you add na.action = na.omit. For a yes-or-no or categorical outcome, make it a factor and it grows a classification forest.',
              note: 'The printout reports error on the out-of-bag cases, the ones each tree did not see, which is a built-in test on new data. The importance line ranks predictors by how much accuracy drops when each is shuffled; it does not say in which direction a predictor works. The ranger package fits the same model faster on large data.',
              further: 'An Introduction to Statistical Learning, the chapter on tree-based methods, and Kuhn and Silge, Tidy Modeling with R (free online), for tuning and cross-validation.',
            },
          },
        ],
      },
    },
    {
      label: 'How probable something is, or how strong the evidence is',
      example: 'How likely is it that the pass rate is above 70%?',
      tech: 'Bayesian analysis',
      group: 'Bayesian analysis',
      next: {
        kind: 'question',
        text: 'What do you want to know?',
        help: 'Bayesian methods give probabilities for the unknowns themselves, and can show evidence that there is no effect. Module 16 introduces them.',
        options: [
          {
            label: 'The likely values of one percentage',
            example: 'What is the pass rate likely to be, given 34 passes out of 40?',
            tech: 'Beta-binomial',
            next: {
              kind: 'answer',
              id: 'bayes-proportion',
              model: 'Bayesian estimate of a proportion (beta-binomial)',
              when: 'One yes-or-no variable, and you want the plausible values of the proportion and the probability of a claim about it, such as "more than half".',
              rCode: `d <- read.csv("data/workplace.csv", stringsAsFactors = TRUE)
left <- sum(d$left_company == 1)
stayed <- sum(d$left_company == 0)
qbeta(c(0.025, 0.5, 0.975), 1 + left, 1 + stayed)
pbeta(0.2, 1 + left, 1 + stayed, lower.tail = FALSE)`,
              check:
                'Independent cases, each counted once, and no missing values in the outcome. The 1 + in each shape is a flat Beta(1, 1) prior; with fewer than about 30 cases, show that the answer holds under another reasonable prior too.',
              traditional: 'The traditional exact binomial test and its confidence interval: binom.test(left, left + stayed, p = 0.2).',
              note: 'Here the proportion is the share of employees who left. The qbeta() line gives the posterior median with a 95% credible interval around it; the pbeta() line is the posterior probability that the share is above 20%. Put the value your own claim is about in place of 0.2.',
              lessonId: '16-2',
            },
          },
          {
            label: 'Evidence for or against an effect',
            example: 'How strong is the evidence that autonomy matters for wellbeing, or that it does not?',
            tech: 'Bayes factor',
            next: {
              kind: 'answer',
              id: 'bayes-factor-models',
              model: 'Bayes factor from the BIC',
              when: 'Any linear model, and the question is how strongly the data support an effect, or its absence, compared with a model without it.',
              rCode: `d <- read.csv("data/workplace.csv", stringsAsFactors = TRUE)
null_model <- lm(wellbeing ~ 1, data = d)
model <- lm(wellbeing ~ mentoring, data = d)
bf10 <- exp((BIC(null_model) - BIC(model)) / 2)
c(BF10 = bf10, BF01 = 1 / bf10)`,
              check:
                'Both models fitted to the same rows: drop cases with missing values first, or BIC() compares different data. The approximation implies a wide prior on the effect, worth about one observation; say you used the BIC approximation.',
              note: 'BF10 above 1 favours the effect, below 1 favours no effect, and BF01 is its reverse. Rough labels: 3 to 10 moderate, 10 to 30 strong, 30 to 100 very strong, above 100 extreme. Here BF01 is about 21: strong evidence that mentoring makes no difference to wellbeing. It works for any pair of nested models, glm() models included.',
              lessonId: '16-3',
            },
          },
          {
            label: 'Evidence about two groups',
            example: 'Is there evidence that remote and office workers do not differ?',
            tech: 'Bayesian version of the traditional t-test',
            next: {
              kind: 'answer',
              id: 'bayes-t-test',
              model: 'Bayesian two-group comparison (default Bayes factor)',
              when: 'Two independent groups and a numeric outcome, and you want the evidence for a difference or for no difference, as psychology journals often ask for.',
              rCode: `library(BayesFactor)
d <- read.csv("data/workplace.csv", stringsAsFactors = TRUE)
bf <- ttestBF(formula = wellbeing ~ remote, data = d)
bf
1 / bf`,
              check:
                'The same as for the traditional t-test: independent scores, roughly normal within each group. The default prior on the standardised difference is a Cauchy with scale 0.707 ("medium"); rerun with rscale = "wide" to show the conclusion does not hang on it.',
              traditional: 'The traditional independent-samples t-test: t.test(wellbeing ~ remote, data = d, var.equal = TRUE).',
              note: 'The printout is BF10, the evidence for a difference against none; 1 / bf gives BF01, the evidence for no difference. posterior(bf, iterations = 10000) draws plausible values of the difference itself.',
              buildsOn: '16-3',
              further: 'The BayesFactor package manual by Richard Morey (free online), and the free program JASP for the same analysis through menus.',
            },
          },
          {
            label: 'A regression with your own priors',
            example: 'What are the plausible values of the autonomy effect, given earlier studies?',
            tech: 'Bayesian regression (brms)',
            next: {
              kind: 'answer',
              id: 'bayesian-regression',
              model: 'Bayesian linear regression (brms)',
              when: 'A numeric outcome and any predictors, and you want a posterior distribution and a credible interval for each coefficient, with priors you choose.',
              rCode: `library(brms)
d <- read.csv("data/workplace.csv", stringsAsFactors = TRUE)
model <- brm(wellbeing ~ autonomy, data = d, prior = prior(normal(0, 1), class = b), seed = 1)
summary(model)
hypothesis(model, "autonomy > 0")`,
              check:
                'Set the prior on the scale of your variables: normal(0, 1) here says one point of autonomy rarely moves wellbeing by more than 2 points. In the summary, every Rhat should be 1.00, and pp_check(model) should show simulated data that look like yours.',
              note: 'The summary gives each coefficient a posterior mean, error and 95% credible interval; hypothesis() gives the posterior probability of a claim. The same call takes several predictors, family = bernoulli() for a yes-or-no outcome, and (1 | id) for repeated measures.',
              lessonId: '16-4',
            },
          },
        ],
      },
    },
  ],
};

/** Shared by two branches, so it is built by a function: each copy is its own object with the same id. */
function crossTable(): Answer {
  return {
    kind: 'answer',
    id: 'cross-table',
    model: 'Traditional chi-square test of independence',
    when: 'Two categorical variables, such as department and whether people left, and the question is whether they are related.',
    rCode: `d <- read.csv("data/workplace.csv", stringsAsFactors = TRUE)
counts <- table(d$left_company, d$department)
counts
chisq.test(counts, correct = FALSE)
prop.table(counts, margin = 2)`,
    check:
      "Each case counted once, in one cell. Expected counts of at least 5 in nearly every cell; chisq.test() warns when they are lower, and then the traditional Fisher exact test is the alternative: fisher.test(counts).",
    note: 'A significant result means the outcome is distributed differently across the categories of the predictor. The last line shows how: the proportion of each outcome within each predictor category. For a yes-or-no outcome, logistic regression with this one predictor gives the same chi-square with anova(glm(left_company ~ department, data = d, family = binomial), test = "Rao"), and extends to more predictors.',
    lessonId: '09-3',
  };
}

/** Every answer once, in tree order, with the option labels that lead to it and its index group. */
export function allAnswers(): { answer: Answer; path: string[]; group: string }[] {
  const found: { answer: Answer; path: string[]; group: string }[] = [];
  const seen = new Set<string>();
  (function walk(node: Node, path: string[], group: string) {
    if (node.kind === 'answer') {
      if (!seen.has(node.id)) {
        seen.add(node.id);
        found.push({ answer: node, path, group });
      }
      return;
    }
    for (const option of node.options) walk(option.next, [...path, option.label], option.group ?? group);
  })(TREE, [], '');
  return found;
}

/** The option labels from the first question to the answer with this id, or null. */
export function pathTo(id: string): string[] | null {
  return allAnswers().find((entry) => entry.answer.id === id)?.path ?? null;
}

/** Follows option labels from the first question. Stops at the last label that matches. */
export function follow(path: string[]): { node: Node; path: string[] } {
  let node: Node = TREE;
  const taken: string[] = [];
  for (const label of path) {
    if (node.kind !== 'question') break;
    const option: Option | undefined = node.options.find((candidate) => candidate.label === label);
    if (!option) break;
    node = option.next;
    taken.push(label);
  }
  return { node, path: taken };
}
