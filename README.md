# Collaborative Graphic Design using okdb

Example of using [okdb](https://okdb.io/) to implement multi-user collaboration.

## Backend

The backend is a node.js service, needed to broadcast changes to connected clients. 

## Frontend

The frontend is a react app generated with <a href="https://reactjs.org/docs/create-a-new-react-app.html">CRA</a> and using <a href="https://material-ui.com/">Material UI</a> components.


## Getting Started

In your first terminal:

```
git clone https://github.com/okdb-io/okdb-sample-designer.git
cd okdb-sample-designer/backend/
npm install
npm run server
```

In your second terminal:

```
cd okdb-sample-designer/frontend/
npm install
npm start
```

Open <a href="http://localhost:3000">landing page</a> in two different browser windows, make changes in one window and see them in another one.


## Next Steps

See <a href="https://okdb.io/p/docs/getting-started">documentation</a> for more information.
