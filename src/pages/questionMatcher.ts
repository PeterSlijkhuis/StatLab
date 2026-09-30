/**
 * Suggests a model from a research question typed in plain English. It is a
 * keyword matcher, nothing more: it looks for cues such as "whether", "before
 * and after" or "through", and scores each answer in modelTree.ts by the cues
 * it needs. Everything it detects is shown to the student, who can switch a
 * cue off or add one it missed, so a misreading is easy to see and correct.
 */

export type CueId =
  | 'number'
  | 'binary'
  | 'count'
  | 'ordinal'
  | 'ranks'
  | 'category'
  | 'survival'
  | 'trials'
  | 'groups'
  | 'twoGroups'
  | 'manyGroups'
  | 'numeric'
  | 'several'
  | 'fixedValue'
  | 'twice'
  | 'waves'
  | 'clustered'
  | 'moderation'
  | 'mediation'
  | 'curved'
  | 'severalOutcomes'
  | 'growth'
  | 'scale'
  | 'factors'
  | 'confirm'
  | 'reduce'
  | 'types'
  | 'timeSeries'
  | 'intervention'
  | 'prediction'
  | 'select'
  | 'bayes';

export type Cue = {
  id: CueId;
  /** On the chip the student toggles. */
  label: string;
  /** One reason a suggestion fits, in the student's terms. */
  why: string;
  /** Matched against the normalised question. 'number' has none: it is assumed when no other outcome is. */
  pattern?: RegExp;
};

// Numeric variables the course data uses, so "the effect of workload" reads as a number predictor.
const NUMERIC_WORDS = new RegExp('\\b(age|hours|income|salary|workload|autonomy|stress|sleep|tenure|experience|temperature|dose|screen time|study time|sleep hours)\\b');
const GROUP_NOUNS = 'groups|departments|conditions|categories|countries|faculties|programmes|programs|regions|brands|treatments';

