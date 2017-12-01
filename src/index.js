// @flow
import type { $Request, $Response, Middleware, NextFunction } from 'express';

type Context = {
    responseBody?: string | Object,
};

export type Tween = () => (Promise<Context>, $Request, $Response) => void;

export const getPatchedResponseFn = (cb: $Response.json | $Response.send, context: Context) => (...args: any) => {
    // Save body
    // eslint-disable-next-line prefer-destructuring, no-param-reassign
    context.responseBody = context.responseBody || args[0];
    // Call the old response function
    cb(...args);
};

export default function tweenz(...tweens: Array<Tween>): Middleware {
    const tweenBodies = tweens.map(t => t());

    return (req: $Request, res: $Response, next: NextFunction) => {
        // Save some stateful request context
        const context: Context = {};

        // Monkey patch express methods
        res.json = getPatchedResponseFn(res.json.bind(res), context);
        res.send = getPatchedResponseFn(res.send.bind(res), context);

        // Construct a Promise to be fulfilled when request has completed
        const requestDetails = new Promise(resolve => {
            function finish() {
                resolve(context);
                // eslint-disable-next-line no-use-before-define
                removeListeners();
            }

            function removeListeners() {
                res.removeListener('finish', finish);
                res.removeListener('error', removeListeners);
                res.removeListener('close', removeListeners);
            }

            res.once('finish', finish);
            res.once('error', removeListeners);
            res.once('close', removeListeners);
        });

        // Call each tween body
        tweenBodies.forEach(tweenBody => {
            tweenBody(requestDetails, req, res);
        });

        next();
    };
}
