-- ============================================================
-- SkillUp — Test Seed Data  (002)
-- ============================================================

-- Step 1: Auth users (uses jsonb_build_object to avoid newline issues)
INSERT INTO auth.users (
  id, email, encrypted_password, email_confirmed_at,
  raw_user_meta_data, created_at, updated_at, aud, role
)
SELECT
  id::uuid,
  email,
  crypt('password123', gen_salt('bf')),
  now(),
  jsonb_build_object('full_name', full_name, 'phone', phone),
  now(), now(),
  'authenticated', 'authenticated'
FROM (VALUES
  ('a1000000-0000-0000-0000-000000000001','thabo.dlamini@test.skillup','Thabo Dlamini','+27821234001'),
  ('a1000000-0000-0000-0000-000000000002','priya.naidoo@test.skillup','Priya Naidoo','+27821234002'),
  ('a1000000-0000-0000-0000-000000000003','sipho.mokoena@test.skillup','Sipho Mokoena','+27821234003'),
  ('a1000000-0000-0000-0000-000000000004','aisha.fortune@test.skillup','Aisha Fortune','+27821234004'),
  ('a1000000-0000-0000-0000-000000000005','mark.williams@test.skillup','Mark Williams','+27821234005'),
  ('a1000000-0000-0000-0000-000000000006','fatima.ismail@test.skillup','Fatima Ismail','+27821234006'),
  ('a1000000-0000-0000-0000-000000000007','lebo.sithole@test.skillup','Lebo Sithole','+27821234007'),
  ('a1000000-0000-0000-0000-000000000008','james.duplessis@test.skillup','James du Plessis','+27821234008')
) AS t(id, email, full_name, phone)
ON CONFLICT (id) DO NOTHING;

-- Step 2: Profiles
INSERT INTO profiles (id, full_name, phone, role)
SELECT id::uuid, full_name, phone, 'provider'
FROM (VALUES
  ('a1000000-0000-0000-0000-000000000001','Thabo Dlamini','+27821234001'),
  ('a1000000-0000-0000-0000-000000000002','Priya Naidoo','+27821234002'),
  ('a1000000-0000-0000-0000-000000000003','Sipho Mokoena','+27821234003'),
  ('a1000000-0000-0000-0000-000000000004','Aisha Fortune','+27821234004'),
  ('a1000000-0000-0000-0000-000000000005','Mark Williams','+27821234005'),
  ('a1000000-0000-0000-0000-000000000006','Fatima Ismail','+27821234006'),
  ('a1000000-0000-0000-0000-000000000007','Lebo Sithole','+27821234007'),
  ('a1000000-0000-0000-0000-000000000008','James du Plessis','+27821234008')
) AS t(id, full_name, phone)
ON CONFLICT (id) DO UPDATE
  SET full_name = EXCLUDED.full_name,
      phone     = EXCLUDED.phone,
      role      = EXCLUDED.role;

-- Step 3: Providers with Johannesburg GPS coordinates
INSERT INTO providers (id, user_id, bio, category, years_experience, is_available, avg_rating, total_jobs, avg_response_minutes, location, area_name)
SELECT
  id::uuid, user_id::uuid, bio, category::text,
  years_exp, available, rating, jobs, response_min,
  ST_SetSRID(ST_MakePoint(lng, lat), 4326),
  area
FROM (VALUES
  ('b1000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001',
   'Master plumber with 12 years experience. Leak repairs, geyser installations, burst pipe emergencies. Available 7 days a week.',
   'Trades',12,true,4.80,143,15, 28.0473,-26.2041,'Sandton'),
  ('b1000000-0000-0000-0000-000000000002','a1000000-0000-0000-0000-000000000002',
   'Qualified hair and beauty therapist. Braids, locs, relaxers, and full makeovers. Home visits available.',
   'Beauty',7,true,4.95,312,10, 28.0320,-26.1929,'Randburg'),
  ('b1000000-0000-0000-0000-000000000003','a1000000-0000-0000-0000-000000000003',
   'Certified electrician. DB board upgrades, fault finding, new installations, and COC certificates.',
   'Trades',9,true,4.70,98,20, 28.0603,-26.1867,'Fourways'),
  ('b1000000-0000-0000-0000-000000000004','a1000000-0000-0000-0000-000000000004',
   'Professional deep-cleaning and domestic services. Offices, homes, post-construction cleans. Eco-friendly products.',
   'Cleaning',5,true,4.60,227,25, 28.0557,-26.2198,'Rosebank'),
  ('b1000000-0000-0000-0000-000000000005','a1000000-0000-0000-0000-000000000005',
   'IT support and laptop/PC repairs. Windows, Mac, networking, CCTV setup, and smart home installation.',
   'Tech',6,true,4.85,189,12, 28.0167,-26.2309,'Melville'),
  ('b1000000-0000-0000-0000-000000000006','a1000000-0000-0000-0000-000000000006',
   'Experienced Maths and Science tutor. Grades 8-12 and first-year university. Proven track record.',
   'Education',10,false,4.90,411,5, 28.0742,-26.1712,'Midrand'),
  ('b1000000-0000-0000-0000-000000000007','a1000000-0000-0000-0000-000000000007',
   'Garden services: lawn mowing, tree felling, pruning, paving, and full garden makeovers.',
   'Garden',8,true,4.55,176,30, 27.9951,-26.1652,'Roodepoort'),
  ('b1000000-0000-0000-0000-000000000008','a1000000-0000-0000-0000-000000000008',
   'Panel beating, spray painting, and automotive repairs. Quality workmanship. Most insurers accepted.',
   'Automotive',15,true,4.75,302,20, 28.0891,-26.2156,'Edenvale')
) AS t(id, user_id, bio, category, years_exp, available, rating, jobs, response_min, lng, lat, area)
ON CONFLICT (id) DO NOTHING;