export const CUES: Cue[] = [
  { id: 'number', label: 'Outcome is a number', why: 'The outcome is a number or score' },
  {
    id: 'binary',
    label: 'Outcome is yes or no',
    why: 'The outcome is yes or no',
    pattern:
      /\b(predicts?|affects?|influences?|explains?|determines?|relates? to|associated with) whether\b|\byes or no\b|\byes ?\/ ?no\b|\b(say|says|said|answer|answers|answered) yes\b|\blogistic\b|\bchi ?squared?\b|\bmore than half\b|\bless than half\b|\bmajority\b|(?<!sick )\bleav(e|es|ing)\b|\bleft (the|their|school|work|company|job)\b|\bquit|\bdrop(s|ped)? out|\bturnover\b|\bpass(es|ed|ing)?\b|\bfail(s|ed)?\b|\bchances?\b|\blikely\b|\blikelihood|\bodds\b|\bproportion|\bpercentage|\bpercent of|\bshare of|\bshare who|\bpass rate|\bsucceed|\bsurvive[sd]?\b/,
  },
  {
    id: 'count',
    label: 'Outcome is a count',
    why: 'The outcome is a count of how often something happens',
    pattern: /\bhow many\b|\bnumber of (?!(items|variables|questions|predictors|factors|components|hours|years)\b)|\bcount of\b|\bhow often\b|\bfrequency\b|\btimes (a|per|each) (day|week|month|year)\b/,
  },
  {
    id: 'ordinal',
    label: 'Outcome has a few ordered levels',
    why: 'The outcome has a few ordered levels',
    pattern:
      /\bordinal\b|\bordered\b|\branks?\b|\branking\b|\brank(ed|s)? order|\bgrades? (a|b|c)\b|\bsatisfaction (level|rating|category)|\blow,? medium,? (and|or) high\b|\b(three|four|five|3|4|5)[ -]point\b|\blikert item\b|\bnever,? sometimes,? (and|or) often\b|\bagree or disagree\b|\bstage\b/,
  },
  {
    id: 'ranks',
    label: 'Ranks instead of means',
    why: 'You ask for a traditional rank-based (nonparametric) test',
    pattern: /\bnon ?parametric\b|\bmann whitney\b|\bwilcoxon\b|\bkruskal\b|\brank based\b|\bskewed\b/,
  },
  {
    id: 'category',
    label: 'Outcome is a category',
    why: 'The outcome is one of several categories with no order',
    pattern:
      /\bwhich (kind|type|category|brand|option|mode|party|product|programme|program|one) (of|do|does|people|they|students|employees)\b|\bchoice of\b|\bchoose (between|among)\b|\bhow (people|they|students|employees|staff) (travel|commute|vote)|\bvote for\b|\bcar,? bike\b/,
  },
  {
    id: 'survival',
    label: 'Time until an event',
    why: 'You ask how long it takes until something happens',
    pattern: /\btime (until|to|before)\b|\bhow (long|soon|quickly) (until|before|it takes|do|does|did|people|employees|patients|students)\b|\bsurvival\b|\bstay(ed)? longer\b|\bsooner\b|\bhazard\b|\bdropout time\b/,
  },
  {
    id: 'trials',
    label: 'Successes out of tries',
    why: 'You count successes out of a fixed number of tries, so it is yes or no per try',
    pattern: /\b\d+ (out )?of (the )?\d+\b|\bout of (ten|twenty|\d+)\b|\bnumber correct\b|\b(correct|right) out of\b/,
  },
  {
    id: 'groups',
    label: 'Compares groups',
    why: 'You compare groups',
    pattern: new RegExp(
      `\\b(differ|differs|differed|difference|differences|different from each other|compare|compared|comparing|comparison|versus|vs|group|condition|treatment|control group|experimental|intervention|gender|men|women|male|female|remote|office workers|training|trained|untrained|mentoring|nationality|department|${GROUP_NOUNS})\\b|\\bper (programme|program|department|group|condition|faculty|country)\\b|(?<!measures |rm )\\banova\\b`,
    ),
  },
  {
    id: 'twoGroups',
    label: 'Two groups',
    why: 'There are two groups',
    pattern:
      /\b(differ\w*|compar\w*|gap|difference) between (the )?\w+( \w+)? and\b|\bthan (?!\d|the (national )?average|chance|half|a\b|expected|before|after|at (baseline|the start))\w+|(?<!\b(time \d|t\d|pre|before) )\b(versus|vs)\b|\btwo (groups|conditions|departments|versions|methods)\b|\bmen and women\b|\bwomen and men\b|\btreatment and control\b|\bwith and without\b/,
  },
  {
    id: 'manyGroups',
    label: 'Three or more groups',
    why: 'There are three or more groups',
    pattern: new RegExp(
      `\\b(three|four|five|six|several|multiple|\\d+) (${GROUP_NOUNS})\\b|\\b(between|across|among) (the )?(${GROUP_NOUNS})\\b|\\b\\w+, \\w+,? (and|or) \\w+ (groups|departments|conditions)\\b|\\b\\w+, \\w+,? (and|or) \\w+ differ|\\bdiffer\\w*[^?]*\\b(between|across|among) \\w+, \\w+,? (and|or) \\w+|(?<!measures |rm |two way |2 way )\\banova\\b`,
    ),
  },
  {
    id: 'numeric',
    label: 'A number predicts it',
    why: 'A number predicts the outcome',
    pattern: new RegExp(
      `\\b(predicts?|predicting|predictor|relates?|related|relationship|associated|association|correlat\\w*|linked|go(es)? with|go together|as \\w+ (increases|rises|goes up|decreases|drops)|the more|increase in)\\b`,
    ),
  },
  {
    id: 'several',
    label: 'Several predictors',
    why: 'You use several predictors, or control for something',
    pattern:
      /\bcontrol(ling)? for\b|\badjust(ing|ed)? for\b|\baccount(ing)? for\b|\btaking into account\b|\bholding \w+( \w+)? constant\b|\bover and above\b|\beach predict|\bseveral (predictors|factors|variables)\b|\bmultiple (predictors|factors|variables)\b|\b\w+ and \w+ (each |both |together )?(predict|explain|affect|relate)\b|\bcovariate|\bmultiple regression\b|\bancova\b|\bwith \w+ and \w+ (as predictors|predicting)\b|\b(predicts?|explains?)\b[^?]*\b\w+, \w+,? (and|or) \w+\b/,
  },
  {
    id: 'fixedValue',
    label: 'Compared with a fixed value',
    why: 'You compare with a fixed value',
    pattern:
      /\bthan \d|\bfrom \d|\b(above|below|exceeds?|at least|at most|more than|less than|over|under) \d+(?!\d| (\w+ )?(times|waves|time points|measurements|occasions|weeks|months|years|days|sessions|visits))|\d ?%|\bpercent\b|\bmidpoint\b|\bthe norm\b|\bnational average\b|\bchance level\b|\bmore than half\b|\bless than half\b|\bmajority\b|\bequally (often|likely|popular|common|distributed)\b|\bexpected (shares|proportions|distribution)\b|\bevenly\b/,
  },
  {
    id: 'twice',
    label: 'Same people, twice',
    why: 'The same people are measured twice',
    pattern:
      /\bbefore and after\b|\bpre ?(test)? (and|to|vs|versus) post\b|\bt1\b[^?]*\bt2\b|\btime 1\b[^?]*\btime 2\b|\bpre ?\/ ?post\b|\bpretest\b|\bposttest\b|\bfrom the first to the second\b|\bfirst and second (measurement|time|wave|test|exam)\b|\btwo (time points|measurements|waves|occasions)\b|\btwice\b|\bfollow ?up\b|\bsame (people|participants|students|employees|persons|patients|children|workers|staff)\b|\bpaired\b|\bmatched pairs\b|\brepeated\b|\bthan (before|at baseline|at the start)\b|\b(rise|rose|increase|increased|drop|dropped|improve|improved|change|changed) from\b/,
  },
  {
    id: 'waves',
    label: 'Three or more measurements',
    why: 'People are measured three or more times',
    pattern:
      /\b(three|four|five|six|several|many|\d+) (measurement )?(times|waves|time points|measurements|occasions|weeks|months|sessions|exam weeks|weigh ins|days|visits)\b(?! (a|per|each) )|\bover time\b|\bover (the )?(two|three|four|five|\d+) years\b|\bevery (week|day)\b|\bweekly\b|\bdaily\b|\btrajector\w*|\bacross (the )?(weeks|months|years|sessions|waves)\b/,
  },
  {
    id: 'clustered',
    label: 'People in teams or classes',
    why: 'People are grouped in teams, classes or sites, which makes them alike',
    pattern: /\b(teams?|class(es|rooms?)?|schools?|sites?|hospitals?|clinics?|branches|wards?|nested|multilevel|multi level|households?|families|neighbourhoods?|neighborhoods?)\b/,
  },
  {
    id: 'moderation',
    label: 'An effect depends on something',
    why: 'You ask whether an effect depends on something else',
    pattern:
      /\b(effect|relationship|relation|link|association|impact|influence)\b[^?]*\b(depends?|differs?|different|stronger|weaker|vary|varies|smaller|larger|bigger)\b|\bdepends? on\b|\b(stronger|weaker|more|less|bigger|smaller|larger) (for|among|when|in)\b|\bdiffer(s)? for\b|\bmoderat\w*|\binteract\w*|\bbuffer\w*/,
  },
  {
    id: 'mediation',
    label: 'An effect through a middle step',
    why: 'You ask whether an effect runs through a middle step',
    pattern: /(?<!go |goes |went |going )\b(through|via)\b|\bexplains? why\b|\bmechanism\b|\bmediat\w*|\bindirect\w*|\bby (raising|increasing|reducing|lowering|improving|making|boosting)\b/,
  },
  {
    id: 'curved',
    label: 'A curved pattern',
    why: 'The pattern may bend or level off',
    pattern: /\bcurv\w*|\blevels? off\b|\bup to a point\b|\bdiminish\w*|\btoo much\b|\bsweet spot\b|\boptimal\b|\binverted u\b|\bu shaped\b|\bnon ?linear\b|\bplateau\w*/,
  },
  {
    id: 'severalOutcomes',
    label: 'Several outcomes at once',
    why: 'You look at several outcomes at once',
    pattern: /\b(several|multiple) (outcomes|dependent variables)\b|\b(in|on) both \w+ and \w+\b|\b(affects?|influences?|improves?|predicts?|raises?|lowers?|changes?) both \w+ and \w+\b|\bmanova\b/,
  },
  {
    id: 'growth',
    label: 'Each at their own rate',
    why: 'People change at their own rate',
    pattern: /\b(different|own) (rates?|pace|speeds?)\b|\bgrowth curve\b|\bhow (fast|quickly) (they|their|people|each|participants|students|patients|employees)\b[^?]*\b(improve|change|grow|increase|decrease|decline|learn)|\bgrow(s)? faster\b|\btrajector\w*/,
  },
  {
    id: 'scale',
    label: 'Questionnaire items',
    why: 'You work with the items of a questionnaire',
    pattern: /\bitems\b|\bquestionnaire\b|\bsubscale\b|\breliab\w*|\bcronbach|\balpha\b|\binternal consistency\b|\bhang together\b/,
  },
  {
    id: 'factors',
    label: 'Traits behind the items',
    why: 'You look for the traits or factors behind the items',
    pattern: /\bfactor analysis\b|\b(efa|cfa)\b|\bfactor structure\b|\b\d+ factor\b|\blatent\b|\bunderl(ie|ies|ying)\b|\b(factors|dimensions|traits)\b[^?]*\b(items|questionnaire)\b|\b(traits|factors|dimensions|abilities)( \w+)? (behind|underlying|they were written for)\b|\b(items|questionnaire)\b[^?]*\b(factors|dimensions|traits|abilities)\b/,
  },
  {
    id: 'confirm',
    label: 'Structure known in advance',
    why: 'You test a structure you expect in advance',
    pattern: /\bconfirm\w*|\bcfa\b|\bwritten for\b|\bas (expected|intended|designed)\b|\bexpected (factors|structure)\b|\bstructural equation\b|\bsem\b|\bpath model\b/,
  },
  {
    id: 'reduce',
    label: 'Many variables into a few',
    why: 'You want to sum up many variables in a few scores',
    pattern: /\bprincipal components?\b|\bpca\b|\breduce (\d+ |the |many |our |my |these )?(\w+ )?(variables|items|measures|scores|questions)\b|\bboil down\b|\bsumm(ed|ari[sz]ed?) up\b|\b(a )?(few|smaller number of|two or three) (scores|dimensions|components|indices)\b/,
  },
  {
    id: 'types',
    label: 'Sorting into types',
    why: 'You want to sort people or cases into types',
    pattern: /\bcluster analysis\b|\bclusters of\b|\bsegments?\b|\bprofiles\b|\b(distinct|natural) (groups|types)\b|\btypes of (people|customers|students|employees|users|patients)\b/,
  },
  {
    id: 'timeSeries',
    label: 'One series over time',
    why: 'You follow one series measured at regular intervals',
    pattern: /\btime series\b|\bmonthly\b|\byearly\b|\bannual\b|\bper (month|year|quarter)\b|\beach (month|year|quarter)\b|\bforecast\w*|\bover the (past|last) \d+ (years|months)\b|\bexpect next (year|month)\b/,
  },
  {
    id: 'intervention',
    label: 'A change at a known moment',
    why: 'Something changed at a known moment',
    pattern: /\b(after|since) (the|a|an|our) [\w ]{0,30}(policy|law|intervention|change|reform|campaign|launch)\b|\b(policy|law|reform|campaign) (started|was introduced|came in|began)\b|\bnew (policy|law|rule|reform|campaign)\b/,
  },
  {
    id: 'prediction',
    label: 'Predicting new cases',
    why: 'You want accurate predictions for new cases',
    pattern: /\bmachine learning\b|\baccurate(ly)?\b|\baccuracy\b|\bpredict (new|future|unseen)\b|\bnew (cases|customers|students|employees|patients)\b|\bnext (year|month|semester|term)\b|\bwho will\b|\bwhich \w+ will\b|\bclassif\w*|\balgorithm\b/,
  },
  {
    id: 'select',
    label: 'Picking the useful predictors',
    why: 'You want to keep only the predictors that matter',
    pattern: /\bwhich (few )?(of|predictors|variables|questions)\b[^?]*\b(matter|predict|important|keep)\w*|\bselect\w*|\bkeep only\b|\bmany (predictors|variables)\b|\b\d{2,} (predictors|variables|survey questions|questions)\b/,
  },
  {
    id: 'bayes',
    label: 'Probabilities, evidence (Bayesian)',
    why: 'You ask how probable something is, or how strong the evidence is',
    pattern: /\bbayes\w*|\bprior\w*|\bposterior\b|\bcredible\b|\bhow (likely|probable) is it that\b|\bprobability that\b|\bevidence (for|against|that)\b|\blikely to be\b|\bplausible values\b/,
  },
];

