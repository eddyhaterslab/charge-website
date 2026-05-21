-- ============================================================
-- CHARGE PLATFORM — Seed CREG quarterly residential rates
-- ============================================================
-- Source of truth: CREG_RATES_FALLBACK in lib/reimbursement/engine.ts.
-- The reimbursement engine reads from this table when the
-- cregRateFetcher hook is wired (see compute route). The fallback
-- map in engine.ts is the same data — kept for unit-test isolation.
--
-- Rates are EUR / kWh including 6% VAT (residential).
-- Industrial rate column is best-effort approximation (residential * 0.92)
-- until the user supplies CREG industrial rates.
-- ============================================================

insert into electricity_tariffs
  (effective_year, effective_quarter, residential_rate_eur_per_kwh, industrial_rate_eur_per_kwh, source, notes)
values
  (2024, 1, 0.4200, 0.3864, 'creg', 'CREG Q1 2024 residential bandwidth'),
  (2024, 2, 0.3950, 0.3634, 'creg', 'CREG Q2 2024 residential bandwidth'),
  (2024, 3, 0.3720, 0.3422, 'creg', 'CREG Q3 2024 residential bandwidth'),
  (2024, 4, 0.3580, 0.3294, 'creg', 'CREG Q4 2024 residential bandwidth'),
  (2025, 1, 0.3450, 0.3174, 'creg', 'CREG Q1 2025 residential bandwidth'),
  (2025, 2, 0.3380, 0.3110, 'creg', 'CREG Q2 2025 residential bandwidth'),
  (2025, 3, 0.3210, 0.2953, 'creg', 'CREG Q3 2025 residential bandwidth'),
  (2025, 4, 0.3520, 0.3238, 'creg', 'CREG Q4 2025 residential bandwidth'),
  (2026, 1, 0.3284, 0.3021, 'creg', 'CREG Q1 2026 residential bandwidth'),
  (2026, 2, 0.3197, 0.2941, 'creg', 'CREG Q2 2026 residential bandwidth'),
  (2026, 3, 0.3052, 0.2808, 'creg', 'CREG Q3 2026 residential bandwidth'),
  (2026, 4, 0.3415, 0.3142, 'creg', 'CREG Q4 2026 residential bandwidth')
on conflict (effective_year, effective_quarter) do update set
  residential_rate_eur_per_kwh = excluded.residential_rate_eur_per_kwh,
  industrial_rate_eur_per_kwh  = excluded.industrial_rate_eur_per_kwh,
  source                       = excluded.source,
  notes                        = excluded.notes;
