
/** FB Sign Up, Login **/
(function(d, debug){
	var js, id = 'facebook-jssdk', ref = d.getElementsByTagName('script')[0];
	if (d.getElementById(id)) {return;}
	js = d.createElement('script'); js.id = id; js.async = true;
	js.src = "//connect.facebook.net/en_US/all" + (debug ? "/debug" : "") + ".js";
	ref.parentNode.insertBefore(js, ref);
}(document, /*debug*/ false));

window.fbAsyncInit = function() {
	/** Facebook SignUp & Login **/
	Baas.FacebookUtils.init({
		appId			: '[Put Your Facebook App ID Here.]',	//sc					
		channelUrl : './fb_channel.html', // Channel File for x-domain communication
		status		 : true, // check the login status upon init?
		cookie		 : true, // set sessions cookies to allow your server to access the session?
		xfbml			: true	// Baas XFBML tags on this page?
	});
}

/** Facebook SignUp & Login **/
function fb_login() {
	Baas.FacebookUtils.logIn("user_likes,email,user_about_me", {
		success: function(user) {
			var msg;
			if (!user.existed()) {
				msg = "Facebook 계정이 없습니다.";
			} else {
				msg = "Facebook Login 성공";
			}
			alert(msg);
			FB.api('/me', function(response) {
				alert('Your name is ' + response.name);
			});								
		},
		error: function(user, error) {
			alert("User cancelled the Facebook login or did not fully authorize.");
		}
	});
}

