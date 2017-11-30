# tweenz

A small library for writing Express middleware, inspired by [Pyramid tweens](https://docs.pylonsproject.org/projects/pyramid/en/latest/narr/hooks.html#registering-tweens).

## Getting started

```bash
yarn add tweenz
```

## How-to

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
The body of a tween is a callback that gets executed with the following parameters:

#### requestDetails

An object of the following type:

```js
{
    responseBody: string | Object
}
```

#### res

[Express request object](http://expressjs.com/en/api.html#req)

#### res

[Express response object](http://expressjs.com/en/api.html#res)
