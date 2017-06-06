$(document).ready(function() {
   $(".button-collapse").sideNav();

   $(".filter-toggle").on('click', function() {
     $(this).siblings().toggleClass('hide');
   });
});
