const express = require('express');
const router = express.Router();
const _ = require('underscore');
const request = require('request');
const xml2js = require('xml2js');
const db = require('../utils/db');

function processFilters (req, res, next) {
  req.filters = req.query.filters ? JSON.parse(req.query.filters) : null;
  var filterlist = [];

  if (_.findWhere(req.filters, {type: 'worktypes'})) {
    filterlist.push("works_new.work_data->>'type' = '" + _.findWhere(req.filters, {type: 'worktypes'}).ids.join("','") + "'");
  }

  if (_.findWhere(req.filters, {type: 'departments'})) {
    filterlist.push("groups.id = " + _.findWhere(req.filters, {type: 'departments'}).ids.toString());
  }

  if (_.findWhere(req.filters, {type: 'people'})) {
    filterlist.push("people.id = " + _.findWhere(req.filters, {type: 'people'}).ids.toString());
  }

  if (_.findWhere(req.filters, {type: 'years'})) {
    filterlist.push("works_new.work_data#>>'{issued,0,date-parts,0}' = " + _.findWhere(req.filters, {type: 'years'}).ids.toString());
  }

  if (_.findWhere(req.filters, {type: 'publications'})) {
    filterlist.push("works_new.work_publication = " + _.findWhere(req.filters, {type: 'publications'}).ids.toString());
  }

  if (_.findWhere(req.filters, {type: 'publishers'})) {
    filterlist.push("publishers.id = " + _.findWhere(req.filters, {type: 'publishers'}).ids.toString());
  }

  req.sqlfilters = (filterlist.length) ? filterlist.join(" AND ") : "TRUE";

  return next();
}

function getWorkTypeCount (req, res, next) {
  var filters = req.sqlfilters ? req.sqlfilters : "TRUE";

  db.run("SELECT works_new.work_data->>'type' as id, work_types.description AS fld, COUNT(distinct works_new.work_id) AS cnt FROM works_new LEFT JOIN publications ON publications.id = works_new.work_publication LEFT JOIN publishers ON publications.publisher_id = publishers.id LEFT JOIN work_types on work_types.type=works_new.work_data->>'type', UNNEST(works_new.work_contributors) AS person_id LEFT JOIN people on people.id = person_id LEFT JOIN memberships ON people.id = memberships.people_id LEFT JOIN groups ON memberships.group_id = groups.id WHERE " + filters + " GROUP BY works_new.work_data->>'type', work_types.description ORDER BY cnt DESC", function(err, results) {
    if (err || !results.length) {
      return next(err);
    }

    req.filter_worktypes = results;
    return next();
  });
}

function getDeptWorkCount (req, res, next) {
  var filters = req.sqlfilters ? req.sqlfilters : "TRUE";

  db.run("SELECT groups.id, groups.name AS fld, COUNT(distinct works_new.work_id) AS cnt FROM works_new LEFT JOIN publications ON publications.id = works_new.work_publication LEFT JOIN publishers ON publications.publisher_id = publishers.id LEFT JOIN work_types on work_types.type=works_new.work_data->>'type', UNNEST(works_new.work_contributors) AS person_id  JOIN people ON people.id = person_id LEFT JOIN memberships ON people.id = memberships.people_id LEFT JOIN groups ON memberships.group_id = groups.id WHERE " + filters + " AND groups.hidden = false GROUP BY groups.id, groups.name ORDER BY cnt DESC", function(err, results) {
    if (err || !results.length) {
      return next(err);
    }

    req.filter_deptworks = results;
    return next();
  });
}

function getPeopleWorkCount (req, res, next) {
  var filters = req.sqlfilters ? req.sqlfilters : "TRUE";

  db.run("SELECT people.id, CONCAT_WS(', ', last_name, first_name) AS fld, COUNT(distinct works_new.work_id) AS cnt FROM works_new LEFT JOIN publications ON publications.id = works_new.work_publication LEFT JOIN publishers ON publications.publisher_id = publishers.id LEFT JOIN work_types on work_types.type=works_new.work_data->>'type', UNNEST(works_new.work_contributors) AS person_id JOIN people on people.id = person_id LEFT JOIN memberships ON people.id = memberships.people_id LEFT JOIN groups ON memberships.group_id = groups.id WHERE " + filters + " GROUP BY people.id, fld ORDER BY cnt DESC", function(err, results) {
    if (err || !results.length) {
      return next(err);
    }

    req.filter_peopleworks = results;
    return next();
  });
}

