import type { ExerciseText } from './types';

export const part2: Record<string, ExerciseText> = {
  'm5-1-a': {
    prompt: 'Behandel examenscores als normaal, met het populatiegemiddelde en de populatie-SD. Welk deel van de studenten scoort onder 60? Sla die kans op in p_below_60.',
    hints: [
      'pnorm(q, mean, sd) geeft de oppervlakte onder de normale curve links van q.',
      'Het gemiddelde en de SD die je wilt zijn mu en sigma, berekend uit population$exam_score in de startcode.',
      'Zet ze samen: pnorm(60, mean = mu, sd = sigma).',
    ],
  },
  'm5-2-a': {
    prompt: 'Een student scoorde 85 op het examen. Druk dat uit als z-score, hoeveel standaarddeviaties boven het populatiegemiddelde, en sla het op in z_85.',
    hints: [
      'Een z-score beantwoordt: hoeveel SD van het gemiddelde ligt dit?',
      'Trek eerst af voordat je deelt: (85 - mu) is de afstand in examenpunten, en delen door sigma maakt van punten SD\'s.',
    ],
  },
  'm5-2-b': {
    prompt: 'Wat is ongewoner in deze populatie: een examenscore van 85, of 9,1 uur per nacht slapen? Sla de twee z-scores op in z_exam en z_sleep, elk berekend tegen zijn eigen kolom.',
    hints: [
      'Twee aparte z-scores, elk met zijn eigen gemiddelde en SD: exam_score voor de eerste, sleep_hours voor de tweede.',
      'z_exam <- (85 - mean(population$exam_score)) / sd(population$exam_score).',
      'Schrijf nu dezelfde regel voor 9,1 uur, en vervang elke exam_score door sleep_hours.',
    ],
  },
  'm5-3-a': {
    prompt: 'De examencommissie wil de afkapwaarde voor een onderscheiding: de score die alleen de beste 10 procent van de studenten overschrijdt. Sla haar op in top10_cutoff.',
    hints: [
      'qnorm(p, mean, sd) is het omgekeerde van pnorm: geef een kans, krijg een score terug.',
      'De beste 10 procent begint waar al 90 procent van de oppervlakte links ligt.',
      'De kans die je aan qnorm geeft is dus 0,90, niet 0,10.',
    ],
  },
  'm5-3-b': {
    prompt: 'Welk deel van de studenten scoort tussen 65 en 85? Sla het op in p_between, met het normale model met het populatiegemiddelde en de populatie-SD.',
    hints: [
      'pnorm(85, ...) is alles onder 85. Dat bevat de studenten onder 65, die je niet wilt.',
      'Neem dus de oppervlakte onder 85 en haal de oppervlakte onder 65 eraf.',
      'p_between <- pnorm(85, mean = mu, sd = sigma) - pnorm(65, mean = mu, sd = sigma).',
    ],
  },
  'm6-1-a': {
    prompt: 'Trek met slice_sample() een willekeurige steekproef van 25 studenten uit de populatie. Sla de steekproef op in my_sample, en het gemiddelde van hun stressscores in sample_mean.',
    hints: [
      'slice_sample(n = 25) trekt 25 rijen willekeurig: my_sample <- population %>% slice_sample(n = 25).',
      'summarise(m = mean(stress)) berekent het gemiddelde van de kolom stress.',
      'pull(m) maakt van het resultaat met één cel een getal: sample_mean <- my_sample %>% summarise(m = mean(stress)) %>% pull(m).',
    ],
  },
  'm6-2-a': {
    prompt: 'Bouw een steekproevenverdeling: neem 1000 steekproeven van grootte 10 uit population$stress, en sla de 1000 steekproefgemiddelden op in means.',
    hints: [
      'replicate(1000, expr) voert expr 1000 keer uit en verzamelt de resultaten.',
      'De uitdrukking die je wilt herhalen is één steekproefgemiddelde: mean(sample(population$stress, 10)).',
      'Zet ze samen: replicate(1000, mean(sample(population$stress, 10))).',
    ],
  },
  'm6-3-a': {
    prompt: 'De populatie van stressscores is sterk scheef. Hoeveel variëren steekproefgemiddelden van 40 studenten? Bereken de standaardfout voor steekproeven van grootte 40 met de formule, niet met simulatie, en sla haar op in se_40.',
    hints: [
      'De standaardfout van het gemiddelde is sigma / sqrt(n).',
      'sd(population$stress) geeft sigma; sqrt(40) geeft de noemer.',
      'In een pipeline: se_40 <- population %>% summarise(se = sd(stress) / sqrt(40)) %>% pull(se).',
    ],
  },
  'm7-1-a': {
    prompt: 'study bevat één steekproef van 50 studenten, alles wat je in een echt project zou hebben. Schat hoeveel het gemiddelde examencijfer van zo\'n studie van steekproef tot steekproef schommelt, en sla die standaardfout op in se_mean.',
    hints: [
      'De formule is dezelfde als in Module 6, met één vervanging: s in plaats van sigma.',
      'sd(study$exam_score) is s; nrow(study) is n.',
      'se_mean <- sd(study$exam_score) / sqrt(nrow(study)).',
    ],
  },
  'm7-1-b': {
    prompt: 'Maak van die schatting een 95%-betrouwbaarheidsinterval voor het gemiddelde examencijfer van de populatie. Sla de twee grenzen op in ci_95, de onderste eerst.',
    hints: [
      'Een interval is de schatting plus en min een veelvoud van haar standaardfout.',
      'Het veelvoud voor 95 procent, wanneer de SD uit n waarnemingen is geschat, is qt(0.975, df = n - 1).',
      'c(-1, 1) * iets geeft beide grenzen tegelijk: sample_mean + c(-1, 1) * qt(0.975, df = 49) * se_mean.',
    ],
  },
  'm7-2-a': {
    prompt: 'Voer 100 studies van elk 40 studenten uit, bouw van elk een 95%-betrouwbaarheidsinterval, en tel hoeveel van die 100 intervallen het ware populatiegemiddelde mu bevatten. Sla het aantal op in captured.',
    hints: [
      'replicate(100, expr) voert expr 100 keer uit. De expr die je wilt geeft TRUE of FALSE: bevatte dit interval mu?',
      'Daarbinnen: trek een steekproef, bereken haar gemiddelde en standaardfout, bouw het interval met qt(0.975, df = 39).',
      'Een interval bevat mu wanneer ci[1] <= mu && ci[2] >= mu. sum() van 100 TRUE/FALSE-waarden is het aantal.',
    ],
  },
  'm7-3-a': {
    prompt: 'Bouw de samenvattingstabel die een figuur met foutbalken nodig heeft. Maak uit study een summary_table met één rij per opleiding en de kolommen mean_exam, sd_exam, n, se en ci, waarbij ci de halve breedte van een 95%-betrouwbaarheidsinterval is.',
    hints: [
      'group_by(programme) en dan summarise() geeft je één rij per opleiding.',
      'mutate() voegt kolommen toe die zijn berekend uit de kolommen die summarise() net maakte: se = sd_exam / sqrt(n).',
      'De halve breedte van het BI is de standaardfout maal het t-kwantiel: ci = qt(0.975, df = n - 1) * se.',
    ],
  },
  'm8-1-a': {
    prompt: 'Bouw de nulverdeling voor het verschil in gemiddeld examencijfer tussen de twee slaapgroepen. Schud de examenscores 2000 keer over de 60 studenten, bereken elke keer het verschil opnieuw, en sla de 2000 verschillen op in null_diffs.',
    hints: [
      'Onder de nulhypothese is het willekeurig bij welke groep een score hoort, dus het schudden van de scores over de groepen zou niets systematisch moeten veranderen.',
      'Binnen replicate() herordent sample(study$exam_score) alle 60 scores. De kolom sleep_group blijft waar ze is.',
      'Neem dan hetzelfde verschil als eerder, maar uit de geschudde scores in plaats van uit study$exam_score.',
    ],
  },
  'm8-2-a': {
    prompt: 'Je hebt observed (het verschil dat je studie vond) en null_diffs (2000 verschillen die ontstonden toen de labels niets betekenden). Bereken de tweezijdige p-waarde, het aandeel schuddingen dat minstens zo ver van nul ligt als het waargenomen verschil, en sla haar op in p_perm.',
    hints: [
      'abs(null_diffs) >= abs(observed) geeft 2000 TRUE/FALSE-waarden: was deze schudding minstens zo extreem als het echte resultaat?',
      'Het gemiddelde van een TRUE/FALSE-vector is het aandeel TRUE-waarden.',
      'p_perm <- mean(abs(null_diffs) >= abs(observed)).',
    ],
  },
  'm8-2-b': {
    prompt: 'Het schudden is het idee; t.test() is de snelkoppeling. Voer een t-toets voor onafhankelijke steekproeven uit van exam_score naar sleep_group op study, met gelijke varianties, en sla de p-waarde op in p_t.',
    hints: [
      'De formuleinterface is uitkomst ~ groep: t.test(exam_score ~ sleep_group, data = study).',
      'Voeg var.equal = TRUE toe voor de gepoolde toets in plaats van de Welch-versie die R standaard gebruikt.',
      'Het resultaat is een lijst; $p.value haalt de p-waarde eruit.',
    ],
  },
  'm8-3-a': {
    prompt: 'Schat de power van een studie die 100 studenten trekt en toetst of hun gemiddelde examencijfer van 70 verschilt, bij alpha = ,05. Simuleer 1000 van zulke studies en sla het aandeel dat de nulhypothese verwerpt op in power_estimate.',
    hints: [
      't.test(s, mu = 70) toetst één steekproef tegen een veronderstelde gemiddelde waarde van 70.',
      'Trek binnen replicate() de steekproef en geef de p-waarde terug: t.test(sample(population$exam_score, 100), mu = 70)$p.value.',
      'Een studie "verwerpt" wanneer haar p-waarde onder ,05 ligt, en mean() van 1000 TRUE/FALSE-waarden is het aandeel dat dat deed.',
    ],
  },
  'm8-4-a': {
    prompt: 'De studie met 60 studenten vond een verschil in gemiddeld examencijfer tussen de twee slaapgroepen. Druk het uit als Cohens d, het verschil in gemiddelden gedeeld door de gepoolde standaarddeviatie, en sla het op in d.',
    hints: [
      'Het verschil in gemiddelden is mean(a) - mean(b).',
      'pooled_sd <- sqrt(((length(a) - 1) * var(a) + (length(b) - 1) * var(b)) / (length(a) + length(b) - 2))',
      'd <- (mean(a) - mean(b)) / pooled_sd',
    ],
  },
  'm8-4-b': {
    prompt: 'Je plant een nieuwe studie naar slaap en examencijfers en verwacht d = 0,5. Hoeveel studenten per groep heb je nodig voor 90% power bij alpha = ,05, in een tweezijdige vergelijking van twee groepen? Gebruik power.t.test() en sla het antwoord, naar BOVEN afgerond op een hele student, op in n_per_group.',
    hints: [
      'Laat n weg en geef power op: power.t.test() lost dan n op.',
      'power.t.test(delta = 0.5, sd = 1, power = 0.9)$n is de exacte n per groep.',
      'ceiling() rondt naar boven af: n_per_group <- ceiling(power.t.test(delta = 0.5, sd = 1, power = 0.9)$n)',
    ],
  },
  'm9-1-a': {
    prompt: 'Welk aandeel van de werknemers werkt thuis, en hoe precies legt een steekproef van 480 dat aandeel vast? Sla het aandeel thuiswerkers op in p_remote, en het 95%-betrouwbaarheidsinterval, als twee getallen, in ci_remote. prop.test() geeft je het interval.',
    hints: [
      'sum(d$remote == "Yes") telt de thuiswerkers; deel door nrow(d) voor het aandeel.',
      'prop.test(count, total) toetst een proportie en geeft haar betrouwbaarheidsinterval als conf.int.',
      'ci_remote <- prop.test(n_remote, nrow(d))$conf.int',
    ],
  },
  'm9-2-a': {
    prompt: 'Welke afdeling verliest de meeste mensen? Kruis left_company (rijen) met department (kolommen), maak van de aantallen dan kolomproporties, zodat elke afdeling optelt tot 1 en de tweede rij haar vertrekpercentage is. Sla het resultaat op in leave_rates.',
    hints: [
      'prop.table() maakt van een tabel met aantallen proporties. Haar argument margin zegt wat tot 1 moet optellen.',
      'margin = 2 betekent kolommen: elke afdeling telt dan op tot 1.',
      'leave_rates <- prop.table(counts, margin = 2)',
    ],
  },
  'm9-3-a': {
    prompt: 'Thuiswerkers vertrokken voor 18,1% en kantoorwerkers voor 25,5%. Is dat meer dan toeval? Voer een chikwadraattoets voor onafhankelijkheid uit op de tabel remote bij left_company en sla het resultaat op in remote_test.',
    hints: [
      'chisq.test() neemt een tweewegtabel met aantallen.',
      'Bouw de tabel met remote in de ene richting en left_company in de andere: table(d$remote, d$left_company).',
      'remote_test <- chisq.test(remote_counts)',
    ],
  },
  'm9-3-b': {
    prompt: 'Afdeling en vertrek hingen samen, chikwadraat(3, N = 480) = 9,94, p = ,019. Hoe sterk? Bereken Cramérs V voor de tabel department bij left_company en sla het op in v.',
    hints: [
      'N is het aantal mensen in de tabel: sum(counts), of nrow(d).',
      'min(dim(counts)) is hier 2, dus de term tussen haakjes is 1.',
      'v <- sqrt(x2 / (sum(counts) * (min(dim(counts)) - 1)))',
    ],
  },
  'm10-1-a': {
    prompt: 'Twee vragen in één. Hoe sterk gaat autonomie samen met welzijn, en hoe sterk werkdruk? Sla de Pearson-correlatie tussen autonomie en welzijn op in r_autonomy, en tussen werkdruk en welzijn in r_workload. Zeg voordat je rekent welke van de twee je negatief verwacht, op grond van wat autonomie en werkdruk zijn (de spreidingsdiagrammen hierboven laten het ook zien).',
    hints: [
      'cor(x, y) neemt twee vectoren: cor(d$autonomy, d$wellbeing).',
      'Doe hetzelfde voor werkdruk, en houd het teken precies zoals R het geeft.',
      'Als je pipes verkiest: d %>% summarise(r = cor(autonomy, wellbeing)) %>% pull(r).',
    ],
  },
  'm10-2-a': {
    prompt: 'Pas het lineaire model aan dat welzijn voorspelt uit autonomie. Sla het aangepaste model op in model, en de coëfficiënt van autonomie, de helling, in slope.',
    hints: [
      'lm(uitkomst ~ voorspeller, data = d) past het model aan. Sla het geheel op in model.',
      'model %>% tidy() geeft één rij per coëfficiënt, met de kolommen term, estimate, std.error, statistic en p.value.',
      'filter(term == "autonomy") %>% pull(estimate) haalt de helling als gewoon getal uit die tabel.',
    ],
  },
  'm10-2-b': {
    prompt: 'Gebruik het aangepaste model om het welzijn te voorspellen van een werknemer met autonomie 8. Sla die ene voorspelde waarde op in pred_8.',
    hints: [
      'predict(model, newdata = ...) neemt een data frame met waarden van de voorspeller.',
      'Het data frame heeft één kolom nodig die precies zo heet als de voorspeller: data.frame(autonomy = 8).',
      'Met de hand is het intercept + helling * 8, dat is coef(model)[[1]] + coef(model)[[2]] * 8.',
    ],
  },
  'm10-3-a': {
    prompt: 'Lees de modeluitvoer in drie getallen: de t-statistiek voor de helling van autonomie in t_slope, haar p-waarde in p_slope, en het aandeel variantie dat het model verklaart in r2.',
    hints: [
      'tidy() noemt de kolommen estimate, std.error, statistic en p.value. De t-statistiek is statistic.',
      'glance() geeft één rij voor het hele model, met onder andere r.squared en adj.r.squared.',
      'filter(term == "autonomy") eerst, zodat je de rij van de helling leest en niet die van het intercept.',
    ],
  },
  'm10-3-b': {
    prompt: 'Nu werkdruk. Pas het model aan dat welzijn voorspelt uit werkdruk en sla het op in model_wl. Bouw dan wl_means: het gemiddelde welzijn in elk derde van werkdruk, van het lichtste derde tot het zwaarste, als tabel met één rij per derde.',
    hints: [
      'mutate(third = ntile(workload, 3)) voegt een kolom toe die elke werknemer 1, 2 of 3 noemt.',
      'Dan group_by(third) %>% summarise(mean_wellbeing = mean(wellbeing)).',
      'Pas het model aan met lm(wellbeing ~ workload, data = d): welzijn is de uitkomst, dus het komt eerst.',
    ],
  },
  'm10-4-a': {
    prompt: 'Stijgt prestatie met autonomie, alleen beoordeeld op de volgorde van de scores? Sla Spearmans rho tussen autonomie en prestatie op in rho, en Kendalls tau voor hetzelfde paar in tau.',
    hints: [
      'cor(x, y, method = "spearman") geeft Spearmans rho.',
      'method = "kendall" geeft Kendalls tau.',
      'Of rangschik beide variabelen zelf: cor(rank(d$autonomy), rank(d$performance)).',
    ],
  },
  'm11-1-a': {
    prompt: 'Pas het model aan dat welzijn voorspelt uit autonomie en werkdruk samen. Sla het op in model2 en sla de coëfficiënt van werkdruk op in b_workload.',
    hints: [
      'Voorspellers voeg je toe met een plus: lm(wellbeing ~ autonomy + workload, data = d).',
      'tidy() geeft nu drie rijen: het intercept, autonomie en werkdruk.',
      'filter(term == "workload") %>% pull(estimate) kiest de gewenste op naam in plaats van op positie.',
    ],
  },
  'm11-2-a': {
    prompt: 'Pas autonomie alleen aan, dan autonomie naast werkdruk en tenure_years. Sla de coëfficiënt van autonomie uit het eerste model op in b_simple en uit het tweede in b_adjusted, zodat je kunt zien hoeveel het toevoegen van de andere voorspellers haar verschuift.',
    hints: [
      'Pas twee modellen aan en houd beide: één met alleen autonomie, één met alle drie de voorspellers.',
      'Haal de rij van autonomie uit elk met filter(term == "autonomy") %>% pull(estimate).',
      'Het tweede model is lm(wellbeing ~ autonomy + workload + tenure_years, data = d). Standaardiseer niets: beide getallen blijven in de oorspronkelijke eenheden.',
    ],
  },
  'm11-2-b': {
    prompt: 'Voeg thuiswerken aan het model toe. Sla het aangepaste model op in model_remote, de coëfficiënt van remote in b_remote, en de groepsgemiddelden en SD\'s in remote_means, één rij per level van remote. Vergelijk dan de coëfficiënt met het ruwe verschil tussen de gemiddelden: ze beantwoorden verschillende vragen, dus controleer of ze dezelfde kant op wijzen.',
    hints: [
      'Een factorvoorspeller gaat op naam in de formule: lm(wellbeing ~ autonomy + workload + remote, data = d).',
      'R noemt de coëfficiënt naar het niet-referentielevel, dus zoek de term remoteYes in tidy().',
      'group_by(remote) %>% summarise(mean_wellbeing = mean(wellbeing), sd_wellbeing = sd(wellbeing), n = n()) geeft de beschrijvende maten.',
    ],
  },
  'm11-3-a': {
    prompt: 'Haal de drie getallen op die een APA-verslag van dit model nodig heeft. Pas welzijn aan op autonomie, werkdruk en tenure_years, en sla dan R-kwadraat op in r2, de model-F-statistiek in f_value, en de residuele vrijheidsgraden in df_resid.',
    hints: [
      'glance() geeft één rij voor het hele model, met onder andere r.squared, statistic, p.value en df.residual.',
      'De model-F is de kolom statistic van glance(), niet een t uit tidy().',
      'Haal elk uit glance(): pull(r.squared), pull(statistic) en pull(df.residual). df.residual is n min het aantal geschatte coëfficiënten, het intercept inbegrepen.',
    ],
  },
};
