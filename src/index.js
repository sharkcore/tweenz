// @flow
import type { $Request, $Response, Middleware, NextFunction } from 'express';

export type RequestDetails = {
    responseBody: string,
};

export type Tween = (
    Promise<RequestDetails>,
    $Request,
    $Response,
) => Promise<void>;
export type TweenFactory = () => Tween;

export const getPatchedResponseFn = (
    cb: $Response.json | $Response.send,
    context: Object,
) => (...args: any) => {
    // Save body
    // eslint-disable-next-line prefer-destructuring, no-param-reassign
    context.responseBody = context.responseBody || args[0];
    // Call the old response function
    cb(...args);
};

export default function tweenz(
    ...tweenFactories: Array<TweenFactory>
): Middleware {
    const tweens = tweenFactories.map(t => t());

    return (req: $Request, res: $Response, next: NextFunction) => {
        // Save some stateful request context
        const context = {};

        // Monkey patch express methods to intercept response body
        res.send = getPatchedResponseFn(res.send.bind(res), context);

        // Construct a Promise to be fulfilled when request has finished
        const requestDetails = new Promise(resolve => {
            function finish() {
                resolve({
                    responseBody: context.responseBody,
                });
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

        // Call each tween
        tweens.forEach(tween => {
            tween(requestDetails, req, res);
        });

        next();
    };
}
