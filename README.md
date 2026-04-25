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

Install frontend dependencies from the project root:

```bash
npm install
```

Install server dependencies and start the server:

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
