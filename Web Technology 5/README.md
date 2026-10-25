# Semester Result System

A responsive web application to prepare the semester result of college students, built with **Spring Boot** and **MySQL**.

Each student is assessed in **four subjects**. For every subject:

```
Final marks (out of 100) = 30% of MSE marks + 70% of ESE marks
```
- MSE: Mid-Semester Examination, entered out of 100
- ESE: End-Semester Examination, entered out of 100

## Features
- Add, edit, view and delete student results (roll number, name, department, semester, academic year).
- Marks entry for the four subjects with **live preview** of final marks and grade.
- Automatic calculation of weighted MSE/ESE marks, final marks, grade, grade points, grand total, percentage, credits earned, **SGPA** and PASS/FAIL.
- Printable **marksheet** (Print / Save as PDF).
- **Dashboard** with class statistics: pass percentage, average SGPA, topper, and subject-wise average, highest, passed and failed counts.
- Search by roll number or name.
- Server-side validation (marks 0-100, unique roll number, academic year format) and friendly error messages.
- **REST API** (JSON) for all results.
- Responsive layout (desktop, tablet, mobile), dark mode and print styles.

## Result rules
| Final marks | Grade | Grade points |
|---|---|---|
| 90 - 100 | O | 10 |
| 80 - 89.99 | A+ | 9 |
| 70 - 79.99 | A | 8 |
| 60 - 69.99 | B+ | 7 |
| 50 - 59.99 | B | 6 |
| 45 - 49.99 | C | 5 |
| 40 - 44.99 | P | 4 |
| below 40 | F | 0 |

- A subject is passed with final marks of 40 or more.
- `SGPA = Σ (credits × grade points) / Σ credits`
- The semester result is **PASS** only if all four subjects are passed.

Subjects (created automatically on first start):

| Code | Subject | Credits |
|---|---|---|
| CS301 | Web Technology | 4 |
| CS302 | Design and Analysis of Algorithms | 4 |
| CS303 | Database Management Systems | 3 |
| CS304 | Computer Networks | 3 |

## Tech stack
- Java 17+, Spring Boot 3 (Web, Thymeleaf, Data JPA, Validation)
- MySQL 8 (via `mysql-connector-j`)
- Thymeleaf templates, CSS and vanilla JavaScript
- Maven (wrapper included)

## Project structure
```
src/main/java/com/college/result/
├── SemesterResultApplication.java
├── model/        Student, Subject, Mark (JPA entities)
├── repository/   StudentRepository, SubjectRepository
├── dto/          ResultForm, MarkInput, ResultView, SubjectResult, ClassSummary, SubjectAverage
├── service/      ResultService, ResultCalculator, Grade, DataInitializer, exceptions
└── web/          ResultPageController (pages), ResultApiController (REST), ApiExceptionHandler
src/main/resources/
├── application.properties     (no passwords; reads environment variables)
├── templates/                 index, form, result, error, fragments (Thymeleaf)
└── static/                    css/style.css, js/form.js
src/test/java/.../ResultCalculatorTest.java
database/schema.sql            reference MySQL schema (optional)
```

## Running locally
Requires JDK 17+ and a running MySQL 8 server.

1. Set the database credentials as **environment variables** (see `.env.example`). Never put a real password in `application.properties`.

   Windows (Command Prompt):
   ```
   set DB_USERNAME=root
   set DB_PASSWORD=your_mysql_password
   ```
   macOS / Linux:
   ```
   export DB_USERNAME=root
   export DB_PASSWORD=your_mysql_password
   ```
2. Start the application:
   ```
   mvnw.cmd spring-boot:run      (Windows)
   ./mvnw spring-boot:run        (macOS / Linux)
   ```
3. Open http://localhost:8080

The `semester_result` database and its tables are created automatically.

## Pages
| URL | Page |
|---|---|
| `/` | Dashboard: class statistics, subject analysis, results list |
| `/results/new` | Add result |
| `/results/{id}` | Marksheet |
| `/results/{id}/edit` | Edit result |

## REST API
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/subjects` | The four subjects |
| GET | `/api/results?q=` | All results (optional search) |
| GET | `/api/results/{rollNo}` | One student's result |
| POST | `/api/results` | Create a result |
| PUT | `/api/results/{rollNo}` | Update a result |
| DELETE | `/api/results/{rollNo}` | Delete a result |
| GET | `/api/summary` | Class summary |

Example request body:
```json
{
  "rollNo": "CS23-045",
  "name": "Student Name",
  "department": "Computer Engineering",
  "semester": 5,
  "academicYear": "2025-26",
  "marks": [
    { "subjectId": 1, "mse": 78, "ese": 82 },
    { "subjectId": 2, "mse": 65, "ese": 71 },
    { "subjectId": 3, "mse": 50, "ese": 36 },
    { "subjectId": 4, "mse": 92, "ese": 88 }
  ]
}
```

## Security note
- `application.properties` contains **no credentials**; the database password is read from the `DB_PASSWORD` environment variable.
- `.env` files and local property overrides are listed in `.gitignore`. Only `.env.example` (placeholders) is committed.
