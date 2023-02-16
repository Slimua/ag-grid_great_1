"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinearScale = void 0;
const continuousScale_1 = require("./continuousScale");
const ticks_1 = require("../util/ticks");
const numberFormat_1 = require("../util/numberFormat");
/**
 * Maps continuous domain to a continuous range.
 */
class LinearScale extends continuousScale_1.ContinuousScale {
    constructor() {
        super([0, 1], [0, 1]);
        this.type = 'linear';
    }
    toDomain(d) {
        return d;
    }
    ticks() {
        var _a;
        const count = (_a = this.tickCount) !== null && _a !== void 0 ? _a : continuousScale_1.ContinuousScale.defaultTickCount;
        if (!this.domain || this.domain.length < 2 || count < 1 || this.domain.some((d) => !isFinite(d))) {
            return [];
        }
        this.refresh();
        const [d0, d1] = this.getDomain();
        const { interval } = this;
        if (interval) {
            const step = Math.abs(interval);
            if (!this.isDenseInterval({ start: d0, stop: d1, interval: step })) {
                return ticks_1.range(d0, d1, step);
            }
        }
        return ticks_1.default(d0, d1, count);
    }
    update() {
        if (!this.domain || this.domain.length < 2) {
            return;
        }
        if (this.nice) {
            this.updateNiceDomain();
        }
    }
    /**
     * Extends the domain so that it starts and ends on nice round values.
     * @param count Tick count.
     */
    updateNiceDomain() {
        var _a, _b;
        const count = (_a = this.tickCount) !== null && _a !== void 0 ? _a : continuousScale_1.ContinuousScale.defaultTickCount;
        let [start, stop] = this.domain;
        if (count < 1) {
            this.niceDomain = [start, stop];
            return;
        }
        if (count === 1) {
            this.niceDomain = ticks_1.singleTickDomain(start, stop);
            return;
        }
        for (let i = 0; i < 2; i++) {
            const step = (_b = this.interval) !== null && _b !== void 0 ? _b : ticks_1.tickStep(start, stop, count);
            if (step >= 1) {
                start = Math.floor(start / step) * step;
                stop = Math.ceil(stop / step) * step;
            }
            else {
                // Prevent floating point error
                const s = 1 / step;
                start = Math.floor(start * s) / s;
                stop = Math.ceil(stop * s) / s;
            }
        }
        this.niceDomain = [start, stop];
    }
    tickFormat({ ticks, specifier }) {
        return numberFormat_1.tickFormat(ticks || this.ticks(), specifier);
    }
}
exports.LinearScale = LinearScale;
