# Home Smart MQTT Broker
Broker that maintains connections between smart devices, Mobile Apps and browsers using MQTT protocol. It includes
- [Aedes MQTT broker](https://github.com/mcollina/aedes)
- [Redis-powered MQEmitter](https://github.com/mcollina/mqemitter-redis)
- [MongoDB persistence for Aedes](https://github.com/mcollina/aedes-persistence-mongodb)

# New Features!
  - [Yarn](https://yarnpkg.com/) Package Manager

### Installation
- Requires [Node.js](https://nodejs.org/) v6+ to run.
- Requires [MongoDB](https://www.mongodb.com/) for storing mqtt messages, user commands, devices responses and devices notifications.
- Requires [Redis](https://redis.io/) for messaging, pub/sub.

Install the dependencies and devDependencies and start the server.

```sh
$ yarn install
$ node app.js
```

### Note:
Detailed documentation comming soon.

# MIT License
    Copyright (c) 2017 Muhammad Ahmed

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.
