"use strict";
/// <reference path="./validator.d.ts" />
var error_accumulator_1 = require("./error-accumulator");
var validation_context_1 = require("./validation-context");
var validator = (function () {
    function validator() {
    }
    validator.run = function (value, validator) {
        var errorAccumulator = new error_accumulator_1.default();
        var context = new validation_context_1.default("", errorAccumulator);
        var result = validator.run(value, context);
        var errors = errorAccumulator.errors();
        if (Object.keys(errors).length) {
            return {
                valid: false,
                value: result,
                errors: errors
            };
        }
        return {
            valid: true,
            value: result
        };
    };
    return validator;
}());
exports.validator = validator;
//# sourceMappingURL=validator.js.map