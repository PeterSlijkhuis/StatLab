import type { ExerciseText } from './types';

export const part1: Record<string, ExerciseText> = {
  'mrm-2-a': {
    prompt: 'Lengte is een ratiovariabele, dus een gemiddelde is zinvol. Wat is de gemiddelde lengte van de Star Wars-personages? Een paar lengtes ontbreken. Sla het gemiddelde op in mean_height.',
    hints: [
      'starwars$height kiest de kolom met lengtes.',
      'mean() geeft NA zodra een waarde ontbreekt, tenzij je na.rm = TRUE toevoegt.',
      'mean_height <- mean(starwars$height, na.rm = TRUE)',
    ],
  },
  'mrm-3-a': {
    prompt: 'Trek een gestratificeerde steekproef: 50 Business- en 50 Psychology-studenten, elk willekeurig getrokken binnen hun opleiding. Sla de 100 rijen op in stratified.',
    hints: [
      'group_by(programme) laat de volgende stap binnen elke opleiding werken.',
      'slice_sample(n = 50) trekt dan 50 rijen uit elke groep.',
      'stratified <- population %>% group_by(programme) %>% slice_sample(n = 50) %>% ungroup()',
    ],
  },
  'mrm-4-a': {
    prompt: 'Hangt economische ontwikkeling samen met steun voor de EU? Maak de kruistabel met support in de rijen en development in de kolommen, met kolompercentages, en sla haar op in ty.',
    hints: [
      'tabyl() neemt eerst de rijvariabele en dan de kolomvariabele.',
      'adorn_percentages("col") laat elke kolom optellen tot 100%.',
      'ty <- regions %>% tabyl(support, development) %>% adorn_percentages("col")',
    ],
  },
  'mrm-5-a': {
    prompt: 'Wijs de 480 werknemers willekeurig toe aan twee gelijke groepen van 240: "treatment" en "control". Sla de labels, één per werknemer, op in group.',
    hints: [
      'rep(c("treatment", "control"), each = 240) maakt de 480 labels op volgorde.',
      'sample() met één vector schudt haar.',
      'group <- sample(rep(c("treatment", "control"), each = 240))',
    ],
  },
  'm0-2-a': {
    prompt: 'De map data in je werkmap bevat workplace.csv. Gebruik file.path() om het relatieve pad naar dat bestand te bouwen en sla het op in path, en sla dan op of R het kan vinden in found.',
    hints: [
      'Een relatief pad begint bij de werkmap, die getwd() laat zien.',
      'file.path("data", "workplace.csv") geeft de tekst "data/workplace.csv".',
      'file.exists() neemt een pad en antwoordt TRUE of FALSE: found <- file.exists(path).',
    ],
  },
  'm0-2-b': {
    prompt: 'Het script van een klasgenoot leest zijn data uit "C:/Users/sam/Documents/survey-analysis/data/survey.csv", wat alleen op de laptop van Sam werkt. Het script staat in een RStudio-project waarvan de map survey-analysis heet. Sla het pad naar survey.csv relatief ten opzichte van het project op in rel_path.',
    hints: [
      'In een project is de werkmap de projectmap: hier survey-analysis.',
      'Houd alleen over wat na survey-analysis/ komt in het oude pad.',
      'Paden in R gebruiken schuine strepen vooruit: rel_path <- "data/survey.csv".',
    ],
  },
  'm0-3-a': {
    prompt: 'ages bevat de leeftijden van acht deelnemers. Sla op hoeveel van hen in de twintig zijn, 20 tot en met 29, in n_twenties.',
    hints: [
      'ages >= 20 stelt één vraag aan elke leeftijd; ages <= 29 stelt de andere.',
      '& verbindt ze: alleen TRUE waar beide TRUE zijn.',
      'sum() telt de TRUE-waarden: n_twenties <- sum(ages >= 20 & ages <= 29).',
    ],
  },
  'm0-3-b': {
    prompt: 'depts bevat de afdeling van zes werknemers. Sla met %in% op hoeveel van hen bij Sales of Support werken in n_front.',
    hints: [
      'depts %in% c("Sales", "Support") geeft zes TRUE- of FALSE-antwoorden.',
      'Tekst moet exact overeenkomen, hoofdletters inbegrepen.',
      'sum() telt de TRUE-waarden: n_front <- sum(depts %in% c("Sales", "Support")).',
    ],
  },
  'm0-4-a': {
    prompt: 'Het data frame team staat in je omgeving, met een kolom name en een kolom hours. Sla de uren van de derde persoon op in third_hours, en de namen van iedereen die meer dan 40 uur werkte in long_names.',
    hints: [
      'team$hours is één kolom, een gewone vector van zes getallen.',
      'Vierkante haken kiezen elementen: team$hours[3] is de derde.',
      'Een TRUE/FALSE-voorwaarde werkt ook binnen [ ]: team$name[team$hours > 40].',
    ],
  },
  'm0-4-b': {
    prompt: 'scores bevat acht beoordelingen op een schaal van 1 tot 5, en er ontbreekt er één. Neem met de pipe |> hun gemiddelde zonder de ontbrekende waarde, rond het af op twee decimalen en sla het resultaat op in avg.',
    hints: [
      'x |> f() betekent f(x): de linkerkant gaat erin als eerste argument.',
      'Extra argumenten blijven tussen de haakjes: scores |> mean(na.rm = TRUE).',
      'Voeg aan het eind nog een stap toe: |> round(2).',
    ],
  },
  'm1-1-a': {
    prompt: 'Een docent noteerde vijf cijfers: 68, 74, 59, 81 en 77. Sla ze op in een vector genaamd marks, en sla hun gemiddelde op in mark_mean.',
    hints: [
      'c() combineert waarden tot één vector: c(68, 74, 59, 81, 77).',
      'De pijl slaat een resultaat op onder een naam: marks <- c(...).',
      'mean() neemt de hele vector in één keer: mark_mean <- mean(marks).',
    ],
  },
  'm1-1-b': {
    prompt: 'Die vijf cijfers waren uit 90. Sla ze als percentages op in percent, in één regel en zonder lus, en sla op hoeveel ervan boven 85 procent liggen in n_high.',
    hints: [
      'Een bewerking op een vector gebeurt met elk element: marks / 90 * 100 geeft vijf percentages.',
      'percent > 85 geeft vijf TRUE- of FALSE-waarden, één per student.',
      'sum() van TRUE en FALSE telt de TRUE-waarden, omdat R TRUE als 1 behandelt.',
    ],
  },
  'm1-2-a': {
    prompt: 'Acht werknemers kregen een vraag over hun welzijnsscore, maar één sloeg de vraag over: scores <- c(62, 58, NA, 71, 66, 60, 64, 57). Sla het gemiddelde van de gegeven scores op in mean_score, en dat gemiddelde afgerond op één decimaal in mean_rounded.',
    hints: [
      'args(mean.default) toont de argumenten die mean() accepteert. Eén ervan gaat over ontbrekende waarden.',
      'mean(scores, na.rm = TRUE) laat de NA vallen en middelt wat overblijft.',
      'round() neemt een tweede argument: round(mean_score, 1) houdt één decimaal.',
    ],
  },
  'm1-2-b': {
    prompt: 'Een vragenlijst wordt gescoord van 0 tot 100 in stappen van 10. Gebruik seq() om die vector van schaalpunten te bouwen in scale_points, en sla op hoeveel punten het zijn in n_points.',
    hints: [
      'args(seq.default) toont de argumenten: onder andere from, to, by en length.out.',
      'by = 10 stelt de stapgrootte in; length.out stelt in hoeveel waarden je krijgt. Jij wilt de stap.',
      'length() telt de waarden in een vector, zodat je ze nooit zelf hoeft te tellen.',
    ],
  },
  'm1-3-a': {
    prompt: 'Het data frame team staat al in je omgeving, met een kolom name en een kolom hours. Laad dplyr en gebruik filter() om alleen de mensen te houden die meer dan 35 uur werkten. Sla het resultaat op in busy en het aantal rijen in n_busy.',
    hints: [
      'library(dplyr) laadt het pakket; de werkwoorden bestaan pas daarna.',
      'filter() houdt rijen: team %>% filter(hours > 35). Let op dat "meer dan 35" 35 zelf uitsluit.',
      'nrow() telt de rijen van een data frame; length() zou de kolommen tellen.',
    ],
  },
  'm2-1-a': {
    prompt: 'Lees data/workplace.csv in employees in, met de tekstkolommen als factoren. Sla het aantal werknemers op in n_employees en het aantal afdelingen in n_departments.',
    hints: [
      'read.csv("data/workplace.csv", stringsAsFactors = TRUE) leest het bestand en maakt van de tekstkolommen factoren.',
      'Elke rij is één werknemer, dus nrow() telt werknemers.',
      'Een factor slaat haar mogelijke waarden op als levels; nlevels() telt ze.',
    ],
  },
  'm2-1-b': {
    prompt: 'Hoeveel mensen werken thuis? Sla de aantallen van de kolom remote op in remote_counts, en alleen het aantal thuiswerkers in n_remote.',
    hints: [
      'table() telt hoe vaak elk level van een factor voorkomt: table(employees$remote).',
      'Een tabel kan worden geïndexeerd met de naam van een level, met dubbele vierkante haken.',
      'Levels staan op alfabet, dus No is eerst en Yes is tweede. Vraag om de naam, niet om de positie.',
    ],
  },
  'm2-2-a': {
    prompt: 'Bouw sales_remote: de werknemers in Sales die thuiswerken, met alleen de kolommen employee_id, tenure_years en wellbeing. Sla het aantal rijen op in n_sales_remote.',
    hints: [
      'filter() kiest rijen. Twee voorwaarden gescheiden door een komma moeten allebei gelden.',
      'select() kiest kolommen, en je noemt ze zonder aanhalingstekens: select(employee_id, tenure_years, wellbeing).',
      'Koppel ze met de pipe en tel dan met nrow(sales_remote).',
    ],
  },
  'm2-2-b': {
    prompt: 'Elke werknemer is twee keer gemeten. Voeg een kolom engagement_change toe met engagement_t2 min engagement_t1, sla de hele tabel op in with_change, en sla de gemiddelde verandering op in mean_change.',
    hints: [
      'mutate() voegt een kolom toe of verandert er een en geeft de hele tabel terug: employees %>% mutate(new = a - b).',
      'Het resultaat moet worden toegewezen, anders wordt het afgedrukt en weggegooid.',
      'Verandering is waar ze uitkwamen min waar ze begonnen, dus engagement_t2 komt eerst.',
    ],
  },
  'm2-3-a': {
    prompt: 'Hervorm de twee engagementkolommen naar lang formaat. Houd employee_id en department, zet de kolomnamen in een kolom time en de scores in een kolom engagement, sla het resultaat op in long, en sla het aantal rijen op in n_long.',
    hints: [
      'pivot_longer() neemt cols (welke kolommen worden gestapeld), names_to en values_to.',
      'Beide engagementkolommen verhuizen: cols = c(engagement_t1, engagement_t2).',
      'names_to is de kolom die engagement_t1 en engagement_t2 als labels bevat; values_to bevat de scores.',
    ],
  },
  'm2-4-a': {
    prompt: 'Hercodeer workload naar workload_level: onder 4 is "low", van 4 tot maar niet inclusief 7 is "medium", en 7 of meer is "high". Sla het op in employees als geordende factor met de levels in die volgorde, en sla table(employees$workload_level) op in level_counts.',
    hints: [
      'Elke regel van case_when() is een voorwaarde, een tilde en een label: workload < 4 ~ "low".',
      'De middelste band heeft twee voorwaarden nodig verbonden met &: workload >= 4 & workload < 7.',
      'Dan legt factor(workload_level, levels = c("low", "medium", "high"), ordered = TRUE) de volgorde vast.',
    ],
  },
  'm3-1-a': {
    prompt: 'Vat de kolom wellbeing samen. Sla een data frame met één rij op in wellbeing_summary met de kolommen mean_wellbeing, sd_wellbeing en n.',
    hints: [
      'summarise() maakt van een hele tabel één rij: employees %>% summarise(...).',
      'Binnen summarise() geef je elke nieuwe kolom een naam: mean_wellbeing = mean(wellbeing).',
      'n() telt de rijen die in de samenvatting gingen, en neemt geen argumenten.',
    ],
  },
  'm3-1-b': {
    prompt: 'Hoe gespreid is welzijn? Sla een data frame met één rij op in spread met sd_wellbeing (de standaarddeviatie), iqr_wellbeing (de interkwartielafstand) en range_wellbeing (de hoogste score min de laagste).',
    hints: [
      'sd() geeft de standaarddeviatie, IQR() de interkwartielafstand.',
      'R heeft een functie range(), maar die geeft twee getallen: de kleinste en de grootste. Hier wil je de afstand ertussen.',
      'max(wellbeing) - min(wellbeing) is die afstand in één uitdrukking.',
    ],
  },
  'm3-2-a': {
    prompt: 'Beschrijf welzijn afdeling voor afdeling. Sla een data frame op in by_department met één rij per afdeling en de kolommen mean_wellbeing, sd_wellbeing en n.',
    hints: [
      'group_by(department) laat het volgende werkwoord binnen elke afdeling apart werken.',
      'summarise() geeft dan één rij per groep terug, met de groeperingskolom behouden.',
      'n() telt de rijen van de groep waarin het wordt aangeroepen, dus hier geeft het een afdelingsgrootte.',
    ],
  },
  'm3-2-b': {
    prompt: 'Rapporteren thuiswerkers een hoger welzijn? Sla by_remote op (één rij per level van remote, met mean_wellbeing en n), en sla het verschil thuis min kantoor op in remote_gap.',
    hints: [
      'group_by(remote) en dan summarise() geeft één rij per level van remote.',
      'n() binnen summarise telt de rijen van de huidige groep; nrow(employees) zou de groepering negeren.',
      'Om één rij van het resultaat te kiezen, indexeer je op de levelnaam: with(by_remote, mean_wellbeing[remote == "Yes"]) is het gemiddelde van thuiswerkers.',
    ],
  },
  'm3-3-a': {
    prompt: 'Vergelijk de twee samenvattingen naast elkaar. Sla department_shape op met één rij per afdeling en de kolommen mean_wellbeing, median_wellbeing en n, en sla dan de naam van de afdeling met de hoogste mediaan welzijn op in highest_median.',
    hints: [
      'Voeg median_wellbeing = median(wellbeing) naast het gemiddelde toe in dezelfde summarise()-aanroep.',
      'slice_max(median_wellbeing, n = 1) houdt de rij met de grootste mediaan.',
      'pull(department) maakt van die kolom met één cel een waarde; as.character() haalt de factorlabels weg.',
    ],
  },
  'm3-4-a': {
    prompt: 'Het eens zijn met q3 betekent LAAG welzijn, dus het moet worden omgedraaid voordat het bij de andere komt. Sla het omgekeerde item op in survey$q3_r, op dezelfde schaal van 1 tot 5, en sla dan de schaalscore van elke persoon, het gemiddelde van q1, q2, q3_r, q4 en q5, op in survey$score.',
    hints: [
      'Op een schaal van 1 tot 5 maakt 6 - x van 1 een 5, van 2 een 4 en laat 3 waar het is.',
      'rowMeans() neemt het gemiddelde over de kolommen die je geeft, één waarde per persoon.',
      'survey$score <- rowMeans(survey[, c("q1", "q2", "q3_r", "q4", "q5")])',
    ],
  },
  'm3-4-b': {
    prompt: 'Hoe consistent zijn de vijf items het met elkaar eens? Bereken Cronbachs alfa voor q1, q2, q3_r, q4 en q5 en sla het op in alpha. De formule staat in de startcode.',
    hints: [
      'apply(items, 2, var) geeft de variantie van elke kolom; sum() telt ze op.',
      'Het totaal is rowSums(items): de vijf antwoorden van elke persoon bij elkaar opgeteld.',
      'alpha <- k / (k - 1) * (1 - sum(apply(items, 2, var)) / var(rowSums(items)))',
    ],
  },
  'm4-1-a': {
    prompt: 'Teken de verdeling van welzijn: een histogram met 20 klassen, opgeslagen in wellbeing_plot.',
    hints: [
      'ggplot(employees, aes(x = wellbeing)) stelt de data in en zegt welke kolom op x komt.',
      'Een laag voeg je toe met een plusteken aan het eind van de regel: + geom_histogram().',
      'geom_histogram() neemt bins als argument: geom_histogram(bins = 20).',
    ],
  },
  'm4-2-a': {
    prompt: 'Vergelijk de vier afdelingen: een boxplot van welzijn per afdeling, opgeslagen in department_plot.',
    hints: [
      'Een boxplot heeft een groeperingsvariabele en een getal nodig: aes(x = department, y = wellbeing).',
      'De laag is geom_boxplot(), zonder argumenten.',
      'Als de dozen horizontaal uitkomen, staan de twee variabelen verkeerd om.',
    ],
  },
  'm4-2-b': {
    prompt: 'Vergelijk de prestatie in Sales en Engineering alleen, één paneel elk: filter op die twee afdelingen, teken dan een histogram van performance met 15 klassen en gebruik facet_wrap() per afdeling. Sla het op in facet_plot.',
    hints: [
      'filter(department %in% c("Sales", "Engineering")) houdt twee afdelingen in één voorwaarde.',
      'facet_wrap(~ department) geeft elke overgebleven afdeling een eigen paneel.',
      'De panelen bestaan alleen voor waarden die nog in de data zitten, dus filter eerst en facet daarna.',
    ],
  },
  'm4-3-a': {
    prompt: 'Bouw één figuur die je in een verslag zou kunnen plakken: welzijn tegen autonomie als punten, met een rechte lijn uit geom_smooth(method = lm), aslabels geschreven voor een lezer, en theme_classic(). Sla het op in apa_plot.',
    hints: [
      'Twee lagen: geom_point(alpha = 0.4) voor de werknemers, zodat overlappende punten zichtbaar blijven, en geom_smooth(method = lm) voor de lijn.',
      'labs(x = "...", y = "...") vervangt de kolomnamen door iets wat een lezer begrijpt.',
      'theme_classic() verwijdert het grijze paneel en het raster en laat de twee aslijnen over.',
    ],
  },
};
