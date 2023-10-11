const db = require("../db");
const { BadRequestError, NotFoundError, ExpressError } = require("../expressError");
const {sqlForPartialUpdate} = require("../helpers/sql");

class Job{
    /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ title, salary, equity, company_handle }) {
    const result = await db.query(
          `INSERT INTO jobs
           (title, salary, equity, company_handle)
           VALUES ($1, $2, $3, $4)
           RETURNING id, title, salary, equity, company_handle`,
        [
          title,
          salary,
          equity,
          company_handle
        ],
    );
    const job = result.rows[0];

    return job;
  }

  /** Find all companies.
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */

  static async findAll(filts= {}) {
    let addsql = "";
    let iter = 1;
    let filters = [];
    //adds where filters if applicable errors at min max mismatch
    if(filts){
      if(filts.title){
        addsql = `${addsql} WHERE title ILIKE $${iter}`;
        filters.push(`%${filts.title}%`);
        iter++;
      }
      if(filts.minSalary){
        (addsql != "") ? addsql = `${addsql} AND` : addsql = "WHERE";
        addsql = `${addsql} salary >= $${iter}`;
        iter++;
        filters.push(`${filts.minSalary}`);
      }
      if(filts.hasEquity){
        if(filts.hasEquity == true){
            (addsql != "") ? addsql = `${addsql} AND` : addsql = "WHERE";
            addsql = `${addsql} equity > $${iter}`;
            iter++;
            filters.push(`0`);
            }
        }
        if(filts.company_handle){
          (addsql != "") ? addsql = `${addsql} AND` : addsql = "WHERE";
          addsql = `${addsql} company_handle ILIKE $${iter}`;
          filters.push(`%${filts.company_handle}%`);
          iter++;
        }
    }
    const jobsRes = await db.query(
          `SELECT id, title, salary, equity, company_handle
           FROM jobs
           ${addsql} `, filters);
    return jobsRes.rows;
  }

  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(id) {
    const jobRes = await db.query(
          `SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE id = $1`,
        [id]);

    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`No job ID: ${id}`);

    return job;
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {});
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE id = ${handleVarIdx} 
                      RETURNING id, title, salary, equity, company_handle`;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job ID: ${id}`);

    return job;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(id) {
    const result = await db.query(
          `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`,
        [id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job ID: ${id}`);
    return job;
  }
}

module.exports = Job;