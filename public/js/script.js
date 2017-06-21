$(document).ready(function() {
   $(".button-collapse").sideNav();

   $(".filter-toggle").on('click', function() {
     $(this).nextAll().toggleClass('hide');
     var txt = $(this).next().is(':visible') ? 'Show fewer filters...' : 'Show more filters...';
     $(this).text(txt);
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
});
