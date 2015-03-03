# MBaaS-SimpleExample
* MBaaS(Mobile BaaS, Backend as a Service) 예제
* 아주 단순한 예제를 만들어 MBaaS를 처음 접하는 사람들이 쉽게 따라할 수 있도록 함
* Javascript 예제를 우선 제공
* baas.io, parse, kinvey, azure mobile services, T developes의 BaaS(줄여서 sktdevbaas)를 이용하여 같은 기능을 구현하고 비교해봄

# 구현해볼 기능
* 단순히 게시물 목록을 가져와 보여주는 페이지 (index.html)
* 위 index.htm을 개선한 페이지. 한 번에 5개의 게시물만 가져오고, 더 보기 버튼을 누르면 내용을 더가져오도록 함. 각각의 게시물에 삭제 버튼 추가, 글 쓰기 버튼 추가 등 (index2.html)
* 글 쓰기 페이지 (write.html)

# 비교(예시) - 내용 작성 중
* baas.io는 이렇게 
```
var io = new Baas.IO({
  'URI':'https://api.baas.io',
  'orgName':'imyaman',
  'appName':'b-log',
});

var options = {
  'client':io,
  'endpoint':'comments',
  'qs':{
    'ql':'order by created DESC'
  }
}

io.request(options, function (err, data) {
 if(!err){
 }else{
 }
});
```

* parse는 이렇게
```
Parse.initialize('cdzz7YuYMPaopERtDOd15bUvv7oSaFtJYkCNZjIg', 'cPEU1ggQqkfL1Uh2fPekOWsmrCs7xc39H6RKZRpr');
var query = new Parse.Query('Comments');
query.limit(10);
query.find({
  success: drawCommentsTable,
  error: drawCommentsError
});
```

* kinvey는 이렇게
```
var promise = Kinvey.init({
  appKey : 'kid_WkVVFh1N5',
  appSecret : '8ffb767dda014827bd9de4ea01df7a32'
});
promise.then(function(activeUser) {
  if(null === activeUser) {
    return Kinvey.User.create();
  }
}, function(error) {
});

var promise = Kinvey.DataStore.find('Comments', null, {
  success : drawCommentsTable,
  error : drawCommentsError
});
```

* azure mobile services는 이렇게
```
var client = new WindowsAzure.MobileServiceClient('https://nextlayer.azure-mobile.net/', 'tIBCRAuvMqKAojuCYMmbqUdLzKSrNw70');
var commentsItemTable = client.getTable('Comments');
commentsItemTable.systemProperties = WindowsAzure.MobileServiceTable.SystemProperties.All;

var query = commentsItemTable.where({ });
query.read().then(function(commentsItems) {
  var listItems = $.map(commentsItems, function(item){
  });
  $('#commentsTable').empty().append(listItems).toggle(listItems.length > 0);
}, handleError);
 
```

* sktdevbaas는 이렇게
```
Baas.initialize("7dab9da0-9541-4c63-9c6a-452c02ba957a");
var query = new Baas.Query('Comments');
query.limit(10);
query.find({
  success: drawCommentsTable,
  error: drawCommentsError
});
```