function getYearWorkCount (req, res, next) {
  var filters = req.sqlfilters ? req.sqlfilters : "TRUE";

  db.run("SELECT work_data#>>'{issued,0,date-parts,0}' AS id, work_data#>>'{issued,0,date-parts,0}' AS fld, COUNT(distinct works_new.work_id) AS cnt FROM works_new LEFT JOIN publications ON publications.id = works_new.work_publication LEFT JOIN publishers ON publications.publisher_id = publishers.id LEFT JOIN work_types on work_types.type=works_new.work_data->>'type', UNNEST(works_new.work_contributors) AS person_id LEFT JOIN people on people.id = person_id LEFT JOIN memberships ON people.id = memberships.people_id LEFT JOIN groups ON memberships.group_id = groups.id WHERE " + filters + " GROUP BY work_data#>>'{issued,0,date-parts,0}' ORDER BY work_data#>>'{issued,0,date-parts,0}' DESC", function(err, results) {
    if (err || !results.length) {
      return next(err);
    }

    req.filter_yearworks = results;
    return next();
  });
}

function getPublicationWorkCount (req, res, next) {
  var filters = req.sqlfilters ? req.sqlfilters : "TRUE";

  db.run("SELECT publications.id, publications.name AS fld, COUNT(distinct works_new.work_id) AS cnt FROM works_new LEFT JOIN publications ON publications.id = works_new.work_publication LEFT JOIN publishers ON publications.publisher_id = publishers.id LEFT JOIN work_types on work_types.type=works_new.work_data->>'type', UNNEST(works_new.work_contributors) AS person_id LEFT JOIN people on people.id = person_id LEFT JOIN memberships ON people.id = memberships.people_id LEFT JOIN groups ON memberships.group_id = groups.id WHERE " + filters + " AND publications.name <> 'Unknown' GROUP BY publications.id, publications.name ORDER BY cnt DESC", function(err, results) {
    if (err || !results.length) {
      return next(err);
    }

    req.filter_publicationworks = results;
    return next();
  });
}

function getPublisherWorkCount (req, res, next) {
  var filters = req.sqlfilters ? req.sqlfilters : "TRUE";

  db.run("SELECT publishers.id, publishers.name AS fld, COUNT(distinct works_new.work_id) AS cnt FROM works_new LEFT JOIN publications ON publications.id = works_new.work_publication LEFT JOIN publishers ON publications.publisher_id = publishers.id LEFT JOIN work_types on work_types.type=works_new.work_data->>'type', UNNEST(works_new.work_contributors) AS person_id LEFT JOIN people on people.id = person_id LEFT JOIN memberships ON people.id = memberships.people_id LEFT JOIN groups ON memberships.group_id = groups.id WHERE " + filters + " AND publishers.sort_name <> 'unknown' AND publications.sort_name <> 'unknown' GROUP BY publishers.id, publishers.name ORDER BY cnt DESC", function(err, results) {
    if (err || !results.length) {
      return next(err);
    }

    req.filter_publisherworks = results;
    return next();
  });
}

function getWorksList(req, res, next) {
  var limit = req.query.limit || 10;
  var offset = req.query.page ? (req.query.page - 1) * limit : 0;
  var filters = req.sqlfilters ? req.sqlfilters : "TRUE";

  db.run("SELECT DISTINCT works_new.work_id, work_data, description as work_type, work_contributors, publications.name as publication, publications.id as pubid, identifier, identifier_type, alt_identifier, alt_identifier_type, archive_url FROM works_new LEFT JOIN publications ON publications.id = works_new.work_publication LEFT JOIN publishers ON publications.publisher_id = publishers.id LEFT JOIN work_types on work_types.type=works_new.work_data->>'type', UNNEST(works_new.work_contributors) AS person_id LEFT JOIN people on people.id = person_id LEFT JOIN memberships ON people.id = memberships.people_id LEFT JOIN groups ON memberships.group_id = groups.id WHERE " + filters + " ORDER BY work_data#>>'{issued,0,date-parts,0}' DESC, works_new.work_id DESC LIMIT $1 OFFSET $2", [limit, offset], function(err, results) {
    if (err || !results.length) {
      return next(err);
    }

    req.works_list = results;
    return next();
  });
}

function getWorksCount(req, res, next) {
  var filters = req.sqlfilters ? req.sqlfilters : "TRUE";

  db.run("SELECT COUNT(DISTINCT works_new.work_id) as total_works FROM works_new LEFT JOIN publications ON publications.id = works_new.work_publication LEFT JOIN publishers ON publications.publisher_id = publishers.id LEFT JOIN work_types on work_types.type=works_new.work_data->>'type', UNNEST(works_new.work_contributors) AS person_id LEFT JOIN people on people.id = person_id LEFT JOIN memberships ON people.id = memberships.people_id LEFT JOIN groups ON memberships.group_id = groups.id WHERE " + filters, function(err, results) {
    if (err || !results.length) {
      return next(err);
    }

    req.total_works = results[0].total_works;
    return next();
  });
}

