# Ledger System

A secure, high-integrity double-entry ledger and account transfer system built with Node.js, Express, and MongoDB. This system guarantees transaction isolation, atomicity, idempotency, and immutability for all ledger records.

---

## Table of Contents

- [Core Features](#core-features)
- [System Architecture](#system-architecture)
- [The 10-Step Transfer Flow](#the-10-step-transfer-flow)
- [Tech Stack](#tech-stack)
- [API Reference](#api-reference)
  - [Authentication](#authentication)
  - [Accounts](#accounts)
  - [Transactions](#transactions)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Variables](#environment-variables)
  - [Installation](#installation)
  - [Running the Server](#running-the-server)
  - [Running Tests](#running-tests)
- [Database Integrity and Design](#database-integrity-and-design)
  - [Immutable Ledger Entry Hooks](#immutable-ledger-entry-hooks)
  - [Double-Entry Aggregation](#double-entry-aggregation)

---

## Core Features

- **Double-Entry Bookkeeping:** All monetary updates are recorded as debit or credit ledger entries tied to a transaction. Balance is computed dynamically by aggregating the ledger history.
- **Strict Immutability:** Ledger entries cannot be updated or deleted. Database-level hooks enforce write-once policies.
- **Idempotency Guarantee:** Prevents duplicate transaction processing under network failures or retries using unique idempotency keys.
- **Atomic Transactions:** Uses MongoDB sessions/transactions (`session.startTransaction()`) to ensure either both ledger entries are recorded and transaction status is updated, or everything rolls back.
- **Email Notifications:** Automatic emails are dispatched using Gmail OAuth2 transporter upon user registration and transaction completion.

---

## System Architecture

```
ledger/
├── src/
│   ├── app.js                 # Express application configuration
│   ├── config/
│   │   └── db.js              # Database connection logic
│   ├── controllers/
│   │   ├── account.controller.js
│   │   ├── auth.controller.js
│   │   └── transaction.controller.js
│   ├── middleware/
│   │   └── auth.middleware.js # JWT validation & user verification
│   ├── models/
│   │   ├── account.model.js   # Dynamic balance & status management
│   │   ├── ledger.model.js    # Immutable credit/debit records
│   │   ├── transaction.model.js
│   │   └── user.model.js
│   ├── routes/
│   │   ├── account.routes.js
│   │   ├── auth.routes.js
│   │   └── transaction.routes.js
│   └── services/
│       └── email.service.js   # Nodemailer SMTP transporter & templates
├── tests/
│   └── transaction.test.js    # Comprehensive integration & idempotency tests
├── server.js                  # Main server entrypoint
└── package.json
```

---

## The 10-Step Transfer Flow

Each fund transfer transaction executes through a strict 10-step process to maintain consistency and balance integrity:

1. **Validate Request:** Checks that sender, receiver, positive amount, and idempotency key are provided. Ensures sender and receiver accounts are distinct.
2. **Validate Idempotency Key:** Checks if a transaction with the same key already exists. Returns the stored response state (`COMPLETED`, `PENDING`, `FAILED`, `REVERSED`) to avoid duplicate processing.
3. **Check Account Status:** Validates that both the sender and receiver accounts exist and are in the `Active` state.
4. **Derive Balance:** Sums credits and debits from the ledger for the sender to verify sufficient funds.
5. **Create Transaction:** Creates a new transaction with state `PENDING`.
6. **Create Debit Ledger Entry:** Records a `DEBIT` ledger entry for the sender's account.
7. **Create Credit Ledger Entry:** Records a `CREDIT` ledger entry for the receiver's account.
8. **Mark Completed:** Updates transaction status to `COMPLETED`.
9. **Commit MongoDB Session:** Commits the transaction session atomically.
10. **Send Email Notification:** Asynchronously notifies both parties of the transfer via email.

---

## Tech Stack

- **Runtime:** Node.js (v16+)
- **Framework:** Express.js
- **Database:** MongoDB & Mongoose
- **Security:** JWT (JSON Web Tokens) & Cookie-Parser, Bcrypt (Password Hashing)
- **Emailing:** Nodemailer with OAuth2
- **Testing:** Jest & Supertest

---

## API Reference

### Authentication

#### Register a new user
* **URL:** `/api/auth/register`
* **Method:** `POST`
* **Payload:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "John Doe"
}
```
* **Response (201 Created):**
```json
{
  "user": {
    "_id": "60d0fe4f5311236168a109ca",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "token": "jwt_token_string"
}
```

#### Log in an existing user
* **URL:** `/api/auth/login`
* **Method:** `POST`
* **Payload:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```
* **Response (200 OK):**
```json
{
  "user": {
    "_id": "60d0fe4f5311236168a109ca",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "token": "jwt_token_string"
}
```

---

### Accounts

#### Create a new account
* **URL:** `/api/account`
* **Method:** `POST`
* **Headers:** `Authorization: Bearer <token>` or JWT token via cookies
* **Response (201 Created):**
```json
{
  "account": {
    "_id": "60d0fe8a5311236168a109cb",
    "user": "60d0fe4f5311236168a109ca",
    "status": "Active",
    "currency": "INR",
    "createdAt": "2026-05-31T15:50:29.000Z",
    "updatedAt": "2026-05-31T15:50:29.000Z"
  }
}
```

---

### Transactions

#### Transfer funds between accounts
* **URL:** `/api/transaction`
* **Method:** `POST`
* **Headers:** `Authorization: Bearer <token>` or JWT token via cookies
* **Payload:**
```json
{
  "fromAccount": "60d0fe8a5311236168a109cb",
  "toAccount": "60d0fea15311236168a109cc",
  "amount": 250,
  "idempotencyKey": "a-unique-uuid-or-nanoid-string"
}
```
* **Response (201 Created):**
```json
{
  "message": "transaction completed successfully",
  "transaction": {
    "_id": "60d0feb85311236168a109cd",
    "fromAccount": "60d0fe8a5311236168a109cb",
    "toAccount": "60d0fea15311236168a109cc",
    "amount": 250,
    "idempotencyKey": "a-unique-uuid-or-nanoid-string",
    "status": "COMPLETED",
    "createdAt": "2026-05-31T15:50:35.000Z",
    "updatedAt": "2026-05-31T15:50:35.000Z"
  }
}
```

---

## Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- MongoDB running locally or a MongoDB Atlas URI

### Environment Variables
Create a `.env` file in the root directory:
```env
MONGO_URI=mongodb://localhost:27017/ledger
JWT_SECRET=your_jwt_secret_key
EMAIL_USER=your_gmail_user@gmail.com
CLIENT_ID=your_gmail_oauth_client_id
CLIENT_SECRET=your_gmail_oauth_client_secret
REFRESH_TOKEN=your_gmail_oauth_refresh_token
```

### Installation
Clone the repository and install dependencies:
```bash
npm install
```

### Running the Server
To run in development mode (using nodemon):
```bash
npm run dev
```

To run in production mode:
```bash
npm start
```

### Running Tests
Execute integration and idempotency tests with Jest:
```bash
npm test
```

---

## Database Integrity and Design

### Immutable Ledger Entry Hooks
To ensure financial auditing compliance, ledger entries cannot be modified once written. In `src/models/ledger.model.js`, MongoDB update and delete operations are intercepted:

```javascript
function preventLedgerModification() {
  throw new Error("Ledger entries are immutable and cannot be modified or deleted");
}

ledgerSchema.pre("findOneAndUpdate", preventLedgerModification);
ledgerSchema.pre("updateOne", preventLedgerModification);
ledgerSchema.pre("deleteOne", preventLedgerModification);
ledgerSchema.pre("remove", preventLedgerModification);
ledgerSchema.pre("deleteMany", preventLedgerModification);
ledgerSchema.pre("updateMany", preventLedgerModification);
ledgerSchema.pre("findOneAndReplace", preventLedgerModification);
ledgerSchema.pre("findOneAndDelete", preventLedgerModification);
```

### Double-Entry Aggregation
Account balance is computed dynamically by grouping all related credits and debits from the ledger. See `src/models/account.model.js`:

```javascript
accountSchema.methods.getBalance = async function (session = null) {
  const balanceData = await ledgerModel.aggregate([
    { $match: { account: this._id } },
    {
      $group: {
        _id: null,
        totalCredit: {
          $sum: {
            $cond: [{ $eq: ["$type", "CREDIT"] }, "$amount", 0]
          }
        },
        totalDebit: {
          $sum: {
            $cond: [{ $eq: ["$type", "DEBIT"] }, "$amount", 0]
          }
        }
      }
    }
  ]).session(session);

  if (balanceData.length === 0) return 0;
  return balanceData[0].totalCredit - balanceData[0].totalDebit;
}
```
