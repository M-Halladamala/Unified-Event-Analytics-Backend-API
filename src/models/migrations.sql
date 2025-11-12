-- Create apps table
CREATE TABLE IF NOT EXISTS apps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    owner_email TEXT NOT NULL,
    api_key_hash TEXT NOT NULL UNIQUE,
    revoked BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create events table
CREATE TABLE IF NOT EXISTS events (
    id BIGSERIAL PRIMARY KEY,
    app_id UUID NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
    event TEXT NOT NULL,
    url TEXT,
    referrer TEXT,
    device TEXT,
    ip_address TEXT,
    timestamp TIMESTAMP NOT NULL,
    metadata JSONB,
    user_id TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_app_event_timestamp ON events(app_id, event, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_apps_api_key_hash ON apps(api_key_hash);
