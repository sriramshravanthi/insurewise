-- Migration: Reference tables (read-only to users)
-- Mirrors DATA-MODEL.md §4

-- ---------------------------------------------------------------------------
-- sources
-- ---------------------------------------------------------------------------

CREATE TABLE sources (
  id          TEXT PRIMARY KEY CHECK (id ~ '^S-[0-9]{3,}$'),
  title       TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 500),
  publisher   TEXT NOT NULL CHECK (length(publisher) <= 200),
  tier        source_tier NOT NULL,
  url         TEXT CHECK (url IS NULL OR url ~ '^https?://'),
  retrieved_at DATE NOT NULL,
  section_or_page TEXT CHECK (section_or_page IS NULL OR length(section_or_page) <= 200),
  notes       TEXT CHECK (notes IS NULL OR length(notes) <= 2000)
);

-- ---------------------------------------------------------------------------
-- jurisdictions
-- ---------------------------------------------------------------------------

CREATE TABLE jurisdictions (
  code             CHAR(2) PRIMARY KEY,
  name             TEXT NOT NULL CHECK (length(name) <= 100),
  supported        BOOLEAN NOT NULL DEFAULT false,
  supported_since  DATE
);

-- ---------------------------------------------------------------------------
-- coverage_definitions
-- ---------------------------------------------------------------------------

CREATE TABLE coverage_definitions (
  code             TEXT PRIMARY KEY CHECK (length(code) <= 50),
  line             fact_line NOT NULL,
  name             TEXT NOT NULL CHECK (length(name) <= 200),
  plain_language   TEXT NOT NULL CHECK (length(plain_language) <= 5000),
  example          TEXT CHECK (example IS NULL OR length(example) <= 2000),
  common_limitations JSONB,
  source_ids       TEXT[] NOT NULL DEFAULT '{}'
);

-- ---------------------------------------------------------------------------
-- reference_facts
-- ---------------------------------------------------------------------------

CREATE TABLE reference_facts (
  id                 TEXT PRIMARY KEY CHECK (id ~ '^RF-'),
  jurisdiction       CHAR(2) NOT NULL REFERENCES jurisdictions(code),
  topic              TEXT NOT NULL CHECK (length(topic) <= 100),
  line               fact_line NOT NULL,
  statement_template TEXT NOT NULL CHECK (length(statement_template) <= 2000),
  value              JSONB NOT NULL,
  level              fact_level NOT NULL,
  recheck_by         DATE
);

CREATE INDEX idx_reference_facts_jurisdiction_topic ON reference_facts (jurisdiction, topic);

-- ---------------------------------------------------------------------------
-- reference_fact_versions
-- ---------------------------------------------------------------------------

CREATE TABLE reference_fact_versions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fact_id               TEXT NOT NULL REFERENCES reference_facts(id),
  effective_from        DATE NOT NULL,
  effective_to          DATE,
  applies_basis         fact_applies_basis NOT NULL,
  value                 JSONB NOT NULL,
  supersedes_id         UUID REFERENCES reference_fact_versions(id),
  CHECK (effective_to IS NULL OR effective_to > effective_from)
);

CREATE INDEX idx_ref_fact_versions_fact_from ON reference_fact_versions (fact_id, effective_from);

-- ---------------------------------------------------------------------------
-- reference_fact_schedule
-- ---------------------------------------------------------------------------

CREATE TABLE reference_fact_schedule (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fact_id                  TEXT NOT NULL REFERENCES reference_facts(id),
  scheduled_effective_from DATE NOT NULL,
  value                    JSONB NOT NULL,
  source_id                TEXT NOT NULL REFERENCES sources(id)
);

-- ---------------------------------------------------------------------------
-- fact_sources (join)
-- ---------------------------------------------------------------------------

CREATE TABLE fact_sources (
  fact_id   TEXT NOT NULL REFERENCES reference_facts(id),
  source_id TEXT NOT NULL REFERENCES sources(id),
  section   TEXT CHECK (section IS NULL OR length(section) <= 200),
  PRIMARY KEY (fact_id, source_id)
);

-- ---------------------------------------------------------------------------
-- glossary_terms
-- ---------------------------------------------------------------------------

CREATE TABLE glossary_terms (
  slug       TEXT PRIMARY KEY CHECK (slug ~ '^[a-z0-9-]+$' AND length(slug) <= 100),
  term       TEXT NOT NULL CHECK (length(term) <= 200),
  short_def  TEXT NOT NULL CHECK (length(short_def) <= 500),
  long_def   TEXT NOT NULL CHECK (length(long_def) <= 10000),
  related    TEXT[],
  source_ids TEXT[] NOT NULL DEFAULT '{}'
);

CREATE INDEX idx_glossary_slug ON glossary_terms (slug);

