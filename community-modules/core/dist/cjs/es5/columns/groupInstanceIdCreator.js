/**
 * @ag-grid-community/core - Advanced Data Grid / Data Table supporting Javascript / Typescript / React / Angular / Vue
 * @version v29.1.0
 * @link https://www.ag-grid.com/
 * @license MIT
 */
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroupInstanceIdCreator = void 0;
// class returns unique instance id's for columns.
// eg, the following calls (in this order) will result in:
//
// getInstanceIdForKey('country') => 0
// getInstanceIdForKey('country') => 1
// getInstanceIdForKey('country') => 2
// getInstanceIdForKey('country') => 3
// getInstanceIdForKey('age') => 0
// getInstanceIdForKey('age') => 1
// getInstanceIdForKey('country') => 4
var GroupInstanceIdCreator = /** @class */ (function () {
    function GroupInstanceIdCreator() {
        // this map contains keys to numbers, so we remember what the last call was
        this.existingIds = {};
    }
    GroupInstanceIdCreator.prototype.getInstanceIdForKey = function (key) {
        var lastResult = this.existingIds[key];
        var result;
        if (typeof lastResult !== 'number') {
            // first time this key
            result = 0;
        }
        else {
            result = lastResult + 1;
        }
        this.existingIds[key] = result;
        return result;
    };
    return GroupInstanceIdCreator;
}());
exports.GroupInstanceIdCreator = GroupInstanceIdCreator;
