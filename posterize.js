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

      addInfo: function( filename, title, tags, where, date, time, notes ) {
        Posters.update( 
          {file: filename}, 
          {$set: {title: title, tags: tags, where: where, date: date, time: time, notes: notes}
        });
        console.log(Posters.find({file: filename}));
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
