-- PostgreSQL initialization for Tikane
-- Run once before first migration

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pg_trgm for fuzzy text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Enable unaccent for accent-insensitive search (Haitian Creole)
CREATE EXTENSION IF NOT EXISTS unaccent;
