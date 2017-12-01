import express from 'express';
import request from 'supertest';
import tweenz from '../src/index';

describe('middleware', () => {
    let app;
    let beforeFn;
    let afterFn;

    beforeEach(() => {
        app = express();
        beforeFn = jest.fn();
        afterFn = jest.fn();

        const dummyTween = () => {
            return async requestDetails => {
                beforeFn();
                const { responseBody } = await requestDetails;
                afterFn(responseBody);
            };
        };

        app.use(tweenz(dummyTween));
    });

    it('should work with res.json', done => {
        app.get('/foo', (req, res) => {
            res.json({ foo: 'bar' });
        });

        request(app)
            .get('/foo')
            .end(() => {
                expect(beforeFn).toHaveBeenCalled();
                expect(JSON.parse(afterFn.mock.calls[0][0])).toMatchObject({ foo: 'bar' });
                done();
            });
    });

    it('should work with res.end', done => {
        app.get('/foo', (req, res) => {
            res.send('foo');
        });

        request(app)
            .get('/foo')
            .end(() => {
                expect(beforeFn).toHaveBeenCalled();
                expect(afterFn).toHaveBeenCalledWith('foo');
                done();
            });
    });
});
