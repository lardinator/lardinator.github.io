---
layout: post
order: 2
slug: tote-mechanics-primer
title: "The Tote Is Not a Bookie: How Pari-Mutuel Betting Actually Works"
hook: "Every tote strategy I tested failed for the same structural reason, and it took me longer than I'd like to admit to fully internalize it: you can never lock a pari-mutuel price."
thesis: "In a pari-mutuel pool you are always paid the closing dividend regardless of when you bet, which means the only edge worth chasing is a genuine closing overlay — and the closing price is the sharpest predictor available."
permalink: /series/tote-mechanics-primer/
---

# The Tote Is Not a Bookie: How Pari-Mutuel Betting Actually Works

The scanner shows 8.4. The model says fair value is 6.0. The finger hovers. Here is what I had not fully internalized: the price you see is not the price you will receive. That price is whatever the pool settles at after the last bet on earth has been counted. That settlement happens after track betting closes, after off-track terminals drain their queues, and after co-mingled international partners report in. By then you are already in. You decided on a snapshot. You are paid the final state.

This is the structural fact that every analysis in this series has to treat as bedrock. The rest of this post explains the mechanics, measures how large the problem actually is, and describes how the measurement was done.

---

## What the Pool Actually Is

A pari-mutuel win pool is a collective pot. Every bettor on a given horse adds to that horse's share of the pot. When the race is run and the winner declared, the winning bettors divide the total pot minus the operator's cut — the takeout.

The takeout is the first number that should be written on every analyst's hand before they open a price feed. Swedish ATG charges 15% takeout on vinnare (win) and komb (exacta), and 25% on trio (trifecta). Norway charges 25% on komb and 30% on trio. France charges 14% on vinnare but 26% on tvilling (quinella) — both co-mingled into the PMU — and 30% on trio, which runs as an ATG-local pool. These are not edge cases — they are the floor of any price-based angle. If you cannot beat the closing price by more than 15–30% on the relevant bet type, you are donating.

The dividend formula:

```
dividend = (pool_total × (1 - takeout_rate)) / stakes_on_winner
```

Equivalently, each horse's implied win probability is:

```
implied_prob(i) = stakes(i) / pool_total
```

The "price" you observe at any point before the pool closes is not the price you receive. It is a provisional reading of a distribution that has not finished moving. Being early has zero value. You cannot lock the price. This is the categorical distinction between a tote and a bookmaker's fixed-odds offer.

---

## Pool Architecture: Not All Totes Are Equal

The second thing that matters is understanding what pool you are actually in, because "ATG win odds on a French race" and "ATG win odds on a Swedish race" are very different objects.

<figure>
  <img src="/assets/figures/pool-architecture-regime-map.png" alt="Pool structure regime map. Rows are country/operator; columns are bet type. Cell color and median turnover (SEK) distinguish co-mingled and merged pools (deep, SE/DK-joined or host-tote) from thin local pools. Takeout rates are labeled per country-bet combination." loading="lazy">
  <figcaption>Pool structure regime map. Rows are country/operator; columns are bet type. Cell color and median turnover (SEK) distinguish co-mingled and merged pools (deep, SE/DK-joined or host-tote) from thin local pools. Takeout rates are labeled per country-bet combination.</figcaption>
</figure>

The regime map divides the available markets into two types: co-mingled or merged (deep liquidity, no structural angle) and local (thin, but thinness alone is not sufficient for mispricing). Swedish and Danish win pools have been merged since December 2020. French vinnare, plats, and couplé are co-mingled into the PMU, France's central tote operator — ATG bettors receive the PMU dividend.

The depth differences are stark:

| Country / pool type | Bet type | Median turnover (SEK) |
|---|---|---|
| FR vinnare (PMU co-mingled) | win | 684,000 |
| SE vinnare | win | 117,000 |
| NO vinnare | win | 13,000 |
| NO trio | trifecta | 14,000 |
| FR trio (ATG-local) | trifecta | 3,600 |
| FR komb (ATG-local) | exacta | 1,300 |

The FR vinnare pool is a deep, liquid market operating at the standard of a national operator. The FR komb pool is thinner than a corner bookmaker running a small county card. A hypothesis that works in a 684,000 SEK co-mingled pool with a 14% takeout is a completely different problem from the same hypothesis in a 1,300 SEK local pool with a 30% takeout. I treated these as interchangeable for longer than I should have, and it was the source of several confounded experiments where the real variable was pool regime, not signal quality.

The cross-tote relative-value play — the idea that thin local FR komb/trio pools might be mispriced relative to the co-mingled vinnare — was tested directly. It was null at every threshold. Pool thinness alone is not a sufficient condition for mispricing. The point here is that the regime map must come before the hypothesis, not after.

---

## Measuring the Late Move

I have 464,787 odds snapshots in `betting.db` on the VPS, collected from `api.travsport.se` via a systemd timer running continuously since 2026-02-23. The question I wanted to answer was simple: how wrong is the T-60s price, relative to the closing dividend you actually receive?

