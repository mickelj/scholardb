const express = require('express');
const router = express.Router();
const _ = require('underscore');
const request = require('request');

function getWorkTypeCount (req, res, next) {
  var db = req.app.get('db');
  db.run("SELECT type, description AS fld, COUNT(type) AS cnt FROM works JOIN work_types USING (type) GROUP BY type, description ORDER BY count(description) DESC", function(err, results) {
    if (err || !results.length) {
      return next(err);
    }

    req.filter_worktypes = results;
    return next();
  });
}

function getDeptWorkCount (req, res, next) {
  var db = req.app.get('db');
  db.run("SELECT groups.id, groups.name AS fld, COUNT(works.id) AS cnt FROM works, JSONB_TO_RECORDSET(works.contributors) AS w(person_id int) LEFT JOIN people p ON p.id = person_id, groups JOIN UNNEST(p.group_membership) AS group_id ON group_id = groups.id WHERE groups.hidden = false GROUP BY groups.id, groups.name ORDER BY COUNT(works.id) DESC", function(err, results) {
    if (err || !results.length) {
      return next(err);
    }

    req.filter_deptworks = results;
    return next();
  });
}

function getPeopleWorkCount (req, res, next) {
  var db = req.app.get('db');
  db.run("SELECT p.id, CONCAT_WS(', ', last_name, first_name) AS fld, COUNT(works.id) AS cnt FROM works, JSONB_TO_RECORDSET(works.contributors) AS w(person_id int) JOIN people p on p.id = person_id GROUP BY p.id, fld ORDER BY COUNT(works.id) DESC;", function(err, results) {
    if (err || !results.length) {
      return next(err);
    }

    req.filter_peopleworks = results;
    return next();
  });
}

function getYearWorkCount (req, res, next) {
  var db = req.app.get('db');
  db.run("SELECT publication_date_year AS fld, COUNT(id) AS cnt FROM works GROUP BY publication_date_year ORDER BY publication_date_year DESC", function(err, results) {
    if (err || !results.length) {
      return next(err);
    }

    req.filter_yearworks = results;
    return next();
  });
}

function getPublicationWorkCount (req, res, next) {
  var db = req.app.get('db');
  db.run("SELECT publications.id, name AS fld, COUNT(works.id) AS cnt FROM works JOIN publications ON publications.authority_id = works.publication_id WHERE name <> 'Unknown' GROUP BY publications.id, name ORDER BY COUNT(works.id) DESC", function(err, results) {
    if (err || !results.length) {
      return next(err);
    }

    req.filter_publicationworks = results;
    return next();
  });
}

function getPublisherWorkCount (req, res, next) {
  var db = req.app.get('db');
  db.run("SELECT publishers.id, publishers.name AS fld, COUNT(works.id) AS cnt FROM works JOIN publications ON publications.authority_id = works.publication_id JOIN publishers ON publishers.id = publications.publisher_id WHERE publishers.sort_name <> 'unknown' AND publications.sort_name <> 'unknown' GROUP BY publishers.id, publishers.name ORDER BY COUNT(works.id) DESC", function(err, results) {
    if (err || !results.length) {
      return next(err);
    }

    req.filter_publisherworks = results;
    return next();
  });
}

function getWorksCount(req, res, next) {
  var db = req.app.get('db');
  db.run("SELECT count(*) as total_works FROM works", function(err, results) {
    if (err || !results.length) {
      return next(err);
    }

    req.total_works = results[0].total_works;
    return next();
  });
}

function getWorksList(req, res, next) {
  var db = req.app.get('db');
  var limit = req.query.limit ? req.query.limit : 10;
  var offset = req.query.page ? (req.query.page - 1) * limit : 0;
  var filters = req.query.filters ? JSON.parse(req.query.filters) : null;
  var filterlist = [];

  if (_.findWhere(filters, {type: 'worktype'})) {
    filterlist.push("works.type IN ('" + _.findWhere(filters, {type: 'worktype'}).ids.join("','") + "')");
  }

  if (_.findWhere(filters, {type: 'people'})) {
    var people = "works.contributors @> ANY(ARRAY[";
    var idlist = [];
    _.findWhere(filters, {type: 'people'}).ids.forEach(function (id) {
      idlist.push("'[{\"person_id\" : " + id + "}]'");
    });
    people += idlist.join(",") + "]::jsonb[])";
    filterlist.push(people);
  }

  if (_.findWhere(filters, {type: 'year'})) {
    filterlist.push("works.publication_date_year IN (" + _.findWhere(filters, {type: 'year'}).ids.toString() + ")");
  }

  if (_.findWhere(filters, {type: 'publications'})) {
    filterlist.push("works.publication_id IN (" + _.findWhere(filters, {type: 'publications'}).ids.toString() + ")");
  }

  if (_.findWhere(filters, {type: 'publishers'})) {
    filterlist.push("publishers.id IN (" + _.findWhere(filters, {type: 'publishers'}).ids.toString() + ")");
  }

  filters = (filterlist.length) ? filterlist.join(" AND ") : "TRUE";

  db.run("SELECT works.id, title_primary as work_title, title_secondary, title_tertiary, description as work_type, contributors, publications.name as publication, publications.id as pubid, pi.identifier, publication_date_year as year FROM works LEFT JOIN publications ON publications.id = works.publication_id LEFT JOIN publishers ON publications.publisher_id = publishers.id LEFT JOIN work_types USING (type) LEFT JOIN LATERAL (select identifier from publications p2, JSONB_TO_RECORDSET(identifiers) as w(type text, identifier text) WHERE p2.id = publications.id AND type LIKE 'ISBN%') pi ON TRUE WHERE $3 ORDER BY publication_date_year DESC, works.id DESC LIMIT $1 OFFSET $2", [limit, offset, filters], function(err, results) {
    if (err || !results.length) {
      return next(err);
    }

    req.works_list = results;
    return next();
  });
}

