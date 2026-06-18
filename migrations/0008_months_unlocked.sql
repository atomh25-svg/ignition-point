-- Number of 30-day months unlocked for this subscription.
-- Default 1 = the 30 days every paid user gets at signup.
-- Each invoice.payment_succeeded with billing_reason='subscription_cycle'
-- (a renewal, NOT the first invoice) bumps this by 1, which gates
-- another 30 days of blueprint content for the user's selected idea.
ALTER TABLE subscriptions ADD COLUMN months_unlocked INTEGER NOT NULL DEFAULT 1;
