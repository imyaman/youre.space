/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

var app =  {
    // Bluemix credentials
    route: "<APPLICATION_ROUTE>",
    guid: "<APPLICATION_GUID>",

    // Initialize BMSClient
    initialize: function() {
        this.bindEvents();
    },

    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },

    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to use the 'route' and 'guid'
    // variables, we must explicitly call 'app.route' and 'app.guid'
    onDeviceReady: function() {
        BMSClient.initialize(app.route, app.guid);
    },

    // Ping Bluemix
    ping: function() {
        var request = new MFPRequest(this.route + "/protected", MFPRequest.GET);

        var header = document.getElementById("text-big");
        var connected = document.getElementById("text-connected");
        var details = document.getElementById("text-details");

        var success = function(successResponse) {
            header.style.display = "block";
            header.innerHTML = "Yay!";
            connected.innerHTML = "You are connected!";
            details.innerHTML = "<h4>Response:</h4><i>" + successResponse.responseText + "</i>";
            //alert("Request success!\n\n" + JSON.stringify(successResponse));
        };

        var failure = function(failureResponse) {
            header.style.display = "block";
            header.innerHTML = "Bummer";
            connected.innerHTML = "Something Went Wrong";
            details.innerHTML = "<h4>Response:</h4><i>" + failureResponse.errorDescription + "</i>";
            //alert("Request failure!\n\n" + JSON.stringify(failureResponse));
        };

        request.send(success, failure);
    }
};

app.initialize();