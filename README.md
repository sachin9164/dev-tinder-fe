# Dev Tinder Frontend

React + Vite frontend for your Dev Tinder backend, with shadcn-style reusable UI components and Tinder-like discover flow.

## Folder

This frontend is intentionally separated from backend code:

- `frontend/` - React app
- `src/` (root project) - Node.js backend

## Setup

1. Install frontend dependencies:

```bash
cd frontend
npm install
```

2. Create env file:

```bash
cp .env.example .env
```

3. Start frontend:

```bash
npm run dev
```

4. Start backend from project root in another terminal:

```bash
npm run dev
```

## Environment

- `VITE_API_BASE_URL` defaults to `http://localhost:3000`
- `VITE_SOCKET_URL` defaults to `VITE_API_BASE_URL`
- `VITE_SOCKET_PATH` defaults to `/socket.io`
- `VITE_SOCKET_SEND_MESSAGE_EVENT` defaults to `chat:message:send`
- `VITE_SOCKET_RECEIVE_MESSAGE_EVENT` defaults to `chat:receiveMessage`

## Features

- Auth: signup, login, logout
- Discover page with Tinder-like swipe actions
- Request management: accept/reject incoming requests
- Matches list from accepted connections
- Profile edit + password update dialog
- Cookie-based auth support (`withCredentials: true`)
