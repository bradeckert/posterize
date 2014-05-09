var imageStore = new FS.Store.GridFS("images", {});

Images = new FS.Collection("images", {
  stores: [imageStore]
});
Images.allow({download: function (userId, doc) {return true;}});

Users = new Meteor.Collection("users");
Posters = new Meteor.Collection("posters");

//globals for camera
var context;
var videoElement;
var new_img;

// Might have to use CollectionsFS for storing images
// https://github.com/CollectionFS/Meteor-CollectionFS

if (Meteor.isClient) {
  Router.map(function() {
    this.route('home');
    this.route('camera');
    this.route('intro', {path: '/'});
    this.route('poster_info');
    this.route('edit_poster_info');
  });


  //temp user name
  Session.set('current_user', "Masha");
  Session.set('mine', true);

  // When this is set, home page displays as search page
  Session.set('search_criteria', null);

  Session.set('reminder', null);

  // HOME / SEARCH -------------------------------------------------------------
  var set_search_criteria = function() {
    Session.set("search_criteria",
                { "hap_from_date" : $("#hap_from_date").datepicker("getDate"),
                  "hap_to_date" : $("#hap_to_date").datepicker("getDate"),
                  "snap_from_date" : $("#snap_from_date").datepicker("getDate"),
                  "snap_to_date" : $("#snap_to_date").datepicker("getDate")
                });
  };

  var get_date_search_filter = function(from, to) {
    if (!from && !to) {
      return null;
    }

    var res = {};
    if (from) {
      res["$gte"] = from;
    }
    if (to) {
      res["$lte"] = to;
    }
    return res;
  };

  var set_mongo_search_filter = function() {
    var res = {};
    if (Session.get('mine')) {
      res.owner = Session.get('current_user');
    }
    if (Session.get("search_criteria")) {
      var snapped_filter = get_date_search_filter(
        Session.get("search_criteria").snap_from_date,
        Session.get("search_criteria").snap_to_date);
      if (snapped_filter) {
        res["snapped"] = snapped_filter;
      }
    }
    return res;
  };

  var get_search_result = function() {
    console.log("filter:");
    console.log(set_mongo_search_filter());
    return Posters.find(set_mongo_search_filter(),
                        {'sort' : { 'snapped': -1}});
  };

  Template.home.rows = function() {
    console.log("Getting rows");
    var posters = get_search_result().fetch();
    console.log("Got posters: " + posters.length);
    var rows = [];
    var date_string = "";
    for (var p = 0; p < posters.length; ++p) {
      if (posters[p].snapped.toLocaleDateString() != date_string) {
        date_string = posters[p].snapped.toLocaleDateString();
        // TODO: change "Snapped on" to "Happening on " if search criteria
        // has a date attribute
        var today = new Date();
        var yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);
        if (posters[p].snapped.getDate() == today.getDate()) {
          rows.push({"day" : "Snapped Today",
                   "posters": []});
        } else if (posters[p].snapped.getDate() == yesterday.getDate()) {
          rows.push({"day" : "Snapped Yesterday",
                   "posters": []});
        } else {
          rows.push({"day" : "Snapped on " + posters[p].snapped.toDateString(),
                   "posters": []});
        }
      }
      rows[rows.length - 1].posters.push(posters[p]);
    }
    return rows;
  };

  Template.home.search_label = function() {
    console.log("Getting search label");
    if (!Session.get("search_criteria")) { return ""; }
    return "search";
  };

  Template.header_home.events({
    'click .x': function() {
      console.log("Setting search criteria");
      Session.set("search_criteria", null);
    },
    'click #mine': function() {
      Session.set("mine", true);
    },
    'click #all': function() {
      Session.set("mine", false);
    },
    'click .right-button': function() {
      $("#dialog").show();
    }
  });

  Template.home.rendered = function() {
    $("#search").button();
    $("#cancel").button();
    $(".date").datepicker();
  };

  Template.home.events({
    'click #search': function() {
      set_search_criteria();
      $("#dialog").hide();
    },
    'click #cancel': function() {
      $("#dialog").hide();
    },
    'click #dialog .x': function() {
      $("#dialog").hide();
    }
  });

  var url_for_poster = function(poster) {
    if (poster.test_url) { return poster.test_url; }
    else { return Images.findOne(poster.file).url(); }
  };

  Template.poster.url = function() {
    return url_for_poster(this);
  };


  //set selected poster
  Template.poster.events({
    'click': function () {
      Session.set("selected_poster", this._id);
    }
  });

  // VIEW POSTER ---------------------------------------------------------------
  Template.poster_info.poster = function() {
    var res = Posters.findOne(Session.get("selected_poster"));
    res["url"] = url_for_poster(res);
    return res;
  };

  Template.poster_info.mine = function() {
    var res = Posters.findOne(Session.get("selected_poster"));
    if (res['owner'] === Session.get('current_user')){
      return "You";
    } else {
      return "Someone else";
    }
  }

  Template.poster_info.snappedString = function() {
    var res = Posters.findOne(Session.get("selected_poster"));
    var today = new Date();
    var yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (res.snapped.getDate() == today.getDate()) {
      return "today";
    } else if (res.snapped.getDate() == yesterday.getDate()) {
      return "yesterday";
    } else {
      return "on " + res.snapped.toDateString();
    }
  }

  Template.poster_info.remindString = function() {
    var res = Posters.findOne(Session.get("selected_poster"));
    var today = new Date();
    var tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    if (res.remind.getDate() == today.getDate()) {
      return "tonight";
    } else if (res.remind.getDate() == tomorrow.getDate()) {
      return "tomorrow";
    } else {
      return res.remind.toDateString();
    }
  }



  Template.poster_info.hasDetail = function() {
    var res = Posters.findOne(Session.get("selected_poster"));
    return ((res['title'] != null && res['title'] != '')
            || (res['where'] != null    && res['where'] != '')
            || (res['date'] != null     && res['date'] != '')
            || (res['time'] != null     && res['time'] != '')
            || (res['tags'] != null     && res['tags'] != ''));
  }

  Template.poster_info.hasTitle = function() {
    var res = Posters.findOne(Session.get("selected_poster"));
    return res['title'] != '';
  }

  Template.poster_info.hasWhere = function() {
    var res = Posters.findOne(Session.get("selected_poster"));
    return (res['where'] != '');
  }

  Template.poster_info.hasDate = function() {
    var res = Posters.findOne(Session.get("selected_poster"));
    return (res['date'] != '');
  }

  Template.poster_info.hasTime = function() {
    var res = Posters.findOne(Session.get("selected_poster"));
    return (res['time'] != '');
  }

  Template.poster_info.hasTags = function() {
    var res = Posters.findOne(Session.get("selected_poster"));
    return (res['tags'] != '' && res['tags'] != null);
  }

  Template.poster_info.upperTags = function() {
    var res = Posters.findOne(Session.get("selected_poster"));
    return (res['tags'].toUpperCase());
  }

  Template.poster_info.hasNotes = function() {
    var res = Posters.findOne(Session.get("selected_poster"));
    return (res['notes'] != '');
  }

  Template.poster_info.hasRemind = function() {
    var res = Posters.findOne(Session.get("selected_poster"));
    return (res['remind'] != null);
  }



