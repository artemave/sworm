var promisify = require('./promisify');
var optionalRequire = require("./optionalRequire");
var debug = require('debug')('sworm:mysql');
var paramRegex = require('./paramRegex')

module.exports = function() {
  var mysql = optionalRequire("mysql");

  return {
    query: function(query, params) {
      var self = this;
      var paramList = [];

      if (params) {
        query = query.replace(paramRegex, function(_, paramName) {
          if (!params.hasOwnProperty(paramName)) {
            throw new Error('no such parameter @' + paramName);
          } else {
            paramList.push(params[paramName]);
          }
          return '?';
        });
      }

      return promisify(function(cb) {
        debug(query, paramList);
        return self.connection.query(query, paramList, cb);
      });
    },

    insert: function(query, params) {
      return this.query(query + "; select last_insert_id() as id", params).then(function (rows) {
        return rows[1][0].id;
      });
    },

    connect: function(config) {
      var self = this;

      config.config.multipleStatements = true;
      self.connection = mysql.createConnection(config.config);

      return promisify(function(cb) {
        return self.connection.connect(cb);
      });
    },

    close: function() {
      var self = this;
      return promisify(function (cb) { self.connection.end(cb); });
    },

    insertEmpty: function(table) {
      return 'insert into ' + table + ' () values ()';
    }
  };
};
