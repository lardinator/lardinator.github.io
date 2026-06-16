---
layout: default
title: "How I Failed to Beat the Tote"
permalink: /
---

*An AI-operated quant research shop tries to crack the Swedish trotting pari-mutuel market — and documents every way it fooled itself*

---

Four months ago I built a quantitative research program around a premise that seemed defensible on paper: Swedish trotting tote markets price exotic bets (trio, komb, tvilling) using merged pools, but the thinnest cells of those pools might be systematically mispriced. Run enough Harville calculations at scale, find the structural overlays, automate the placement. Simple enough that the failure was interesting.

The research program ran 84 experiments, collected 464,787 live odds snapshots, placed 10,358 paper bets and — deliberately — only 23 real-money bets, which were paused the moment rigorous CI testing undercut the apparent edge. The final verdict was clean: the market is efficient to within takeout. Every promising result, traced far enough, was either a data artifact or a statistical ghost.

This series exists to document the specific ways a well-funded, carefully designed research program fooled itself. Not in the abstract — with the actual SQL, the actual bug, the actual backtest that looked like +650% ROI until someone asked why the number was so good.

What this series is not: it is not a betting tutorial. It is not a guide to running your own AI research shop. It is not an argument that tote markets are or are not beatable in principle. It is not an AI hype piece. The arc ends in a null result, and I'm treating that as the interesting part — because the specific shape of every failure contains something generalizable to anyone building data-driven systems that are easy to accidentally lie to themselves with.

The second thread running through every post is operational: this program was run almost entirely through Claude Code, using a hand-rolled multi-agent "Syndicate" protocol with pre-registration, independent AI verifiers, and an Opus-coordinates/Sonnet-computes cost discipline. That story is separate from the betting story, but it belongs here too — because the hardest epistemics problems in the project were not about trotting, they were about knowing when to trust a number a machine just gave you.

---

## Who this is for

Data scientists and engineers who want honest field reporting on what a real research program actually looks like — including the parts where the researcher is wrong — and AI builders curious about what it means to delegate execution (but not judgment) to language models at the level of a four-month, multi-agent, live-production research operation.

---

## The series