$(document).ready(function() {
	Baas.initialize($("#javascriptKey").val());

	var sampleSuccess = function(result) {
		Baas._log("sampleSuccess", arguments);
		Baas._log("sampleSuccess", this);
		$("#rsPanel").html(JSON.stringify(result, undefined, 2));
	}
	var sampleError = function(result, error) {
		Baas._log("sampleError", arguments);
		$("#rsPanel").html(JSON.stringify(result, undefined, 2));
		$("#rsErrorPanel").html(JSON.stringify(error, undefined, 2));
	}

	$("#btnRetrievingObject").click(function() {
		var tableName = $("#RetrievingObject > #tableName").val();
		var query = new Baas.Query(tableName);
		query.find({
			success: sampleSuccess,
			error: sampleError
		});
	});

	$("#btnGetObject").click(function() {
		var tableName = $("#GetObject > #tableName").val();
		var objectId = $("#GetObject > #objectId").val();
		var query = new Baas.Query(tableName);
		query.get(objectId, {
			success: sampleSuccess,
			error: sampleError
		});
	});

	$("#btnSaveObject").click(function() {
		var tableName = $("#SaveObject > #tableName").val();
		var columnName = $("#SaveObject > #columnName").val();
		var columnValue = $("#SaveObject > #columnValue").val();
		var Table = new Baas.Object.extend(tableName);
		var table = new Table();
		table.set(columnName, columnValue);
		table.save(null, {
			success: sampleSuccess,
			error: sampleError
		});
	});

	$("#btnUpdateObject").click(function() {
		var tableName = $("#UpdateObject > #tableName").val();
		var objectId = $("#UpdateObject > #objectId").val();
		var columnName = $("#UpdateObject > #columnName").val();
		var columnValue = $("#UpdateObject > #columnValue").val();
		var query = new Baas.Query(tableName);
		query.get(objectId, {
			success: function(object) {
				object.set(columnName, columnValue);
				object.save({
					success: sampleSuccess,
					error: sampleError
				});
			}
		});
	});

	$("#btnDeleteObject").click(function() {
		var tableName = $("#DeleteObject > #tableName").val();
		var objectId = $("#DeleteObject > #objectId").val();
		var query = new Baas.Query(tableName);
		query.get(objectId, {
			success: function(object) {
				object.destroy({
					success: sampleSuccess,
					error: sampleError
				});
			},
			error: sampleError
		});
	});

	$("#btnPointerRowData").click(function() {
		var inputs = formInputToVariable($(this));
		var tableName = inputs["tableName"];
		var columnName = inputs["columnName"];
		var objectId = inputs["objectId"];
		if(!Baas._isNull(tableName)) {
			var Table = Baas.Object.extend(tableName);
			var query = new Baas.Query(Table);
			if(!Baas._isNull(columnName)) query.include(columnName);
			if(!Baas._isNull(objectId)) {
				query.get(objectId, {
					success: sampleSuccess,
					error: sampleError
				});
			}
		}
	});

	$("#btnWhereRowData").click(function() {
		var inputs = formInputToVariable($(this));
		var tableName = inputs["tableName"];
		if(!Baas._isNull(tableName)) {
			var Table = Baas.Object.extend(tableName);
			var query = new Baas.Query(Table);
			if(!Baas._isNull(inputs["lessThanColumnName"]) && !Baas._isNull(inputs["lessThanColumnValue"])) query.lessThan(inputs["lessThanColumnName"], inputs["lessThanColumnValue"]);
			if(!Baas._isNull(inputs["lessThanOrEqualToColumnName"]) && !Baas._isNull(inputs["lessThanOrEqualToColumnValue"])) query.lessThanOrEqualTo(inputs["lessThanOrEqualToColumnName"], inputs["lessThanOrEqualToColumnValue"]);
			if(!Baas._isNull(inputs["greaterThanColumnName"]) && !Baas._isNull(inputs["greaterThanColumnValue"])) query.greaterThan(inputs["greaterThanColumnName"], inputs["greaterThanColumnValue"]);
			if(!Baas._isNull(inputs["greaterThanOrEqualToColumnName"]) && !Baas._isNull(inputs["greaterThanOrEqualToColumnValue"])) query.greaterThanOrEqualTo(inputs["greaterThanOrEqualToColumnName"], inputs["greaterThanOrEqualToColumnValue"]);
			if(!Baas._isNull(inputs["equalToColumnName"]) && !Baas._isNull(inputs["equalToColumnValue"])) query.equalTo(inputs["equalToColumnName"], inputs["equalToColumnValue"]);
			if(!Baas._isNull(inputs["notEqualToColumnName"]) && !Baas._isNull(inputs["notEqualToColumnValue"])) query.notEqualTo(inputs["notEqualToColumnName"], inputs["notEqualToColumnValue"]);
			if(!Baas._isNull(inputs["containedInColumnName"]) && !Baas._isNull(inputs["containedInColumnValue"])) query.containedIn(inputs["containedInColumnName"], inputs["containedInColumnValue"]);
			if(!Baas._isNull(inputs["notContainedInColumnName"]) && !Baas._isNull(inputs["notContainedInColumnValue"])) query.notContainedIn(inputs["notContainedInColumnName"], inputs["notContainedInColumnValue"]);
			if(!Baas._isNull(inputs["existsColumnName"])) query.exists(inputs["existsColumnName"]);
			if(!Baas._isNull(inputs["containsAllColumnName"]) && !Baas._isNull(inputs["containsAllColumnValue"])) query.containsAll(inputs["containsAllColumnName"], inputs["containsAllColumnValue"]);
			if(!Baas._isNull(inputs["startWithColumnName"]) && !Baas._isNull(inputs["startWithColumnValue"])) query.startWith(inputs["startWithColumnName"], inputs["startWithColumnValue"]);
			if(!Baas._isNull(inputs["endWithColumnName"]) && !Baas._isNull(inputs["endWithColumnValue"])) query.endWith(inputs["endWithColumnName"], inputs["endWithColumnValue"]);
			if(!Baas._isNull(inputs["skip"])) query.skip(inputs["skip"]);
			if(!Baas._isNull(inputs["limit"])) query.limit(inputs["limit"]);
			if(!Baas._isNull(tableName)) {
				query.find({
					success: sampleSuccess,
					error: sampleError
				});
			}
		}
	});

	$("#btnTotalCount").click(function() {
		var inputs = formInputToVariable($(this));
		var tableName = inputs["tableName"];
		if(!Baas._isNull(tableName)) {
			var Table = Baas.Object.extend(tableName);
			var query = new Baas.Query(Table);
			if(!Baas._isNull(tableName)) {
				query.count({
					success: sampleSuccess,
					error: sampleError
				});
			}
		}
	});

	$("#btnArrayDataWhere").click(function() {
		var inputs = formInputToVariable($(this));
		var tableName = inputs["tableName"];
		if(!Baas._isNull(tableName)) {
			var Table = Baas.Object.extend(tableName);
			var query = new Baas.Query(Table);
			if(!Baas._isNull(inputs["equalToColumnName"]) && !Baas._isNull(inputs["equalToColumnValue"])) query.equalTo(inputs["equalToColumnName"], inputs["equalToColumnValue"]);
			if(!Baas._isNull(tableName)) {
				query.find({
					success: sampleSuccess,
					error: sampleError
				});
			}
		}
	});

	$("#btnInQuery").click(function() {
		var inputs = formInputToVariable($(this));
		var parentTableName = inputs["parentTableName"];
		var childTableName = inputs["childTableName"];
		if(!Baas._isNull(parentTableName) && !Baas._isNull(childTableName)) {
			var Obj = Baas.Object.extend(parentTableName);	
			var query = new Baas.Query(Obj);
			var InQueryObj = Baas.Object.extend(childTableName);	// Search Table
			var InQuery = new Baas.Query(InQueryObj);
			if(!Baas._isNull(inputs["childEqualToColumnName"]) && !Baas._isNull(inputs["childEqualToColumnValue"])) InQuery.equalTo(inputs["childEqualToColumnName"], inputs["childEqualToColumnValue"]);	// Child Search Column
			if(!Baas._isNull(inputs["parentRelationColumnName"])) query.inQuery(inputs["parentRelationColumnName"], InQuery);	// Parent RelationColumn
			query.find({
				success: sampleSuccess,
				error: sampleError
			});
		}
	});

	$("#btnNotInQuery").click(function() {
		var inputs = formInputToVariable($(this));
		var parentTableName = inputs["parentTableName"];
		var childTableName = inputs["childTableName"];
		if(!Baas._isNull(parentTableName) && !Baas._isNull(childTableName)) {
			var Obj = Baas.Object.extend(parentTableName);	
			var query = new Baas.Query(Obj);
			var InQueryObj = Baas.Object.extend(childTableName);	// Search Table
			var InQuery = new Baas.Query(InQueryObj);
			if(!Baas._isNull(inputs["childEqualToColumnName"]) && !Baas._isNull(inputs["childEqualToColumnValue"])) InQuery.equalTo(inputs["childEqualToColumnName"], inputs["childEqualToColumnValue"]);	// Child Search Column
			if(!Baas._isNull(inputs["parentRelationColumnName"])) query.notInQuery(inputs["parentRelationColumnName"], InQuery);	// Parent RelationColumn
			query.find({
				success: sampleSuccess,
				error: sampleError
			});
		}
	});

	$("#btnRelatedTo").click(function() {
		var inputs = formInputToVariable($(this));
		var parentTableName = inputs["parentTableName"];
		var parentObjectId = inputs["parentObjectId"];
		var relationColumnName = inputs["relationColumnName"];
		var childTableName = inputs["childTableName"];
		if(!Baas._isNull(parentTableName) && !Baas._isNull(parentObjectId) && !Baas._isNull(relationColumnName) && !Baas._isNull(childTableName)) {
			var Parent = Baas.Object.extend(parentTableName);
			var query = new Baas.Query(Parent);			// Parent Query
			query.get(parentObjectId, function(postObj) {	// Parent ObjectId
				var relation = postObj.relation(relationColumnName);	// Parent Table의 Child Relation 컬럼명.
				relation.targetTableName = childTableName;		// target ChildTable
				relation.relatedTo().find({
					success: sampleSuccess,
					error: sampleError
				});
			});
		}
	});

	$("#btnNotRelatedTo").click(function() {
		var inputs = formInputToVariable($(this));
		var parentTableName = inputs["parentTableName"];
		var parentObjectId = inputs["parentObjectId"];
		var relationColumnName = inputs["relationColumnName"];
		var childTableName = inputs["childTableName"];
		if(!Baas._isNull(parentTableName) && !Baas._isNull(parentObjectId) && !Baas._isNull(relationColumnName) && !Baas._isNull(childTableName)) {
			var Parent = Baas.Object.extend(parentTableName);
			var query = new Baas.Query(Parent);			// Parent Query
			query.get(parentObjectId, function(postObj) {	// Parent ObjectId
				var relation = postObj.relation(relationColumnName);	// Parent Table의 Child Relation 컬럼명.
				relation.targetTableName = childTableName;		// target ChildTable
				relation.notRelatedTo().find({
					success: sampleSuccess,
					error: sampleError
				});
			});
		}
	});

	$("#btnCompound").click(function() {
		var inputs = formInputToVariable($(this));
		var tableName = inputs["tableName"];
		var equalToColumnName = inputs["equalToColumnName"];
		var equalToColumnValue = inputs["equalToColumnValue"];
		var notEqualToColumnName = inputs["notEqualToColumnName"];
		var notEqualToColumnValue = inputs["notEqualToColumnValue"];
		if(!Baas._isNull(tableName)) {
			var TableEqualTo = Baas.Object.extend(tableName);
			var TableNotEqualTo = Baas.Object.extend(tableName);
			var queryEqualTo = new Baas.Query(TableEqualTo);
			var queryNotEqualTo = new Baas.Query(TableNotEqualTo);
			if(!Baas._isNull(equalToColumnName) && !Baas._isNull(equalToColumnValue)) queryEqualTo.equalTo(equalToColumnName, equalToColumnValue);
			if(!Baas._isNull(notEqualToColumnName) && !Baas._isNull(notEqualToColumnValue)) queryNotEqualTo.notEqualTo(notEqualToColumnName, notEqualToColumnValue);
			var query = new Baas.Query.or(queryEqualTo, queryNotEqualTo);
			query.find({
				success: sampleSuccess,
				error: sampleError
			});
		}
	});

	$("#btnIncrement").click(function() {
		var inputs = formInputToVariable($(this));
		var tableName = inputs["tableName"];
		var objectId = inputs["objectId"];
		var incrementColumnName = inputs["incrementColumnName"];
		var incrementColumnValue = parseInt(inputs["incrementColumnValue"]);
		if(!Baas._isNull(tableName)) {
			var Obj = Baas.Object.extend(tableName);
			var query = new Baas.Query(Obj);
			query.get(objectId, {
				success: function(object) {
					if(incrementColumnValue > 0) {
						object.increment(incrementColumnName, incrementColumnValue);
					} else {
						object.increment(incrementColumnName);
					}
					object.save({
						success: sampleSuccess,
						error: sampleError
					})
				}
			});
		}
	});

	$("#btnArrayAdd").click(function() {
		var inputs = formInputToVariable($(this));
		var tableName = inputs["tableName"];
		var objectId = inputs["objectId"];
		var addColumnName = inputs["addColumnName"];
		var addColumnValue = inputs["addColumnValue"];
		if(!Baas._isNull(tableName)) {
			var Obj = Baas.Object.extend(tableName);
			var query = new Baas.Query(Obj);
			query.get(objectId, {
				success: function(object) {
					object.add(addColumnName, addColumnValue);
					object.save({
						success: sampleSuccess,
						error: sampleError
					})
				}
			});
		}
	});

	$("#btnArrayAddUnique").click(function() {
		var inputs = formInputToVariable($(this));
		var tableName = inputs["tableName"];
		var objectId = inputs["objectId"];
		var addColumnName = inputs["addColumnName"];
		var addColumnValue = inputs["addColumnValue"];
		if(!Baas._isNull(tableName)) {
			var Obj = Baas.Object.extend(tableName);
			var query = new Baas.Query(Obj);
			query.get(objectId, {
				success: function(object) {
					object.addUnique(addColumnName, addColumnValue);
					object.save({
						success: sampleSuccess,
						error: sampleError
					});
				}
			});
		}
	});

	$("#btnArrayRemove").click(function() {
		var inputs = formInputToVariable($(this));
		var tableName = inputs["tableName"];
		var objectId = inputs["objectId"];
		var addColumnName = inputs["addColumnName"];
		var addColumnValue = inputs["addColumnValue"];
		if(!Baas._isNull(tableName)) {
			var Obj = Baas.Object.extend(tableName);
			var query = new Baas.Query(Obj);
			query.get(objectId, {
				success: function(object) {
					object.remove(addColumnName, addColumnValue);
					object.save({
						success: sampleSuccess,
						error: sampleError
					});
				}
			});
		}
	});

	$("#btnRelationRowDataAdd").click(function() {
		var inputs = formInputToVariable($(this));
		var parentTableName = inputs["parentTableName"];
		var childTableName = inputs["childTableName"];
		var parentObjectId = inputs["parentObjectId"];
		var childObjectId = inputs["childObjectId"];
		var parentRelationColumnName = inputs["parentRelationColumnName"];
		if(!Baas._isNull(parentTableName) && !Baas._isNull(childTableName) && !Baas._isNull(parentObjectId) && !Baas._isNull(childObjectId) && !Baas._isNull(parentRelationColumnName)) {
			var Parent = Baas.Object.extend(parentTableName);
			var Child = Baas.Object.extend(childTableName);
			var query = new Baas.Query(Parent);
			var innerQuery = new Baas.Query(Child);
			query.get(parentObjectId, function(parentObj) {	// ParentObject
				innerQuery.get(childObjectId, function(childObj) {	// ChildObject
					var relation = parentObj.relation(parentRelationColumnName);
					relation.targetTableName = childTableName;	
					relation.add(childObj);
					parentObj.save({
						success: sampleSuccess,
						error: sampleError
					});
				});
			});
		}
	});

	$("#btnRelationRowDataRemove").click(function() {
		var inputs = formInputToVariable($(this));
		var parentTableName = inputs["parentTableName"];
		var childTableName = inputs["childTableName"];
		var parentObjectId = inputs["parentObjectId"];
		var childObjectId = inputs["childObjectId"];
		var parentRelationColumnName = inputs["parentRelationColumnName"];
		if(!Baas._isNull(parentTableName) && !Baas._isNull(childTableName) && !Baas._isNull(parentObjectId) && !Baas._isNull(childObjectId) && !Baas._isNull(parentRelationColumnName)) {
			var Parent = Baas.Object.extend(parentTableName);
			var Child = Baas.Object.extend(childTableName);
			var query = new Baas.Query(Parent);
			var innerQuery = new Baas.Query(Child);
			query.get(parentObjectId, function(parentObj) {	// ParentObject
				innerQuery.get(childObjectId, function(childObj) {	// ChildObject
					var relation = parentObj.relation(parentRelationColumnName);
					relation.targetTableName = childTableName;	
					relation.remove(childObj);
					parentObj.save({
						success: sampleSuccess,
						error: sampleError
					});
				});
			});
		}
	});

	$("#btnRowColumnUnset").click(function() {
		var inputs = formInputToVariable($(this));
		var tableName = inputs["tableName"];
		var objectId = inputs["objectId"];
		var unsetColumnName = inputs["unsetColumnName"];
		if(!Baas._isNull(tableName) && !Baas._isNull(objectId) && !Baas._isNull(unsetColumnName)) {
			var Parent = Baas.Object.extend(tableName);
			var query = new Baas.Query(Parent);
			query.get(objectId, function(obj) {	// ParentObject
				obj.unset(unsetColumnName);
				obj.save();
			});
		}
	});

	$("#btnBatchInsert").click(function() {
		var inputs = formInputToVariable($(this));
		var tableName = inputs["tableName"];
		var firstObjColumnName = inputs["firstObjColumnName"];
		var firstObjColumnValue = inputs["firstObjColumnValue"];
		var secondObjColumnName = inputs["secondObjColumnName"];
		var secondObjColumnValue = inputs["secondObjColumnValue"];
		if(!Baas._isNull(tableName) && !Baas._isNull(firstObjColumnName) && !Baas._isNull(firstObjColumnValue) && !Baas._isNull(secondObjColumnName) && !Baas._isNull(secondObjColumnValue)) {
			var Obj = new Baas.Object.extend(tableName);
			var obj01 = new Obj();
			var obj02 = new Obj();
			obj01.set(firstObjColumnName, firstObjColumnValue);
			obj02.set(secondObjColumnName, secondObjColumnValue);
			var batchArr = new Array();
			batchArr.push(obj01);
			batchArr.push(obj02);
			Baas.Object.saveAll(batchArr, {
				success: sampleSuccess,
				error: sampleError
			});
		}
	});

	$("#btnBatchDelete").click(function() {
		var inputs = formInputToVariable($(this));
		var tableName = inputs["tableName"];
		var startWithColumnName = inputs["startWithColumnName"];
		var startWithColumnValue = inputs["startWithColumnValue"];
		if(!Baas._isNull(tableName) && !Baas._isNull(startWithColumnName) && !Baas._isNull(startWithColumnValue)) {
			var Obj = new Baas.Object.extend(tableName);
			var query = new Baas.Query(Obj);
			query.startWith(startWithColumnName, startWithColumnValue);
			query.find({
				success: function(results) {
					Baas.Object.destroyAll(results, {
						success: sampleSuccess,
						error: sampleError
					});
				}
			});
		}
	});

	$("#btnUserAdd").click(function() {
		var inputs = formInputToVariable($(this));
		var username = inputs["username"];
		var password = inputs["password"];
		var email = inputs["email"];
		if(!Baas._isNull(username) && !Baas._isNull(password)) {
			var user = new Baas.User();
			user.set("username", username);
			user.set("password", password);
			user.set("email", email);
			user.signUp(null, {
				success: sampleSuccess,
				error: sampleError
			});
		}
	});

	$("#btnMultiUserQuery").click(function() {
		var inputs = formInputToVariable($(this));
		var query = new Baas.Query("User");
		query.find({
			success: sampleSuccess,
			error: sampleError
		});
	});

	$("#btnSingleUserQuery").click(function() {
		var inputs = formInputToVariable($(this));
		var objectId = inputs["objectId"];
		if(!Baas._isNull(objectId)) {
			var query = new Baas.Query("User");
			query.get(objectId, {
				success: sampleSuccess,
				error: sampleError
			});
		}
	});

	$("#btnUserUpdate").click(function() {
		var inputs = formInputToVariable($(this));
		var objectId = inputs["objectId"];
		var email = inputs["email"];
		if(!Baas._isNull(objectId)) {
			var query = new Baas.Query("User");
			query.get(objectId, {
				success: function(object) {
					object.set("email", email);
					object.save(null, {
						success: sampleSuccess,
						error: sampleError
					})
					Baas._log("results", results);
				}
			});
		}
	});

	$("#btnUserDelete").click(function() {
		var inputs = formInputToVariable($(this));
		var objectId = inputs["objectId"];
		if(!Baas._isNull(objectId)) {
			var query = new Baas.Query("User");
			query.get(objectId, {
				success: function(object) {
					object.destroy({
						success: sampleSuccess,
						error: sampleError
					});
				}
			});
		}
	});

	$("#btnUserLogin").click(function() {
		var inputs = formInputToVariable($(this));
		var username = inputs["username"];
		var password = inputs["password"];
		if(!Baas._isNull(username)) {
			Baas.User.logIn(username, password, {
				success: sampleSuccess,
				error: sampleError
			});
		}
	});

	$("#btnUserLoginOut").click(function() {
		var currentUser = Baas.User.current();
		if(currentUser) {
			Baas.User.logOut();
		}
	});

	$("#btnVerifyEmail").click(function() {
		var inputs = formInputToVariable($(this));
		var username = inputs["username"];
		var password = inputs["password"];
		var email = inputs["email"];
		if(!Baas._isNull(username)) {
			Baas.User.logIn(username, password, {
				success: function(user) {
					user.verifyEmail(email, {
						success: sampleSuccess,
						error: sampleError
					});
				}
			});
		}
	});

	$("#btnResetPassword").click(function() {
		var inputs = formInputToVariable($(this));
		var username = inputs["username"];
		var password = inputs["password"];
		var email = inputs["email"];
		if(!Baas._isNull(username)) {
			Baas.User.logIn(username, password, {
				success: function(user) {
					Baas.User.resetPassword(email, {
						success: sampleSuccess,
						error: sampleError
					});
				}
			});
		}
	});

	$("#btnFbLinking").click(function() {
		var currentUser = Baas.User.current();
		Baas._log("currentUser", currentUser);
		if(currentUser) {
			if(!Baas.FacebookUtils.isLinked(currentUser)) {
				if(Baas.FacebookUtils.getFbInitialzed()) {
					Baas.FacebookUtils.link(currentUser, null, {
						success: sampleSuccess,
						error: sampleError
					});
				}
			} else {
				alert("링크 가능한 사용자가 없습니다.")
			}
		} else {
			alert("로그인 된 사용자가 없습니다.");
		}
	});

	$("#btnFbUnLinking").click(function() {
		var currentUser = Baas.User.current();
		if(currentUser) {
			if(Baas.FacebookUtils.isLinked(currentUser)) {
				if(Baas.FacebookUtils.getFbInitialzed()) {
					Baas.FacebookUtils.unlink(currentUser, {
						success: sampleSuccess,
						error: sampleError
					});
				}
			} else {
				alert("링크된 사용자가 없습니다.");
			}
		} else {
			alert("로그인 된 사용자가 없습니다.");
		}
	});

	$("#btnRoleInsert").click(function() {
		var inputs = formInputToVariable($(this));
		var roleName = inputs["roleName"];
		var publicReadAccess = inputs["publicReadAccess"];
		var publicWriteAccess = inputs["publicWriteAccess"];
		if(!Baas._isNull(roleName) && !Baas._isNull(publicReadAccess) && !Baas._isNull(publicWriteAccess)) {
			var roleACL = new Baas.ACL();
			roleACL.setPublicReadAccess(eval(publicReadAccess));
			roleACL.setPublicWriteAccess(eval(publicWriteAccess));
			var role = new Baas.Role(roleName, roleACL);
			role.save({
				success: sampleSuccess,
				error: sampleError
			});
		}
	});

	$("#btnRoleMultiQuery").click(function() {
		var inputs = formInputToVariable($(this));
		var query = new Baas.Query("Role");
		query.find({
			success: sampleSuccess,
			error: sampleError
		});
	});

	$("#btnRoleSingleQuery").click(function() {
		var inputs = formInputToVariable($(this));
		var objectId = inputs["objectId"];
		if(!Baas._isNull(objectId)) {
			var role = new Baas.Query("Role");
			role.get(objectId, {	// Role ObjectId
				success: sampleSuccess,
				error: sampleError
			});
		}
	});

	$("#btnRoleUpdate").click(function() {
		var inputs = formInputToVariable($(this));
		var objectId = inputs["objectId"];
		var publicReadAccess = inputs["publicReadAccess"];
		var publicWriteAccess = inputs["publicWriteAccess"];
		if(!Baas._isNull(objectId)) {
			var role = new Baas.Query("Role");
			role.get(objectId, {	// Role ObjectId
				success: function(role) {
					var roleACL = role.getACL();
					roleACL.setPublicReadAccess(eval(publicReadAccess));
					roleACL.setPublicWriteAccess(eval(publicWriteAccess));
					role.save(null, {
						success: sampleSuccess,
						error: sampleError
					})
				}
			});
		}
	});

	$("#btnRoleDelete").click(function() {
		var inputs = formInputToVariable($(this));
		var objectId = inputs["objectId"];
		if(!Baas._isNull(objectId)) {
			var role = new Baas.Query("Role");
			role.get(objectId, {	// Role ObjectId
				success: function(role) {
					role.destroy({
						success: sampleSuccess,
						error: sampleError
					});
				}
			});
		}
	});

	$("#btnRoleACL").click(function() {
		var inputs = formInputToVariable($(this));
		var tableName = inputs["tableName"];
		var tableObjectId = inputs["tableObjectId"];
		var objPublicReadAccess = inputs["objPublicReadAccess"];
		var objPublicWriteAccess = inputs["objPublicWriteAccess"];
		var objUserObjectId = inputs["objUserObjectId"];
		var objUserObjectIdReadAccess = inputs["objUserObjectIdReadAccess"];
		var objUserObjectIdWriteAccess = inputs["objUserObjectIdWriteAccess"];
		var roleObjectId = inputs["roleObjectId"];
		var roleReadAccess = inputs["roleReadAccess"];
		var roleWriteAccess = inputs["roleWriteAccess"];
		if(!Baas._isNull(tableName) && !Baas._isNull(tableObjectId)) {
			var query = new Baas.Query(tableName);
			query.get(tableObjectId, {
				success: function(obj) {
					// var acl = new Baas.ACL();	// 새로운 ACL 생성.
					acl = obj.getACL();				// 기존의 ACL 이용.

					// 전체 권한에 대한 설정.
					if(!Baas._isNull(objPublicReadAccess))	acl.setPublicReadAccess(eval(objPublicReadAccess));
					if(!Baas._isNull(objPublicWriteAccess))	acl.setPublicWriteAccess(eval(objPublicWriteAccess));
					// User ObjectId별 권한 설정.
					if(!Baas._isNull(objUserObjectId) && !Baas._isNull(objUserObjectIdReadAccess))	acl.setReadAccess(objUserObjectId, eval(objUserObjectIdReadAccess));	// User ObjectId, true/false
					if(!Baas._isNull(objUserObjectId) && !Baas._isNull(objUserObjectIdWriteAccess))	acl.setWriteAccess(objUserObjectId, eval(objUserObjectIdWriteAccess));	// User ObjectId, true/false

					if(!Baas._isNull(roleObjectId)) {
						// Role에 대한 권한 설정.
						var role = new Baas.Query("Role");
						role.get(roleObjectId, {	// Role ObjectId
							success: function(role) {
								if(!Baas._isNull(roleReadAccess))	acl.setRoleReadAccess(role, eval(roleReadAccess));
								if(!Baas._isNull(roleWriteAccess))	acl.setRoleWriteAccess(role, eval(roleWriteAccess));
								obj.setACL(acl);
								obj.save({
									success: sampleSuccess,
									error: sampleError
								});
							}
						});
					} else {
						obj.setACL(acl);
						obj.save({
							success: sampleSuccess,
							error: sampleError
						});
					}
				}
			});
		}
	});

	$("#btnRoleHierarchy").click(function() {
		var inputs = formInputToVariable($(this));
		var parentRoleObjectId = inputs["parentRoleObjectId"];
		var addChildRoleObjectId = inputs["addChildRoleObjectId"];
		if(!Baas._isNull(parentRoleObjectId) && !Baas._isNull(addChildRoleObjectId)) {
			var parentRole = new Baas.Query("Role");
			parentRole.get(parentRoleObjectId, {	// Role ObjectId // ParentRole ObjectId
				success: function(parentRole) {
					var childRole = new Baas.Query("Role");
					childRole.get(addChildRoleObjectId, {	// Role ObjectId // ChildRole ObjectId
						success: function(childRole) {
							parentRole.getRoles().add(childRole);
							parentRole.save({
								success: sampleSuccess,
								error: sampleError
							});
						}
					});
				}
			});
		}
	});

	$("#btnGeoPointInsert").click(function() {
		var inputs = formInputToVariable($(this));
		var tableName = inputs["tableName"];
		var geoColumn = inputs["geoColumn"];
		var latitude = inputs["latitude"];
		var longitude = inputs["longitude"];
		if(!Baas._isNull(tableName) && !Baas._isNull(latitude) && !Baas._isNull(longitude) && !Baas._isNull(geoColumn)) {
			var geo = new Baas.GeoPoint({latitude: parseFloat(eval(latitude)), longitude: parseFloat(eval(longitude))});
			var table = new Baas.Object.extend(tableName);
			var tableObj = new table();
			tableObj.set(geoColumn, geo);
			tableObj.save(null, {
				success: sampleSuccess,
				error: sampleError
			});
		}
	});

	$("#btnGeoPointNear").click(function() {
		var inputs = formInputToVariable($(this));
		var tableName = inputs["tableName"];
		var geoColumn = inputs["geoColumn"];
		var latitude = inputs["latitude"];
		var longitude = inputs["longitude"];
		if(!Baas._isNull(tableName) && !Baas._isNull(latitude) && !Baas._isNull(longitude) && !Baas._isNull(geoColumn)) {
			var point = new Baas.GeoPoint(parseFloat(eval(latitude)), parseFloat(eval(longitude)));
			var PlaceObject = Baas.Object.extend(tableName);
			var query = new Baas.Query(PlaceObject);
			query.near(geoColumn, point);
			// query.limit(10);
			query.find({
				success: sampleSuccess,
				error: sampleError
			});
		}
	});

	$("#btnGeoPointKilometers").click(function() {
		var inputs = formInputToVariable($(this));
		var tableName = inputs["tableName"];
		var geoColumn = inputs["geoColumn"];
		var latitude = inputs["latitude"];
		var longitude = inputs["longitude"];
		var kilometers = inputs["kilometers"];
		if(!Baas._isNull(tableName) && !Baas._isNull(latitude) && !Baas._isNull(longitude) && !Baas._isNull(geoColumn) && !Baas._isNull(kilometers)) {
			var point = new Baas.GeoPoint(parseFloat(eval(latitude)), parseFloat(eval(longitude)));
			var PlaceObject = Baas.Object.extend(tableName);
			var query = new Baas.Query(PlaceObject);
			query.withinKilometers(geoColumn, point, parseFloat(eval(kilometers)));
			query.find({
				success: sampleSuccess,
				error: sampleError
			});
		}
	});

	$("#btnGeoPointMiles").click(function() {
		var inputs = formInputToVariable($(this));
		var tableName = inputs["tableName"];
		var geoColumn = inputs["geoColumn"];
		var latitude = inputs["latitude"];
		var longitude = inputs["longitude"];
		var miles = inputs["miles"];
		if(!Baas._isNull(tableName) && !Baas._isNull(latitude) && !Baas._isNull(longitude) && !Baas._isNull(geoColumn) && !Baas._isNull(miles)) {
			var point = new Baas.GeoPoint(parseFloat(eval(latitude)), parseFloat(eval(longitude)));
			var PlaceObject = Baas.Object.extend(tableName);
			var query = new Baas.Query(PlaceObject);
			query.withinMiles(geoColumn, point, parseFloat(eval(miles)));
			query.find({
				success: sampleSuccess,
				error: sampleError
			});
		}
	});

	$("#btnGeoPointRadians").click(function() {
		var inputs = formInputToVariable($(this));
		var tableName = inputs["tableName"];
		var geoColumn = inputs["geoColumn"];
		var latitude = inputs["latitude"];
		var longitude = inputs["longitude"];
		var radians = inputs["radians"];
		if(!Baas._isNull(tableName) && !Baas._isNull(latitude) && !Baas._isNull(longitude) && !Baas._isNull(geoColumn) && !Baas._isNull(radians)) {
			var point = new Baas.GeoPoint(parseFloat(eval(latitude)), parseFloat(eval(longitude)));
			var PlaceObject = Baas.Object.extend(tableName);
			var query = new Baas.Query(PlaceObject);
			query.withinRadians(geoColumn, point, parseFloat(eval(radians)));
			query.find({
				success: sampleSuccess,
				error: sampleError
			});
		}
	});

	$("#btnGeoPointWithin").click(function() {
		var inputs = formInputToVariable($(this));
		var tableName = inputs["tableName"];
		var geoColumn = inputs["geoColumn"];
		var firstLatitude = inputs["firstLatitude"];
		var firstLongitude = inputs["firstLongitude"];
		var secondLatitude = inputs["secondLatitude"];
		var secondLongitude = inputs["secondLongitude"];
		if(!Baas._isNull(tableName) 
			&& !Baas._isNull(geoColumn) 
			&& !Baas._isNull(firstLatitude) 
			&& !Baas._isNull(firstLongitude) 
			&& !Baas._isNull(secondLatitude)
			&& !Baas._isNull(secondLongitude)) {
			var southwestOfSF = new Baas.GeoPoint(parseFloat(eval(firstLatitude)), parseFloat(eval(firstLongitude)));
			var northeastOfSF = new Baas.GeoPoint(parseFloat(eval(secondLatitude)), parseFloat(eval(secondLongitude)));
			var PlaceObject = Baas.Object.extend(tableName);
			var query = new Baas.Query(PlaceObject);
			query.geoWithin(geoColumn, southwestOfSF, northeastOfSF);
			query.find({
				success: sampleSuccess,
				error: sampleError
			});
		}
	});

	$('#FileUpload').submit(function() {
		var baasFile = new Baas.File();
		baasFile.setFrm($(this));
		baasFile.save({
			success: sampleSuccess,
			error: sampleError
		});
		return false;
	});

	$("#btnFileMultiQuery").click(function() {
		var fileObj = Baas.Object.extend("File");
		var fileQuery = new Baas.Query(fileObj);
		fileQuery.find({
			success: sampleSuccess,
			error: sampleError
		});
	});

	$("#btnFileSingleQuery").click(function() {
		var inputs = formInputToVariable($(this));
		var fileName = inputs["fileName"];
		if(!Baas._isNull(fileName)) {
			var File = Baas.Object.extend("File");
			var query = new Baas.Query(File);
			query.equalTo("name", fileName);	// FileName 필요.
			query.find({
				success: sampleSuccess,
				error: sampleError
			});
		}
	});

	var formInputToVariable = function(btn) {
		var vars = {};
		var formId = $(btn).parent().attr("id");
		var $inputs = $("#" + formId + " input[type=text]");
		for(var i = 0; i < $inputs.length; i++) {
			vars[$inputs[i].id] = $inputs[i].value;
		}
		return vars;
	}
});

$("html").addClass("js");
$.fn.accordion.defaults.container = false; 
$(function() {
	$("#acc1").accordion({
		el: ".h", 
		head: "h4, h5", 
		next: "div", 
		initShow : "div.outer:eq(1)",
		event: "click"
	});
	$("html").removeClass("js");
	$("h5").click(function() {
		$(".sourceCode").hide();
		$("#rsPanel").html("");
		$("#rsErrorPanel").html("");
		$(".sourceCode:eq("+$(this).index('h5')+")").show();

	});
	$(".sourceCode:eq(0)").show();
});