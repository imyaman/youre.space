// http://food-guide.co.kr/FoodInfo/client/category_list.do
//var url='http://note.openartguide.org/4movie/category2.php';
var url='http://food-guide.co.kr/FoodInfo/client/category_list.do'; 
var data='';

$.getJSON(url, function(data){
  console.log(data.food_list);
  var contents=[];
  var items = data.food_list;
  
  $.each(items, function(index, item){
    contents.push( '<li id="' + item.code + '">' 
      + '<a href="category3_health.html?code=' + item.code + '" rel="external">'
      + item.code_name 
      + '</a>'
      + "</li>" );
  });

  $( "<ul/>", {
    "class": "foodcategory-list",
    "data-role": "listview",
    html: contents.join( "" )
  }).appendTo( "#ui-content" );
  console.log(contents);

});
