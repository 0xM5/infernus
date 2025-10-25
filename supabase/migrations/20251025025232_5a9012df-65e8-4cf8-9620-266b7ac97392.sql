-- Change rating column from integer to numeric to support half stars (like 3.5)
ALTER TABLE trades ALTER COLUMN rating TYPE NUMERIC(3,1);