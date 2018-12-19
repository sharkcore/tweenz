// @flow

import type { $Request, $Response, Middleware, NextFunction } from 'express';
import BufferList from 'bl';

export type RequestDetails = {|
    // TODO: Work out if this type can be inferred somehow
    responseBody: any,
|};

export type Tween = (
    Promise<RequestDetails>,
    $Request,
    $Response,
) => Promise<void>;

export default function tweenz(...tweens: Array<Tween>): Middleware {
    return (req: $Request, res: $Response, next: NextFunction) => {
        // we'll store all chunks passed to res.write/end in memory here
        const bufferList = new BufferList();

        // We're about to write over res.write and res.end - save the old versions
        const oldResWrite = res.write.bind(res);
        const oldResEnd = res.end.bind(res);

        // $FlowFixMe: Ack that res.write is not writable - we're doing mad science
        res.write = function PatchedWrite(chunk, ...args) {
            bufferList.append(chunk);
            return oldResWrite(chunk, ...args);
        };

        // $FlowFixMe: Ack that res.end is not writable - we're doing mad science
        res.end = function PatchedEnd(chunk, ...args) {
            bufferList.end(chunk);
            return oldResEnd(chunk, ...args);
        };

        // Construct a Promise to be fulfilled when request has finished
        const requestDetails: Promise<RequestDetails> = new Promise(resolve => {
            function finish() {
                resolve({ responseBody: bufferList.toString() });
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
