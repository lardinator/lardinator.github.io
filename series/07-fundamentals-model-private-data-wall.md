---
layout: post
order: 7
slug: fundamentals-model-private-data-wall
title: "The Model That Converged on the Crowd: Building the Strongest Public-Data Signal and Watching It Lose"
hook: "The strongest model we could build from public data — form, pedigree, equipment, driver history, market history, genetic merit index — was still measurably worse than the closing tote odds at predicting race outcomes."
thesis: "In a liquid pari-mutuel market, the closing price already embeds every piece of public information your model can use, so a public-data model converges toward the crowd from below and cannot cross the takeout barrier."
permalink: /series/fundamentals-model-private-data-wall/
---

## The Model That Converged on the Crowd: Building the Strongest Public-Data Signal and Watching It Lose

---

The brief landed at 06:00 on June 13. The coordinator read the Phase 3b numbers: blend coefficient *b* = 0.152, standard error 0.031, likelihood-ratio p < 1e-7. The signal was real. It was also 0.848 short of anything useful.

That gap is the subject of this post. We built the strongest public-data fundamentals model we could assemble — form, driver history, equipment flags, pedigree genetics, prior closing odds — and measured precisely how much independent signal it adds to the closing tote price. The answer is: a little. Statistically incontrovertible. Economically irrelevant against a 15–25% takeout. This is the story of how we verified it rigorously, almost fell for a data-contamination trap that would have reported the opposite, and arrived at a precise, reproducible number for exactly how far public information can take you.

---

## The Benter Architecture: Starting from First Principles

The standard reference for combining a fundamentals model with a pari-mutuel market is William Benter's 1994 report, which described the Hong Kong program that (eventually) worked. The framework is straightforward: build a model of win probability from observable horse and race attributes, then incorporate the market odds as a covariate rather than ignoring them. Benter showed that the market odds are the single most predictive variable — no model that omits them competes — but that a well-specified fundamentals model adds genuine signal on top.

The key parameter is the coefficient *b* on the model's log-odds relative to the market. If *b* = 0, the model adds nothing; the market already contains everything it knows. If *b* = 1, the model contributes as much independent signal as the market itself — a strong, roughly equal contribution. Benter's Hong Kong program, operating in an early-1990s market with genuine information asymmetries, achieved something in that range. We wanted to know what was achievable in the 2025–2026 Swedish trot market, with data readily available from travsport.se, breedly.com, and ATG's own race archive.

A note on the *b* ≈ 1.0 benchmark: it is not a mathematically derived threshold for this market. It is a rough intuitive landmark from Benter's context, where the model contributed roughly as much as the market and the combination produced a positive edge after Hong Kong's lower take. In a Swedish market with 15–25% takeout, what matters is not hitting any specific *b* value but whether the model's contribution at whatever *b* it achieves is large enough to generate positive expected value after takeout. At *b* = 0.15, the model contributes about 15% as much independent signal as the market itself. That is not close to enough.

The answer we found: *b* ≈ 0.15.

That number is the spine of this post. It is real. It is not moving. Let me show you why.

---

## Building the Program: Six Phases, Overnight

The Benter program ran six phases autonomously between 2026-06-12 and 2026-06-13. A background Sonnet agent executed each phase — logistic regression grid searches, conditional logit fits, out-of-sample evaluation — and returned a structured brief. The coordinator (an Opus main session) read the brief, checked whether the numbers were internally consistent, and issued a verdict (PASS, DEAD, or PIVOT) against pre-registered kill criteria. The coordinator did not re-run the numbers; it judged them.

Pre-registration mattered here. The kill criterion for the full program was stated before any results appeared: "if blend log-loss improvement is not significant on the 2025+ test set, program is dead." Each phase verdict was measured against that criterion, not against whatever happened to look interesting in the output.

The feature set that went into the program:

- **Form signals**: recent placement counts, normalized speed (km-time tenths, start-method-adjusted), distance history.
- **Driver quality**: win rate and trainer win rate from the travsport.se race archive.
- **Equipment flags**: shoe change, sulky change — binary signals that a horse is being adjusted.
- **Pedigree indices**: from Breedly's GraphQL API, covering 621,597 horses, including the BLUP genetic merit index (mean ~100) and inbreeding coefficient.
- **Market history**: prior closing odds for the same horse in recent races.