On 1,569 settled horses across SE, NO, FR, and other markets, the median absolute relative move is 17.2%. Only 13% of horses land within 5% of the closing dividend at T-60s. Only 29% land within 10%.

More than 70% of horses are still more than 10% away from their closing price at 60 seconds to post. The odds feed you are watching is not close to the price you will receive.

The move is also directional, consistent with what Snowberg and Wolfers documented as the favourite-longshot bias (2010). Favourites — horses at odds below 3.0 — tend to shorten into the close: their T-60s price is about 6% longer than the closing dividend, with a median move of 10%. Longshots at 8.0 or above drift out: their T-60s price reads approximately 17% below the closing dividend value — these horses drift outward to a longer price by close — with a median move of 20%. Only 22% of longshots are within 10% of the closing dividend at T-60s.

<figure>
  <img src="/assets/figures/late-move-directional-asymmetry.png" alt="Late-move directional asymmetry. Two series indexed to the closing dividend (close = 1.0). Favourites shorten into post; longshots drift out. The shaded band shows the ±5% range — only 13% of all horses fall within it at T-60s. Source: 1,569 settled horses, late-odds-movement memory, measured 2026-06-16." loading="lazy">
  <figcaption>Late-move directional asymmetry. Two series indexed to the closing dividend (close = 1.0). Favourites shorten into post; longshots drift out. The shaded band shows the ±5% range — only 13% of all horses fall within it at T-60s. Source: 1,569 settled horses, late-odds-movement memory, measured 2026-06-16.</figcaption>
</figure>

The trajectory from T-20min to T-60s goes: 28% median absolute move at T-20min, then 24%, 21%, 19%, 17% at T-60s. It converges, but it never gets tight.

The calculation is straightforward to audit:

```sql
-- Compute per-horse absolute deviation at T-60s from closing dividend
WITH
snapshots AS (
    SELECT
        race_id,
        horse_id,
        odds,
        snapshot_ts,
        race_start_ts,
        (race_start_ts - snapshot_ts) AS secs_to_post
    FROM odds_snapshots
    WHERE settled = 1
),
t60 AS (
    SELECT race_id, horse_id, odds AS odds_t60
    FROM snapshots
    WHERE secs_to_post BETWEEN 55 AND 75
    QUALIFY ROW_NUMBER() OVER (
        PARTITION BY race_id, horse_id
        ORDER BY ABS(secs_to_post - 60)
    ) = 1
),
closing AS (
    SELECT race_id, horse_id, closing_dividend AS odds_close
    FROM race_results
)
SELECT
    t60.horse_id,
    t60.odds_t60,
    c.odds_close,
    ABS(t60.odds_t60 - c.odds_close) / c.odds_close AS abs_rel_move
FROM t60
JOIN closing c USING (race_id, horse_id)
```

The mechanism is not a data artifact. One of the first hypotheses I entertained was that the scanner was picking up "pre-close" odds that the ATG system had not yet propagated correctly. The archive odds for settled races are true closing odds. The ~17% move is real post-freeze off-track money — terminals at tracks in Denmark and Norway, online accounts settling after the on-track pool closes, co-mingled international partners reporting in. The close is not the same quantity as the T-60s snapshot. They are genuinely different prices.

---

## The Close Is Informed, Not Random

The directional asymmetry is not a distortion to fade. That is the contrarian intuition — favourites have been bet down by sharp money, longshots have been ignored, let me go against the crowd's final answer. I tested it directly.

Fading the late move produces −45% ROI on 374 settled races. The other strategies on the same races:

- Bet all at closing dividend: −39%
- Drifters: −20%
- Favourites: −22%

(There is one apparently positive result — betting in the direction of the late move — at +4.9% on n=588 individual horse-bets drawn from those 374 races. It has no out-of-sample split and no confidence interval. It is mentioned here only to explain why it does not appear in the conclusions. Noise is not a result.)

The Brier score tells the cleaner story. A Brier score measures forecast accuracy as mean squared error of probability estimates: lower is better. It penalises both poor calibration and poor discrimination. Measured on 374 races / 3,944 horses between February and mid-May 2026 — the period where closing dividends were also backfilled with outcome data; the 1,569-horse late-move sample above is the full universe of settled vinnare races with matched T-60s snapshots across the whole scanner period:

| Price source | Brier score | vs. closing |
|---|---|---|
| T-5min scanner | 0.06616 | +0.00182 |
| T-60s scanner | 0.06572 | +0.00138 |
| Closing dividend | 0.06434 | — |
| Fundamentals model (OOS) | 0.081 | +0.01666 |

