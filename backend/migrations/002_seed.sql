-- Migration 002: Seed data (MySQL)

INSERT IGNORE INTO users (id, name, email, password_hash, role, status) VALUES
  (1, 'Super Admin', 'admin@police.gov.kh',  'admin123',  'superAdmin', 'active'),
  (2, 'Editor',      'editor@police.gov.kh', 'editor123', 'editor',     'active'),
  (3, 'Admin User',  'admin2@police.gov.kh', 'admin123',  'admin',      'active');

INSERT IGNORE INTO categories (id, name, name_kh, slug) VALUES
  (1, 'General News',  'ព័ត៌មានទូទៅ',       'general'),
  (2, 'Public Safety', 'សុវត្ថិភាពសាធារណៈ', 'safety'),
  (3, 'Crime',         'ឧក្រិដ្ឋកម្ម',       'crime'),
  (4, 'Traffic',       'ចរាចរណ៍',            'traffic'),
  (5, 'Announcement',  'ការប្រកាស',           'announcement'),
  (6, 'Community',     'សហគមន៍',             'community');

INSERT IGNORE INTO menus (id, name, name_kh, slug, order_num, active) VALUES
  (1, 'Home',          'ទំព័រដើម',      'home',          1, 1),
  (2, 'News',          'ព័ត៌មាន',        'news',          2, 1),
  (3, 'Safety',        'សុវត្ថិភាព',     'safety',        3, 1),
  (4, 'Services',      'សេវាកម្ម',       'services',      4, 1),
  (5, 'Contact',       'ទំនាក់ទំនង',     'contact',       5, 1),
  (6, 'Announcements', 'ការប្រកាស',      'announcements', 6, 1);

INSERT IGNORE INTO tags (id, name, slug) VALUES
  (1,  'Security',   'security'),
  (2,  'Police',     'police'),
  (3,  'Traffic',    'traffic'),
  (4,  'Crime',      'crime'),
  (5,  'Community',  'community'),
  (6,  'Announcement','announcement'),
  (7,  'Cybercrime', 'cybercrime'),
  (8,  'Border',     'border'),
  (9,  'Drugs',      'drugs'),
  (10, 'Road Safety','road-safety');

INSERT IGNORE INTO sliders (id, title, title_kh, image, link, order_num, active) VALUES
  (1, 'National Police Campaign',  'យុទ្ធនាការនគរបាលជាតិ',            'https://picsum.photos/seed/slider1/1200/500', '/', 1, 1),
  (2, 'Road Safety Week',          'សប្តាហ៍សុវត្ថិភាពចរាចរណ៍',         'https://picsum.photos/seed/slider2/1200/500', '/', 2, 1),
  (3, 'Community Policing',        'នគរបាលសហគមន៍',                     'https://picsum.photos/seed/slider3/1200/500', '/', 3, 1),
  (4, 'Cyber Crime Alert',         'ការព្រមានឧក្រិដ្ឋកម្មតាមអ៊ីនធឺណិត', 'https://picsum.photos/seed/slider4/1200/500', '/', 4, 1);

INSERT IGNORE INTO settings (`key`, value) VALUES
  ('site_name',       'នគរបាលជាតិ'),
  ('site_name_en',    'Cambodia National Police'),
  ('site_description','ព័ត៌មានផ្លូវការរបស់នគរបាលជាតិ'),
  ('contact_email',   'info@police.gov.kh'),
  ('contact_phone',   '117'),
  ('hotline',         '117'),
  ('facebook_url',    'https://facebook.com'),
  ('telegram_url',    'https://t.me'),
  ('logo_url',        '/uploads/settings/logo.png'),
  ('address_kh',      'ភ្នំពេញ, ព្រះរាជាណាចក្រកម្ពុជា'),
  ('address_en',      'Phnom Penh, Kingdom of Cambodia'),
  ('copyright_kh',    'រក្សាសិទ្ធិ © នគរបាលជាតិ'),
  ('copyright_en',    'Cambodia National Police. All rights reserved.');

INSERT IGNORE INTO articles
  (id, title, title_kh, excerpt, excerpt_kh, content, content_kh, image, category_id, menu_id, author, status, featured, breaking, views, published_at)
