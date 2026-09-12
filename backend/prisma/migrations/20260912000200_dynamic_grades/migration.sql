CREATE TABLE `grades` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(120) NOT NULL,
    `slug` VARCHAR(160) NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `grades_slug_key`(`slug`),
    INDEX `grades_is_active_sort_order_idx`(`is_active`, `sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `grades` (`name`, `slug`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
    ('عاشر', 'tenth', 1, true, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
    ('حادي عشر', 'eleventh', 2, true, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
    ('توجيهي', 'tawjihi', 3, true, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));

ALTER TABLE `subjects` ADD COLUMN `grade_id` INTEGER NULL;

UPDATE `subjects` AS `subject`
INNER JOIN `grades` AS `grade`
    ON `grade`.`slug` = CASE `subject`.`grade`
        WHEN 'TENTH' THEN 'tenth'
        WHEN 'ELEVENTH' THEN 'eleventh'
        WHEN 'TAWJIHI' THEN 'tawjihi'
    END
SET `subject`.`grade_id` = `grade`.`id`;

ALTER TABLE `subjects` DROP INDEX `subjects_grade_is_active_idx`;
ALTER TABLE `subjects` MODIFY `grade_id` INTEGER NOT NULL;
ALTER TABLE `subjects` DROP COLUMN `grade`;

CREATE INDEX `subjects_grade_id_is_active_idx` ON `subjects`(`grade_id`, `is_active`);
ALTER TABLE `subjects` ADD CONSTRAINT `subjects_grade_id_fkey`
    FOREIGN KEY (`grade_id`) REFERENCES `grades`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;
