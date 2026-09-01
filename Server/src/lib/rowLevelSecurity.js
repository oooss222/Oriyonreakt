async function setupRowLevelSecurity(query) {
  await query(`
    CREATE SCHEMA IF NOT EXISTS app;

    CREATE OR REPLACE FUNCTION app.current_user_id() RETURNS uuid AS $$
      SELECT NULLIF(current_setting('app.user_id', true), '')::uuid;
    $$ LANGUAGE sql STABLE;

    CREATE OR REPLACE FUNCTION app.current_role() RETURNS text AS $$
      SELECT COALESCE(NULLIF(current_setting('app.role', true), ''), 'anon');
    $$ LANGUAGE sql STABLE;

    CREATE OR REPLACE FUNCTION app.is_system() RETURNS boolean AS $$
      SELECT app.current_role() = 'system';
    $$ LANGUAGE sql STABLE;

    CREATE OR REPLACE FUNCTION app.is_staff() RETURNS boolean AS $$
      SELECT app.current_role() IN (
        'moderator', 'accountant', 'admin', 'super_admin', 'system'
      );
    $$ LANGUAGE sql STABLE;

    CREATE OR REPLACE FUNCTION app.is_admin() RETURNS boolean AS $$
      SELECT app.current_role() IN ('admin', 'super_admin', 'system');
    $$ LANGUAGE sql STABLE;
  `);

  const tables = [
    "users",
    "listings",
    "favorites",
    "messages",
    "wallet_transactions",
    "payment_orders",
    "saved_searches",
    "seller_reviews",
    "listing_reports",
    "admin_audit_log",
    "site_settings",
    "user_events",
    "phone_otps",
    "ad_campaigns",
    "re_developments",
    "chat_thread_settings",
    "user_chat_blocks",
    "user_compare_lists",
    "listing_drafts",
  ];

  for (const table of tables) {
    await query(
      `ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`
    );
    await query(
      `ALTER TABLE ${table} FORCE ROW LEVEL SECURITY`
    );
  }

  await query(`
    DROP POLICY IF EXISTS users_select ON users;
    CREATE POLICY users_select ON users FOR SELECT USING (
      app.is_system()
      OR app.is_staff()
      OR id = app.current_user_id()
      OR EXISTS (
        SELECT 1 FROM listings l
        WHERE l.owner = users.id
          AND l.status IN ('approved', 'sold')
      )
      OR EXISTS (
        SELECT 1 FROM messages m
        WHERE (m.sender_id = app.current_user_id() AND m.receiver_id = users.id)
           OR (m.receiver_id = app.current_user_id() AND m.sender_id = users.id)
      )
      OR EXISTS (
        SELECT 1 FROM seller_reviews sr
        WHERE sr.seller_id = users.id OR sr.reviewer_id = users.id
      )
    );

    DROP POLICY IF EXISTS users_insert ON users;
    CREATE POLICY users_insert ON users FOR INSERT WITH CHECK (
      app.is_system() OR app.is_staff()
    );

    DROP POLICY IF EXISTS users_update ON users;
    CREATE POLICY users_update ON users FOR UPDATE USING (
      app.is_system()
      OR app.is_staff()
      OR id = app.current_user_id()
    ) WITH CHECK (
      app.is_system()
      OR app.is_staff()
      OR id = app.current_user_id()
    );

    DROP POLICY IF EXISTS users_delete ON users;
    CREATE POLICY users_delete ON users FOR DELETE USING (
      app.is_system() OR app.is_admin()
    );

    DROP POLICY IF EXISTS listings_select ON listings;
    CREATE POLICY listings_select ON listings FOR SELECT USING (
      status = 'approved'
      OR owner = app.current_user_id()
      OR app.is_staff()
      OR app.is_system()
    );

    DROP POLICY IF EXISTS listings_insert ON listings;
    CREATE POLICY listings_insert ON listings FOR INSERT WITH CHECK (
      app.is_system()
      OR app.is_staff()
      OR owner = app.current_user_id()
    );

    DROP POLICY IF EXISTS listings_update ON listings;
    CREATE POLICY listings_update ON listings FOR UPDATE USING (
      app.is_system()
      OR app.is_staff()
      OR owner = app.current_user_id()
    ) WITH CHECK (
      app.is_system()
      OR app.is_staff()
      OR owner = app.current_user_id()
    );

    DROP POLICY IF EXISTS listings_delete ON listings;
    CREATE POLICY listings_delete ON listings FOR DELETE USING (
      app.is_system()
      OR app.is_staff()
      OR owner = app.current_user_id()
    );

    DROP POLICY IF EXISTS favorites_all ON favorites;
    CREATE POLICY favorites_all ON favorites FOR ALL USING (
      app.is_system()
      OR app.is_staff()
      OR user_id = app.current_user_id()
    ) WITH CHECK (
      app.is_system()
      OR app.is_staff()
      OR user_id = app.current_user_id()
    );

    DROP POLICY IF EXISTS messages_select ON messages;
    CREATE POLICY messages_select ON messages FOR SELECT USING (
      app.is_system()
      OR app.is_staff()
      OR sender_id = app.current_user_id()
      OR receiver_id = app.current_user_id()
    );

    DROP POLICY IF EXISTS messages_insert ON messages;
    CREATE POLICY messages_insert ON messages FOR INSERT WITH CHECK (
      app.is_system()
      OR app.is_staff()
      OR sender_id = app.current_user_id()
    );

    DROP POLICY IF EXISTS messages_update ON messages;
    CREATE POLICY messages_update ON messages FOR UPDATE USING (
      app.is_system()
      OR app.is_staff()
      OR sender_id = app.current_user_id()
      OR receiver_id = app.current_user_id()
    ) WITH CHECK (
      app.is_system()
      OR app.is_staff()
      OR sender_id = app.current_user_id()
      OR receiver_id = app.current_user_id()
    );

    DROP POLICY IF EXISTS messages_delete ON messages;
    CREATE POLICY messages_delete ON messages FOR DELETE USING (
      app.is_system() OR app.is_admin()
    );

    DROP POLICY IF EXISTS wallet_transactions_select ON wallet_transactions;
    CREATE POLICY wallet_transactions_select ON wallet_transactions FOR SELECT USING (
      app.is_system()
      OR app.is_staff()
      OR user_id = app.current_user_id()
    );

    DROP POLICY IF EXISTS wallet_transactions_insert ON wallet_transactions;
    CREATE POLICY wallet_transactions_insert ON wallet_transactions FOR INSERT WITH CHECK (
      app.is_system() OR app.is_staff()
    );

    DROP POLICY IF EXISTS wallet_transactions_update ON wallet_transactions;
    CREATE POLICY wallet_transactions_update ON wallet_transactions FOR UPDATE USING (
      app.is_system() OR app.is_staff()
    ) WITH CHECK (
      app.is_system() OR app.is_staff()
    );

    DROP POLICY IF EXISTS payment_orders_select ON payment_orders;
    CREATE POLICY payment_orders_select ON payment_orders FOR SELECT USING (
      app.is_system()
      OR app.is_staff()
      OR user_id = app.current_user_id()
    );

    DROP POLICY IF EXISTS payment_orders_insert ON payment_orders;
    CREATE POLICY payment_orders_insert ON payment_orders FOR INSERT WITH CHECK (
      app.is_system()
      OR app.is_staff()
      OR user_id = app.current_user_id()
    );

    DROP POLICY IF EXISTS payment_orders_update ON payment_orders;
    CREATE POLICY payment_orders_update ON payment_orders FOR UPDATE USING (
      app.is_system() OR app.is_staff()
    ) WITH CHECK (
      app.is_system() OR app.is_staff()
    );

    DROP POLICY IF EXISTS saved_searches_all ON saved_searches;
    CREATE POLICY saved_searches_all ON saved_searches FOR ALL USING (
      app.is_system()
      OR app.is_staff()
      OR user_id = app.current_user_id()
    ) WITH CHECK (
      app.is_system()
      OR app.is_staff()
      OR user_id = app.current_user_id()
    );

    DROP POLICY IF EXISTS seller_reviews_select ON seller_reviews;
    CREATE POLICY seller_reviews_select ON seller_reviews FOR SELECT USING (true);

    DROP POLICY IF EXISTS seller_reviews_insert ON seller_reviews;
    CREATE POLICY seller_reviews_insert ON seller_reviews FOR INSERT WITH CHECK (
      app.is_system()
      OR app.is_staff()
      OR reviewer_id = app.current_user_id()
    );

    DROP POLICY IF EXISTS seller_reviews_update ON seller_reviews;
    CREATE POLICY seller_reviews_update ON seller_reviews FOR UPDATE USING (
      app.is_system() OR app.is_staff()
    ) WITH CHECK (
      app.is_system() OR app.is_staff()
    );

    DROP POLICY IF EXISTS seller_reviews_delete ON seller_reviews;
    CREATE POLICY seller_reviews_delete ON seller_reviews FOR DELETE USING (
      app.is_system() OR app.is_admin()
    );

    DROP POLICY IF EXISTS listing_reports_select ON listing_reports;
    CREATE POLICY listing_reports_select ON listing_reports FOR SELECT USING (
      app.is_system()
      OR app.is_staff()
      OR reporter_id = app.current_user_id()
    );

    DROP POLICY IF EXISTS listing_reports_insert ON listing_reports;
    CREATE POLICY listing_reports_insert ON listing_reports FOR INSERT WITH CHECK (
      app.is_system()
      OR app.is_staff()
      OR reporter_id = app.current_user_id()
    );

    DROP POLICY IF EXISTS listing_reports_update ON listing_reports;
    CREATE POLICY listing_reports_update ON listing_reports FOR UPDATE USING (
      app.is_system() OR app.is_staff()
    ) WITH CHECK (
      app.is_system() OR app.is_staff()
    );

    DROP POLICY IF EXISTS admin_audit_log_all ON admin_audit_log;
    CREATE POLICY admin_audit_log_all ON admin_audit_log FOR ALL USING (
      app.is_system() OR app.is_staff()
    ) WITH CHECK (
      app.is_system() OR app.is_staff()
    );

    DROP POLICY IF EXISTS site_settings_select ON site_settings;
    CREATE POLICY site_settings_select ON site_settings FOR SELECT USING (true);

    DROP POLICY IF EXISTS site_settings_insert ON site_settings;
    CREATE POLICY site_settings_insert ON site_settings FOR INSERT WITH CHECK (
      app.is_system() OR app.is_admin()
    );

    DROP POLICY IF EXISTS site_settings_update ON site_settings;
    CREATE POLICY site_settings_update ON site_settings FOR UPDATE USING (
      app.is_system() OR app.is_admin()
    ) WITH CHECK (
      app.is_system() OR app.is_admin()
    );

    DROP POLICY IF EXISTS user_events_insert ON user_events;
    CREATE POLICY user_events_insert ON user_events FOR INSERT WITH CHECK (true);

    DROP POLICY IF EXISTS user_events_select ON user_events;
    CREATE POLICY user_events_select ON user_events FOR SELECT USING (
      app.is_system() OR app.is_staff()
    );

    DROP POLICY IF EXISTS phone_otps_all ON phone_otps;
    CREATE POLICY phone_otps_all ON phone_otps FOR ALL USING (
      app.is_system()
    ) WITH CHECK (
      app.is_system()
    );

    DROP POLICY IF EXISTS ad_campaigns_select ON ad_campaigns;
    CREATE POLICY ad_campaigns_select ON ad_campaigns FOR SELECT USING (
      app.is_staff()
      OR app.is_system()
      OR (
        active = true
        AND (starts_at IS NULL OR starts_at <= now())
        AND (ends_at IS NULL OR ends_at >= now())
      )
    );

    DROP POLICY IF EXISTS ad_campaigns_modify ON ad_campaigns;
    CREATE POLICY ad_campaigns_modify ON ad_campaigns FOR ALL USING (
      app.is_system() OR app.is_staff()
    ) WITH CHECK (
      app.is_system() OR app.is_staff()
    );

    DROP POLICY IF EXISTS re_developments_select ON re_developments;
    CREATE POLICY re_developments_select ON re_developments FOR SELECT USING (true);

    DROP POLICY IF EXISTS re_developments_modify ON re_developments;
    CREATE POLICY re_developments_modify ON re_developments FOR ALL USING (
      app.is_system() OR app.is_staff()
    ) WITH CHECK (
      app.is_system() OR app.is_staff()
    );

    DROP POLICY IF EXISTS chat_thread_settings_all ON chat_thread_settings;
    CREATE POLICY chat_thread_settings_all ON chat_thread_settings FOR ALL USING (
      app.is_system() OR user_id = app.current_user_id()
    ) WITH CHECK (
      app.is_system() OR user_id = app.current_user_id()
    );

    DROP POLICY IF EXISTS user_chat_blocks_all ON user_chat_blocks;
    CREATE POLICY user_chat_blocks_all ON user_chat_blocks FOR ALL USING (
      app.is_system()
      OR blocker_id = app.current_user_id()
      OR blocked_id = app.current_user_id()
    ) WITH CHECK (
      app.is_system() OR blocker_id = app.current_user_id()
    );

    DROP POLICY IF EXISTS user_compare_lists_all ON user_compare_lists;
    CREATE POLICY user_compare_lists_all ON user_compare_lists FOR ALL USING (
      app.is_system() OR user_id = app.current_user_id()
    ) WITH CHECK (
      app.is_system() OR user_id = app.current_user_id()
    );

    DROP POLICY IF EXISTS listing_drafts_all ON listing_drafts;
    CREATE POLICY listing_drafts_all ON listing_drafts FOR ALL USING (
      app.is_system() OR user_id = app.current_user_id()
    ) WITH CHECK (
      app.is_system() OR user_id = app.current_user_id()
    );
  `);

  console.log("Row Level Security policies applied");
}

module.exports = {
  setupRowLevelSecurity,
};
