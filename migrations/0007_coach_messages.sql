-- AI Founder Coach chat history. One row per message, ordered by
-- created_at. The coach uses the user's selected idea + blueprint as
-- conversation context, and remembers the chat across sessions.
--
-- role: 'user' or 'assistant'. We don't store 'system' rows — the
-- system prompt is rebuilt every turn from the user's idea + blueprint.
--
-- Reset semantics: when a user switches idea (via selectIdea swap),
-- application code wipes their old chat so the coach doesn't keep
-- referencing the previous idea's context.
CREATE TABLE coach_messages (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  clerk_user_id  TEXT    NOT NULL,
  role           TEXT    NOT NULL CHECK (role IN ('user', 'assistant')),
  content        TEXT    NOT NULL,
  created_at     INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX coach_messages_user_created
  ON coach_messages (clerk_user_id, created_at);
