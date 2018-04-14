const lambda = require("./index");

const handler = lambda.handler;
const ERROR_RESPONSE = lambda.ERROR_RESPONSE;

const rawReq = (headers) => {
    return {
        Records: [
            {
                cf: {
                    request: {
                        headers,
                        myLittleRequest: true
                    }
                }
            }
        ]
    };
};

const req = (headerValue) => {
    return rawReq({
        authorization: [{
            name: "Authorization",
            value: headerValue
        }]
    });
}

const base64 = (input) => {
    return Buffer.from(input, "utf-8").toString("base64");
}

const ERROR = {"headers": {"www-authenticate": [{"key": "WWW-Authenticate", "value": "Basic realm=\"Authentication Required\""}]}, "status": "401"};

describe("handler", () => {
    it("rejects requests with no authorization header", (done) => {
        handler(rawReq({}), null, (err, res) => {
            expect(err).toBeNull();
            expect(res).toEqual(ERROR_RESPONSE);

            done();
        });
    });

    it("rejects requests with an auth header in the wrong format", (done) => {
        handler(req("boring Aeabaae="), null, (err, res) => {
            expect(err).toBeNull();
            expect(res).toEqual(ERROR_RESPONSE);

            done();
        });
    });

    it("rejects requests with an invalid auth token (base64 garbage)", (done) => {
        handler(req("Basic ababababababab"), null, (err, res) => {
            expect(err).toBeNull();
            expect(res).toEqual(ERROR_RESPONSE);

            done();
        });
    });

    it("rejects requests with an invalid auth token (valid base64, no colon)", (done) => {
        handler(req("Basic " + base64("NotUserPassPair")), null, (err, res) => {
            expect(err).toBeNull();
            expect(res).toEqual(ERROR_RESPONSE);

            done();
        });
    });

    it("rejects requests with an unkown user and password", (done) => {
        handler(req("Basic " + base64("brian:brown")), null, (err, res) => {
            expect(err).toBeNull();
            expect(res).toEqual(ERROR_RESPONSE);

            done();
        });
    });

    it("rejects requests with an incorrect password", (done) => {
        handler(req("Basic " + base64("docs:hunter2")), null, (err, res) => {
            expect(err).toBeNull();
            expect(res).toEqual(ERROR_RESPONSE);

            done();
        });
    });

    it("accepts requests for valid users", (done) => {
        handler(req("Basic " + base64("docs:d0cs")), null, (err, res) => {
            expect(err).toBeNull();

            // Matches the request we passed in
            expect(res).toEqual({
                headers: {
                    authorization: [{
                        name: "Authorization",
                        value: "Basic " + base64("docs:d0cs")
                    }]
                },
                myLittleRequest: true
            });

            done();
        });
    });
});
