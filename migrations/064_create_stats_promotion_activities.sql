-- Individual promotion activity records for Sheet 4 (홍보)
-- Each row = one promotion activity (flyer, event, SNS channel, etc.)

CREATE TABLE IF NOT EXISTS stats_promotion_activities (
  id          uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  year        integer NOT NULL,
  activity_date date,
  content     text    NOT NULL,
  total_count integer DEFAULT 1,

  -- 홍보물 (promotional materials)
  promo_material_type  text,
  promo_material_count integer,

  -- 매체홍보 (media promotion)
  media_type  text,
  media_count integer,

  -- 행사 (events)
  event_type      text,
  event_count     integer,
  event_attendees integer,

  -- 기타 (other)
  other_type  text,
  other_count integer,
  other_times integer,

  notes      text,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE stats_promotion_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff can manage promotion activities"
  ON stats_promotion_activities FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

COMMENT ON TABLE stats_promotion_activities IS '개별 홍보 활동 기록 (Sheet 4)';
