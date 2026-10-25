-- Reference schema for the Semester Result System (MySQL 8).
-- The application creates these tables automatically (spring.jpa.hibernate.ddl-auto=update),
-- so running this script is optional. It contains no user accounts or passwords.

CREATE DATABASE IF NOT EXISTS semester_result;
USE semester_result;

CREATE TABLE IF NOT EXISTS subjects (
    id       BIGINT AUTO_INCREMENT PRIMARY KEY,
    code     VARCHAR(15) NOT NULL UNIQUE,
    name     VARCHAR(80) NOT NULL,
    credits  INT         NOT NULL
);

CREATE TABLE IF NOT EXISTS students (
    id             BIGINT AUTO_INCREMENT PRIMARY KEY,
    roll_no        VARCHAR(20) NOT NULL UNIQUE,
    name           VARCHAR(80) NOT NULL,
    department     VARCHAR(60) NOT NULL,
    semester       INT         NOT NULL,
    academic_year  VARCHAR(9)  NOT NULL
);

-- MSE and ESE marks are stored out of 100.
-- Final = 0.30 * mse_marks + 0.70 * ese_marks (calculated by the application).
CREATE TABLE IF NOT EXISTS marks (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id  BIGINT NOT NULL,
    subject_id  BIGINT NOT NULL,
    mse_marks   INT    NOT NULL CHECK (mse_marks BETWEEN 0 AND 100),
    ese_marks   INT    NOT NULL CHECK (ese_marks BETWEEN 0 AND 100),
    CONSTRAINT uk_marks_student_subject UNIQUE (student_id, subject_id),
    CONSTRAINT fk_marks_student FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE,
    CONSTRAINT fk_marks_subject FOREIGN KEY (subject_id) REFERENCES subjects (id)
);

-- The four semester subjects (also inserted automatically on first start)
INSERT IGNORE INTO subjects (code, name, credits) VALUES
    ('CS301', 'Web Technology', 4),
    ('CS302', 'Design and Analysis of Algorithms', 4),
    ('CS303', 'Database Management Systems', 3),
    ('CS304', 'Computer Networks', 3);