// EDIT POSTER INFO --------------------------------------------------------------------
   Template.edit_poster_info.poster = function() {
    var res = Posters.findOne(Session.get("selected_poster"));
    res["url"] = url_for_poster(res);
    return res;
  };

  Template.edit_poster_info.disabled = function() {
    var res = Posters.findOne(Session.get("selected_poster"));

    var owner = res['owner'];
    
    if (res['editable'] == false) {
      return (owner != Session.get('current_user'));
    }
    return false;
  }

  Template.edit_poster_info.rendered = function() {
    $("#save").button();
    $("#cancel").button();
    $("#delete").button();
    $("#cancel_delete").button();

    var res = Posters.findOne(Session.get("selected_poster"));
    
    // MINE/ALL fill from data
    if (res['editable'] == false) {
      if (res['owner'] === Session.get('current_user')) {
        $("#me").prop('checked', true);
      }
    } else {
      $("#all").prop('checked', true);
    }

    // TAGS fill from data
    if (res['tags'] === "serious") {
      $("#serious").prop('checked', true);
    } else if (res['tags'] === "fun") {
      $("#fun").prop('checked', true);
    }
  };

  Template.edit_poster_info.events({
    'click #delete' : function() {
      var res = Posters.findOne(Session.get("selected_poster"));
      Meteor.call('removePoster', res);
      Router.go('home');
    },
    'click #cancel_delete' : function() {
      $("#dialog").hide();
    },
    'click .x' : function() {
      $("#dialog").hide();
    },
    'click #save' : function (event, template) {
      var res = Posters.findOne(Session.get("selected_poster"));
      res['title'] = template.find("input[name=title]").value;
      if (template.find("input[name=tags]:checked")) {
        res['tags'] = template.find("input[name=tags]:checked").value;
      }
      res['where'] = template.find("input[name=where]").value;
      res['date'] = template.find("input[name=date]").value;
      res['time'] = template.find("input[name=time]").value;
      res['notes'] = template.find("input[name=notes]").value;
      res['editable'] = (template.find("input[name=meall]:checked").value === "all");
      Meteor.call('updatePoster', res);
      Router.go('poster_info');
    },

    'click #cancel' : function (event, template) {
      template.find("input[name=title]").value = '';
      template.find("input[name=tags]").value = '';
      template.find("input[name=where]").value = '';
      template.find("input[name=date]").value = '';
      template.find("input[name=time]").value = '';
      template.find("input[name=notes]").value = '';
      Router.go('poster_info');
    }

  });
  

  // EDIT PAGE HEADER ----------------------------------------------------------
  Template.header_poster_edit.events({
    //remove a poster by clicking trash
    'click .right-button img' : function () {
      $("#dialog").show();
    },

    'click .left-button img' : function () {
      var came_by = Session.get("came_to_edit_by");
      if (came_by === "camera") {
        Router.go('camera');
      } else {
        Router.go('poster_info');
      }
    }
  });

   // VIEW PAGE HEADER ----------------------------------------------------------
    //remove a poster by clicking trash
  Template.header_poster_info.events({
    //go to edit page
    'click .right-button img' : function () {
      Session.set("came_to_edit_by", 'poster_info');
      Router.go('edit_poster_info');
    }
  });


  // CAMERA --------------------------------------------------------------------
  var save_new_poster = function(template) {
    //uncomment for ios
    //var file = $(".myFileInput").get(0).files[0];
    var file = new_img;
    console.log("Saving file: " + file);
    var today = new Date();
    var tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    var remind_day = template.find("input[name=vehicle]:checked", '#remind_form');
    console.log(remind_day.value);
    var remind = null;
    if (remind_day.value === "tonight") {
      remind = today;
    } else if (remind_day.value === "tomorrow") {
      remind = tomorrow;
    } else if (remind_day.value === "thursday") {
      if (4 - today.getUTCDay() >= 0) {
        remind = new Date();
        remind.setDate(today.getDate() + (4 - today.getUTCDay()));
      } else {
        remind = new Date()
        remind.setDate(today.getDate() + (4 - (4 - today.getUTCDay())) + 1);
      }
    }
    console.log(remind.toDateString());

    Images.insert(file, function (err, fileObj) {
      if (!err) {
        var id = Posters.insert(
          {owner: Session.get('current_user'),
           file: fileObj._id,
           snapped: new Date(),
           remind: remind
        });
        Session.set("selected_poster", id);
        console.log("Stored as : " + fileObj);
      } else {
        console.log("Error");
      }
      fO = fileObj;
    }); };

  Template.camera.rendered = function() {
    $("#save").button();
    $("#edit").button();
    $("#discard").button();
  };

  Template.camera.dialog_status = function() {
    if (!Session.get("about_to_save_new")) return "hidden";
    return "";
  };

  Template.camera.events({
    'click .camera_button': function() {
      Session.set("about_to_save_new", true);
      context.drawImage(videoElement, 0, 0, 720, 1280);
      new_img = canvas.toDataURL("image/png");
    },
    'click #discard' : function() {
      Session.set("about_to_save_new", false); },
    'click .x' : function() {
      Session.set("about_to_save_new", false); },
    'click #save' : function (event, template) {
      save_new_poster(template);
      Session.set("about_to_save_new", false);
    },
    'click #edit' : function (event, template) {
      save_new_poster(template);
      Session.set("about_to_save_new", false);
      Session.set("came_to_edit_by", 'camera');
      //TODO: make this less hacky, may not even be neccesary
      while(Session.get('selected_poster') == null) {}
      Router.go('edit_poster_info');
    }
  });

  Template.camera_input.rendered = function() {
    videoElement = document.querySelector("video");
    var videoSelect = document.querySelector("select#videoSource");
    var canvas = document.getElementById("canvas");
    context = canvas.getContext("2d");
    var cameras=[];
    var audios=[];
    navigator.getUserMedia = navigator.getUserMedia ||
    navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

    function gotSources(sourceInfos) {
      for (var i = 0; i != sourceInfos.length; ++i) {
        var sourceInfo = sourceInfos[i];

          if (sourceInfo.kind === 'audio') {
          audios.push(sourceInfo.id);
        } else if (sourceInfo.kind === 'video'&& sourceInfo.facing == "environment") {
          cameras.push(sourceInfo.id);
        }

      }
        start();
    }

    if (typeof MediaStreamTrack === 'undefined'){
      alert('This browser does not support MediaStreamTrack.\n\nTry Chrome Canary.');
    } else {
      MediaStreamTrack.getSources(gotSources);
    }


    function successCallback(stream) {
      window.stream = stream; // make stream available to console
      videoElement.src = window.URL.createObjectURL(stream);
      videoElement.play();

    }

    function errorCallback(error){
      console.log("navigator.getUserMedia error: ", error);
    }

    function start(){
      if (!!window.stream) {
        videoElement.src = null;
        window.stream.stop();
      }
      var audioSource = audios[0];
      var videoSource = cameras[0];
      var constraints = {
        audio: {
          optional: [{sourceId: audioSource}]
        },
        video: {
          optional: [{sourceId: videoSource}]
        }
      };
      navigator.getUserMedia(constraints, successCallback, errorCallback);
    }

  }


}

