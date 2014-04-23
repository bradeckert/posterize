Users = new Meteor.Collection("users");
Posters = new Meteor.Collection("posters");

if (Meteor.isClient) {
  //temp user name
  Session.set('current_user', "Joe");

  Template.people.users = function () {
    return Users.find({});
  };

  Template.posters.posters = function () {
    return Posters.find({});
  };

  // remove a poster
  Template.posters.events({
    'click': function () {
      Meteor.call('removePoster', this.file);
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
        Posters.insert({owner: username, file: filename});
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
                notes: poster.notes
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
    if (Users.find({}).count() === 0) {
      Users.insert({user: "DavidKarger", pw: "hello"});
      Posters.insert({owner: "DavidKarger", file: "/posters/poster69.jpg"});

      Users.insert({user: "RobMiller", pw: "hello"});
      Posters.insert({owner: "RobMiller", file: "/posters/newhope.jpg"});

      Users.insert({user: "Joe", pw: "hello"});
      Posters.insert({owner: "Joe", file: "/posters/JamSession.JPG"});
      Posters.insert({owner: "Joe", file: "/posters/BallRoomDance.JPG"});
    }

  });
}
