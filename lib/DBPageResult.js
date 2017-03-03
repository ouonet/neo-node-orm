function DBPageResult() {
    /**
     * the number of the current page
     * @type {number}
     */
    this.number = 0;

    /**
     * the size of the page
     * @type {number}
     */
    this.size = 20;

    /**
     * the number of total pages.
     * @type {number}
     */
    this.totalPages = 0;

    /**
     * the number of elements currently on this page.
     * @type {number}
     */
    this.numberOfElements = 0;

    /**
     * the total amount of elements.
     * @type {number}
     */
    this.totalElements = 0;


    /**
     * array of items
     ** @type {Array}
     */
    this.rows = [];
    return this;
}
module.exports = DBPageResult;