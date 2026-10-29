-- Migration: User-owned tables
-- Mirrors DATA-MODEL.md §3
-- RLS: Every user-owned row reachable only through a household owned by auth.uid()

-- ---------------------------------------------------------------------------
-- households
-- ---------------------------------------------------------------------------

CREATE TABLE households (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label      TEXT NOT NULL CHECK (length(label) <= 80),
  state      CHAR(2) NOT NULL,
  zip5       CHAR(5) CHECK (zip5 ~ '^\d{5}$'),
  is_sample  BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_households_owner ON households (owner_id);

ALTER TABLE households ENABLE ROW LEVEL SECURITY;

CREATE POLICY "households_owner_select" ON households
  FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "households_owner_insert" ON households
  FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "households_owner_update" ON households
  FOR UPDATE TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "households_owner_delete" ON households
  FOR DELETE TO authenticated USING (owner_id = auth.uid());

-- ---------------------------------------------------------------------------
-- vehicles
-- ---------------------------------------------------------------------------

CREATE TABLE vehicles (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id     UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  year             INTEGER NOT NULL CHECK (year BETWEEN 1900 AND 2100),
  make             TEXT NOT NULL CHECK (length(make) <= 200),
  model            TEXT NOT NULL CHECK (length(model) <= 200),
  ownership        ownership_type NOT NULL,
  value_cents      BIGINT CHECK (value_cents IS NULL OR value_cents >= 0),
  loan_balance_cents BIGINT CHECK (loan_balance_cents IS NULL OR loan_balance_cents >= 0),
  mileage_band     mileage_band,
  use              vehicle_use_type,
  parking          vehicle_parking_type,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_vehicles_household ON vehicles (household_id);

ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vehicles_via_household" ON vehicles
  FOR ALL TO authenticated
  USING (
    household_id IN (SELECT id FROM households WHERE owner_id = auth.uid())
  )
  WITH CHECK (
    household_id IN (SELECT id FROM households WHERE owner_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- drivers
-- ---------------------------------------------------------------------------

CREATE TABLE drivers (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id        UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  age_band            age_band NOT NULL,
  years_licensed_band years_licensed_band NOT NULL,
  incidents_3y        JSONB,
  primary_vehicle_id  UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_drivers_household ON drivers (household_id);

ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "drivers_via_household" ON drivers
  FOR ALL TO authenticated
  USING (
    household_id IN (SELECT id FROM households WHERE owner_id = auth.uid())
  )
  WITH CHECK (
    household_id IN (SELECT id FROM households WHERE owner_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- properties
-- ---------------------------------------------------------------------------

CREATE TABLE properties (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id          UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  type                  property_type NOT NULL,
  year_built            INTEGER NOT NULL CHECK (year_built BETWEEN 1600 AND 2100),
  sqft                  INTEGER NOT NULL CHECK (sqft > 0 AND sqft <= 50000),
  stories               INTEGER NOT NULL CHECK (stories BETWEEN 1 AND 10),
  construction          construction_type NOT NULL,
  foundation            foundation_type,
  roof_material         roof_material,
  roof_age_band         roof_age_band,
  systems               JSONB,
  protective_devices    JSONB,
  liability_features    JSONB,
  hazard_flags          JSONB,
  market_value_cents    BIGINT CHECK (market_value_cents IS NULL OR market_value_cents >= 0),
  rebuild_estimate_cents BIGINT CHECK (rebuild_estimate_cents IS NULL OR rebuild_estimate_cents >= 0),
  cost_per_sqft_cents   BIGINT CHECK (cost_per_sqft_cents IS NULL OR cost_per_sqft_cents >= 0),
  contents_value_cents  BIGINT CHECK (contents_value_cents IS NULL OR contents_value_cents >= 0),
  valuables             JSONB,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_properties_household ON properties (household_id);

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "properties_via_household" ON properties
  FOR ALL TO authenticated
  USING (
    household_id IN (SELECT id FROM households WHERE owner_id = auth.uid())
  )
  WITH CHECK (
    household_id IN (SELECT id FROM households WHERE owner_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- policies
-- ---------------------------------------------------------------------------

CREATE TABLE policies (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id          UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  policy_type           policy_type NOT NULL,
  role                  policy_role NOT NULL DEFAULT 'hypothetical',
  label                 TEXT NOT NULL CHECK (length(label) <= 80),
  insurer_label         TEXT CHECK (insurer_label IS NULL OR length(insurer_label) <= 200),
  term_months           INTEGER NOT NULL CHECK (term_months IN (1, 3, 6, 12)),
  amount_cents          BIGINT NOT NULL CHECK (amount_cents >= 0),
  amount_basis          amount_basis NOT NULL,
  installments_per_year INTEGER CHECK (installments_per_year IS NULL OR installments_per_year BETWEEN 1 AND 12),
  fees                  JSONB,
  effective_period      JSONB,
  source                policy_source NOT NULL DEFAULT 'entered',
  notes                 TEXT CHECK (notes IS NULL OR length(notes) <= 2000),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_policies_household ON policies (household_id);
CREATE INDEX idx_policies_household_created ON policies (household_id, created_at);

ALTER TABLE policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "policies_via_household" ON policies
  FOR ALL TO authenticated
  USING (
    household_id IN (SELECT id FROM households WHERE owner_id = auth.uid())
  )
  WITH CHECK (
    household_id IN (SELECT id FROM households WHERE owner_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- policy_coverages
-- ---------------------------------------------------------------------------

CREATE TABLE policy_coverages (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id            UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
  coverage_code        TEXT NOT NULL CHECK (length(coverage_code) <= 50),
  included             BOOLEAN,                            -- NULL = not_entered
  limit_primary_cents  BIGINT CHECK (limit_primary_cents IS NULL OR limit_primary_cents >= 0),
  limit_secondary_cents BIGINT CHECK (limit_secondary_cents IS NULL OR limit_secondary_cents >= 0),
  limit_split_raw      TEXT CHECK (limit_split_raw IS NULL OR length(limit_split_raw) <= 50),
  deductible_cents     BIGINT CHECK (deductible_cents IS NULL OR deductible_cents >= 0),
  deductible_pct       NUMERIC(5,2) CHECK (deductible_pct IS NULL OR (deductible_pct >= 0 AND deductible_pct <= 100)),
  deductible_pct_basis deductible_pct_basis,
  valuation_basis      valuation_basis,
  notes                TEXT CHECK (notes IS NULL OR length(notes) <= 2000),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Require basis when both forms set
  CONSTRAINT deductible_basis_required
    CHECK (NOT (deductible_cents IS NOT NULL AND deductible_pct IS NOT NULL) OR deductible_pct_basis IS NOT NULL)
);

CREATE INDEX idx_policy_coverages_policy ON policy_coverages (policy_id);

ALTER TABLE policy_coverages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "policy_coverages_via_policy" ON policy_coverages
  FOR ALL TO authenticated
  USING (
    policy_id IN (
      SELECT p.id FROM policies p
      JOIN households h ON h.id = p.household_id
      WHERE h.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    policy_id IN (
      SELECT p.id FROM policies p
      JOIN households h ON h.id = p.household_id
      WHERE h.owner_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- policy_endorsements
-- ---------------------------------------------------------------------------

CREATE TABLE policy_endorsements (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id  UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
  code       TEXT CHECK (code IS NULL OR length(code) <= 50),
  label      TEXT NOT NULL CHECK (length(label) <= 80),
  notes      TEXT CHECK (notes IS NULL OR length(notes) <= 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_policy_endorsements_policy ON policy_endorsements (policy_id);

ALTER TABLE policy_endorsements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "policy_endorsements_via_policy" ON policy_endorsements
  FOR ALL TO authenticated
  USING (
    policy_id IN (
      SELECT p.id FROM policies p
      JOIN households h ON h.id = p.household_id
      WHERE h.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    policy_id IN (
      SELECT p.id FROM policies p
      JOIN households h ON h.id = p.household_id
      WHERE h.owner_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- policy_limitations
-- ---------------------------------------------------------------------------

CREATE TABLE policy_limitations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id  UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
  text       TEXT NOT NULL CHECK (length(text) <= 2000),
  origin     limitation_origin NOT NULL,
  source_id  TEXT CHECK (source_id IS NULL OR length(source_id) <= 20),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_policy_limitations_policy ON policy_limitations (policy_id);

ALTER TABLE policy_limitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "policy_limitations_via_policy" ON policy_limitations
  FOR ALL TO authenticated
  USING (
    policy_id IN (
      SELECT p.id FROM policies p
      JOIN households h ON h.id = p.household_id
      WHERE h.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    policy_id IN (
      SELECT p.id FROM policies p
      JOIN households h ON h.id = p.household_id
      WHERE h.owner_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- scenarios
-- ---------------------------------------------------------------------------

CREATE TABLE scenarios (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id      UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  kind              scenario_kind NOT NULL,
  name              TEXT NOT NULL CHECK (length(name) <= 80),
  config            JSONB NOT NULL,
  results_snapshot  JSONB,
  engine_version    TEXT NOT NULL CHECK (engine_version ~ '^\d+\.\d+\.\d+$'),
  reference_version TEXT CHECK (reference_version IS NULL OR reference_version ~ '^\d+\.\d+\.\d+$'),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_scenarios_household_created ON scenarios (household_id, created_at);

ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "scenarios_via_household" ON scenarios
  FOR ALL TO authenticated
  USING (
    household_id IN (SELECT id FROM households WHERE owner_id = auth.uid())
  )
  WITH CHECK (
    household_id IN (SELECT id FROM households WHERE owner_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- scenario_policies (join)
-- ---------------------------------------------------------------------------

CREATE TABLE scenario_policies (
  scenario_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  policy_id   UUID NOT NULL REFERENCES policies(id) ON DELETE RESTRICT,
  position    INTEGER NOT NULL CHECK (position >= 0),
  PRIMARY KEY (scenario_id, policy_id)
);

ALTER TABLE scenario_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "scenario_policies_via_scenario" ON scenario_policies
  FOR ALL TO authenticated
  USING (
    scenario_id IN (
      SELECT s.id FROM scenarios s
      JOIN households h ON h.id = s.household_id
      WHERE h.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    scenario_id IN (
      SELECT s.id FROM scenarios s
      JOIN households h ON h.id = s.household_id
      WHERE h.owner_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- review_findings
-- ---------------------------------------------------------------------------

CREATE TABLE review_findings (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id        UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  rule_id             TEXT NOT NULL CHECK (length(rule_id) <= 50),
  status              review_status NOT NULL,
  inputs_used         JSONB,
  message_template_id TEXT CHECK (message_template_id IS NULL OR length(message_template_id) <= 50),
  severity            review_severity,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_review_findings_household_created ON review_findings (household_id, created_at);

ALTER TABLE review_findings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "review_findings_via_household" ON review_findings
  FOR ALL TO authenticated
  USING (
    household_id IN (SELECT id FROM households WHERE owner_id = auth.uid())
  )
  WITH CHECK (
    household_id IN (SELECT id FROM households WHERE owner_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- checklist_progress
-- ---------------------------------------------------------------------------

CREATE TABLE checklist_progress (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  item_id      TEXT NOT NULL CHECK (length(item_id) <= 50),
  state        checklist_state NOT NULL DEFAULT 'todo',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (household_id, item_id)
);

ALTER TABLE checklist_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "checklist_via_household" ON checklist_progress
  FOR ALL TO authenticated
  USING (
    household_id IN (SELECT id FROM households WHERE owner_id = auth.uid())
  )
  WITH CHECK (
    household_id IN (SELECT id FROM households WHERE owner_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- assistant_conversations
-- ---------------------------------------------------------------------------

CREATE TABLE assistant_conversations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scenario_id UUID REFERENCES scenarios(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_assistant_conversations_user ON assistant_conversations (user_id);

ALTER TABLE assistant_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "assistant_conversations_owner" ON assistant_conversations
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- assistant_messages
-- ---------------------------------------------------------------------------

CREATE TABLE assistant_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES assistant_conversations(id) ON DELETE CASCADE,
  role            assistant_role NOT NULL,
  content         TEXT NOT NULL CHECK (length(content) <= 100000),
  cited_fact_ids  TEXT[],
  validation      JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_assistant_messages_conversation ON assistant_messages (conversation_id, created_at);

ALTER TABLE assistant_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "assistant_messages_via_conversation" ON assistant_messages
  FOR ALL TO authenticated
  USING (
    conversation_id IN (
      SELECT id FROM assistant_conversations WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM assistant_conversations WHERE user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- audit_events (append-only; no update or delete by users)
-- ---------------------------------------------------------------------------

CREATE TABLE audit_events (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action    TEXT NOT NULL CHECK (length(action) <= 100),
  entity    TEXT NOT NULL CHECK (length(entity) <= 50),
  entity_id UUID NOT NULL,
  at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_events_user_at ON audit_events (user_id, at);

ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

-- Users may read their own audit log, but cannot write or delete
CREATE POLICY "audit_events_user_select" ON audit_events
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Server-side inserts go through service_role; no client insert policy intentional

-- ---------------------------------------------------------------------------
-- updated_at trigger helper
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'households','vehicles','drivers','properties','policies',
    'policy_coverages','scenarios','checklist_progress'
  ]
  LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at()',
      tbl, tbl
    );
  END LOOP;
END $$;