<figure>
  <img src="/assets/figures/brier-score-trajectory.png" alt="Brier score by price source, measured on 374 races / 3,944 horses (Feb–mid-May 2026). Lower is better. The closing price (0.06434, dashed line) is the sharpest predictor at every prior time horizon. A ten-feature fundamentals model scores 0.0812 — approximately 13% worse than the close." loading="lazy">
  <figcaption>Brier score by price source, measured on 374 races / 3,944 horses (Feb–mid-May 2026). Lower is better. The closing price (0.06434, dashed line) is the sharpest predictor at every prior time horizon. A ten-feature fundamentals model scores 0.0812 — approximately 13% worse than the close. Source: late-odds-movement memory; tote-efficiency-synthesis memory; ATG api.travsport.se.</figcaption>
</figure>

The closing price is the sharpest predictor at every prior time horizon. The crowd's final answer — assembled from the most informed money, including off-track money that arrives after the betting window — is better calibrated than anything observable before it. As Asch, Malkiel, and Quandt first documented, late racetrack money tends to be informed (1982). The market is not being distorted at the close; it is being completed.

The fundamentals model I built — ten features including driver statistics, shoe and sulky changes, pedigree, and market history, trained to AUC 0.82 on the hold-out set — produced an out-of-sample Brier of 0.081. That is approximately 26% worse than simply using the closing price as your probability estimate. A blend of the model and the closing price beat the closing price alone by roughly 0.15% Brier — a real, measurable difference, and roughly 100 times smaller than the takeout. Signal, not edge.

Hausch, Ziemba, and Rubinstein (1981) confirmed the win pool was largely efficient; the favourite-longshot bias itself — documented since Griffith (1949) and surveyed by Thaler and Ziemba (1988) — is real and is the only robust structural inefficiency they identified in the win pool. Favourites at ATG are median −7.8% on closing odds — meaning they are overbet by about 7.8% relative to their true win probability. That bias is real, and consistent with the directional late-move asymmetry observed above. It is also entirely inside the 15% takeout. A documented bias is not automatically exploitable.

---

## The T-1 Bug, or: Why the Number Was Wrong for Three Months

The clearest illustration of the pricing problem was not a theory. It was a bug.

Early in the project, paper P/L was computed by settling at the last available pre-race odds snapshot — what I was calling T-1. The system was recording odds 60–90 seconds before post, treating those as "the price," and computing returns against them. On those numbers, one of the backtest strategies showed +243,000 SEK in paper profit.

The corrected number, settled against the actual closing dividend from the race results API, was −7,500 SEK. The swing is +250,000 SEK from a single methodology error.

The bug was caught by doubt, not automation. Human skepticism about an unreasonably large positive result triggered the investigation. The T-1 stale-odds artifact is now item one in the false-positive checklist that runs before any result is accepted. Automation catches categories of error you anticipated. Humans catch the ones you didn't.

---

## How the Measurement Was Done

The Brier trajectory analysis was not run interactively. A background Sonnet agent was given a fully self-contained brief — database path on the VPS, SQL filter logic, output format, and a list of the specific numbers to produce. The coordinator (the main session) read a two-paragraph summary when the agent reported back. No notebook was opened. No intermediate output was scrolled through. This is the intended division of labor: cheap compute agents measure; the coordinator only judges.

The key design constraint is that agents receive zero conversation context, so briefs must be hermetic. Anything left implicit becomes a source of divergence. A second agent independently re-ran the Brier calculation on the same data, and the coordinator reconciled the two outputs before accepting any number. Two independently computed numbers that agree is a stronger claim than one number that looked reasonable.

The scanner that generated the 464,787 snapshots runs as a systemd unit on the same VPS. The systemd timer fires every 45 seconds during race windows, producing approximately 25 pre-race readings per race. Over 113 days of operation the total is 464,787 snapshots.

---

## Takeaway

No price-based angle is viable from a T-60s decision window. The tote closes at the closing price; the closing price is the sharpest available predictor; a ten-feature fundamentals model built from public data was approximately 26% worse than the close by Brier score. The favourite-longshot bias is real and sits entirely inside the takeout.

The only edge worth building toward is a genuine closing overlay — a dividend that exceeds fair probability after takeout — which requires private information or a structural pool position the closing price cannot incorporate.

---

## References

Asch, P., Malkiel, B.G., and Quandt, R.E. (1982). "Racetrack Betting and Informed Behavior." *Journal of Financial Economics*.

Griffith, R.M. (1949). "Odds Adjustments by American Horse-Race Bettors." *American Journal of Psychology*.

Hausch, D.B., Ziemba, W.T., and Rubinstein, M. (1981). "Efficiency of the Market for Racetrack Betting." *Management Science*, 27, 1435–1452.

Snowberg, E. and Wolfers, J. (2010). "Explaining the Favorite–Longshot Bias: Decision Weights, Not Judgment Errors." *Journal of Political Economy*.

Thaler, R.H. and Ziemba, W.T. (1988). "Parimutuel Betting Markets: Racetracks and Lotteries." *Journal of Economic Perspectives*.
