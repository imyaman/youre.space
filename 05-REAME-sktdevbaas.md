# 도입, 인사말 

서버를 이미 만들어 사용하고 있더라도 BaaS로 이전해보자. 서버 관리 및 유지보수, 비용 등의 측면에서 BaaS를 이용하는 것이 효율적이라고 판단. 이 문서에서는 BaaS를 이용하여 댓글을 보고, 작성하고 관리할 수 있는 기능을 만들어보자. 

실제로 서비스에 적용될 것은 복잡하겠지만 최대한 단순화하여 예제로 설명하고자 한다. 아직 BaaS를 처음 접하는 개발자들이 많을 것으로 생각되고, 또 BaaS가 초급 개발자에게 더 의미있을 것이라 생각하여 최대한 쉽게 설명하고자 하니 표현이 다소 중복되더라도 양해 바란다. 

# 목표, 무엇을 만들 것인가, 환경 

목록 화면에서 을 선택하면 ... 상세 화면이 표시되는데, 이 상세 화면의 하단에 댓글이 목록으로 보여지고, 댓글 작성 버튼, 삭제 버튼 등이 보이도록 만들어보겠다. 

SKT가 제공하는 SDK는 iOS와 Android 네이티브 우선 제공되지만, 본 예제에서는 javascript로 예를 들겠다.  

우선, T developers에 가입하여 프로젝트를 생성하고, 프로젝트 상세화면의 좌측메뉴 Service에서 BaaS를 활성화 시킨다. 

Image 


그리고 좌측 메뉴 Key에서 Javascript Key를 확인한다. 

Image 

BaaS를 이용하여 댓글을 구현함 

web, 별도의 서버 프로그램 없이 client side에서 구현, javascript, jquery 활용 

T developers 웹 사이트에서 key 확인 



# 댓글 목록 

댓글 목록은 이렇게 보여진다. 보기좋게 꾸미는 것은 제일 마지막에 한다. 

BaaS 초기화 -> query 객체를 생성 -> query 객체의 프로퍼티(받아올 목록의 조건) 설정 -> query 실행 -> query 결과 object에 댓글 리스트가 담겨 있음 -> 리스트를 UI로 표현 





웹 페이지에 아래 라이브러리 파일을 넣고 시작한다. 
* jquery 라이브러리 import 
* underscore 라이브러리 import 
* BaaS SDK import 





==== ==== index.html ==== ==== 
```
<!doctype html> 
<head> 
<meta charset="utf-8"> 
<title>My Baas App</title> 
<meta name="description" content="My Baas App"> 
<meta name="viewport" content="width=device-width"> 
<script type="text/javascript" src="js/jquery-1.11.1.min.js"></script> 
<script type="text/javascript" src="js/underscore.js"></script> 
<script type="text/javascript" src="js/baas-1.1.0.js"></script> 
</head> 
<body> 
<h1>BaaS Test</h1> 
<table id="personDataTable"> 
<thead> 
<tr>   
<td>comment</td> 
<td>name</td>  
<td>date</td>  
</tr> 
</thead> 
<tbody> 
</tbody> 
</table> 
<!-- 여기에 script --> 
</body> 
</html> 
```


==== ==== list.js ==== ==== 
```
<script> 
$(document).ready(function() { 
// BaaS에 접속하기 위한 초기화. 이 한 줄 만으로 모든 것이 알아서 준비된다. 
// T developers 웹 사이트에서 확인한 key를 인자로 넣는다. 
Baas.initialize("7dab9da0-9541-4c63-9c6a-452c02ba957a"); 
var query = new Baas.Query("sellers"); 
query.limit(10); 
query.find({ 
success: drawSellerTable, 
error: drawSellerError 
}); 
}); 
function drawSellerTable(data){ 
var obj = $.parseJSON(JSON.stringify(data)); 
Baas._log(JSON.stringify(data)); 
$.each(obj, function(i, item){ 
drawRow(item); 
}); 
} 
function drawRow(rowData) { 
var row = $("<tr />"); 
$("#personDataTable").append(row);  
row.append($("<td>" + rowData.comment + "</td>")); 
row.append($("<td>" + rowData.name + "</td>")); 
row.append($("<td>" + rowData.createdAt + "</td>")); 
} 
function drawSellerError(data){ 
var row = $("<tr />"); 
$("#personDataTable").append(row);  
row.append($("<td>-</td>")); 
row.append($("<td>-</td>")); 
row.append($("<td>-</td>")); 
} 
</script> 
```
==== ==== ==== 

# 댓글 쓰기 
댓글 쓰기 화면은 이렇게 보여진다 
BaaS 초기화 -> comments collection에 들어갈 entity를 생성 -> entity의 프로퍼티(코멘트 내용, 작성자, 비밀번호)를 설정 -> entity를 commends collection에 저장 -> 실행 결과를 받아와 성공/실패를 구분하여 후처리 

