function getUrlParameter(sParam) {
  var sPageURL = decodeURIComponent(window.location.search.substring(1)),
    sURLVariables = sPageURL.split('&'),
    sParameterName,
    i;

  for (i = 0; i < sURLVariables.length; i++) {
    sParameterName = sURLVariables[i].split('=');

    if (sParameterName[0] === sParam) {
      return sParameterName[1] === undefined ? true : sParameterName[1];
    }
  }

  return undefined;
}

$(document).ready(function() {
  $(".button-collapse").sideNav();

  $(".filter-toggle").on('click', function() {
    $(this).nextAll().toggleClass('hide');
    var txt = $(this).next().is(':visible') ? 'Show fewer filters...' : 'Show more filters...';
    $(this).text(txt);
    $(this).toggleClass('red').toggleClass('white-text');
  });

  $('.collapsible').collapsible();

  $('.carousel.carousel-slider').carousel({fullWidth: true});

  $('select').material_select();

  $('.page-selector').on('change', function() {
    $(this).parent().submit();
  });

  $('.letter-selector').on('change', function() {
    $(this).parent().submit();
  });

  $('#resultsPerPage').on('change', function() {
    $(this).parent().submit();
  });

  $(".detail-works").css('max-height', ($(".detail-profile-sidebar").height()));

  $(".filter-group a.collection-item").on('click', function() {
    var filtype = $(this).data('filter-type');
    var val = $(this).data('filter-id');
    var limit = getUrlParameter('limit') ? "&limit=" + getUrlParameter('limit') : "";
    var page = getUrlParameter('page') ? "&page=" + getUrlParameter('page') : "";

    var filstr = getUrlParameter('filters');
    if (filstr) {
      var filters = JSON.parse(filstr);

      var filindex = _.indexOf(filters, _.findWhere(filters, {type: filtype}));
      if (filindex > -1) {
        if (!(val in filters[filindex].ids)) {
          filters[filindex].ids.push(val);
        }
      } else {
        filters.push({type: filtype, ids: [val]});
      }
    } else {  // this is the first filter applied
      var filters = [{type: filtype, ids: [val]}];
    }

    window.location.href = "/works?filters=" + JSON.stringify(filters) + limit + page;
  });

  $(".filter-group .chip .close").on('click', function() {
    var filtype = $(this).parent().data('filter-type');
    var val = $(this).parent().data('filter-id');
    var limit = getUrlParameter('limit') ? "&limit=" + getUrlParameter('limit') : "";
    var page = getUrlParameter('page') ? "&page=" + getUrlParameter('page') : "";
    var filstr = getUrlParameter('filters');
    var filters = JSON.parse(filstr);

    var filindex = _.indexOf(filters, _.findWhere(filters, {type: filtype}));
    if (filindex > -1) {
      if (val in filters[filindex].ids) {
        if (filter[filindex].ids.length > 1) {
          filters[filindex].ids.splice($.inArray(val, filters[filindex].ids), 1);
        } else { // remove the entire object from the array
          filters.splice(filindex, 1);
        }
      }
    }

    if (filters.length) {
      window.location.href = "/works?filters=" + JSON.stringify(filters) + limit + page;
    } else {
      window.location.href = "/works";
    }
  });
});