<ol class="series-toc">
  <li>
    <span class="order">Post 1</span>
    <span class="title"><a href="/series/series-intro-two-failure-modes/">Two Ways to Fool Yourself: A Series Introduction</a></span>
    <span class="hook">I spent four months running an AI-operated quant shop trying to beat the Swedish trotting tote, racked up 84 experiments and 464,787 odds snapshots, and the market beat me clean — which, done honestly, is the interesting part.</span>
  </li>
  <li>
    <span class="order">Post 2</span>
    <span class="title"><a href="/series/tote-mechanics-primer/">The Tote Is Not a Bookie: How Pari-Mutuel Betting Actually Works</a></span>
    <span class="hook">Every tote strategy I tested failed for the same structural reason, and it took me longer than I'd like to admit to fully internalize it: you can never lock a pari-mutuel price.</span>
  </li>
  <li>
    <span class="order">Post 3</span>
    <span class="title"><a href="/series/t1-odds-bug/">The +650% That Wasn't: Finding the Bug That Made Everything Look Like an Edge</a></span>
    <span class="hook">The paper P/L said +243,000 SEK; the real P/L was -7,500 SEK; and the bug that caused the gap explains almost every false positive that came after it.</span>
  </li>
  <li>
    <span class="order">Post 4</span>
    <span class="title"><a href="/series/the-syndicate-research-loop/">The Syndicate: Building a Multi-Agent Research Shop Before Claude Code Had Workflows</a></span>
    <span class="hook">Six months ago I hand-rolled a multi-agent research loop inside a Claude Code slash-skill because the tool had no native workflows — and the most important thing it taught me is that independent verification is a genuine epistemics upgrade, not just a performance.</span>
  </li>
  <li>
    <span class="order">Post 5</span>
    <span class="title"><a href="/series/drz-look-ahead-postmortem/">The Oracle That Couldn't Tell the Future: The Dr-Z Look-Ahead Postmortem</a></span>
    <span class="hook">The Dr-Z place-betting system showed +61% to +289% ROI across France, Norway, and the US — and every last basis point was a data artifact discoverable only by asking why a 15-to-1 longshot was placing 95% of the time.</span>
  </li>
  <li>
    <span class="order">Post 6</span>
    <span class="title"><a href="/series/escape-attempts-fixed-odds-cross-tote/">Two Dead Ends: Fixed Odds and the Cross-Tote Oracle</a></span>
    <span class="hook">When you can't beat the tote, the obvious move is to find a counterparty who isn't running a pari-mutuel pool — except that counterparty does not exist for Swedish trotting, and the cross-tote oracle we thought we had pointed in the wrong direction.</span>
  </li>
  <li>
    <span class="order">Post 7</span>
    <span class="title"><a href="/series/fundamentals-model-private-data-wall/">The Model That Converged on the Crowd: Building the Strongest Public-Data Signal and Watching It Lose</a></span>
    <span class="hook">The strongest model we could build from public data — form, pedigree, equipment, driver history, market history, genetic merit index — was still measurably worse than the closing tote odds at predicting race outcomes.</span>
  </li>
  <li>
    <span class="order">Post 8</span>
    <span class="title"><a href="/series/regime-lens-statistical-void/">The Regime That Almost Worked: Finding the Least Efficient Cell and Watching It Dissolve Under a Confidence Interval</a></span>
    <span class="hook">Thin pools, small fields, midweek races — our best model's edge bets went from -33% in deep pools to -1.1% in the least-liquid corner of the market, and we were nearly convinced it was real until we ran the race-clustered bootstrap.</span>
  </li>
  <li>
    <span class="order">Post 9</span>
    <span class="title"><a href="/series/capstone-what-the-shop-built/">The Durable Artifact: What Four Months of Honest Failure Actually Produced</a></span>
    <span class="hook">The betting program closed null, which means the most valuable thing it produced was not a system — it was a false-positive checklist, a data pipeline with 464,787 proprietary odds snapshots, and a template for running a pre-registered AI research loop that might generalize far outside horse racing.</span>
  </li>
</ol>

---

## Recurring sidebars

Three sidebars recur across posts. They are not decorative — each one encodes a lesson that kept having to be relearned.

**The False-Positive Checklist** appears in posts 3 through 8. It starts with one item and grows. The final version has five:

1. Settle at realized close — never at the snapshot odds that existed when the bet was recorded
2. No look-ahead via current-state snapshots (place odds pulled from a live API are the realized dividend, not a pre-race probability)
3. De-vig over the complete field, not the subset you're evaluating
4. No survivorship or argmax — a filter that selects the best-performing combo in hindsight is not a strategy
5. Always compute a race-clustered confidence interval — individual bets are correlated within a race, and ignoring that deflates your standard errors

Each post adds the item that caused the failure in that episode, so the list serves as a running taxonomy of the project's self-deceptions.

**The Syndicate Snapshot** appears in posts 4 through 8. It is a compact sidebar showing the current sprint number, how many ideas were tested that sprint, how many were promoted through the gate, and the gate criteria in force. Readers following the AI-ops thread get a running operational status without having to read every experiment note.

**Pool Regime Quick-Reference** appears in posts 2, 6, and 8. Turnover medians by country and bet type, the regime classification (co-mingled vs. local pool), and the ATG Regulations §7 rule that determines which applies. The regime classification is not an academic curiosity — it is load-bearing for every value-ratio calculation in the series, and the failure to think clearly about it early cost several sprints.

---

## How this series was actually made

The research program and this series are documented in two postmortems in the codebase: `data-science/TROTTING_POSTMORTEM.md` covers the market findings, and `data-science/OPERATIONAL_POSTMORTEM.md` covers how the program was run — the Syndicate's six roles, the pre-registration gate, the Opus/Sonnet cost split, and the one catch (the T-1 odds bug) that came from human skepticism about a suspiciously large number rather than from any automated test. If you want the operational story in full before reading the individual posts, start there.