==== ==== write.html ==== ==== 
```
<!doctype html> 
<head> 
<meta charset="utf-8"> 
<title>My Baas App</title> 
<meta name="description" content="My Baas App"> 
<meta name="viewport" content="width=device-width"> 
<script type="text/javascript" src="js/jquery-1.11.1.min.js"></script> 
<script type="text/javascript" src="js/underscore.js"></script> 
<script type="text/javascript" src="js/baas-1.1.0.js"></script> 
</head> 
<body> 
<h1>BaaS Test</h1> 
<form id="postComment"> 
Comment : <input type="text" id="comment"> <br/> 
Name : <input type="text" id="name"> <br/> 
PW : <input type="password" id="simplepw"> <br/> 
<input type="button" id="btnSaveObject" value="save"> 
</form> 
<button id="list">list</button> 
<!-- 여기에 script --> 
</body> 
</html> 
==== ==== write.js ==== ==== 
<script> 
$(document).ready(function() { 
Baas.initialize("7dab9da0-9541-4c63-9c6a-452c02ba957a"); 
}); 
$("#btnSaveObject").click(function() { 
var comment = $('#comment').val(); 
var name = $('#name').val(); 
var pw = $('#simplepw').val(); 
var Comment = new Baas.Object.extend("sellers"); 
var myComment = new Comment(); 
myComment.set("comment", comment); 
myComment.set("name", name); 
myComment.set("simplepw", pw); 
myComment.save(null, { 
success: alertSuccess, 
error: alertError 
}); 
}); 
function alertSuccess(data){ 
alert('Saved'); 
} 
function alertError(data){ 
alert('Not saved'); 
} 
$('#list').click(function(){ 
window.location.href='index.long.delete.html'; 
}); 
</script>
```

==== ==== index.html ==== ==== 
```
... 
<button id='write'>write</button> <!-- 목록 화면에 댓글 쓰기 버튼 추가 --> 
... 
```

# 더 보기 및 댓글 삭제 버튼 
댓글 삭제 화면은 이렇게 보여진다 [스크린샷] 
댓글 목록에 삭제 버튼 추가 
BaaS는 기본으로 collection으로부터 10개의 항목을 받아온다. 한꺼번에 받아올 entity의 수를 바꾸고 싶으면, query에 limit 프로퍼티를 설정한다.  

예를 들면, query.limit(5);  
이미 받아온 10개 이후의 entity를 받고 싶으면  query에 skip 프로퍼티를 설정한다. 
예를 들면, query.skip(10); 

본 예제는 한번에 5개의 항목을 받아오고(pgCount=5), more를 버튼을 누르면 다음 5개(currentPage=0; skip = pgCount * currentPage; currentPage++; )를 받아온다.  
특정 댓글의 삭제 버튼을 누르면, (BaaS 초기화는 이미 되어있음), 댓글 ID를 확인하고, 삭제를 위한 query 생성, query 실행 


==== ==== index.html ==== ==== 
```
... 
<table id="personDataTable"> 
<thead> 
<tr>   
<td>comment</td> 
<td>name</td>  
<td>date</td>  
<td>option</td> <!-- 삭제 버튼을 넣을 컬럼을 추가함 --> 
</tr> 
</thead> 
<tbody> 
</tbody> 
</table> 
... 
```

==== ==== list.js ==== ==== 
```
<script> 
var pgCount=5; 
var currentPage=0; 
$(document).ready(function() { 
Baas.initialize("7dab9da0-9541-4c63-9c6a-452c02ba957a"); 
doQuery(); 
}); 
$('#more').click(function(){ 
doQuery(); 
}); 
function doQuery(){ 
var query = new Baas.Query("sellers"); 
query.skip(pgCount * currentPage); 
query.limit(pgCount); 
query.find({ 
success: drawSellerTable, 
error: drawSellerError 
}); 

currentPage++; 
} 
... 
</script> 
```
==== ==== ==== ==== 

# 댓글 삭제 처리 
삭제 확인하는 UI 표시 -> 비밀번호를 입력 받음 -> button으로부터 해당 댓글의 ID (BaaS에는 objectId로 표현됨)를 확인 ->  해당 댓글의 비밀번호가 맞는지 확인 -> 비밀번호가 맞으면 삭제를 위한 query 생성 및 실행, 비밀번호가 틀리면 오류 메시지 표시 


# 통합 및 UI 개선 
단위 기능을 통합함 
jquery mobile을 이용하여 보기좋게 꾸밈 

# 맺음말 
이렇게 BaaS를 이용하여 댓글 기능을 구현해보았다. 이 예제는 http://nextlayer.nl/sktdevbaas/ 에서 확인할 수 있다. 소스코드는 http://nextlayer.nl/sktdevbaas/comment.zip 에서 다운로드 받을 수 있다. 
