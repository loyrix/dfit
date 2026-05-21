-- 20260521112845_add_profile_health_targets.up.sql
create table profile_health_targets (
  profile_id uuid primary key references profiles(id) on delete cascade,
  height_cm numeric(5,2) not null check (height_cm between 90 and 250),
  weight_kg numeric(5,2) not null check (weight_kg between 25 and 300),
  age_years integer not null check (age_years between 18 and 90),
  sex text not null check (sex in ('female', 'male', 'not_specified')),
  activity_level text not null check (
    activity_level in ('sedentary', 'light', 'moderate', 'active')
  ),
  goal text not null check (goal in ('maintain', 'lose_gently', 'gain_gently')),
  bmi numeric(5,2) not null check (bmi > 0),
  bmi_category text not null check (
    bmi_category in ('underweight', 'healthy', 'overweight', 'obese')
  ),
  bmr_calories integer not null check (bmr_calories > 0),
  daily_calorie_target integer not null check (daily_calorie_target > 0),
  formula text not null default 'mifflin_st_jeor_v1',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
