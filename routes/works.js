const express = require('express');
const router = express.Router();

function getWorkTypeCount (req, res, next) {
  var db = req.app.get('db');
  db.run("SELECT description AS fld, COUNT(type) AS cnt FROM works JOIN work_types USING (type) GROUP BY description ORDER BY count(description) DESC", function(err, results) {
    if (err || !results.length) {
      return next(err);
    }

    req.filter_worktypes = results;
    return next();
  });
}

function getDeptWorkCount (req, res, next) {
  var db = req.app.get('db');
  db.run("SELECT groups.name AS fld, COUNT(works.id) AS cnt FROM works, JSONB_TO_RECORDSET(works.contributors) AS w(person_id int) LEFT JOIN people p ON p.id = person_id, groups JOIN UNNEST(p.group_membership) AS group_id ON group_id = groups.id WHERE groups.hidden = false GROUP BY groups.name ORDER BY COUNT(works.id) DESC", function(err, results) {
    if (err || !results.length) {
      return next(err);
    }

    req.filter_deptworks = results;
    return next();
  });
}

function getPeopleWorkCount (req, res, next) {
  var db = req.app.get('db');
  db.run("SELECT CONCAT_WS(', ', last_name, first_name) AS fld, COUNT(works.id) AS cnt FROM works, JSONB_TO_RECORDSET(works.contributors) AS w(person_id int) JOIN people p on p.id = person_id GROUP BY fld ORDER BY COUNT(works.id) DESC;", function(err, results) {
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
  db.run("SELECT name AS fld, COUNT(works.id) AS cnt FROM works JOIN publications ON publications.id = works.publication_id WHERE name <> 'Unknown' GROUP BY name ORDER BY COUNT(works.id) DESC", function(err, results) {
    if (err || !results.length) {
      return next(err);
    }

    req.filter_publicationworks = results;
    return next();
  });
}

function getPublisherWorkCount (req, res, next) {
  var db = req.app.get('db');
  db.run("SELECT publishers.name AS fld, COUNT(works.id) AS cnt FROM works JOIN publications ON publications.id = works.publication_id JOIN publishers ON publishers.id = publications.publisher_id WHERE publishers.name <> 'Unknown' AND publications.name <> 'Unknown' GROUP BY publishers.name ORDER BY COUNT(works.id) DESC", function(err, results) {
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

    req.works_count = results;
    return next();
  })
}

function getWorksList(req, res, next) {
  var db = req.app.get('db');
  var limit = req.query.limit ? req.query.limit : 10;
  var offset = req.query.page ? (req.query.page - 1) * limit : 0;
  //db.run("SELECT works.id, title_primary as work_title, description as work_type, (select string_agg(display_name, '; ') from jsonb_to_recordset(contributors) as x(display_name text)) as contributors, name as publication, publication_date_year as year FROM works JOIN publications ON publications.id = works.publication_id JOIN work_types USING (type) ORDER BY publication_date_year DESC, works.id DESC LIMIT $1 OFFSET $2", [limit, offset], function(err, results) {
  db.run("SELECT works.id, title_primary as work_title, description as work_type, contributors, name as publication, publications.id as pubid, publication_date_year as year FROM works JOIN publications ON publications.id = works.publication_id JOIN work_types USING (type) ORDER BY publication_date_year DESC, works.id DESC LIMIT $1 OFFSET $2", [limit, offset], function(err, results) {
    if (err || !results.length) {
      return next(err);
    }

    req.works_list = results;
    return next();
  });
}

function renderWorksList (req, res) {
  var nconf = req.app.get('nconf');

  var limit = req.query.limit ? req.query.limit : 10;
  var page_count = Math.ceil(req.works_count[0].total_works / limit);
  var cur_page = req.query.page ? req.query.page : 1;
  var offset = (cur_page - 1) * limit;

  res.render('works', {
    title: nconf.get('application:appname') + " - Works",
    tagline: nconf.get('application:tagline'),
    logo: nconf.get('application:logo'),
    appname: nconf.get('application:appname'),
    defimgext: nconf.get('application:defimgext'),
    imgrootdir: nconf.get('application:imgrootdir'),
    organization: nconf.get('application:organization'),
    searchdeftext: nconf.get('application:searchdeftext'),
    filter_worktypes: req.filter_worktypes,
    filter_deptworks: req.filter_deptworks,
    filter_peopleworks: req.filter_peopleworks,
    filter_yearworks: req.filter_yearworks,
    filter_publicationworks: req.filter_publicationworks,
    filter_publisherworks: req.filter_publisherworks,
    works_count: req.works_count[0].total_works,
    works_list: req.works_list,
    limit: limit,
    page_count: page_count,
    cur_page: cur_page,
    offset: offset
  });
}

function getWorkDetail(req, res, next) {
  var db = req.app.get('db');
  var work_id = req.params.id;

  db.run("SELECT works.id, title_primary as work_title, description as work_type, contributors, publications.name as publication, publications.id as pubid, publishers.name as publisher, publishers.id as publisherid, publication_date_year as year, volume, issue, start_page, end_page, location, works.url, summary FROM works JOIN publications ON publications.id = works.publication_id JOIN work_types USING (type) JOIN publishers ON publishers.id = publications.publisher_id WHERE works.id = $1", [work_id], function(err, results) {
    if (err || !results.length) {
      return next(err);
    }

    req.work_detail = results[0];
    return next();
  });

}

function renderWorkDetail(req, res) {
  var nconf = req.app.get('nconf');

  if (req.work_detail.url.match(/^10/)) {
    var url = 'http://dx.doi.org/' + req.work_detail.url;
  } else {
    var url = req.work_detail.url;
  }

  res.render('work_detail', {
    title: nconf.get('application:appname') + " - Work: " + req.work_detail.work_title,
    tagline: nconf.get('application:tagline'),
    logo: nconf.get('application:logo'),
    appname: nconf.get('application:appname'),
    defimgext: nconf.get('application:defimgext'),
    imgrootdir: nconf.get('application:imgrootdir'),
    organization: nconf.get('application:organization'),
    searchdeftext: nconf.get('application:searchdeftext'),
    work_detail: req.work_detail,
    url: url
  });
}

router.get('/', getWorkTypeCount, getDeptWorkCount, getPeopleWorkCount, getYearWorkCount, getPublicationWorkCount, getPublisherWorkCount, getWorksCount, getWorksList, renderWorksList);

router.get('/:id', getWorkDetail, renderWorkDetail);

module.exports = router;