const BY_ID = new Map(CUES.map((cue) => [cue.id, cue]));
export const cueById = (id: CueId) => BY_ID.get(id)!;

const OUTCOMES: CueId[] = ['number', 'binary', 'count', 'ordinal', 'ranks', 'category', 'survival'];
/** Cues that only say what is assumed, not enough on their own for a suggestion. */
const WEAK: CueId[] = ['number'];
/** Cues that name the kind of question outright: an answer that ignores one fits worse. */
const DECISIVE: CueId[] = ['mediation', 'bayes', 'prediction', 'select', 'timeSeries', 'types', 'reduce', 'factors'];

/** Lowercase, straight quotes, no punctuation except the %, commas and slashes some cues need. */
export function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[^a-z0-9%,/' ]+/g, ' ')
    .replace(/'s\b/g, '')
    .replace(/'/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** The cues found in the text, before the student corrects any. */
export function detectCues(text: string): CueId[] {
  const t = normalise(text);
  if (!t) return [];
  const found = new Set(CUES.filter((cue) => cue.pattern?.test(t)).map((cue) => cue.id));
  if (found.has('twoGroups') || found.has('manyGroups')) found.add('groups');
  // "differ in stress" or "mean stress above 5": the variable is the outcome, not a predictor.
  if (NUMERIC_WORDS.test(t) && (!(found.has('groups') || found.has('fixedValue')) || found.has('moderation') || found.has('several'))) found.add('numeric');
  // Paired or matched data compares two measurements, not two groups, and so does
  // "the difference between before and after" when no group is named.
  const groupNamed = cueById('groups').pattern!.test(t.replace(/\b(differ\w*|different from each other|compar\w*|versus|vs)\b/g, ''));
  if (/\b(paired|matched)\b/.test(t) || (found.has('twice') && !groupNamed)) ['groups', 'twoGroups', 'manyGroups'].forEach((id) => found.delete(id as CueId));
  // "Differ in how fast they improve" is about rates, not groups.
  if (found.has('growth') && !found.has('twoGroups') && !found.has('manyGroups')) found.delete('groups');
  // Reducing many variables is not picking predictors.
  if (found.has('reduce') && !found.has('prediction')) found.delete('select');
  // 7 out of 10 correct is a yes or no per try, not a count of events.
  if (found.has('trials')) {
    found.add('binary');
    found.delete('count');
  }
  if (found.has('waves') || found.has('timeSeries')) found.delete('twice');
  if (found.has('survival')) found.delete('binary');
  // "Items" alone is a reliability question; traits behind them make it a factor question.
  if (found.has('factors')) found.add('scale');
  if (found.has('confirm') && !found.has('factors') && !found.has('scale')) found.delete('confirm');
  return CUES.map((cue) => cue.id).filter((id) => found.has(id));
}

type Need = CueId | CueId[];
type Rule = { id: string; needs: Need[]; bonus?: CueId[]; avoid?: CueId[] };

const DEPENDENT: CueId[] = ['twice', 'waves', 'clustered'];

/**
 * One rule per answer id in modelTree.ts. A need is a cue the answer requires
 * (a list means any one of them); a bonus makes it fit better; an avoid makes
 * it fit worse. Earlier rules win ties.
 */
const RULES: Rule[] = [
  { id: 'simple-regression', needs: ['number', 'numeric'], avoid: ['several', 'groups', 'moderation', 'curved', 'mediation', 'prediction', 'fixedValue', ...DEPENDENT] },
  { id: 'multiple-regression', needs: ['number', 'several'], bonus: ['numeric'], avoid: ['groups', 'moderation', 'prediction', ...DEPENDENT] },
  { id: 'two-groups', needs: ['number', 'groups'], bonus: ['twoGroups'], avoid: ['manyGroups', 'several', 'moderation', 'numeric', 'severalOutcomes', ...DEPENDENT] },
  { id: 'several-groups', needs: ['number', 'groups'], bonus: ['manyGroups'], avoid: ['twoGroups', 'several', 'moderation', 'numeric', 'severalOutcomes', ...DEPENDENT] },
  { id: 'continuous-moderation', needs: ['number', 'moderation'], bonus: ['numeric'], avoid: DEPENDENT },
  { id: 'factorial', needs: ['number', 'moderation', 'groups'], avoid: ['numeric', ...DEPENDENT] },
  { id: 'groups-with-covariate', needs: ['number', 'groups', 'several'], avoid: ['moderation', ...DEPENDENT] },
  { id: 'several-outcomes', needs: ['number', 'severalOutcomes'], bonus: ['groups'], avoid: DEPENDENT },
  { id: 'curved-relationship', needs: ['number', 'curved'], bonus: ['numeric'] },
  { id: 'mean-vs-value', needs: ['number', 'fixedValue'], avoid: ['groups', 'numeric', ...DEPENDENT] },
  { id: 'before-after', needs: ['number', 'twice'], avoid: ['moderation', 'groups', 'waves', 'clustered'] },
  { id: 'repeated-measures', needs: ['number', 'waves'], avoid: ['moderation', 'groups', 'growth'] },
  { id: 'time-by-group', needs: ['number', ['twice', 'waves'], ['moderation', 'groups']] },
  { id: 'growth-curve', needs: ['number', 'growth'], bonus: ['waves'] },
  { id: 'nested-groups', needs: ['number', 'clustered'], avoid: ['twice', 'waves'] },
  { id: 'logistic-regression', needs: ['binary'], bonus: ['numeric', 'several'], avoid: ['trials', 'fixedValue', 'prediction', ...DEPENDENT] },
  { id: 'cross-table', needs: [['binary', 'category'], 'groups'], avoid: ['numeric', 'several', 'fixedValue', ...DEPENDENT] },
  { id: 'proportion-vs-value', needs: ['binary', 'fixedValue'], avoid: ['groups', 'numeric', ...DEPENDENT] },
  { id: 'repeated-binary', needs: ['binary', ['twice', 'waves', 'clustered']] },
  { id: 'successes-of-trials', needs: ['binary', 'trials'], bonus: ['numeric', 'groups'], avoid: ['fixedValue'] },
  { id: 'rank-tests', needs: [['ordinal', 'ranks']], bonus: ['groups'], avoid: ['several'] },
  { id: 'ordinal-regression', needs: ['ordinal', ['several', 'numeric']] },
  { id: 'multinomial-regression', needs: ['category'], bonus: ['numeric', 'several'], avoid: ['groups', 'fixedValue'] },
  { id: 'goodness-of-fit', needs: ['category', 'fixedValue'] },
  { id: 'poisson-regression', needs: ['count'], bonus: ['numeric', 'groups', 'several'] },
  { id: 'survival-curves', needs: ['survival'], bonus: ['groups'], avoid: ['numeric', 'several'] },
  { id: 'cox-regression', needs: ['survival', ['numeric', 'several']] },
  { id: 'mediation', needs: ['mediation'], bonus: ['groups', 'numeric'] },
  { id: 'scale-reliability', needs: ['scale'], avoid: ['factors', 'reduce', 'types'] },
  { id: 'exploratory-factors', needs: ['factors'], bonus: ['scale', 'reduce'], avoid: ['confirm'] },
  { id: 'confirmatory-factors', needs: ['factors', 'confirm'] },
  { id: 'principal-components', needs: ['reduce'], avoid: ['scale'] },
  { id: 'cluster-analysis', needs: ['types'] },
  { id: 'forecast-series', needs: ['timeSeries'], bonus: ['prediction'], avoid: ['intervention'] },
  { id: 'interrupted-time-series', needs: ['timeSeries', 'intervention'] },
  { id: 'random-forest', needs: ['prediction'], avoid: ['select'] },
  { id: 'lasso', needs: ['select'], bonus: ['prediction'] },
  { id: 'bayes-proportion', needs: ['bayes', 'binary'] },
  { id: 'bayes-t-test', needs: ['bayes', 'groups'] },
  { id: 'bayesian-regression', needs: ['bayes', 'numeric'] },
  { id: 'bayes-factor-models', needs: ['bayes'] },
];

export const RULE_IDS = RULES.map((rule) => rule.id);

export type Suggestion = { id: string; score: number; reasons: string[] };
export type Match = { detected: CueId[]; cues: CueId[]; suggestions: Suggestion[] };

/**
 * Ranks the answers for a research question. `overrides` holds the student's
 * corrections: true adds a cue, false removes one. When no outcome type is
 * found, the outcome is taken to be a number, the most common case.
 */
export function matchQuestion(text: string, overrides: Partial<Record<CueId, boolean>> = {}): Match {
  const found = detectCues(text);
  const detected = found.length > 0 && !found.some((id) => OUTCOMES.includes(id)) ? (['number', ...found] as CueId[]) : found;
  const active = new Set(detected);
  for (const [id, on] of Object.entries(overrides) as [CueId, boolean][]) {
    if (on) active.add(id);
    else active.delete(id);
  }
  // A cue added by hand to a question with none found still needs an outcome.
  if (active.size > 0 && !OUTCOMES.some((id) => active.has(id)) && overrides.number !== false) active.add('number');
  const cues = CUES.map((cue) => cue.id).filter((id) => active.has(id));
  if (!cues.some((id) => !WEAK.includes(id))) return { detected, cues, suggestions: [] };

  const suggestions: Suggestion[] = [];
  for (const rule of RULES) {
    let score = 0;
    let strong = false;
    let outcomeMissed = false;
    const reasons: CueId[] = [];
    for (const need of rule.needs) {
      const options = Array.isArray(need) ? need : [need];
      const hit = options.find((id) => active.has(id));
      // A model for another kind of outcome, or for a kind of question not asked, is no
      // alternative: no Cox regression for a score, no Bayesian model unless asked for.
      if (!hit && options.every((id) => OUTCOMES.includes(id) || DECISIVE.includes(id))) outcomeMissed = true;
      score += hit ? 3 : -2;
      if (hit) {
        reasons.push(hit);
        if (!WEAK.includes(hit)) strong = true;
      }
    }
    for (const id of rule.bonus ?? []) if (active.has(id)) (score += 1), reasons.push(id);
    const uses = [...rule.needs.flat(), ...(rule.bonus ?? [])];
    const ignored = DECISIVE.filter((id) => !uses.includes(id));
    for (const id of [...(rule.avoid ?? []), ...ignored]) if (active.has(id)) score -= 3;
    // The assumed outcome is the weakest reason, so it goes last.
    reasons.sort((a, b) => Number(WEAK.includes(a)) - Number(WEAK.includes(b)));
    if (strong && !outcomeMissed && score > 0) suggestions.push({ id: rule.id, score, reasons: reasons.map((id) => cueById(id).why) });
  }
  // A stable sort keeps rule order for ties.
  suggestions.sort((a, b) => b.score - a.score);
  return { detected, cues, suggestions };
}