function getWorksImages (req, res, next) {
  var nconf = req.app.get('nconf');

  var idents = _.map(req.works_list, function(work) {
    return work.identifier ? work.identifier.replace(/-/g, '') : 'null';
  });

  request.get(nconf.get('application:ccurlbase') + idents.join(','), function(err, res, body) {
    if (err) {
      return next(err);
    }

    imgobj = JSON.parse(body);

    _.map(req.works_list, function(work) {
      var wi = (work.identifier ? work.identifier.replace(/-/g, '') : null);
      work.coverimage = (wi in imgobj ? imgobj[wi] : null);
    });

    return next();
  });
}

function renderWorksList (req, res) {
  var nconf = req.app.get('nconf');

  var limit = req.query.limit ? req.query.limit : 10;
  var page_count = Math.ceil(req.total_works / limit);
  var cur_page = req.query.page ? req.query.page : 1;
  var offset = (cur_page - 1) * limit;

  res.render('works', {
    appconf: nconf.get('application'),
    title: nconf.get('application:appname') + " - Works",
    filter_worktypes: req.filter_worktypes,
    filter_deptworks: req.filter_deptworks,
    filter_peopleworks: req.filter_peopleworks,
    filter_yearworks: req.filter_yearworks,
    filter_publicationworks: req.filter_publicationworks,
    filter_publisherworks: req.filter_publisherworks,
    total_works: req.total_works,
    works_list: req.works_list,
    limit: limit,
    page_count: page_count,
    cur_page: cur_page,
    offset: offset,
    cur_list: req.baseUrl
  });
}

function getWorkDetail(req, res, next) {
  var db = req.app.get('db');
  var work_id = req.params.id;

  db.run("SELECT works.id, title_primary as work_title, title_secondary, title_tertiary, description as work_type, contributors, publications.name as publication, publications.authority_id as pubid, publishers.name as publisher, publishers.id as publisherid, publication_date_year as year, volume, issue, start_page, end_page, location, works.url, pi.identifier FROM works LEFT JOIN publications ON publications.id = works.publication_id LEFT JOIN work_types USING (type) LEFT JOIN publishers ON publishers.id = publications.publisher_id LEFT JOIN LATERAL (select identifier from publications p2, JSONB_TO_RECORDSET(identifiers) as w(type text, identifier text) WHERE p2.id = publications.id AND type LIKE 'ISBN%') pi ON TRUE WHERE works.id = $1", [work_id], function(err, results) {
    if (err || !results.length) {
      return next(err);
    }

    req.work_detail = results[0];
    return next();
  });
}

function getSingleImage (req, res, next) {
  var nconf = req.app.get('nconf');
  var wi = req.work_detail.identifier ? req.work_detail.identifier.replace(/-/g, '') : null;

  if (wi) {
    request.get(nconf.get('application:ccurlbase') + wi, function(err, res, body) {
      if (err) {
        return next(err);
      }

      imgobj = JSON.parse(body);
      req.coverimage = (wi in imgobj ? imgobj[wi] : null);
      return next();
    });
  } else {
    req.coverimage = null;
    return next();
  }
}

function renderWorkDetail(req, res) {
  var nconf = req.app.get('nconf');

  if (req.work_detail.url.match(/^10/)) {
    var url = 'http://dx.doi.org/' + req.work_detail.url;
  } else {
    var url = req.work_detail.url;
  }

  res.render('work_detail', {
    appconf: nconf.get('application'),
    title: nconf.get('application:appname') + " - Work: " + req.work_detail.work_title,
    work_detail: req.work_detail,
    coverimage: req.coverimage,
    url: url
  });
}

router.get('/', getWorkTypeCount, getDeptWorkCount, getPeopleWorkCount, getYearWorkCount, getPublicationWorkCount, getPublisherWorkCount, getWorksCount, getWorksList, getWorksImages, renderWorksList);

router.get('/:id', getWorkDetail, getSingleImage, renderWorkDetail);

module.exports = router;
