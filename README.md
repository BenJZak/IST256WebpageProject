## How To Run

Start MongoDB first using the steps above.

Install frontend dependencies from the project root:

```bash
npm install
```

Install server dependencies:

```bash
cd server
npm install
```

Start the Express API from the project root:

```bash
node server/server.js
```

In a second terminal, start the React app from the project root:

```bash
npm run dev
```

Open the Parcel URL shown in the terminal, usually:

```text
http://localhost:1234
```

## Main User Flows

- Sign Up creates shopper records in MongoDB with a username and password.
- Member passwords are stored as salted password hashes, not plain text.
- Login lets members sign in with their username and password.
- Demo admin login uses username `admin` and password `admin`.
- Store shows product details and syncs the shopping cart to MongoDB.
- Checkout requires a signed-in member account; guest checkout is blocked.
- Checkout stores customer, shipping, billing, cart, and order data.
- My Orders looks up submitted orders by registered email.
- Returns creates return requests and shows return status.
- Admin manages products, shoppers, order approvals, order history, returns, and demo data resets.
- Cart, order, return, member lookup, and admin API actions use a login token from the current session
