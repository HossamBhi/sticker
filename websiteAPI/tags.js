const { connection, mysql } = require("../config");
const { unlink } = require("fs");

const removeImageFromServer = (path) =>
  unlink(path, (err) => {
    if (err) console.log(err);
    console.log("successfully deleted " + path);
  });

const getAll = () =>
  new Promise((res) => {
    connection.query(`SELECT * FROM tags`, (err, result) => {
      if (err) throw err;
      res(result);
    });
  });

const edit = (id, tag) =>
  new Promise((res) => {
    const { ar_name, en_name, tag_image } = tag;
    connection.query(
      `UPDATE tags SET ar_name = ${mysql.escape(
        ar_name
      )}, en_name = ${mysql.escape(en_name)} ${
        tag_image === false ? "" : `, tag_image = ${mysql.escape(tag_image)} `
      }
      WHERE tag_id = ${mysql.escape(id)}`,
      (err, result) => {
        if (err) throw err;
        getTag(id).then((t) => res(t));
      }
    );
  });

const getTag = (id) =>
  new Promise((res) => {
    connection.query(
      `SELECT * FROM tags WHERE tag_id = ? `,
      [id],
      (err, result) => {
        if (err) throw err;
        res(result[0]);
      }
    );
  });

const remove = (id) =>
  new Promise((res) => {
    getTag(id).then(({ tag_image }) => {
      connection.query(
        `DELETE FROM tags WHERE tag_id = ?`,
        [id],
        (err, result) => {
          if (err) throw err;
          tag_image && removeImageFromServer(tag_image);
          result.affectedRows !== 0
            ? res({ message: "Tag deleted successfuly." })
            : res({ message: "Tag not found." });
        }
      );
    });
  });

const add = (tag) => {
  return new Promise((res) => {
    console.log("tag: ", tag);
    const { ar_name, en_name, tag_image } = tag;
    const VALUES = [[ar_name, en_name, tag_image]];
    connection.query(
      `INSERT INTO tags (ar_name, en_name, tag_image) VALUES ? `,
      [VALUES],
      (err, result) => {
        if (err) throw err;
        const { insertId } = result;
        connection.query(
          `SELECT * FROM tags WHERE tag_id = ? `,
          [insertId],
          (err, result) => {
            if (err) throw err;
            res(result[0]);
          }
        );
      }
    );
  });
};

module.exports = {
  getAll,
  edit,
  remove,
  add,
};
