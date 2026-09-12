INSERT INTO `announcements` (`title`, `content`, `badge`, `image_url`, `sort_order`, `is_active`, `created_at`, `updated_at`)
SELECT
  'سند لكبار البلد',
  'تعلن منصة سنابل عن خصم بنسبة 50% على بطاقة الصقور الذهبية لجميع المواد. تابع إعلانات المنصة لمعرفة تفاصيل التسجيل والاستفادة من العرض.',
  'عرض خاص',
  '/announcements/sanabil-50-off-v2.png',
  1,
  TRUE,
  CURRENT_TIMESTAMP(3),
  CURRENT_TIMESTAMP(3)
WHERE NOT EXISTS (SELECT 1 FROM `announcements` WHERE `title` = 'سند لكبار البلد');

INSERT INTO `announcements` (`title`, `content`, `badge`, `image_url`, `sort_order`, `is_active`, `created_at`, `updated_at`)
SELECT
  'وجهات المواد أصبحت أقرب',
  'رتبنا لك الوصول إلى المواد في مسار واضح: اختر المادة، ثم الوجهة المناسبة، وأكمل التصفح داخل Google Drive.',
  'جديد',
  '/announcements/subject-destinations.png',
  2,
  TRUE,
  CURRENT_TIMESTAMP(3),
  CURRENT_TIMESTAMP(3)
WHERE NOT EXISTS (SELECT 1 FROM `announcements` WHERE `title` = 'وجهات المواد أصبحت أقرب');
