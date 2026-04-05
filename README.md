# User Management System - MongoDB + Node.js

## Setup Instructions

### 1. Install dependencies
```bash
npm install
```

### 2. Configure .env
Edit the `.env` file with your MongoDB Atlas connection string:
```
MONGO_URI=your_connection_string_here
PORT=3000
```

### 3. Start the server
```bash
node server.js
```

### 4. Run index tests
```bash
node index-test.js
```

---

## API Endpoints

| Method | URL | Description |
|--------|-----|-------------|
| POST | /addUser | Create new user |
| GET | /users | Get all users |
| PUT | /updateUser/:id | Update user by ID |
| DELETE | /deleteUser/:id | Delete user by ID |
| GET | /users/search?name= | Search by name |
| GET | /users/filter?email=&age= | Filter by email/age |
| GET | /users/hobbies?hobby= | Find by hobby |
| GET | /users/bio-search?text= | Text search on bio |
| GET | /users/paginate?page=&limit=&sortBy= | Paginate results |

---

## Postman Testing Guide

### POST /addUser
- Method: POST
- URL: http://localhost:3000/addUser
- Body (JSON):
```json
{
  "name": "Alice",
  "email": "alice@gmail.com",
  "age": 25,
  "hobbies": ["reading", "painting"],
  "bio": "loves books and art",
  "userId": "u001"
}
```

### GET /users
- Method: GET
- URL: http://localhost:3000/users

### PUT /updateUser/:id
- Method: PUT
- URL: http://localhost:3000/updateUser/PASTE_ID_HERE
- Body (JSON):
```json
{
  "age": 26
}
```

### DELETE /deleteUser/:id
- Method: DELETE
- URL: http://localhost:3000/deleteUser/PASTE_ID_HERE

---

## Post-Lab Answers

### Q1: How to check index usage using .explain() in Postman?

Add this route to server.js:
```javascript
app.get('/users/explain', async (req, res) => {
  try {
    const result = await User.find({ name: req.query.name }).explain('executionStats');
    res.json({
      indexUsed: result.queryPlanner.winningPlan.inputStage?.indexName,
      keysExamined: result.executionStats.totalKeysExamined,
      docsExamined: result.executionStats.totalDocsExamined,
      executionTime: result.executionStats.executionTimeMillis
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
```
Then in Postman: GET http://localhost:3000/users/explain?name=Alice

---

### Q2: Compound index { email: 1, age: -1 }

- find({ email: "test@gmail.com" }) → USES index (email is the prefix/first field)
- find({ age: 25 }) → DOES NOT use index (age alone is not the prefix)
- find({ email: "test@gmail.com", age: 25 }) → USES index (both fields match)

Explanation: MongoDB uses indexes based on the leftmost prefix rule.
A compound index can be used if the query includes the first field of the index.
Querying only on age (second field) skips the prefix so the index is NOT used.

---

### Q3: Missing vs Duplicate email

Schema: email: { type: String, required: true, unique: true }

Case 1 - POST without email:
- Error type: Mongoose Validation Error
- When it happens: BEFORE hitting the database
- Error message: "Path 'email' is required"
- HTTP Status: 400

Case 2 - POST with duplicate email:
- Error type: MongoDB Duplicate Key Error (E11000)
- When it happens: AFTER hitting the database
- Error message: "E11000 duplicate key error"
- HTTP Status: 400

They are DIFFERENT errors:
- Missing email = Mongoose catches it (validation layer)
- Duplicate email = MongoDB catches it (database layer)
- Different error codes, different messages, different stages of processing