The fundamentals model is a LightGBM classifier trained on horse-level features (driver win rate, equipment flags, km-time normalized by start method, trainer win rate, horse year-stats). Model quality improved across versions: v1 achieved a test-set AUC of 0.745, v2 reached 0.773. An independent Sonnet verifier re-computed the load-bearing numbers from a self-contained brief with hardcoded database paths. The two agents' outputs were reconciled by the coordinator before any result was committed to memory.

---

## The Brier Score Ladder

The core measurement is the Brier score: the mean squared error between predicted win probabilities and actual outcomes. Lower is better.

<figure>
  <img src="/assets/figures/brier-ladder.png" alt="Brier score ladder showing the position of the full public-data model (0.0816), closing odds (0.0721), and blend (0.0720) relative to earlier time-horizon measurements from a February–May 2026 sub-sample. The model's independent contribution — the gap between 0.0721 and 0.0720 — is barely visible at chart resolution. All model scores sit above (worse than) the closing odds; the blend is indistinguishable from the close." loading="lazy">
  <figcaption>Brier score ladder showing the position of the full public-data model (0.0816), closing odds (0.0721), and blend (0.0720) relative to earlier time-horizon measurements from a February–May 2026 sub-sample. The model's independent contribution — the gap between 0.0721 and 0.0720 — is barely visible at chart resolution. All model scores sit above (worse than) the closing odds; the blend is indistinguishable from the close.</figcaption>
</figure>

The out-of-sample Brier for the closing tote odds alone: **0.0721**.

The out-of-sample Brier for the full fundamentals model alone: **0.0816**.

That is 13% worse than the market closing price — and this is after we gave the model form, driver history, equipment flags, pedigree indices, and market history as inputs. The crowd, doing whatever it does collectively in the final minutes before a race, beats a carefully specified machine learning model by a margin that is neither close nor ambiguous.

The blend — model probabilities combined with closing odds — achieves **0.0720**.

The Brier improvement from adding the fundamentals model is 0.0001 in absolute terms — a 0.14% relative reduction in mean squared error. That is separate from any return implication: against a 15–25% takeout, an edge of this magnitude is economically nothing.

The three conditional logit estimates of *b* across program phases, presented before interpretation:

<figure>
  <img src="/assets/figures/b-coefficient-regime.png" alt="Number-line diagram showing the blend coefficient b, with the fundamentals program's estimates (b ≈ 0.15, with Phase 3a conditional logit b = 0.173 ± 0.031) in the sub-takeout zone, and the inferred Benter-program landmark (b ~ 1.0) far to the right. The arrow from model-v1 to model-v2 shows b moving 0.152 to 0.146 as features were added — sideways, not up." loading="lazy">
  <figcaption>Number-line diagram showing the blend coefficient b, with the fundamentals program's estimates (b ≈ 0.15, with Phase 3a conditional logit b = 0.173 ± 0.031) in the sub-takeout zone, and the intuitive Benter-program landmark (b ~ 1.0, derived from the Hong Kong context, not a measured value in this study) far to the right. The arrow from model-v1 to model-v2 shows b moving 0.152 to 0.146 as features were added — sideways, not up.</figcaption>
</figure>

- Phase 3a: *b* = 0.173, SE = 0.031, LR p < 1e-7.
- Phase 3b (honest blend): *b* = 0.152.
- Phase 4 (model v2 with enriched features): *b* = 0.146.

The p-value confirms the signal is real. The trajectory — 0.173 → 0.152 → 0.146 — confirms it is not moving up. In Phase 4 the standalone model quality improved substantially (AUC 0.745 → 0.773, log-loss 2.055 → 1.948) but the independent signal *b* moved barely at all and slightly down. Feature richness is not a substitute for information advantage.

Every betting slice was negative.

Bet-all: −27%. Edge ≥ 0.1 deep: −20%. Adding the prior closing-odds history as a feature contributed nothing (coefficient 0.06, log-loss +0.001%).

The theoretical grounding for why is straightforward. Hausch, Ziemba, and Rubinstein demonstrated in 1981 that the win pool is approximately efficient: the closing odds are fair minus takeout, and that result holds in the Swedish trot market with uncomfortable precision. Thaler and Ziemba explained the structural implication: the market's aggregation of public information is what makes clearing the takeout barrier from the public-information side essentially impossible. The win pool already knows what the features describe.

We thought we had found a way through. We were wrong.

---

## The Breedly Detour and the Look-Ahead Trap

Partway through the program, Breedly's GraphQL API looked like a genuine edge.

