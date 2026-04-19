# IST256WebpageProject

## ZyBooks Compatibility

This project is written to match the main web development ideas used in IST 256 and zyBooks:

- HTML pages and Bootstrap classes for layout, forms, buttons, tables, alerts, and responsive design.
- JavaScript form events, validation, arrays, objects, conditionals, loops, and functions.
- JSON data with `JSON.parse()` and `JSON.stringify()`.
- Browser storage with `localStorage` for cart and customer email lookup data.
- React components, modules, props, `useState`, and `useEffect`.
- `fetch()` requests from the React app to a simple Node/Express API.
- jQuery and `$.ajax()` only in the legacy static store page.
- Parcel for the React project setup and build scripts.
- Server-side JSON files for products, members, and orders.

The React/Parcel app is the primary version of the project. The legacy static pages are kept only for compatibility and redirects.
Navigation uses regular links and simple React state.

## How To Run

Install the main React app dependencies from the project root:

```bash
npm install
```

Install the server dependencies:

```bash
cd server
npm install
```

Start the Express API from the `server` folder:

```bash
npm start
```

The React app expects this API to be running at:

```text
http://localhost:3001
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

- Admin registers, edits, and deletes members in the Admin section.
- Admin adds and deletes store products in the Admin section.
- Customer opens the Store, searches products, and sends items to the cart.
- Customer goes to Checkout and submits an order for approval.
- Checkout automatically registers the customer email as a member when the email is not already in the member list.
- Customer opens My Orders and looks up orders with a registered member email.
- Admin reviews pending orders and approves or declines them.

## Useful Checks

Run a production build from the project root:

```bash
npm run build
```

Check the server file syntax:

```bash
node --check server/server.js
```
