//var url='http://note.openartguide.org/4movie/category1.php';
//var url='http://note.openartguide.org/4movie/category1.php';
var url='http://food-guide.co.kr/FoodInfo/client/category_list.do';
var data='';

$.getJSON(url, function(data){
  console.log(data.food_list);
  var contents=[];
  var items = data.food_list;
  
  $.each(items, function(index, item){
    contents.push( '<li id="' + item.code + '">' 
      + '<a href="list-category02.html?code=' + item.code + '" rel="external">'
      + item.code_name 
      + '</a>'
      + "</li>" );
  });

  $( "<ul/>", {
    "class": "category_list",
    html: contents.join( "" )
  }).appendTo( "#content" );
  console.log(contents);

});
