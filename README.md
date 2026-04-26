# IST256 Storefront

## Install MongoDB

Install MongoDB Server and MongoDB Shell on Windows:

```powershell
winget install --id MongoDB.Server -e --accept-package-agreements --accept-source-agreements
winget install --id MongoDB.Shell -e --accept-package-agreements --accept-source-agreements
```

## Start MongoDB

Check that MongoDB is running:

```powershell
Get-Service MongoDB
```

If MongoDB is stopped, start it:

```powershell
Start-Service MongoDB
```

## Start The Project

Open one terminal for the API:

```powershell
cd server
npm install
npm start
```

Open a second terminal from the project root for the React app:

```powershell
cd ~
npm install
npm start
```

Open the local URL shown in the React terminal, usually:

```text
http://localhost:1234
```
