CREATE TABLE IF NOT EXISTS requests (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  user_prompt TEXT NOT NULL,
  data_context_json TEXT,
  ai_code TEXT,
  ai_explanation TEXT,
  edited_code TEXT,
  was_edited BOOLEAN DEFAULT 0,
  status TEXT CHECK(status IN ('pending','edited','approved','executing','executed','completed','failed','rejected')),
  execution_result_json TEXT,
  error_message TEXT,
  execution_time_ms INTEGER
);

CREATE INDEX IF NOT EXISTS idx_requests_created ON requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_requests_status  ON requests(status);

CREATE TABLE IF NOT EXISTS saved_charts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  figure_base64 TEXT NOT NULL,
  prompt TEXT NOT NULL,
  created_at TEXT NOT NULL,
  request_id TEXT,
  FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_saved_charts_created ON saved_charts(created_at DESC);