-- ---------------------------------------------------------------------------
-- rating_factors
-- ---------------------------------------------------------------------------

CREATE TABLE rating_factors (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  line                     fact_line NOT NULL,
  category                 TEXT NOT NULL CHECK (length(category) <= 200),
  factor                   TEXT NOT NULL CHECK (length(factor) <= 200),
  how_commonly_considered  TEXT CHECK (how_commonly_considered IS NULL OR length(how_commonly_considered) <= 500),
  jurisdiction_notes       JSONB,
  status                   rating_factor_status NOT NULL,
  source_ids               TEXT[] NOT NULL DEFAULT '{}'
);

-- ---------------------------------------------------------------------------
-- review_rules (reference data)
-- ---------------------------------------------------------------------------

CREATE TABLE review_rules (
  id                   TEXT PRIMARY KEY CHECK (length(id) <= 50),
  line                 fact_line NOT NULL,
  applies_to           TEXT NOT NULL CHECK (applies_to IN ('car', 'home', 'both')),
  required_inputs      TEXT[] NOT NULL DEFAULT '{}',
  condition            JSONB NOT NULL,
  parameters           JSONB NOT NULL,
  severity             review_severity NOT NULL,
  message_template_id  TEXT NOT NULL CHECK (length(message_template_id) <= 50),
  question_template_id TEXT CHECK (question_template_id IS NULL OR length(question_template_id) <= 50),
  source_ids           TEXT[] NOT NULL DEFAULT '{}'
);

-- ---------------------------------------------------------------------------
-- message_templates
-- ---------------------------------------------------------------------------

CREATE TABLE message_templates (
  id     TEXT NOT NULL CHECK (length(id) <= 50),
  text   TEXT NOT NULL CHECK (length(text) <= 2000),
  locale TEXT NOT NULL DEFAULT 'en',
  PRIMARY KEY (id, locale)
);

-- ---------------------------------------------------------------------------
-- claims_workflows / claims_steps
-- ---------------------------------------------------------------------------

CREATE TABLE claims_workflows (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_type  TEXT NOT NULL CHECK (length(workflow_type) <= 100),
  label          TEXT NOT NULL CHECK (length(label) <= 200),
  disclaimer_id  TEXT CHECK (disclaimer_id IS NULL OR length(disclaimer_id) <= 50),
  source_ids     TEXT[] NOT NULL DEFAULT '{}'
);

CREATE TABLE claims_steps (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id       UUID NOT NULL REFERENCES claims_workflows(id) ON DELETE CASCADE,
  step_order        INTEGER NOT NULL CHECK (step_order >= 0),
  branch_conditions JSONB,
  text              TEXT NOT NULL CHECK (length(text) <= 5000),
  source_ids        TEXT[] NOT NULL DEFAULT '{}'
);

CREATE INDEX idx_claims_steps_workflow ON claims_steps (workflow_id, step_order);

-- ---------------------------------------------------------------------------
-- checklist_items
-- ---------------------------------------------------------------------------

CREATE TABLE checklist_items (
  id             TEXT PRIMARY KEY CHECK (length(id) <= 50),
  line           fact_line NOT NULL,
  text           TEXT NOT NULL CHECK (length(text) <= 1000),
  why_it_matters TEXT CHECK (why_it_matters IS NULL OR length(why_it_matters) <= 2000),
  source_ids     TEXT[] NOT NULL DEFAULT '{}'
);

-- ---------------------------------------------------------------------------
-- sample_households / sample_documents
-- ---------------------------------------------------------------------------

CREATE TABLE sample_households (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fixture   JSONB NOT NULL,
  is_sample BOOLEAN NOT NULL DEFAULT true CHECK (is_sample = true),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sample_documents (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fixture    JSONB NOT NULL,
  is_sample  BOOLEAN NOT NULL DEFAULT true CHECK (is_sample = true),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- RLS: Reference tables are SELECT-only for all authenticated and anon users
-- ---------------------------------------------------------------------------

ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE jurisdictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE coverage_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reference_facts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reference_fact_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reference_fact_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE fact_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE glossary_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE rating_factors ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sample_households ENABLE ROW LEVEL SECURITY;
ALTER TABLE sample_documents ENABLE ROW LEVEL SECURITY;

-- One policy per table: SELECT for everyone, no mutations from the client
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'sources','jurisdictions','coverage_definitions','reference_facts',
    'reference_fact_versions','reference_fact_schedule','fact_sources',
    'glossary_terms','rating_factors','review_rules','message_templates',
    'claims_workflows','claims_steps','checklist_items',
    'sample_households','sample_documents'
  ]
  LOOP
    EXECUTE format(
      'CREATE POLICY "public_read_%s" ON %I FOR SELECT TO anon, authenticated USING (true)',
      tbl, tbl
    );
  END LOOP;
END $$;
