-- Seed market_benchmarks with national average pricing data for the four launch trades.
-- Sources: founder_experience, HomeAdvisor, Angi, BLS (Bureau of Labor Statistics).
-- Region is NULL = national averages. Companies can override with regional data later.

-- Add unique constraint for idempotent upserts (trade + service_name).
-- All seed data is national (region = NULL). If regional data is added later,
-- promote to a composite unique index on (trade, service_name, region).
alter table market_benchmarks
  add constraint uq_market_benchmarks_trade_service unique (trade, service_name);

-- ============================================
-- BACKFLOW
-- ============================================

insert into market_benchmarks (trade, region, service_name, benchmark_low, benchmark_high, benchmark_source, notes)
values
  ('backflow', null, 'Backflow Test', 75, 150, 'founder_experience', 'Annual testing required by most municipalities'),
  ('backflow', null, 'Backflow Repair', 150, 500, 'founder_experience', 'Depends on valve type and accessibility'),
  ('backflow', null, 'Backflow Installation', 300, 1200, 'HomeAdvisor', 'New device install including permit'),
  ('backflow', null, 'Annual Backflow Certification', 50, 100, 'founder_experience', 'Certification paperwork and filing fee')
on conflict on constraint uq_market_benchmarks_trade_service do update set
  benchmark_low = excluded.benchmark_low,
  benchmark_high = excluded.benchmark_high,
  benchmark_source = excluded.benchmark_source,
  notes = excluded.notes,
  updated_at = now();

-- ============================================
-- HVAC
-- ============================================

insert into market_benchmarks (trade, region, service_name, benchmark_low, benchmark_high, benchmark_source, notes)
values
  ('hvac', null, 'AC Service Call', 89, 175, 'HomeAdvisor', 'Diagnostic fee, often waived with repair'),
  ('hvac', null, 'AC Tune-Up', 79, 149, 'Angi', 'Seasonal maintenance, coil cleaning, refrigerant check'),
  ('hvac', null, 'Furnace Tune-Up', 79, 129, 'Angi', 'Fall season maintenance, heat exchanger inspection'),
  ('hvac', null, 'AC Install (3-ton)', 4500, 8500, 'HomeAdvisor', 'Full system replacement including labor'),
  ('hvac', null, 'Furnace Install', 3000, 6500, 'HomeAdvisor', 'Gas furnace, mid-efficiency to high-efficiency'),
  ('hvac', null, 'Duct Cleaning', 300, 600, 'Angi', 'Whole-home duct cleaning, average 2000 sqft'),
  ('hvac', null, 'Refrigerant Recharge', 150, 400, 'founder_experience', 'R-410A, includes leak check')
on conflict on constraint uq_market_benchmarks_trade_service do update set
  benchmark_low = excluded.benchmark_low,
  benchmark_high = excluded.benchmark_high,
  benchmark_source = excluded.benchmark_source,
  notes = excluded.notes,
  updated_at = now();

-- ============================================
-- PLUMBING
-- ============================================

insert into market_benchmarks (trade, region, service_name, benchmark_low, benchmark_high, benchmark_source, notes)
values
  ('plumbing', null, 'Drain Cleaning', 100, 300, 'Angi', 'Standard cable or hydro-jet, single drain'),
  ('plumbing', null, 'Water Heater Install', 1200, 3500, 'HomeAdvisor', 'Tank-style, 40-50 gallon, including haul-away'),
  ('plumbing', null, 'Tankless WH Install', 2500, 5000, 'HomeAdvisor', 'Gas tankless, includes gas line and venting'),
  ('plumbing', null, 'Faucet Replacement', 150, 350, 'Angi', 'Customer-supplied or standard faucet, single fixture'),
  ('plumbing', null, 'Toilet Replacement', 250, 500, 'founder_experience', 'Standard toilet, includes wax ring and supply line'),
  ('plumbing', null, 'Sewer Line Repair', 1500, 5000, 'HomeAdvisor', 'Trenchless or traditional, varies by depth and length'),
  ('plumbing', null, 'Garbage Disposal', 150, 400, 'Angi', 'Supply and install, 1/2 HP to 3/4 HP')
on conflict on constraint uq_market_benchmarks_trade_service do update set
  benchmark_low = excluded.benchmark_low,
  benchmark_high = excluded.benchmark_high,
  benchmark_source = excluded.benchmark_source,
  notes = excluded.notes,
  updated_at = now();

-- ============================================
-- ELECTRICAL
-- ============================================

insert into market_benchmarks (trade, region, service_name, benchmark_low, benchmark_high, benchmark_source, notes)
values
  ('electrical', null, 'Panel Upgrade (200A)', 1500, 3000, 'BLS', '100A to 200A upgrade, includes permit'),
  ('electrical', null, 'Outlet Install', 100, 250, 'Angi', 'Standard or GFCI outlet, existing circuit'),
  ('electrical', null, 'Ceiling Fan Install', 150, 350, 'HomeAdvisor', 'Existing wiring, includes mounting hardware'),
  ('electrical', null, 'Whole House Rewire', 8000, 15000, 'BLS', '2000 sqft home, copper wiring, includes panel'),
  ('electrical', null, 'EV Charger Install', 500, 1500, 'HomeAdvisor', 'Level 2, 240V circuit, includes permit'),
  ('electrical', null, 'Generator Install', 3000, 8000, 'HomeAdvisor', 'Whole-home standby, includes transfer switch'),
  ('electrical', null, 'Lighting Fixture', 100, 300, 'Angi', 'Standard fixture swap, existing wiring')
on conflict on constraint uq_market_benchmarks_trade_service do update set
  benchmark_low = excluded.benchmark_low,
  benchmark_high = excluded.benchmark_high,
  benchmark_source = excluded.benchmark_source,
  notes = excluded.notes,
  updated_at = now();