VALUES
(1,
 'Police Strengthen Border Security',
 'នគរបាលបង្កើនសុវត្ថិភាពព្រំដែន',
 'National Police have increased patrols along the border to combat smuggling.',
 'នគរបាលជាតិបានបង្កើនការស្វែងរកតាមបណ្ដោយព្រំដែន ដើម្បីប្រយុទ្ធប្រឆាំងនឹងការជួញដូរ។',
 '<p>National Police have announced a major operation to strengthen border security across multiple provinces. The operation involves hundreds of officers deployed in shifts along key border crossing points.</p>',
 '<p>នគរបាលជាតិបានប្រកាសអំពីប្រតិបត្តិការធំមួយ ដើម្បីបង្កើនសុវត្ថិភាពព្រំដែននៅទូទាំងខេត្តជាច្រើន។ ប្រតិបត្តិការនេះពាក់ព័ន្ធនឹងមន្ត្រីរាប់រយនាក់ ដែលត្រូវបានដាក់ពង្រាយជាវេនតាមចំណុចឆ្លងព្រំដែនសំខាន់ៗ។</p>',
 'https://picsum.photos/seed/article1/800/500',
 1, 2, 'ក្រសួងមហាផ្ទៃ', 'published', 1, 0, 1240,
 DATE_SUB(NOW(), INTERVAL 1 DAY)),

(2,
 'Road Safety Campaign 2025',
 'យុទ្ធនាការសុវត្ថិភាពចរាចរណ៍ ២០២៥',
 'The annual road safety campaign kicks off this month with new enforcement measures.',
 'យុទ្ធនាការសុវត្ថិភាពចរាចរណ៍ប្រចាំឆ្នាំបានចាប់ផ្ដើមខែនេះ ជាមួយនឹងវិធានការអនុវត្តន៍ថ្មី។',
 '<p>Cambodia National Police launched its annual Road Safety Campaign for 2025, aiming to reduce traffic fatalities by 20% compared to last year.</p>',
 '<p>នគរបាលជាតិកម្ពុជាបានចាប់ផ្ដើមយុទ្ធនាការសុវត្ថិភាពចរាចរណ៍ប្រចាំឆ្នាំ ២០២៥ ក្នុងគោលបំណងកាត់បន្ថយអ្នកស្លាប់ក្នុងចរាចរណ៍ ២០ ភាគរយ បើប្រៀបធៀបនឹងឆ្នាំមុន។</p>',
 'https://picsum.photos/seed/article2/800/500',
 4, 2, 'អគ្គស្នងការប៉ូលីស', 'published', 1, 1, 892,
 DATE_SUB(NOW(), INTERVAL 2 DAY)),

(3,
 'Anti-Drug Operation Success',
 'ប្រតិបត្តិការប្រឆាំងគ្រឿងញៀនជោគជ័យ',
 'Police seized over 500kg of illegal drugs in a major operation across three provinces.',
 'ប៉ូលីសបានរឹបអូសគ្រឿងញៀនខុសច្បាប់ជាង ៥០០ គីឡូក្រាម ក្នុងប្រតិបត្តិការធំនៅទូទាំងខេត្តបី។',
 '<p>In a major anti-narcotics operation spanning three provinces, the National Police Drug Bureau seized over 500 kilograms of methamphetamine and arrested 23 suspects.</p>',
 '<p>ក្នុងប្រតិបត្តិការប្រឆាំងគ្រឿងញៀនធំមួយ ដែលគ្របដណ្ដប់បីខេត្ត ក្រុមស្នើប្រឆាំងគ្រឿងញៀននៃនគរបាលជាតិបានរឹបអូសមេទម្ហ្វេតាមីនជាង ៥០០ គីឡូក្រាម ហើយបានចាប់ខ្លួនជនសង្ស័យ ២៣ នាក់។</p>',
 'https://picsum.photos/seed/article3/800/500',
 3, 3, 'នាយកដ្ឋានប្រឆាំងគ្រឿងញៀន', 'published', 0, 0, 1580,
 DATE_SUB(NOW(), INTERVAL 3 DAY)),

