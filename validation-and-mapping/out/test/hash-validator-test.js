"use strict";
/// <reference path="../validator/validator.d.ts" />
var should = require("should");
var validator_1 = require("../validator");
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = function () {
    describe("for numbers hash", function () {
        var numbersHash = validator_1.hash(validator_1.num().required().must(function (n) { return n > 0 && n < 10; }));
        it("must pass valid numbers", function () {
            var validHash = {
                one: 1,
                two: 2,
                three: 3,
                four: 4
            };
            var result = validator_1.validate(validHash, numbersHash);
            result.valid.should.be.true();
            result.value.should.deepEqual(validHash);
            console.dir(result.value);
        });
        it("must fail on invalid numbers", function () {
            var invalidHash = {
                one: 1,
                two: 2,
                three: "three"
            };
            var result = validator_1.validate(invalidHash, numbersHash);
            result.valid.should.be.false();
            should(result.errors["three"][0]).equal("Value is not a valid number");
        });
    });
};
//# sourceMappingURL=hash-validator-test.js.map