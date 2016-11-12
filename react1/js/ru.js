ReactDOM.render(
//<h1>Hello, world!</h1>,
  React.createElement('h1', null, 'Hello, world!'),
  document.getElementById('title')
);

var client = new Usergrid.Client({
  'URI':'https://api02.youre.space',
  'orgName':'svr42mp', 
  'appName':'baas.io',
  //'token':baas_token
});

var options = {
  'client':client,
  'endpoint':'comments',
  'qs':{
    'ql':'order by created DESC'
  }
}

var myItems;

var CommentBlock = React.createClass({
  observe: function() {
    return {
      comments: function(){return '{"comment":"h"}'}
        /* client.request(options, function (err, data) {
          if(!err){
            myItems=data.entities;
          }else{
            console.log(err.toString());
          }
        } */
      
    }; /* end of return */
  },

  render: function() {
    // Render the text of each comment as a list item
    return (
      <ul>
        {this.data.comments.map(function(c) {
          return <li>{c.comment}</li>;
        })}
      </ul>
    );
  }
});

ReactDOM.render(
  React.createElement('p', null, 'Items must be here!'),
  document.getElementById('list')
);
