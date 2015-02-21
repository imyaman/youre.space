
$(document).ready(function(){

	// 검색옵션 클링 시 show hide
	$('.btn_search').click(function(){ 
		var terms = $(this).next('.option');     
		if( terms.is(':visible') ){ 
			terms.hide(); 
			$(this).removeClass('on').text('검색옵션▼')
		} else { 
			terms.show();
			$(this).addClass('on').text('검색옵션▲')
		}
	});


});



/* $('.srch_txt').click(function(){ 
		e.preventDefault();
		if(!$(this).hasClass('active')){
			$('.srch_txt').removeClass('active');
			$(this).children('a.add').css('white-space','normal');
		}
		else {
			$(this).removeClass('active');
			$(this).children('a.add').css('white-space','nowrap');
		}
	});*/