if (Meteor.isServer) {
  Meteor.startup(function () {
    Meteor.methods({
      // login call
      // true on success, false otherwise
      login: function ( username, pw ) {
        user = Users.find({user: username});
        if (user.user == username && user.pw == pw) {
          Session.set('current_user', user);
          return true;
        }
        return false;
      },

      // create a new account
      createAccount: function( username, pw ) {
        if (Users.find({user: username}).count() === 0) {
          Users.insert({user: username, pw: pw});
        }
      },

      // add a poster entry with username as owner
      addPoster: function( username, filename ) {
        var today = new Date();
        Posters.insert({owner: username, file: filename, snapped: today});
      },

      // remove poster entry
      removePoster: function( poster ) {
        Posters.remove({_id: poster._id});
      },

      // Edit a poster
      // must resend new copy of object to be updated
      // where is a GeoJSON operator: http://docs.mongodb.org/manual/reference/glossary/#term-geojson
      updatePoster: function( poster ) {
        Posters.update({_id: poster._id}, poster);
      },

      // get all the info about a poster
      // returns a map of the data
      getPosterInfo: function ( filename ) {
        var poster = Posters.find({file: filename});
        return {title: poster.title,
                tags: poster.tags,
                where: poster.where,
                date: poster.date,
                time: poster.time,
                notes: poster.notes,
                snapped: poster.snapped
              };
      },

      // mine is a bool specifying whether searching all/mine
      // where has a longitude and latitude field
      // within is in miles
      search: function ( username, mine, tags, where, within, start_date, end_date ) {
        if ( mine ) {
          var with_mine = Posters.find({ owner: username });
        } else {
          var with_mine = Posters.find({});
        }

        var with_date = with_mine.find({$and: [ {date: {$gte: start_date}}, {date: {$lte: end_date}} ] });

        var with_tags = with_date.find({tags: {$in: tags}});

        var with_where = with_tags.find({
          where: {
            $near : {
              $geometry : {
                 type : "Point" ,
                 coordinates : [ where.longitude , where.latitude ]
              },
              $maxDistance : within
            }
          }
        });
      },

      // return all the posters for a given user
      getPostersForUser: function( username ) {
        return Posters.find({ owner: username });
      }

    });

    //temp testing data
    // Users.remove({});
    // Posters.remove({});
    // Images.remove({});
    if (Users.find({}).count() === 0) {
      Users.insert({user: "Masha", pw: "hello"});
      var today = new Date();
      var yesterday = new Date();
      var twodaysback = new Date();
      yesterday.setDate(today.getDate() - 1);
      twodaysback.setDate(today.getDate() - 2);

      Posters.insert({test_url: "/posters/IMG_3696.jpeg",
                      owner: "Masha", snapped: today,
                      title: "A title", where: "A location",
                      date: "A date", time: "A time", editable: true,
                      tags: "fun", notes: "A bunch of notes about this poster"});
      Posters.insert({test_url: "/posters/JamSession.JPG",
                      owner: "Masha", snapped: today});
      Posters.insert({test_url: "/posters/PowerYoga.JPG",
                      owner: "Masha", snapped: yesterday});
      Posters.insert({test_url: "/posters/Star-Wars-Retro-Wrestling-Posters-02.jpg",
                      owner: "Masha", snapped: yesterday});
      Posters.insert({test_url: "/posters/Youth Festival Poster 2012 for Web.jpg",
                      owner: "Masha", snapped: today});
      Posters.insert({test_url: "/posters/cool-poster-designs-34.jpg",
                      owner: "Masha", snapped: twodaysback});

      Users.insert({owner: "Brad", pw: "hello"});
      Posters.insert({test_url: "/posters/BallRoomDance.JPG",
                      owner: "Brad", snapped: today,
                      editable: false});
      Posters.insert({test_url: "/posters/Christmas Lights 2012-01.jpg",
                      owner: "Brad", snapped: today});
      Posters.insert({test_url: "/posters/Circle-Gala-Poster.png",
                      owner: "Brad", snapped: yesterday,
                      title: "A title", where: "A location",
                      date: "A date", time: "A time",
                      tags: "fun", editable: false,
                      notes: "A bunch of notes about this poster"});
      Posters.insert({test_url: "/posters/IMG_2974.JPG",
                      owner: "Brad", snapped: yesterday});
      Posters.insert({test_url: "/posters/IMG_2975.JPG",
                      owner: "Brad", snapped: yesterday,
                      title: "A title", where: "A location",
                      date: "A date", time: "A time",
                      tags: "serious", editable: true,
                      notes: "A bunch of notes about this poster"});
      Posters.insert({test_url: "/posters/IMG_2976.JPG",
                      owner: "Brad", snapped: yesterday});
      Posters.insert({test_url: "/posters/IMG_2977.JPG",
                      owner: "Brad", snapped: today,
                      title: "Title for poster", where: "A location",
                      date: "A date", time: "A time",
                      tags: "fun", editable: true,
                      notes: "A bunch of notes about this poster"});
      Posters.insert({test_url: "/posters/IMG_2978.JPG",
                      owner: "Brad", snapped: today,
                      title: "Something important", where: "A location",
                      date: "A date", time: "A time",
                      tags: "serious", editable: false,
                      notes: "A bunch of notes about the important stuff in poster"});

      Users.insert({owner: "Cagri", pw: "hello"});
      Posters.insert({test_url: "/posters/environmentalrevolutionposterpx-13892784218nkg4.jpg",
                      owner: "Cagri", snapped: today,
                      title: "Cagri shot this", where: "A location",
                      date: "A data", time: "A time",
                      tags: "serious", editable: false,
                      notes: "A bunch of notes about this poster"});
      Posters.insert({test_url: "/posters/filmFestivalPosters12.jpg",
                      owner: "Cagri", snapped: today});
      Posters.insert({test_url: "/posters/newhope.jpg",
                      owner: "Cagri", snapped: today,
                      title: "Title", where: "Some location",
                      date: "A date", time: "A time",
                      tags: "fun", editable: true,
                      notes: "A bunch of notes about this poster"});
      Posters.insert({test_url: "/posters/nhscooklifepostersandflyers-13892767598kgn4.jpg",
                      owner: "Cagri", snapped: yesterday});
      Posters.insert({test_url: "/posters/poster69.jpg",
                      owner: "Cagri", snapped: yesterday});
      Posters.insert({test_url: "/posters/sample_poster.png",
                      owner: "Cagri", snapped: twodaysback});
    }

  });
}
