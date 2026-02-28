
UPDATE regus_locations SET name = REPLACE(name, 'Regus ', 'Startup Factory Hub ') WHERE name LIKE 'Regus %';
UPDATE regus_locations SET name = REPLACE(name, 'Regus', 'Startup Factory Hub') WHERE name LIKE '%Regus%';
