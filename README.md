## chat-app

Link to website:

A MERN-stack chat application utilizing websockets for live updates. Deployed on heroku.

Any action a user can make that would affect what another user can see, happens live through the websocket.
This includes but is not limited to things such as adding/removing friends, inviting/removing users
from chat rooms, changing bio/username, sending messages etc.

Made to improve and display my MERN-stack skills.

## Trying out the app

As a 100% network-driven and social app, you need to be logged in to perform any functionality.

The best way to test this app if you're alone is to open one normal tab and one incognito tab, log in with two
different accounts respectively and just play around. Send friend requests and messages from the user on one of your tabs
to the user on your other tab and see what happens.

## Testing it locally

Clone the repo or download it.

in the server folder add a .env file and fill in these with your own:

file:  "chat-app/server/.env"
```
MONGODB_URL=[your_mongodb_uri]
SECRET_COOKIE=[your_secret_cookie]
REACT_APP_ENVIRONMENT_BASE_URL=http://localhost:3000/
GOOGLE_DISCOVERY_URL=[your_google_discovery_url]
MICROSOFT_DISCOVERY_URL=[your_microsoft_discovery_url]
GOOGLE_CLIENT_ID=[your_google_client_id]<br>
MICROSOFT_CLIENT_ID=[your_microsoft_client_id]
```


In the root directory, download dependencies with:

```bash
npm install
```

Then run the application with:

```bash
npm run dev
```

It is exposed on port 3000, so the url will be http://localhost:3000/
