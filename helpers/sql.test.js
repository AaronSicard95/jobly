const { BadRequestError } = require("../expressError");
const { sqlForPartialUpdate } = require("./sql");


describe("Test sqlForPartialUpdate", function () {
  test("empty data", function () {
    expect(() => sqlForPartialUpdate({}, {})).toThrow(BadRequestError);
  });

  test("working", function () {
    const newVal = sqlForPartialUpdate({name: "I like chicken", personality: "super weird"}, ["yes","no"]);
    expect(newVal).toEqual({setCols: '"name"=$1, "personality"=$2', values: ["I like chicken", "super weird"]});
  });
});