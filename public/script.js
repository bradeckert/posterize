var selectedPoster;
$(document).ready(function(){
    $('.searchView').hide();
    $( "#dialog" ).dialog({
      height: 270,
      width:250,
      draggable:false,
      show:200,
      autoOpen:false,
      position:{of:".content_capture"},
    });

    $( "#selectable" ).selectable({
      stop: function() {
        $( ".ui-selected", this ).each(function() {
          var index = $( "#selectable li" ).index( this );
          remindAction(index);
        });
      }
    });

$(function() {
    $( "#datepicker" ).datepicker({position:{of:"#content"}});
  });

    
$('.intro').click(function(){
    $('.intro').animate({right:'330px'});
});
$('.capture').click(function(){
    $('.dummy_poster').animate({opacity:0},50,function(){
        $('.dummy_poster').animate({opacity:100},300,function(){
        
        $( "#dialog" ).dialog("open");

        });
    });
     
});
    
$('.poster_detail_header .left_icon').click(function(){
    $(".header").show();
        $(".posters").show({effect:"slide",direction:'up',duration:200});
        $("#from_home_poster").hide();
        $(".poster_view").hide({effect:"slide",direction:'down',duration:200});

});
    
 $('.header_edit .left_icon').click(function(){
    $(".header").show();
        $(".posters").show({effect:"slide",direction:'up',duration:200});
        $(".header_edit").hide();
        $(".poster_view").hide({effect:"slide",direction:'down',duration:200});

});
    
    
 $('.header_edit .right_icon').click(function(){
    $(".header").show();
        $(".posters").show({effect:"slide",direction:'up',duration:200});
        $(".header_edit").hide();
        $(".poster_view").hide({effect:"slide",direction:'down',duration:200});

});
$('.poster_detail_header .right_icon').click(function(){
        $(".poster_view").hide();
        $("#from_home_poster").hide();
        $('.editView').show();
            $('.header_edit').show();

    $(".poster_img_edit img").attr("src", selectedPoster);

});
    
$('.saveButton').click(function(){
        $(".poster_view").show();
        $("#from_home_poster").show();
        $('.editView').hide();
            $('.header_edit').hide();

});
$('.cancelButton').click(function(){
        $('.posters').show();
        $('.content').show();
        $('.header').show();
        $('.content_capture').hide();
        $('.footer').hide();
        $('.posters_search_page').hide();
});
   
    
$('.capture_small').click(function(){
        $('.content').hide();
        $('.header').hide();
        $('.content_capture').show();
        $('.footer').show();
        $('.posters_search_page').hide();

});

$('.home').click(function(){
       if($('#dialog').dialog( "isOpen" )){
       $('#dialog').dialog("close");
       }      
        $('.posters').show();
        $('.content').show();
        $('.header').show();
        $('.content_capture').hide();
        $('.footer').hide();
        $('.posters_search_page').hide();

    
});


$('.search').click(function(){
        $('.posters').hide();
        $('.posters_search_page').hide();
        $('.editView').hide();
        
        $('.searchView').show();
        //$('.posters_search_page').show();

});
    
$('.searchButton').click(function(){
        $('.posters').hide();
        $('.posters_search_page').hide();
        $('.editView').hide();
        
        $('.posters_search_page').show({effect:"slide",direction:'down',duration:200});

});
 $(".scrollable img").click(function(e) {
        $(".header").hide();
        $(".posters").hide();
        $('.posters_search_page').hide();
        $('.editView').hide();
     
        $("#from_home_poster").show();
        $(".poster_img img").attr("src", $(e.target).attr("src"));
        selectedPoster=$(e.target).attr("src");
        $(".poster_view").show({effect:"slide",direction:'down',duration:200});
    });
});


function remindAction(index){
 $('#dialog').dialog("close");
 $('.content_capture').hide();
 $('.footer').hide();
    if(index==3){
        $('.content').show({effect:"slide",direction:'right',duration:200});
        $('.header_edit').show({duration:100});
        $('.header').hide();

        $('.posters_search_page').hide();
        $('.posters').hide();
        $('.editView').show();
    }
    
    else{
      $('.content').show({effect:"slide",direction:'right',duration:200});
        $('.header').show({duration:100});
                $('.posters').show();       
                $('.posters_search_page').hide();

    }

}


    