The API — open at time of testing, no authentication, clean schema — covers 621,597 horses worldwide and includes a BLUP (Best Linear Unbiased Prediction) genetic merit index, where 100 is the population average. We pulled 374,549 Swedish horses. Of those, 289,000 (77%) had non-null BLUP scores. On the test set of race starts, 89% matched to a horse with a BLUP value. Building a model with BLUP, pedigree index, equipment flags, and market history produced a blend Brier of 0.07202 against a close Brier of 0.07214 — a genuine tiny improvement, similar to the fundamentals program.

But a subset told a different story. For horses with five or fewer prior starts, the look-ahead model at edge ≥ 0.1 showed an apparent ROI of +26.4%.

The coordinator killed the result immediately.

BLUP is not a fixed quantity. It is re-estimated each time a horse races, because each new race result shifts the posterior. The current Breedly snapshot therefore encodes the horse's entire career, including races that had not yet been run at the time of any historical selection. Lightly-raced horses — those with five starts or fewer — are most sensitive to this contamination because each new result shifts their BLUP more than it shifts a horse with 50 starts behind it. The edge was sharpest exactly where the contamination was strongest.

The coordinator recognized the spatial signature: apparent edge concentrated in a data-sparse or information-thin subset. That pattern had appeared in the Dr-Z investigation, where `rv_plats.plats_final_odds` was selecting on the realized place dividend rather than the pre-race place odds, producing impossible 95% strike rates in longshot subsets. The finding was stored in the project's markdown memory index with enough specificity that the connection was immediate — a vague note ("be careful about data leakage") would not have caught the BLUP result; a specific one ("impossible strike rates in longshot subsets = look-ahead into realized dividend field") did. A fresh session without that context would have spent days convincing itself the horse-genetics angle was real.

The clean result: lightly-raced horses with the look-ahead removed returned −17%. All clean slices were negative. The genetic signal that looked strongest in the thin-data regime vanished when the contamination was removed.

<figure>
  <img src="/assets/figures/blup-starts-chart.png" alt="Bar chart of apparent ROI versus number of prior starts, with two series: the contaminated look-ahead model and the clean model. The look-ahead bars peak sharply at the 0–5 start bin (+26.4% at edge ≥ 0.1) and decay toward the takeout floor as starts increase. The clean bars are uniformly below zero, with the ≤5 starts bin at −17%. A vertical dashed line at 5 starts marks where contamination is most severe." loading="lazy">
  <figcaption>Bar chart of apparent ROI versus number of prior starts, with two series: the contaminated look-ahead model and the clean model. The look-ahead bars peak sharply at the 0–5 start bin (+26.4% at edge ≥ 0.1) and decay toward the takeout floor as starts increase. The clean bars are uniformly below zero, with the ≤5 starts bin at −17%. A vertical dashed line at 5 starts marks where contamination is most severe. A callout box notes the same signature appeared in the Dr-Z investigation.</figcaption>
</figure>

One thread remains open. We deployed a forward BLUP logger on the VPS: a weekly systemd timer (`blup-snapshot.timer`, Mondays at 06:00) running `blup_snapshot_logger.py`, which takes a point-in-time snapshot of Breedly BLUP scores into `/home/claude/betting/data/blup_snapshots.db`. The first snapshot ran on 2026-06-16. Every snapshot is stamped with the date taken; no historical selection may reference a snapshot postdating its own race. Testing whether BLUP predicts outcomes from point-in-time snapshots requires months of accumulation. The answer is not in yet.

---

## Why the Ceiling Is Where It Is

The ceiling is structural, not a model deficiency.

The result — *b* ≈ 0.15, irreducible, stable across model versions and calendar halves — is a consequence of what public information is. Form, driver win rates, equipment changes, pedigree indices, and even a horse's own prior closing-odds history are all available on public websites. A serious bettor in 2025 can query travsport.se, visit breedly.com, and watch the ATG tote in real time. The crowd does all of this, continuously, for every race, before the pool closes. The closing price is what happens when thousands of people with access to the same information all express their view simultaneously. As Hausch, Ziemba, and Rubinstein demonstrated, that process produces a price that is approximately efficient — close to a fair probability estimate minus the track's cut.

A model built from those same public sources is trying to reconstruct the signal that the market has already incorporated. It does so imperfectly, which is why *b* > 0: the model captures the information slightly differently from the crowd, and the ensemble of crowd + model is marginally better than either alone. But the margin is 0.0001 Brier.

