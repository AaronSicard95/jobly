"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError, ExpressError } = require("../expressError");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  const newJob = {
    title: "Mercenary",
    salary: 50000,
    equity: "0",
    company_handle: "c3",
  };

  test("works", async function () {
    let job = await Job.create(newJob);
    expect(job).toEqual({...newJob,id:job.id});

    const result = await db.query(
          `SELECT title, salary, equity, company_handle
           FROM jobs
           WHERE id = $1`,[job.id]);
    expect(result.rows).toEqual([
      {
        title: "Mercenary",
        salary: 50000,
        equity: "0",
        company_handle: "c3",
      },
    ]);
  });
});

/************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    let jobs = await Job.findAll();
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "CEO",
        salary: 9000000,
        equity: "0.05",
        company_handle: "c1"
      },
      {
        id: expect.any(Number),
        title: "Janitor",
        salary: 2500,
        equity: "0",
        company_handle: "c2"
      },
      {
        id: expect.any(Number),
        title: "Cool guy",
        salary: 1000000000,
        equity: "0.9",
        company_handle: "c1"
      },
    ]);
  });
  test("works: filter title", async function () {
    let jobs = await Job.findAll({title: "Janitor"});
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "Janitor",
        salary: 2500,
        equity: "0",
        company_handle: "c2"
      }
    ]);
  });
  test("works: filter min", async function () {
    let companies = await Job.findAll({minSalary: 1000000});
    expect(companies).toEqual([
      {
        id: expect.any(Number),
        title: "CEO",
        salary: 9000000,
        equity: "0.05",
        company_handle: "c1"
      },
      {
        id: expect.any(Number),
        title: "Cool guy",
        salary: 1000000000,
        equity: "0.9",
        company_handle: "c1"
      },
    ]);
  });
});

/************************************** get */

describe("get", function () {
    const newJob = {
      title: "Mercenary",
      salary: 50000,
      equity: "0",
      company_handle: "c3",
    };
  test("works", async function () {
    let job = await Job.create(newJob);
    let jobCheck = await Job.get(job.id);
    expect(jobCheck).toEqual({
        id: expect.any(Number),
        title: "Mercenary",
        salary: 50000,
        equity: "0",
        company_handle: "c3",
    });
  });

  test("not found if no such Job", async function () {
    try {
      await Job.get(-890898);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {
  const updateData = {
    title: "New",
    salary: 90,
    equity: "1",
    company_handle: "c3"
  };

  test("works", async function () {
    let getAll = await Job.findAll();
    let job = await Job.update(getAll[0].id, updateData);
    expect(job).toEqual({
      id: job.id,
      ...updateData,
    });

    const result = await db.query(
          `SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE id = $1`, [job.id]);
    expect(result.rows).toEqual([{
      id: job.id,
      title: "New",
      salary: 90,
      equity: "1",
      company_handle: "c3"
    }]);
  });

  test("works: null fields", async function () {
    const updateDataSetNulls = {
      title: "New",
      salary: null,
      equity: null,
      company_handle: "c2",
    };
    let getAll = await Job.findAll();

    let job = await Job.update(getAll[0].id, updateDataSetNulls);
    expect(job).toEqual({
      id: getAll[0].id,
      ...updateDataSetNulls,
    });

    const result = await db.query(
          `SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE id = $1`, [getAll[0].id]);
    expect(result.rows).toEqual([{
      id: expect.any(Number),
      title: "New",
      salary: null,
      equity: null,
      company_handle: "c2",
    }]);
  });

  test("not found if no such Job", async function () {
    try {
      await Job.update(-90000, updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      await Job.update(1, {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    const newJob = {
      title: "Mercenary",
      salary: 50000,
      equity: "0",
      company_handle: "c3",
    };
    let job = await Job.create(newJob);
    let idtest = job.id;
    await Job.remove(idtest);
    const res = await db.query(
        "SELECT id FROM jobs WHERE id=$1", [idtest]);
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such Job", async function () {
    try {
      await Job.remove(-800000);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