-- Step 4: Services
INSERT INTO services (provider_id, name, price_from, price_label)
SELECT provider_id::uuid, name, price, label
FROM (VALUES
  ('b1000000-0000-0000-0000-000000000001','Leak detection & repair',350,'From R350'),
  ('b1000000-0000-0000-0000-000000000001','Geyser installation',1800,'From R1 800'),
  ('b1000000-0000-0000-0000-000000000001','Burst pipe emergency',500,'From R500'),
  ('b1000000-0000-0000-0000-000000000001','Toilet / tap replacement',250,'From R250'),
  ('b1000000-0000-0000-0000-000000000002','Box braids (full head)',800,'From R800'),
  ('b1000000-0000-0000-0000-000000000002','Hair relaxer & style',450,'From R450'),
  ('b1000000-0000-0000-0000-000000000002','Full makeover & makeup',650,'From R650'),
  ('b1000000-0000-0000-0000-000000000002','Locs installation',1200,'From R1 200'),
  ('b1000000-0000-0000-0000-000000000003','DB board upgrade',2500,'From R2 500'),
  ('b1000000-0000-0000-0000-000000000003','Fault finding',400,'From R400'),
  ('b1000000-0000-0000-0000-000000000003','COC certificate',1500,'From R1 500'),
  ('b1000000-0000-0000-0000-000000000003','New plug/light points',350,'From R350 each'),
  ('b1000000-0000-0000-0000-000000000004','Full house deep clean',950,'From R950'),
  ('b1000000-0000-0000-0000-000000000004','Office cleaning (monthly)',1200,'From R1 200/month'),
  ('b1000000-0000-0000-0000-000000000004','Post-construction clean',1500,'From R1 500'),
  ('b1000000-0000-0000-0000-000000000004','Move-in/move-out clean',800,'From R800'),
  ('b1000000-0000-0000-0000-000000000005','Laptop/PC repair',350,'From R350'),
  ('b1000000-0000-0000-0000-000000000005','Network setup & WiFi',600,'From R600'),
  ('b1000000-0000-0000-0000-000000000005','CCTV installation (4 cam)',3500,'From R3 500'),
  ('b1000000-0000-0000-0000-000000000005','Virus removal & tune-up',250,'From R250'),
  ('b1000000-0000-0000-0000-000000000006','Maths tutoring (Gr 8-12)',200,'R200/hour'),
  ('b1000000-0000-0000-0000-000000000006','Science tutoring',200,'R200/hour'),
  ('b1000000-0000-0000-0000-000000000006','Exam prep crash course',800,'R800 / 4 sessions'),
  ('b1000000-0000-0000-0000-000000000007','Lawn mowing (std plot)',350,'From R350'),
  ('b1000000-0000-0000-0000-000000000007','Tree felling & removal',1500,'From R1 500'),
  ('b1000000-0000-0000-0000-000000000007','Garden makeover',3000,'From R3 000'),
  ('b1000000-0000-0000-0000-000000000007','Hedge trimming',280,'From R280'),
  ('b1000000-0000-0000-0000-000000000008','Panel beating (per panel)',800,'From R800/panel'),
  ('b1000000-0000-0000-0000-000000000008','Full respray',8000,'From R8 000'),
  ('b1000000-0000-0000-0000-000000000008','Bumper repair',1200,'From R1 200'),
  ('b1000000-0000-0000-0000-000000000008','Windscreen replacement',1500,'From R1 500')
) AS t(provider_id, name, price, label)
ON CONFLICT DO NOTHING;

-- Step 5: Reviews
INSERT INTO reviews (reviewer_id, provider_id, rating, comment)
SELECT reviewer_id::uuid, provider_id::uuid, rating, comment
FROM (VALUES
  ('a1000000-0000-0000-0000-000000000002','b1000000-0000-0000-0000-000000000001',5,'Fixed our burst pipe in under an hour. Incredible service!'),
  ('a1000000-0000-0000-0000-000000000004','b1000000-0000-0000-0000-000000000001',5,'Professional, clean, and fair pricing. Will use again.'),
  ('a1000000-0000-0000-0000-000000000005','b1000000-0000-0000-0000-000000000001',4,'Good work on the geyser install. Came on time.'),
  ('a1000000-0000-0000-0000-000000000001','b1000000-0000-0000-0000-000000000002',5,'My braids look absolutely stunning. Priya is so talented!'),
  ('a1000000-0000-0000-0000-000000000003','b1000000-0000-0000-0000-000000000002',5,'Best braider in Jozi. Gentle hands and great conversation.'),
  ('a1000000-0000-0000-0000-000000000006','b1000000-0000-0000-0000-000000000002',5,'Did a full makeover for my wedding. Looked like a queen!'),
  ('a1000000-0000-0000-0000-000000000001','b1000000-0000-0000-0000-000000000005',5,'Fixed my laptop same day. Honest pricing and explained everything.'),
  ('a1000000-0000-0000-0000-000000000003','b1000000-0000-0000-0000-000000000005',5,'Set up our whole office network. Super professional.')
) AS t(reviewer_id, provider_id, rating, comment)
ON CONFLICT DO NOTHING;
