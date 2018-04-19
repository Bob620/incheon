# Incheon

### Install

Install [Redis](https://redis.io/download)

Install [NodeJS 9.5.0+](https://nodejs.org/en/download/current/)

**Run Redis on localhost:6379 (default)**

```bash
git clone https://github.com/bob620/incheon
npm install

node tests/websockets.js
```

Expected output:
```bash
[Tester] - Websocket connected
[Tester] - PASS | Authenticate via ws
[Tester] - PASS | Responded with settings
[Tester] - PASS | Settings contains correct values
[Tester] - PASS | Responded with environments
[Tester] - PASS | Correct environments included
[Tester] - FAIL | Responded with Users
```