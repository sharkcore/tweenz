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

export const getPatchedSendFn = (
    context: Object,
): $PropertyType<$Response, 'send'> =>
    function send(...args: any) {
        // eslint-disable-next-line prefer-destructuring, no-param-reassign
        context.responseBody = args[0];
        this.send(...args);
        /* istanbul ignore next */
        return this;
    };

export default function tweenz(
    ...tweenFactories: Array<TweenFactory>
): Middleware {
    const tweens = tweenFactories.map(t => t());

    return (req: $Request, res: $Response, next: NextFunction) => {
        // Save some stateful request context
        const context = {};

        // Monkey patch express methods to intercept response body
        // $FlowFixMe: https://github.com/facebook/flow/issues/3076
        res.send = getPatchedSendFn(context).bind(res);

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
