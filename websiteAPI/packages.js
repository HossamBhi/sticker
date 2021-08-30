const { unlink } = require("fs");
const rimraf = require("rimraf");
const { clearInterval } = require("timers");
const { connection, mysql } = require("../config");

const getTagsForPackages = (ids) =>
  new Promise((res) => {
    connection.query(
      `SELECT * FROM tags WHERE tag_id IN (${ids})`,
      (err, result) => {
        if (err) throw err;
        res(result);
      }
    );
  });
const getFullPackageDetails = (packages) =>
  new Promise((res) => {
    let isDone = 0;
    let len = packages.length * 2;
    packages.map((pack, i) => {
      if (pack.tags) {
        getTagsForPackages(pack.tags).then((p) => {
          packages[i].tags = p;
          isDone++;
        });
      } else {
        packages[i].tags = [];
        isDone++;
      }
      getItemsByPackageId(pack.category_id).then((p) => {
        packages[i].stickers = p;
        isDone++;
      });
    });
    let interval = setInterval(() => {
      if (isDone === len) {
        clearInterval(interval);
        res(packages);
      }
    });
  });

const getAll = () =>
  new Promise((res) => {
    connection.query(`SELECT * FROM packages`, async (err, packages) => {
      if (err) throw err;
      getFullPackageDetails(packages).then((ps) => res(ps));
    });
  });

const getPack = (id) =>
  new Promise((res) => {
    connection.query(
      `SELECT * FROM packages WHERE category_id = ?`,
      [id],
      (err, result) => {
        if (err) throw err;
        res(result);
      }
    );
  });

const getItemsByPackageId = (id) =>
  new Promise((res) => {
    connection.query(
      `SELECT * FROM items WHERE category_id = ?`,
      [id],
      (err, result) => {
        if (err) throw err;
        res(result);
      }
    );
  });

const remove = (id) =>
  new Promise((res) => {
    getPack(id).then((pack) => {
      connection.query(
        `DELETE FROM packages WHERE category_id = ?`,
        [id],
        async (err, result) => {
          if (err) throw err;
          // delete package image
          unlink(pack[0].category_image, (err) => {
            if (err) console.log(err);
            console.log("successfully deleted " + pack[0].category_image);
          });

          connection.query(
            `DELETE FROM items WHERE category_id = ?`,
            [id],
            (err, result) => {
              if (err) throw err;
              console.log("result: ", result);
              //  delete folder of package deleted
              rimraf(`uploads/${id}`, function () {
                console.log("successfully deleted uploads/" + id);
              });
              result.affectedRows !== 0
                ? res({ message: "Category deleted successfuly." })
                : res({ message: "Category not found." });
            }
          );
        }
      );
    });
  });

const edit = (id, category) =>
  new Promise((res) => {
    let { category_name, category_image, premium, price, tags } = category;
    premium =
      premium == 0 || premium == false || premium == "false" ? false : true;
    let sql = `UPDATE packages SET category_name = ${mysql.escape(
      category_name
    )}, tags = ${mysql.escape(tags)}, ${
      category_image === false
        ? ""
        : `category_image = ${mysql.escape(category_image)}, `
    }premium = ${premium}, price = ${
      price == null ? 0 : price
    } WHERE category_id = ${id}`;

    connection.query(sql, (err, result) => {
      if (err) throw err;
      // res(result);
      result.affectedRows !== 0
        ? res({ message: "Package changes successfuly." })
        : res({ message: "Package not found." });
    });
  });

const add = (category) =>
  new Promise((res) => {
    let { category_name, category_image, premium, price, tags } = category;
    premium =
      premium == 0 || premium == false || premium == "false" ? false : true;
    const VALUES = [
      [category_name, category_image, premium, price == null ? 0 : price, tags],
    ];
    connection.query(
      `INSERT INTO packages (category_name, category_image, premium, price, tags) VALUES ? `,
      [VALUES],
      (err, result) => {
        if (err) throw err;
        const { insertId } = result;
        connection.query(
          `SELECT * FROM packages WHERE category_id = ? `,
          [insertId],
          (err, result) => {
            if (err) throw err;
            getFullPackageDetails(result).then((ps) => res(ps[0]));
          }
        );
      }
    );
  });

const addItems = async (categoryId, items) =>
  new Promise(async (res) => {
    let VALUES = [];
    await items.map((item) =>
      VALUES.push([item.filename, item.path, categoryId])
    );
    connection.query(
      `INSERT INTO items (item_name, item_image, category_id) VALUES ? `,
      [VALUES],
      (err, result) => {
        if (err) throw err;
        res(result);
      }
    );
  });

const removeItem = (id) =>
  new Promise((res) => {
    connection.query(
      `DELETE FROM items WHERE item_id = ?`,
      [id],
      (err, result) => {
        if (err) throw err;
        result.affectedRows !== 0
          ? res({ message: "Item deleted successfuly." })
          : res({ message: "Item not found." });
      }
    );
  });

module.exports = {
  getAll,
  getItemsByPackageId,
  remove,
  edit,
  add,
  addItems,
  removeItem,
};
