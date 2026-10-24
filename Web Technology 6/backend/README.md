# Backend — Spring Boot + MongoDB

## Requirements
- **JDK 17 or newer** — check with `java -version`
- **Maven 3.9+** — check with `mvn -v`
- **MongoDB** — either:
  - **Local:** MongoDB Community Server (runs on `mongodb://localhost:27017`) + MongoDB Compass to view data, or
  - **Cloud:** a free MongoDB Atlas cluster (set `MONGODB_URI`, see `.env.example`)

## Run
```bash
cd backend
mvn spring-boot:run
```
API runs at http://localhost:8080.
On first start it creates the `bookstore` database, seeds 12 books and a demo user
(`demo@bookstore.com` / `demo123`).

Using Atlas instead of local MongoDB (PowerShell):
```powershell
$env:MONGODB_URI="mongodb+srv://<user>:<password>@<cluster>.mongodb.net/bookstore"
mvn spring-boot:run
```

## Structure
```
src/main/java/com/bookstore/
├── BookstoreApplication.java     entry point
├── model/          Book, User                     (MongoDB documents)
├── repository/     BookRepository, UserRepository (MongoRepository)
├── dto/            LoginRequest, RegisterRequest, AuthResponse, UserResponse
├── service/        AuthService                    (register/login, BCrypt hashing)
├── controller/     BookController, AuthController (REST endpoints)
├── exception/      ApiException, GlobalExceptionHandler
└── config/         CorsConfig, DataSeeder
src/main/resources/application.properties
```

## API
| Method | Endpoint              | Body / Params                          | Returns           |
|--------|-----------------------|----------------------------------------|-------------------|
| GET    | `/api/books`          | `?genre=` or `?search=` (optional)     | `Book[]`          |
| GET    | `/api/books/{id}`     | –                                      | `Book`            |
| POST   | `/api/books`          | `Book`                                 | created `Book`    |
| PUT    | `/api/books/{id}`     | `Book`                                 | updated `Book`    |
| DELETE | `/api/books/{id}`     | –                                      | 204               |
| POST   | `/api/auth/register`  | `{ fullName, email, phone?, password }`| `{ user, token }` |
| POST   | `/api/auth/login`     | `{ email, password }`                  | `{ user, token }` |

## MongoDB collections
- `books` — title, author, genre, price, rating, description, coverColor, imageUrl, inStock
- `users` — fullName, email (unique), phone, passwordHash (BCrypt), createdAt
