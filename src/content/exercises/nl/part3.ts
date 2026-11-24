import type { ExerciseText } from './types';

export const part3: Record<string, ExerciseText> = {
  'm11-4-a': {
    prompt: 'Hoeveel werknemers zijn invloedrijk volgens de gebruikelijke vuistregel? Pas wellbeing ~ autonomy + workload + tenure_years aan en tel de werknemers wier Cook-afstand boven 4 / n ligt. Sla het aantal op in n_influential.',
    hints: [
      'cooks.distance(model) geeft één getal per werknemer.',
      'Vergelijk ze met 4 / nrow(d); het resultaat is TRUE of FALSE per werknemer.',
      'sum() telt de TRUE-waarden: n_influential <- sum(cooks.distance(model) > 4 / nrow(d))',
    ],
  },
  'm11-4-b': {
    prompt: 'Een gevoeligheidscontrole: pas hetzelfde model opnieuw aan zonder de ene meest invloedrijke werknemer, die met de grootste Cook-afstand, en sla de nieuwe helling van autonomie op in slope_without.',
    hints: [
      'd[-most, ] is de data zonder rij most.',
      'Pas dezelfde formule aan op die data en neem dan coef(refit)["autonomy"].',
      'refit <- lm(wellbeing ~ autonomy + workload + tenure_years, data = d[-most, ])',
    ],
  },
  'm12-1-a': {
    prompt: 'Pas welzijn aan op remote als enige voorspeller. Sla het model op in model_remote, de coëfficiënt van remote in b_remote, en de twee groepsgemiddelden, SD\'s en groepsgroottes in group_means. Overtuig jezelf er dan van dat b_remote precies het gemiddelde van thuiswerkers min het gemiddelde van kantoorwerkers in je tabel is.',
    hints: [
      'Een factor gaat op naam in de formule: lm(wellbeing ~ remote, data = d).',
      'levels(d$remote) toont welk level R als referentie gebruikt: het eerste.',
      'De coëfficiënt is genoemd naar het andere level, dus filter(term == "remoteYes").',
    ],
  },
  'm12-1-b': {
    prompt: 'Laat zien dat het model de t-toets voor onafhankelijke steekproeven reproduceert. Sla de t-statistiek voor remoteYes uit het model op in t_model, en de t-statistiek uit de t-toets met gelijke varianties in t_ttest. De twee moeten even groot zijn. Zoek zelf uit waarom de tekens verschillen.',
    hints: [
      'De t van het model is de kolom statistic van de rij remoteYes in tidy().',
      't.test(wellbeing ~ remote, data = d, var.equal = TRUE) voert de toets met gepoolde variantie uit; zonder var.equal krijg je Welch, wat een andere toets is.',
      'Het resultaat van t.test() is een lijst; haar t-statistiek staat in $statistic.',
    ],
  },
  'm12-2-a': {
    prompt: 'Pas welzijn aan op department, dat vier levels heeft. Sla het model op in model_dept, de naam van het level dat R als referentie gebruikte in reference_level, en de coëfficiënt voor de afdeling Support in b_support.',
    hints: [
      'levels(d$department) toont de levels in de volgorde die R gebruikt; het eerste is de referentie.',
      'lm(wellbeing ~ department, data = d) geeft drie coëfficiënten voor vier groepen.',
      'De coëfficiëntnamen zijn de factornaam plakkend aan de levelnaam: departmentSupport.',
    ],
  },
  'm12-2-b': {
    prompt: 'Bouw dept_summary: één rij per afdeling met het gemiddelde, de mediaan, de SD en de n van welzijn. Sla dan in top_by_median de naam op van de afdeling met de hoogste MEDIAAN welzijn. Dat is niet de afdeling met het hoogste gemiddelde, en uitzoeken waarom is het punt van de oefening.',
    hints: [
      'group_by(department) %>% summarise(...) met zowel mean(wellbeing) als median(wellbeing).',
      'arrange(desc(median_wellbeing)) %>% slice(1) zet de bovenste rij eerst en houdt alleen die.',
      'pull(department) op een factor geeft een factor; as.character() maakt er gewone tekst van.',
    ],
  },
  'm12-3-a': {
    prompt: 'De totale F zegt dat minstens twee afdelingen verschillen. Zoek uit welke. Sla de Tukey-gecorrigeerde paarsgewijze vergelijkingen op in pairs_tbl als data frame, en het aantal van die vergelijkingen waarvan de gecorrigeerde p-waarde onder ,05 ligt in n_significant.',
    hints: [
      'emmeans(model_dept, pairwise ~ department, adjust = "tukey") geeft een lijst met een element emmeans en een element contrasts.',
      'De vergelijkingen zitten in het element contrasts; as.data.frame() maakt er een gewone tabel van.',
      'sum(pairs_tbl$p.value < 0.05) telt de rijen onder ,05, omdat sum() over TRUE en FALSE de TRUE-waarden telt.',
    ],
  },
  'm12-4-a': {
    prompt: 'Vergelijk de vier afdelingen op welzijn met ranks. Voer een Kruskal-Wallis-toets uit en sla haar toetsingsgrootheid H, als enkel getal, op in h.',
    hints: [
      'kruskal.test() neemt dezelfde formule als lm(): uitkomst ~ groep.',
      'De statistiek zit in het onderdeel $statistic van het resultaat.',
    ],
  },
  'm13-1-a': {
    prompt: 'Bouw de veranderingsscore, betrokkenheid op tijdstip 2 min tijdstip 1, als nieuwe kolom change, en pas dan het model aan waarin training en mentoring interacteren. Sla het aangepaste model op in model_int en de interactiecoëfficiënt in b_int.',
    hints: [
      'mutate(change = engagement_t2 - engagement_t1) voegt de kolom change toe: later min eerder.',
      'training * mentoring past beide hoofdeffecten en de interactie in één keer aan.',
      'tidy() noemt de interactierij trainingYes:mentoringYes, met een dubbele punt.',
    ],
  },
  'm13-2-a': {
    prompt: 'Eerst, voor elke toets, de vier celgemiddelden. Bouw cell_means met één rij voor elke combinatie van training en mentoring, met de gemiddelde verandering, haar SD en de n van de cel. Bereken dan boost: hoeveel meer de groep met beide interventies won dan je zou voorspellen door de twee afzonderlijke winsten bij de groep met geen van beide op te tellen.',
    hints: [
      'group_by(training, mentoring) groepeert op beide factoren tegelijk en geeft vier rijen.',
      'Voeg .groups = "drop" aan summarise() toe om het resultaat ongegroepeerd te laten.',
      'Voluit geschreven is boost mean(Yes,Yes) - mean(Yes,No) - mean(No,Yes) + mean(No,No).',
    ],
  },
  'm13-2-b': {
    prompt: 'Maak de factoriële ANOVA-tabel voor de veranderingsscore met type III-kwadratensommen, op de juiste manier. Pas het model aan met som-nulcontrasten voor beide factoren, sla het op in model_sum, sla de car::Anova-tabel als data frame op in aov_tbl, en sla de F-waarde van het hoofdeffect van training op in f_training.',
    hints: [
      'Geef contrasts = list(training = contr.sum, mentoring = contr.sum) mee binnen de lm()-aanroep, naast data = d.',
      'Anova() met hoofdletter A komt uit car; anova() met kleine a is een andere functie die sequentiële (type I) kwadratensommen geeft.',
      'as.data.frame() op het resultaat laat je indexeren op rijnaam: aov_tbl["training", "F value"].',
    ],
  },
  'm13-3-a': {
    prompt: 'Een interactie betekent dat het effect van de ene factor van de andere afhangt, dus rapporteer elk effect waar het echt geldt. Sla uit de celgemiddelden het effect van training onder werknemers zonder mentoring op in effect_no_mentoring, en onder werknemers die ook mentoring kregen in effect_yes_mentoring. Elk is het Yes-min-No-verschil in gemiddelde verandering binnen die helft van de data.',
    hints: [
      'Een enkelvoudig effect is een verschil berekend binnen één level van de andere factor.',
      'cells$mean_change[cells$training == "Yes" & cells$mentoring == "No"] kiest één celgemiddelde.',
      'Beide effecten zijn Yes min No op training; alleen het level van mentoring dat je vasthoudt verandert.',
    ],
  },
  'm14-1-a': {
    prompt: 'Hervorm de twee engagementkolommen naar lang formaat. Sla het resultaat op in long_d, met één rij per werknemer per meting, een factorkolom time waarvan de levels t1 en dan t2 zijn, en een numerieke kolom engagement. Bouw dan time_means: het gemiddelde, de SD en de n van betrokkenheid op elk meetmoment. De gemiddelden vertellen je welke kant betrokkenheid op ging.',
    hints: [
      'names_to noemt de nieuwe kolom die de OUDE kolomnamen bevat; values_to noemt de kolom die de getallen bevat.',
      'pivot_longer(cols = c(engagement_t1, engagement_t2), names_to = "time", values_to = "engagement").',
      'factor(time, levels = c("engagement_t1", "engagement_t2"), labels = c("t1", "t2")) legt zowel de volgorde als de labels vast.',
    ],
  },
  'm14-2-a': {
    prompt: 'Pas het gemengde-effectenmodel voor de twee metingen aan: betrokkenheid voorspeld door tijd, met een random intercept voor elke werknemer. Sla het model op in m_time en het vaste effect van tijd in b_time.',
    hints: [
      'De verticale streep leest als "gegroepeerd naar": (1 | employee_id) is een intercept voor elke werknemer.',
      'lmer(engagement ~ time + (1 | employee_id), data = long_d): het vaste deel voor de plus, het random deel tussen haakjes.',
      'fixef(m_time) geeft de vaste effecten; degene die je wilt is de tweede, genoemd naar het tweede level van time.',
    ],
  },
  'm14-2-b': {
    prompt: 'Splits de overgebleven variatie in tweeën. Sla uit hetzelfde model de standaarddeviatie van de random intercepts van werknemers op in sd_employee, de residuele standaarddeviatie in sd_residual, en de intraklassecorrelatie, het deel van de variantie dat tussen werknemers zit, in icc.',
    hints: [
      'as.data.frame(VarCorr(m_time)) geeft één rij per variantiecomponent, met de kolommen grp, vcov en sdcor.',
      'vc$sdcor[vc$grp == "employee_id"] kiest de SD tussen werknemers; de residurij heet "Residual".',
      'De ICC is variantie tussen gedeeld door totale variantie, dus kwadrateer de SD\'s voordat je deelt.',
    ],
  },
  'm14-3-a': {
    prompt: 'Laat zien dat het gemengde model met twee meetmomenten de gepaarde t-toets reproduceert. Pas het model aan en sla het op in m_time, sla de t-statistiek voor time op in t_lmer, en sla de t uit de gepaarde t-toets op in t_paired. Ze moeten overeenkomen.',
    hints: [
      'summary(m_time)$coefficients is een matrix met een kolom "t value"; neem de rij timet2.',
      't.test(d$engagement_t2, d$engagement_t1, paired = TRUE) vergelijkt elke werknemer met zichzelf.',
      'Zonder paired = TRUE krijg je de toets voor onafhankelijke steekproeven, wat een andere en veel minder krachtige vergelijking is.',
    ],
  },
  'm14-4-a': {
    prompt: 'Steeg betrokkenheid meer voor werknemers die training kregen? Pas het gemengde model aan met een interactie van tijd bij training en een random intercept per werknemer, sla het op in m_mixed, en sla de interactiecoëfficiënt, als enkel getal, op in b_interaction.',
    hints: [
      'time * training in de formule past beide hoofdeffecten en hun interactie aan.',
      'Houd het random intercept: + (1 | employee_id).',
      'fixef(m_mixed)["timet2:trainingYes"] haalt de interactie eruit.',
    ],
  },
  'm14-5-a': {
    prompt: 'Steeg betrokkenheid van t1 naar t2, beoordeeld op ranks? Voer de Wilcoxon signed-rank-toets uit met t2 eerst en t1 tweede, en sla haar statistiek V, als enkel getal, op in v.',
    hints: [
      'wilcox.test() neemt dezelfde argumenten als t.test(), inclusief paired = TRUE.',
      'Zet engagement_t2 eerst, zodat V de ranks van de stijgingen optelt.',
    ],
  },
  'm15-1-a': {
    prompt: 'Zie zelf waarom een rechte lijn de verkeerde vorm is voor een ja/nee-uitkomst. Pas lm(left_company ~ wellbeing) aan en sla het op in lpm, tel hoeveel van haar voorspelde waarden buiten het bereik 0 tot 1 vallen en sla dat aantal op in n_impossible, en bouw rate_by_third: het aandeel dat vertrok in elk derde van welzijn, het laagste derde eerst.',
    hints: [
      'fitted(lpm) geeft de voorspelde waarde voor elke werknemer.',
      'sum() over een logische vector telt de TRUE-waarden: sum(fitted(lpm) < 0 | fitted(lpm) > 1).',
      'mutate(third = ntile(wellbeing, 3)) verdeelt de werknemers in derden van welzijn; group_by(third), dan summarise(rate = mean(left_company)), omdat het gemiddelde van een 0/1-kolom het aandeel enen is.',
    ],
  },
  'm15-2-a': {
    prompt: 'Pas de logistische regressie van vertrek op welzijn en diensttijd aan. Sla het aangepaste model op in m_left en de coëfficiënt van welzijn, op de log-oddsschaal, precies zoals het model haar rapporteert, in b_wellbeing.',
    hints: [
      'glm(left_company ~ wellbeing + tenure_years, data = d, family = binomial): het argument family maakt het logistisch.',
      'tidy() werkt op een glm precies als op een lm, en de kolom estimate staat op de log-oddsschaal.',
      'Exponentieer nog niet. Deze oefening vraagt de coëfficiënt zoals het model haar rapporteert.',
    ],
  },
  'm15-2-b': {
    prompt: 'Maak van beide hellingen odds ratio\'s. Sla exp() van de coëfficiënt van welzijn op in or_wellbeing en exp() van de coëfficiënt van diensttijd in or_tenure. Beide moeten onder 1 uitkomen; zorg dat je kunt zeggen wat dat voor de odds om te vertrekken betekent.',
    hints: [
      'exp() maakt de log in log odds ongedaan: exp(coef(m_left)[["wellbeing"]]).',
      'Gebruik de dubbele haak, of unname(), zodat je een gewoon getal krijgt in plaats van een benoemd getal.',
      'Een odds ratio is altijd positief. Als de jouwe negatief is, heb je niet geëxponentieerd.',
    ],
  },
  'm15-3-a': {
    prompt: 'Bouw de tabel die in de resultatensectie hoort: odds ratio\'s met hun 95%-betrouwbaarheidsintervallen, voor elke term in het model, het intercept inbegrepen. Sla haar op in or_table, met de odds ratio in een kolom OR en de intervalgrenzen ernaast.',
    hints: [
      'cbind(OR = coef(m_left), confint(m_left)) bouwt de drie kolommen op de log-oddsschaal.',
      'Wikkel de hele cbind() in exp() zodat de schatting en beide grenzen samen worden getransformeerd.',
      'confint() op een glm drukt "Waiting for profiling to be done..." af: dat is een melding, geen fout.',
    ],
  },
  'm15-4-a': {
    prompt: 'Pas een Poissonregressie aan van sick_days op workload en remote, en sla de rate ratio voor werkdruk, als enkel getal, op in rr_workload.',
    hints: [
      'glm(sick_days ~ workload + remote, data = d, family = poisson).',
      'Coëfficiënten staan op de logschaal; exp() maakt er rate ratio\'s van.',
    ],
  },
  'm16-1-a': {
    prompt: 'In Engineering vertrokken 33 van de 128 werknemers. Bereken met het raster en de sectorprior dbeta(p_grid, 3, 17) de posterior voor het vertrekpercentage van Engineering en sla haar, genormaliseerd tot een som van 1, op in posterior_eng. Sla het posterior gemiddelde op in eng_mean.',
    hints: [
      'De likelihood is dbinom(left_eng, size = n_eng, prob = p_grid): één waarde voor elk kandidaatpercentage.',
      'posterior_eng <- prior * likelihood, en dan posterior_eng <- posterior_eng / sum(posterior_eng).',
      'Het posterior gemiddelde is sum(p_grid * posterior_eng).',
    ],
  },
  'm16-2-a': {
    prompt: 'Geef een 95%-geloofwaardigheidsinterval voor het vertrekpercentage van Engineering, met een vlakke Beta(1, 1)-prior. Sla het op in ci_engineering: twee getallen, de ondergrens eerst.',
    hints: [
      'Met een Beta(1, 1)-prior is de posterior Beta(1 + left_eng, 1 + n_eng - left_eng).',
      'De middelste 95% loopt van het 2,5e tot het 97,5e percentiel.',
      'ci_engineering <- qbeta(c(0.025, 0.975), 1 + left_eng, 1 + n_eng - left_eng)',
    ],
  },
  'm16-2-b': {
    prompt: 'Vertrekken thuiswerkers minder vaak dan kantoorwerkers? Trek met vlakke Beta(1, 1)-priors 10.000 aannemelijke vertrekpercentages voor elke groep in rate_remote en rate_office, en sla de kans dat het percentage van thuiswerkers het lagere is op in prob_remote_lower.',
    hints: [
      'rbeta(10000, 1 + left_remote, 1 + n_remote - left_remote) trekt 10.000 aannemelijke percentages voor de groep thuiswerkers.',
      'rate_remote < rate_office vergelijkt de trekkingen paar voor paar en geeft 10.000 TRUE- en FALSE-waarden.',
      'Het gemiddelde van een TRUE/FALSE-vector is het aandeel TRUE-waarden: mean(rate_remote < rate_office).',
    ],
  },
  'm16-3-a': {
    prompt: 'Thuiswerkers rapporteren hoger welzijn, p = ,008. Hoe sterk is het bewijs? Pas lm(wellbeing ~ remote) aan als m_remote en sla de Bayes-factor voor een effect van thuiswerken tegen het nulmodel, BF10 uit de BIC-benadering, op in bf10.',
    hints: [
      'm_remote <- lm(wellbeing ~ remote, data = d)',
      'BIC(m0) en BIC(m_remote) geven de twee BIC-waarden. Het betere model heeft de lagere BIC.',
      'bf10 <- exp((BIC(m0) - BIC(m_remote)) / 2)',
    ],
  },
  'm16-4-a': {
    prompt: 'Elk extra punt werkdruk gaat samen met ongeveer 3,3 punten lager welzijn. Combineer die schatting met een sceptische Normal(0, 1)-prior op de helling. Sla het posterior gemiddelde op in post_mean_b en een 95%-geloofwaardigheidsinterval, de ondergrens eerst, in cri_b.',
    hints: [
      'w_data <- 1 / se_hat^2 en w_prior <- 1 / prior_sd^2 zijn de twee precisies.',
      'post_mean_b <- (w_data * b_hat + w_prior * 0) / (w_data + w_prior)',
      'De posterior-SD is sqrt(1 / (w_data + w_prior)); dan cri_b <- qnorm(c(0.025, 0.975), post_mean_b, die SD).',
    ],
  },
  'm17-1-a': {
    prompt: 'Verlaagt werkdruk prestatie via welzijn? Pas het a-pad aan (welzijn op werkdruk) en het b-pad (prestatie op welzijn, bij constant gehouden werkdruk), en sla dan het indirecte effect, a maal b, op in indirect.',
    hints: [
      'coef(path_a)["workload"] is het a-pad.',
      'coef(path_b)["wellbeing"] is het b-pad: de helling van welzijn bij constant gehouden werkdruk.',
      'indirect <- coef(path_a)["workload"] * coef(path_b)["wellbeing"]',
    ],
  },
  'm17-2-a': {
    prompt: 'Pas een exploratieve factoranalyse met twee factoren aan op de zes items, waarbij de factoren mogen correleren (rotation = "promax"). Sla het resultaat op in efa.',
    hints: [
      'factanal() neemt de data en het aantal factoren.',
      'rotation = "promax" laat de factoren correleren.',
      'efa <- factanal(items, factors = 2, rotation = "promax")',
    ],
  },
};