(4,
 'New Police Academy Graduates',
 'ការបញ្ចប់ការសិក្សារបស់វិទ្យាស្ថានប្រជាជន',
 '500 new officers graduated from the National Police Academy this week.',
 'មន្ត្រី ៥០០ នាក់ថ្មីបានបញ្ចប់ការសិក្សាពីវិទ្យាស្ថានជាតិប្រជាជនក្នុងសប្ដាហ៍នេះ។',
 '<p>The National Police Academy held its graduation ceremony for 500 new police officers this week, the largest class in the academy''s history.</p>',
 '<p>វិទ្យាស្ថានជាតិប្រជាជនបានរៀបចំពិធីបញ្ចប់ការសិក្សាសម្រាប់មន្ត្រីប៉ូលីស ៥០០ នាក់ ក្នុងសប្ដាហ៍នេះ ដែលជាថ្នាក់ធំបំផុតក្នុងប្រវត្តិសាស្ត្ររបស់វិទ្យាស្ថាន។</p>',
 'https://picsum.photos/seed/article4/800/500',
 1, 2, 'វិទ្យាស្ថានជាតិ', 'published', 0, 0, 675,
 DATE_SUB(NOW(), INTERVAL 4 DAY)),

(5,
 'Community Policing Initiative',
 'គំនិតផ្ដួចផ្ដើមនគរបាលសហគមន៍',
 'A new community policing program will expand to all provinces by end of 2025.',
 'កម្មវិធីនគរបាលសហគមន៍ថ្មីនឹងពង្រីកទៅរាល់ខេត្តនៅចុងឆ្នាំ ២០២៥។',
 '<p>The National Police launched a new Community Policing Initiative aimed at building stronger relationships between officers and local communities across all 25 provinces.</p>',
 '<p>នគរបាលជាតិបានចាប់ផ្ដើមគំនិតផ្ដួចផ្ដើមនគរបាលសហគមន៍ថ្មី ក្នុងគោលបំណងកសាងទំនាក់ទំនងរឹងមាំជាងមុន រវាងមន្ត្រីប្រចាំការ និងសហគមន៍មូលដ្ឋាននៅទូទាំង ២៥ ខេត្ត។</p>',
 'https://picsum.photos/seed/article5/800/500',
 6, 3, 'នគរបាលខេត្ត', 'published', 1, 0, 445,
 DATE_SUB(NOW(), INTERVAL 5 DAY)),

(6,
 'Cybercrime Warning to Public',
 'ការព្រមានអំពីឧក្រិដ្ឋកម្មតាមអ៊ីនធឺណិត',
 'Police warn citizens about a new wave of online scams targeting bank accounts.',
 'ប៉ូលីសព្រមានប្រជាពលរដ្ឋអំពីរលកឆបោកតាមអ៊ីនធឺណិតថ្មី ដែលកំណត់គោលដៅទៅលើគណនីធនាគារ។',
 '<p>The National Police Cybercrime Division has issued a warning to the public about a sophisticated wave of online scams targeting bank accounts through fake SMS messages.</p>',
 '<p>នាយកដ្ឋានឧក្រិដ្ឋកម្មតាមអ៊ីនធឺណិតរបស់នគរបាលជាតិបានចេញការព្រមានដល់ប្រជាពលរដ្ឋ អំពីការឆបោកតាមអ៊ីនធឺណិតដ៏ស្មុគស្មាញ ដែលកំណត់គោលដៅទៅលើគណនីធនាគារ តាមរយៈសារ SMS ក្លែងក្លាយ។</p>',
 'https://picsum.photos/seed/article6/800/500',
 2, 3, 'នាយកដ្ឋានឧក្រិដ្ឋកម្មតាមអ៊ីនធឺណិត', 'published', 0, 0, 3200,
 DATE_SUB(NOW(), INTERVAL 6 DAY));

INSERT IGNORE INTO article_tags (article_id, tag_id) VALUES
  (1,2),(1,1),(1,8),
  (2,3),(2,10),(2,2),
  (3,9),(3,4),(3,2),
  (4,2),(4,6),
  (5,5),(5,2),
  (6,7),(6,1),(6,6);
