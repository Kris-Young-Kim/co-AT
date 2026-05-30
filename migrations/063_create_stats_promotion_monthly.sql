-- Monthly media analytics for Sheet 4-1 (매체 운영 기록지)
-- Three sections: SNS post counts, homepage analytics, Instagram analytics

CREATE TABLE IF NOT EXISTS stats_promotion_monthly (
  id          uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  year        integer NOT NULL,
  month       integer NOT NULL CHECK (month BETWEEN 1 AND 12),

  -- SNS monthly post counts
  homepage_posts   integer,
  facebook_posts   integer,
  kakao_posts      integer,
  instagram_posts  integer,
  blog_posts       integer,

  -- Homepage analytics
  hp_notice         integer,
  hp_gallery        integer,
  hp_gov_support    integer,
  hp_online_inquiry integer,
  hp_visitor_total  integer,
  hp_daily_avg      numeric(10,1),
  hp_monthly_avg    numeric(10,1),
  hp_visitor_ratio  numeric(5,1),

  -- Instagram analytics
  ig_story              integer,
  ig_post               integer,
  ig_online_inquiry     integer,
  ig_follower_ratio     numeric(5,1),
  ig_non_follower_ratio numeric(5,1),
  ig_total_views        integer,
  ig_top_post           text,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  UNIQUE (year, month)
);

ALTER TABLE stats_promotion_monthly ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff can manage promotion monthly"
  ON stats_promotion_monthly FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

COMMENT ON TABLE stats_promotion_monthly IS '월별 매체 운영 기록 (Sheet 4-1)';
