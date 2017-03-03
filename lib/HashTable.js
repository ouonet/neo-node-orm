/**
 * Created by neo on 2016/8/1.
 */
function HashTable() {
    this.keys = [];
    this.values = [];
    return this

}
HashTable.prototype = {
    put: function (key, value) {
        var index = this.keys.indexOf(key);
        if (index == -1) {
            this.keys.push(key);
            this.values.push(value);
        }
        else {
            this.values[index] = value;
        }
    },
    get: function (key) {
        return this.values[this.keys.indexOf(key)];
    }
};
module.exports = HashTable;