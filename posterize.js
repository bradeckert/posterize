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
    this.route('search_results');
    this.route('search');
    this.route('add_info');
    this.route('header');
  });


  //temp user name
  Session.set('current_user', "Masha");
  Session.set('mine', true);

  // When this is set, home page displays as search page
  Session.set('search_criteria', null);

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
        rows.push({"day" : "Snapped on " + posters[p].snapped.toDateString(),
                   "posters": []});
      }
      rows[rows.length - 1].posters.push(posters[p]);
    }
    return rows;
  };

  Template.camera.rendered = function() {
    $("#save").button();
    $("#edit").button();
    $("#discard").button();
  };

  Template.camera.dialog_status = function() {
    if (!Session.get("about_to_save_new")) return "hidden";
    return "";
  };

  var save_new_poster = function() {
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
      //TODO: go to poster page
    }
  });

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

  Template.poster.url = function() {
    console.log("Calling url");
    if (this.test_url) { return this.test_url; }
    else { return Images.findOne(this.file).url(); }
  };

  Template.poster.events({
    'click': function () {
      Session.set("selected_poster", this._id);
    }
  });

  // Template.test_form.events({
  //   'change .myFileInput': function(event, template) {
  //     var files = event.target.files;
  //     for (var i = 0, ln = files.length; i < ln; i++) {
  //       console.log("Saving file: " + files[i]);
  //       Images.insert(files[i], function (err, fileObj) {
  //         if (!err) {
  //           Posters.insert(
  //             {owner: Session.get('current_user'),
  //              file: fileObj._id,
  //              snapped: new Date()});
  //           console.log("Stored as : " + fileObj);
  //         } else {
  //           console.log("Error");
  //         }
  //         fO = fileObj;
  //         //Inserted new doc with ID fileObj._id, and kicked off the data upload using HTTP
  //       });
  //     }
  //   }
  // });

  //Template.

  // remove a poster
  // Template.posters.events({
  //   'click': function () {
  //     Meteor.call('removePoster', this.file);
  //   }
  // });

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
      removePoster: function( filename ) {
        Posters.remove({file: filename});
      },

      // Edit a poster
      // must resend all info in order to be updated
      // where is a GeoJSON operator: http://docs.mongodb.org/manual/reference/glossary/#term-geojson
      addPosterInfo: function( filename, title, tags, where, date, time, notes ) {
        Posters.update(
          {file: filename},
          {$set: {title: title,
                  tags: tags,
                  where: where,
                  date: date,
                  time: time,
                  notes: notes
                }
        });
        console.log(Posters.find({file: filename}));
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
    Users.remove({});
    Posters.remove({});
    Images.remove({});
    if (Users.find({}).count() === 0) {
      Users.insert({user: "Masha", pw: "hello"});
      var today = new Date();
      var yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);

      Posters.insert({test_url: "/posters/IMG_3696.jpeg",
                      owner: "Masha", snapped: today});
      Posters.insert({test_url: "/posters/JamSession.JPG",
                      owner: "Masha", snapped: today});
      Posters.insert({test_url: "/posters/PowerYoga.JPG",
                      owner: "Masha", snapped: yesterday});
      Posters.insert({test_url: "/posters/Star-Wars-Retro-Wrestling-Posters-02.jpg",
                      owner: "Masha", snapped: yesterday});
      Posters.insert({test_url: "/posters/Youth Festival Poster 2012 for Web.jpg",
                      owner: "Masha", snapped: today});
      Posters.insert({test_url: "/posters/cool-poster-designs-34.jpg",
                      owner: "Masha", snapped: today});

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
                      owner: "Cagri", snapped: yesterday});
    }

  });
}
