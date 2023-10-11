"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  adminToken,
} = require("./_testCommon");
const Job = require("../models/job");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /companies */

describe("POST /jobs", function () {
  const newJob = {
    title: "new",
    salary: 1000,
    equity: 0.5,
    company_handle: "c1",
  };

  test("ok for admins", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      job: {...newJob,equity: "0.5",id: expect.any(Number)},
    });
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          title: "new",
          salary: 10,
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          ...newJob,
          equity: "I'm not a number LMAO",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /companies */

describe("GET /jobs", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual({
      job:
          [
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
          ],
    });
  });

  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE jobs CASCADE");
    const resp = await request(app)
        .get("/jobs")
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(500);
  });
});

/************************************** GET /companies/:handle */

describe("GET /jobs/:id", function () {
  test("works for anon", async function () {
    let jobList = await Job.findAll();
    let idtest = jobList[0].id;
    const resp = await request(app).get(`/jobs/${idtest}`);
    expect(resp.body).toEqual({
      job: {
        id: jobList[0].id,
        title: jobList[0].title,
        salary: jobList[0].salary,
        equity: jobList[0].equity,
        company_handle: jobList[0].company_handle,
      },
    });
  });

  test("not found for no such job", async function () {
    const resp = await request(app).get(`/jobs/-99`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /companies/:handle */

describe("PATCH /jobs/:id", function () {
  test("works for admins", async function () {
    let jobList = await Job.findAll();
    let idtest = jobList[0].id;
    console.log(jobList);
    const resp = await request(app)
        .patch(`/jobs/${idtest}`)
        .send({
          title: "Teacher",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({
      job: {
        id: jobList[0].id,
        title: "Teacher",
        salary: jobList[0].salary,
        equity: jobList[0].equity,
        company_handle: jobList[0].company_handle,
      },
    });
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .patch(`/jobs/1`)
        .send({
          name: "C1-new",
        });
    expect(resp.statusCode).toEqual(401);
  });

  test("not found on no such job", async function () {
    const resp = await request(app)
        .patch(`/jobs/-99`)
        .send({
          title: "new nope",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request on handle change attempt", async function () {
    let jobList = await Job.findAll();
    let idtest = jobList[0].id;
    const resp = await request(app)
        .patch(`/jobs/${idtest}`)
        .send({
          company_handle: "c1-new",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on invalid data", async function () {
    let jobList = await Job.findAll();
    let idtest = jobList[0].id;
    const resp = await request(app)
        .patch(`/jobs/${idtest}`)
        .send({
          salary: "not-an-integer",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /companies/:handle */

describe("DELETE /jobs/:id", function () {
  test("works for admin", async function () {
    let jobList = await Job.findAll();
    let idtest = jobList[0].id;
    const resp = await request(app)
        .delete(`/jobs/${idtest}`)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({ deleted: idtest });
  });

  test("unauth for anon", async function () {
    let jobList = await Job.findAll();
    let idtest = jobList[0].id;
    const resp = await request(app)
        .delete(`/jobs/${idtest}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such job", async function () {
    const resp = await request(app)
        .delete(`/jobs/-99`)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });
});
