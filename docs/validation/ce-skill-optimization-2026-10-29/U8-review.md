# U8 sample and calibration evidence repair

Status: mechanism verified; real measurement provenance and independence remain owner obligations.

The decider counts observed samples on both arms for every required objective. Scalars/aggregates count at most once; sample_count cannot supply missing observations. Repeat mode now enforces its repeat budget as ladder mode does. Existing holdout checks remain intact. Positive fixtures now provide baseline observations instead of assuming one baseline scalar satisfies repeated confirmation; no production evidence was fabricated.

Measurement admission v2 preregisters range-v1 (maximum minus minimum completed A/A score, in metric units). allow-ab reads bounded non-symlink regular result files, verifies their SHA-256, distinct run/file identity, baseline/admission binding, successful exit and score agreement, then computes the spread itself. A caller's observed_noise_floor cannot override it. v1 evidence remains historical and requires fresh admission/calibration. Broken runs remain unscored.

Evidence: U8-red.log records four observed failures before implementation. U8-green.log records 4 suites / 140 tests passed, including 0/100 A/A with asserted zero noise, missing/reused/tampered/failed/wrong-source results, legacy admission refusal, both-arm repeat checks, and stable calibration. U8-typecheck.log records 272 files checked.

Limits: result records and sample arrays remain caller-supplied evidence. Hashes and run IDs prevent accidental substitution/reuse but do not authenticate execution or prove process independence. The owner must retain and inspect raw launch/log provenance; the result explicitly labels its evidence_scope as file-integrity-and-arithmetic-only. The range is observed spread, not statistical confidence. No live model, A/B quality gain, independent review or field outcome was measured.