Two technical branches confirmed the ceiling from different angles. The Benter blend measured *b* at the win-probability level. Separately, the Harville ordering work (Phases 4b and 4c) tested whether the combination-probability mapping — win probabilities translated into trio and combination probabilities via the Harville framework — was itself the exploitable gap. It was not. Clean slices were uniformly negative in both branches. These were two separate null results, not one unified test: the win-level model and the combo-probability mapping each failed independently, which is more damning than if either had failed alone. A note on Phase 4c's komb universe test: it used final settled odds from archive blobs — unknowable at bet time — so its null is a look-ahead-generous upper bound. The honest figure would be at least as bad. Both branches are dead.

The two paths past the ceiling are a rebate arrangement — where the track returns a fraction of takeout to high-volume bettors, effectively lowering the barrier — or genuinely private information: a model that incorporates data the market does not have. Workout times, vet records, stable observations, real-time equipment details not yet reflected in the tote. That research is in a different category. The public-data program ran as far as public data can take it, and this is where it stopped.

---

## What the AI-Operated Shop Learned

Three operational lessons worth recording precisely enough to be useful.

**Pre-registration discipline.** Stating the kill criteria before running the phases is trivially easy and eliminates the most common failure mode in self-directed research: stopping when the output looks good rather than when it answers the question. The Benter program's criterion — blend log-loss improvement significant on the 2025+ test set — was clean enough that each overnight phase returned an unambiguous verdict. The coordinator was not saving time by being lazy; it was concentrating attention where attention is worth something.

**Sonnet-as-backtester.** A Sonnet agent running a logistic grid search and returning a structured brief takes a few minutes and a fraction of the token cost of doing it in the coordinator session. The coordinator's job is to read the brief, check internal consistency, and judge. This separation held across six phases and was the thing that made overnight autonomous runs viable. The pattern held throughout the broader research program — more than 80 tracked experiments, producing hundreds of thousands of odds snapshots and thousands of paper bets before the research closed.

**Cross-experiment memory specificity.** The look-ahead catch in the BLUP results was not produced by a test. There is no automated test for "is this edge concentrated in a subset where contamination would be strongest?" The coordinator recognized the pattern because the same signature had appeared in the Dr-Z investigation, and that earlier finding was stored in the memory index with enough specificity that the connection was immediate. The value of the memory store is proportional to the specificity with which past findings are recorded. A vague note ("be careful about data leakage") would not have caught the BLUP result; a specific one ("impossible strike rates in longshot subsets = look-ahead into realized dividend field") did.

---

## Conclusion

The program is not closed because it failed. It is closed because it answered the question.

The best public-data model we could build achieved *b* ≈ 0.15 of independent signal relative to the closing tote — statistically real, economically sub-takeout, stable across model versions and calendar halves. Adding features improved standalone model quality but did not raise *b*. The closing price already contains what the features describe, because the same people who could build this model are already betting.

The apparent BLUP genetic edge (+26.4% for lightly-raced horses) was entirely look-ahead contamination. The clean figure for the same subset is −17%. The forward BLUP logger now running weekly on the VPS is the only honest way to test whether point-in-time genetic data adds anything; results in several months.

The only routes past the public-data ceiling are a rebate arrangement or genuinely private information. The program now knows exactly how far public data goes.

---

## References

Benter, W. (1994). Computer-based horse race handicapping and wagering systems: a report. In D. B. Hausch, V. S. Y. Lo, & W. T. Ziemba (Eds.), *Efficiency of Racetrack Betting Markets*. Academic Press.

Harville, D. A. (1973). Assigning probabilities to the outcomes of multi-entry competitions. *Journal of the American Statistical Association*, 68(342), 312–316.

Hausch, D. B., & Ziemba, W. T. (Eds.). (1994). *Efficiency of Racetrack Betting Markets*. Academic Press (reissued World Scientific, 2008).

Hausch, D. B., Ziemba, W. T., & Rubinstein, M. (1981). Efficiency of the market for racetrack betting. *Management Science*, 27(12), 1435–1452.

Snowberg, E., & Wolfers, J. (2010). Explaining the favorite-longshot bias: decision weights and the pre-rationality hypothesis. *Journal of Political Economy*, 118(4), 723–746.

Thaler, R. H., & Ziemba, W. T. (1988). Parimutuel betting markets: racetracks and lotteries. *Journal of Economic Perspectives*, 2(2), 161–174.
