var imageStore = new FS.Store.GridFS("images", {});

Images = new FS.Collection("images", {
  stores: [imageStore]
});
Images.allow({download: function (userId, doc) {return true;}});

Users = new Meteor.Collection("users");
Posters = new Meteor.Collection("posters");

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

  // HOME / SEARCH -------------------------------------------------------------
  var get_search_result = function() {
    // TODO: use search_criteria
    if (Session.get('mine')) {
      return Posters.find({owner: Session.get('current_user')},
                          {'sort' : { 'snapped': -1}});
    } else {
      return Posters.find({}, {'sort' : { 'snapped': -1}});
    }
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
  };

  Template.home.events({
    'click #search': function() {
      // TODO: update search criteria
      Session.set("search_criteria", "not_null");
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

Template.poster_info.hasDetail = function() {
    var res = Posters.findOne(Session.get("selected_poster"));
    return ((res['title'] != null)
            || (res['where'] != null) 
            || (res['date'] != null) 
            || (res['time'] != null)
            || (res['tags'] != null));
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
    return (res['tags'] != '');
  }

  Template.poster_info.hasNotes = function() {
    var res = Posters.findOne(Session.get("selected_poster"));
    return (res['notes'] != '');
  }



// EDIT POSTER INFO --------------------------------------------------------------------
   Template.edit_poster_info.poster = function() {
    var res = Posters.findOne(Session.get("selected_poster"));
    res["url"] = url_for_poster(res);
    return res;
  };

  Template.edit_poster_info.rendered = function() {
    $("#save").button();
    $("#cancel").button();
  };

  Template.edit_poster_info.events({

    'submit form' : function (event, template) {
      event.preventDefault();

      var res = Posters.findOne(Session.get("selected_poster"));
      console.log('yolo');
      res['title'] = template.find("input[name=title]").value;
      res['tags'] = template.find("input[name=tags]").value;
      res['where'] = template.find("input[name=where]").value;
      res['date'] = template.find("input[name=date]").value;
      res['time'] = template.find("input[name=time]").value;
      res['notes'] = template.find("input[name=notes]").value;
      Meteor.call('updatePoster', res);
      console.log("the value is " + res['title']);
      console.log(res);
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
      var res = Posters.findOne(Session.get("selected_poster"));
      Meteor.call('removePoster', res);
      Router.go('home');
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
  var save_new_poster = function() {
    // TODO(Cagri): change to uploda from canvas instead
    if (!$(".myFileInput").get(0).files) {
      alert("No file chosen!");
    }
    var file = $(".myFileInput").get(0).files[0];
    console.log("Saving file: " + file);
    Images.insert(file, function (err, fileObj) {
      if (!err) {
        var id = Posters.insert(
          {owner: Session.get('current_user'),
           file: fileObj._id,
           snapped: new Date()});
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
      Session.set("about_to_save_new", true); },
    'click #discard' : function() {
      Session.set("about_to_save_new", false); },
    'click .x' : function() {
      Session.set("about_to_save_new", false); },
    'click #save' : function () {
      save_new_poster();
      Session.set("about_to_save_new", false);
    },
    'click #edit' : function () {
      save_new_poster();
      Session.set("about_to_save_new", false);
      Session.set("came_to_edit_by", 'camera');
      //TODO: make this less hacky, may not even be neccesary
      while(Session.get('selected_poster') == null) {}
      Router.go('edit_poster_info');
    }
  });

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

    // //temp testing data
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
                      date: "A data", time: "A time",
                      tags: "some tags", notes: "A bunch of notes about this poster"});
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
                      owner: "Brad", snapped: today});
      Posters.insert({test_url: "/posters/Christmas Lights 2012-01.jpg",
                      owner: "Brad", snapped: today});
      Posters.insert({test_url: "/posters/Circle-Gala-Poster.png",
                      owner: "Brad", snapped: yesterday});
      Posters.insert({test_url: "/posters/IMG_2974.JPG",
                      owner: "Brad", snapped: yesterday});
      Posters.insert({test_url: "/posters/IMG_2975.JPG",
                      owner: "Brad", snapped: yesterday});
      Posters.insert({test_url: "/posters/IMG_2976.JPG",
                      owner: "Brad", snapped: yesterday});
      Posters.insert({test_url: "/posters/IMG_2977.JPG",
                      owner: "Brad", snapped: today});
      Posters.insert({test_url: "/posters/IMG_2978.JPG",
                      owner: "Brad", snapped: today});

      Users.insert({owner: "Cagri", pw: "hello"});
      Posters.insert({test_url: "/posters/environmentalrevolutionposterpx-13892784218nkg4.jpg",
                      owner: "Cagri", snapped: today});
      Posters.insert({test_url: "/posters/filmFestivalPosters12.jpg",
                      owner: "Cagri", snapped: today});
      Posters.insert({test_url: "/posters/newhope.jpg",
                      owner: "Cagri", snapped: today});
      Posters.insert({test_url: "/posters/nhscooklifepostersandflyers-13892767598kgn4.jpg",
                      owner: "Cagri", snapped: yesterday});
      Posters.insert({test_url: "/posters/poster69.jpg",
                      owner: "Cagri", snapped: yesterday});
      Posters.insert({test_url: "/posters/sample_poster.png",
                      owner: "Cagri", snapped: twodaysback});
    }

  });
}
