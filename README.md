# tweenz

[![npm (scoped)](https://img.shields.io/npm/v/tweenz.svg)](https://yarn.pm/tweenz) [![Build Status](https://travis-ci.org/sharkcore/tweenz.svg?branch=master)](https://travis-ci.org/sharkcore/tweenz) [![Greenkeeper badge](https://badges.greenkeeper.io/sharkcore/tweenz.svg)](https://greenkeeper.io/)

A small library for writing [Express](https://expressjs.com/) middleware, inspired by [Pyramid tweens](https://docs.pylonsproject.org/projects/pyramid/en/latest/narr/hooks.html#registering-tweens).

### Why?
This library does the following:
- Exposes the response body to the middleware (as part of `requestDetails`)
- Provides a first class API to allow middleware to safely execute code after the request has finished

## Getting started

```bash
yarn add tweenz
```

A tween in `tweenz` looks like this:

```js
export default () => {
    // one-time configuration code goes here

    return async (requestDetails, req, res) => {
        // code to be executed for each request before
        // the actual application code goes here

        const details = await requestDetails;

        // code to be executed for each request after
        // the actual application code goes here
    };
};
```

### Example

Here's a tween to calculate the time taken for a request to complete:

#### time-logger.js
```js
export default () => {
    return async (requestDetails, req, res) => {
        const startAt = process.hrtime();

        // wait for request to complete
        await requestDetails;

        // calculate time taken for request
        const [seconds, nanoseconds] = process.hrtime(startAt);
        const miliseconds = seconds * 1e3 + nanoseconds * 1e-6;
        console.log(`Request took ${miliseconds}ms to complete!`);
    };
};
```

#### app.js
```js
import express from 'express';
import tweenz from 'tweenz';
import timeLogger from './time-logger';

const app = express();
app.use(tweenz(timeLogger));

...
```

## API

### Registering tweens
```
tweenz(tween [, tween ...])
```

### Tween Callback
A tween should return a callback, which will get executed with the following parameters

#### requestDetails

An object of the following type:

```js
{
    responseBody: string | Object
}
```

#### req

[Express request object](http://expressjs.com/en/api.html#req)

#### res

[Express response object](http://expressjs.com/en/api.html#res)
