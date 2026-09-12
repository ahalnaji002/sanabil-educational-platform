ALTER TABLE `subjects` ADD COLUMN `grade` ENUM('TENTH', 'ELEVENTH', 'TAWJIHI') NULL;

UPDATE `subjects` SET `grade` = 'TAWJIHI' WHERE `grade` IS NULL;

ALTER TABLE `subjects` MODIFY `grade` ENUM('TENTH', 'ELEVENTH', 'TAWJIHI') NOT NULL;

CREATE INDEX `subjects_grade_is_active_idx` ON `subjects`(`grade`, `is_active`);