function getWorksImages (req, res, next) {
  var nconf = req.app.get('nconf');

  var idents = _.map(req.works_list, function(work) {
    return work.identifier ? work.identifier.replace(/-/g, '') : 'null';
  });

  request.get(nconf.get('images:covimgsrv') + idents.join(','), function(err, res, body) {
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
  var limit = req.query.limit || 10;
  var page_count = Math.ceil(req.total_works / limit);
  var cur_page = req.query.page || 1;
  var offset = (cur_page - 1) * limit;

  res.render('works', {
    appconf: nconf.get(),
    title: nconf.get('customtext:appname') + " - Works",
    filter_worktypes: req.filter_worktypes,
    filter_deptworks: req.filter_deptworks,
    filter_peopleworks: req.filter_peopleworks,
    filter_yearworks: req.filter_yearworks,
    filter_publicationworks: req.filter_publicationworks,
    filter_publisherworks: req.filter_publisherworks,
    total_works: req.total_works,
    works_list: req.works_list,
    applied_filters: req.filters,
    filter_string: req.query.filters,
    limit: limit,
    page_count: page_count,
    cur_page: cur_page,
    offset: offset,
    cur_list: req.baseUrl,
    user: req.user
  });
}

function getWorkDetail(req, res, next) {
  var work_id = req.params.id;

  db.run("SELECT works_new.work_id, work_data, description as work_type, work_contributors, publications.name as publication, work_publication as pubid, publishers.name as publisher, publishers.id as publisherid, identifier, identifier_type, alt_identifier, alt_identifier_type, archive_url, archived_at FROM works_new LEFT JOIN publications ON publications.id = works.publication_id LEFT JOIN work_types on work_types.type=works_new.work_data->>'type' LEFT JOIN publishers ON publishers.id = publications.publisher_id WHERE works_new.work_id = $1", [work_id], function(err, results) {
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
    request.get(nconf.get('images:covimgsrv') + wi, function(err, res, body) {
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

function getRomeoDetails (req, res, next) {
  var nconf = req.app.get('nconf');
  var romeourl = nconf.get('romeo:romeourl') + process.env.ROMEO_API_KEY;

  if (req.work_detail.identifier_type && req.work_detail.identifier_type === 'ISSN') {
    request.get(romeourl + '&issn=' + req.work_detail.identifier, function(err, res, body) {
      if (err) {
        return next(err);
      }

      xml2js.parseString(body, function(err, result) {
        if (err) {
          return next(err);
        }

        req.romeo = {};
        req.romeo.numhits = result.romeoapi.header[0].numhits[0];
        if (req.romeo.numhits > 0) {
          req.romeo.publisher = result.romeoapi.publishers[0].publisher[0];
        }
        return next();
      });
    });
  } else {
    return next();
  }
}

function renderWorkDetail(req, res) {
  var nconf = req.app.get('nconf');

  if (req.work_detail.url && req.work_detail.url.match(/^10/)) {
    req.work_detail.url = 'http://dx.doi.org/' + req.work_detail.url;
  }

  res.render('work_detail', {
    appconf: nconf.get(),
    title: nconf.get('customtext:appname') + " - Work: " + req.work_detail.work_title,
    work_detail: req.work_detail,
    coverimage: req.coverimage,
    romeo: req.romeo,
    user: req.user
  });
}

function getRssResults(req, res, next) {
  var limit = req.query.limit || 10;

  db.run("SELECT DISTINCT works_new.work_id, work_data, work_contributors, publications.name as pubname, publications.id as pubid, works_new.updated_at, works_new.created_at FROM works_new JOIN publications ON publications.id = works.publication_id JOIN work_types on work_types.type=works_new.work_data->>'type' ORDER BY works_new.created_at DESC, works_new.work_id DESC LIMIT $1", [limit], function(err, results) {
    if (err || !results.length) {
      return next(err);
    }

    req.feed_detail = results;
    return next();
  });
}

function renderRssFeed(req, res) {
  var nconf = req.app.get('nconf');

  res.render('rss', {
    appconf: nconf.get(),
    title: nconf.get('customtext:appname') + ": Latest Works",
    feed_link: req.protocol + '://' + req.get('host') + req.originalUrl,
    feed_detail: req.feed_detail
  });
}

router.get('/', processFilters, getWorkTypeCount, getDeptWorkCount, getPeopleWorkCount, getYearWorkCount, getPublicationWorkCount, getPublisherWorkCount, getWorksList, getWorksCount, getWorksImages, renderWorksList);
router.get('/rss', getRssResults, renderRssFeed);
router.get('/:id', getWorkDetail, getSingleImage, getRomeoDetails, renderWorkDetail);

module.exports = router;
