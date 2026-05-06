CREATE TABLE IF NOT EXISTS requests (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  user_prompt TEXT NOT NULL,
  data_context_json TEXT,
  ai_code TEXT,
  ai_explanation TEXT,
  edited_code TEXT,
  status TEXT CHECK(status IN ('pending','edited','approved','executed','completed','failed','rejected')),
  execution_result_json TEXT,
  error_message TEXT,
  execution_time_ms INTEGER
);

CREATE INDEX IF NOT EXISTS idx_requests_created ON requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_requests_status  ON requests(status);
