---
layout: default
title: "About"
permalink: /about/
---

I'm a software engineer who spent the better part of 2026 trying to beat the Swedish trotting pari-mutuel market with public data, Harville probabilities, and an automated research loop run almost entirely through Claude Code. The short version: the market is efficient to within the takeout. Eighty-four experiments. Twenty-three real-money bets. Net: negative.

This series is not a success story. It's a record of how a one-person quant program actually runs when you build it on top of LLM agents — what the division of labor looks like, where the models earn their keep, where human judgment is irreplaceable, and what failure looks like when the infrastructure is working correctly.

The research shop had a clear hierarchy. A main Opus session served as principal investigator: it read sprint summaries, smell-tested numbers, issued short correction rules, and held the real-money gate (a literal `REAL_MONEY_ENABLED = False` flag, flipped by hand). Sub-agents on Sonnet ran the actual compute — backtests, ML grid searches, verification passes, experiment notes. The most important catch in the whole program — a T-1 odds bug that made paper P/L look like +650% when it was −20% — came from human skepticism about a suspiciously round number, not from any automated test. That is not an advertisement for human superiority; it is a calibration note about where to keep your eyes.

**Honest disclosure.** This series was assembled with the same workflow it describes. The postmortems, the experiment summaries, and the drafts here were written in Claude Code sessions, with the author reviewing, correcting, and committing. The words are mine in the sense that I directed, edited, and stand behind every claim. The drafting velocity is not.

---

## References and data

The two primary source documents are in the project repository:

- `data-science/TROTTING_POSTMORTEM.md` — full market-research postmortem: every angle tested, every false positive autopsied, final verdict.
- `data-science/OPERATIONAL_POSTMORTEM.md` — operational postmortem: how the AI-run research shop was actually structured, what it cost, what it got right, what it got wrong.

Underlying data: 464,787 odds snapshots collected by the live scanner (2026-02-23 to 2026-06-16), 9.9M horse starts and 5.7M race results extracted from ATG's raw JSON archive into DuckDB, 10,358 paper bets, and 83 experiments tracked in MLflow.
