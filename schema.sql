CREATE TABLE IF NOT EXISTS rate_limit(key TEXT PRIMARY KEY,count INTEGER NOT NULL,window_start INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS subscriber(id INTEGER PRIMARY KEY AUTOINCREMENT,email TEXT UNIQUE NOT NULL,topic TEXT NOT NULL,token_hash TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT(datetime('now')));

-- 구독자 표와 독립된 발행 기록. 원문 전체와 외부 계정 비밀은 저장하지 않는다.
CREATE TABLE IF NOT EXISTS editorial_run (
  id TEXT PRIMARY KEY, run_key TEXT UNIQUE NOT NULL, kind TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'collecting', target INTEGER NOT NULL CHECK(target BETWEEN 2 AND 10),
  created_at TEXT NOT NULL, finished_at TEXT, message TEXT NOT NULL DEFAULT '', published_count INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS source_result (
  run_id TEXT NOT NULL REFERENCES editorial_run(id), source_id TEXT NOT NULL,
  state TEXT NOT NULL, found INTEGER NOT NULL DEFAULT 0, accepted INTEGER NOT NULL DEFAULT 0,
  message TEXT NOT NULL DEFAULT '', lease_until INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (run_id, source_id)
);
CREATE TABLE IF NOT EXISTS editorial_candidate (
  id TEXT PRIMARY KEY, run_id TEXT NOT NULL REFERENCES editorial_run(id), source_id TEXT NOT NULL,
  url TEXT NOT NULL, url_hash TEXT NOT NULL, title_hash TEXT NOT NULL,
  original_title TEXT NOT NULL, original_date TEXT NOT NULL, date_label TEXT NOT NULL,
  topic TEXT NOT NULL, score INTEGER NOT NULL, state TEXT NOT NULL DEFAULT 'candidate',
  reason TEXT NOT NULL DEFAULT '', selected INTEGER NOT NULL DEFAULT 0,
  lease_until INTEGER NOT NULL DEFAULT 0, draft_json TEXT, evidence_json TEXT,
  UNIQUE(run_id, url_hash)
);
CREATE INDEX IF NOT EXISTS candidate_run ON editorial_candidate(run_id, selected, score DESC);
CREATE TABLE IF NOT EXISTS publication (
  id INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT UNIQUE NOT NULL,
  run_id TEXT NOT NULL REFERENCES editorial_run(id), source_id TEXT NOT NULL,
  url_hash TEXT UNIQUE NOT NULL, title_hash TEXT UNIQUE NOT NULL,
  topic TEXT NOT NULL, issue_json TEXT NOT NULL, published_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS publication_date ON publication(published_at DESC, id DESC);
