## MongoDB Setup

Install MongoDB Server and MongoDB Shell on Windows:

```
winget install --id MongoDB.Server -e --accept-package-agreements --accept-source-agreements
winget install --id MongoDB.Shell -e --accept-package-agreements --accept-source-agreements
```

## Start The Database

MongoDB is installed as a Windows service. Before starting the API, check that the database service is running:

```powershell
Get-Service MongoDB
```

If the status is not `Running`, start it from PowerShell:

```powershell
Start-Service MongoDB
```

If PowerShell says permission is denied, open PowerShell as Administrator and run the same command again.

To confirm the database responds, run:

```powershell
mongosh mongodb://127.0.0.1:27017/ist256_storefront
```

If `mongosh` is not recognized, use the full installed path:

```powershell
& "$env:LOCALAPPDATA\Programs\mongosh\mongosh.exe" "mongodb://127.0.0.1:27017/ist256_storefront"
```

## How To Run

Start MongoDB first using the steps above.

Start the server from the server folder
```bash
cd server
npm install
npm start
```

Start the client from the project root

```bash
cd ~
npm install
npm start
```


Open the  URL shown in the terminal, usually:

```text
http://localhost:1234
```

## Main User Flows

- Sign Up creates shopper records in MongoDB with a username and password.
- Member passwords are stored as salted password hashes, not plain text.
- Login lets members sign in with their username and password.
- Demo admin account: `admin:admin`.
- Demo normal account: `JohnDoe:Admin6`.
- Store shows product details and syncs the shopping cart to MongoDB.
- Checkout requires a signed-in member account; guest checkout is blocked.
- Checkout stores customer, shipping, billing, cart, and order data.
- My Orders looks up submitted orders by registered email.
- Returns creates return requests and shows return status.
- Admin manages products, shoppers, order approvals, order history, returns, and demo data resets.
- Cart, order, return, member lookup, and admin API actions use a login token from the current session.

## Useful Checks

```bash
node --check server/server.js
npm run build
```

MongoDB collection count check:

```bash
mongosh mongodb://127.0.0.1:27017/ist256_storefront
```

Then run `show collections` and `db.products.countDocuments()` in the MongoDB shell.

## L12 Deliverables

Generated files are in `deliverables/`:

- `IST256_L12_TestPlan.xlsx`
- `IST256_L12_TestPlan.csv`
- `IST256_L12_BugFixReport.pdf`
- `IST256_L12_FinalPresentationDraft.pptx`
- `IST256_L12_Presentation_Script.md`
- `evidence/final-verification-results.json`

Replace placeholder team member names before submitting.
