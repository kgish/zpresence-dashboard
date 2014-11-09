App = Ember.Application.create({
    LOG_TRANSITIONS: true,
    LOG_TRANSITIONS_INTERNAL: true,
    LOG_VIEW_LOOKUPS: true,
    LOG_ACTIVE_GENERATION: true
});

App.ApplicationAdapter = DS.FixtureAdapter;

/** ROUTER **/
App.Router.map(function(){
  this.resource('users', function(){
    this.route('create');
    this.resource('user', { path: '/:user_id' }, function(){
        this.route('edit');
        this.resource('channel', { path: '/channel/:channel_id' }, function() {
            this.route('edit');
        });
    });
  });
});


/** ROUTES **/
App.IndexRoute = Ember.Route.extend({
    redirect: function() {
        this.transitionTo('users');
    }
});

App.UsersRoute = Ember.Route.extend({
    model: function() {
        return this.store.find('user');
    },
    redirect: function() {
        var user = this.modelFor('users').get('firstObject');
        this.transitionTo('user', user);
    }
});

App.UserRoute = Ember.Route.extend({
    model: function(params) {
        return this.store.find('user', params.user_id);
    }
});

/** CONTROLLERS **/
App.ApplicationController = Ember.ObjectController.extend({
    appName:    'Z-Presence Dashboard',
    appVersion: 'v0.1'
});

App.UsersController = Ember.ArrayController.extend({
    editFlag: false,
    sortProperties: ['name'],
    sortAscending: true,
    usersCount: function(){
        return this.get('model.length');
    }.property('@each'),
    actions: {
        deleteUser: function(user) {
            var id = user.get('id'),
                name = user.get('name');
            if (confirm('Are you sure you want to delete user "'+name+'" ('+id+') ?')) {
                // => DELETE to /users/user_id
                user.destroyRecord();
            }
            this.transitionToRoute('users');
        },
        createUser: function() {
            this.transitionToRoute('users.create');
        }
    }
});

App.UserController = Ember.ObjectController.extend({
    sortProperties: ['name'],
    sortAscending: true,
    channelsCount: function(){
        return this.get('channels.length');
    }.property('channels.length'),
    actions: {
        editUser: function(){
            this.transitionToRoute('user.edit');
        },
        createChannel: function(){
            alert('UserController action CREATE');
            return false;
            //this.transitionToRoute('users');
        },
        deleteChannel: function(channel){
            var id = channel.get('id'),
                name = channel.get('name'),
                user = channel.get('user');
            if (confirm('Are you sure you want to delete channel "'+name+'" ('+id+') ?')) {
                // => DELETE to /users/user_id/channel/channel_id
                channel.destroyRecord();
            }
            this.transitionToRoute('user', user);
        }
    }
});

App.UserEditController = Ember.ObjectController.extend({
    actions: {
        save: function(){
            var user = this.get('model');
            this.transitionToRoute('user', user);
        },
        cancel: function(){
            var user = this.get('model');
            user.rollback();
            this.transitionToRoute('user', user);
        }
    }
});

App.UsersCreateController = Ember.ObjectController.extend({
    re : /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
    name: '',
    email: '',
    actions: {
        save: function(){
            var name = this.get('name'),
                email = this.get('email');

            if (name.length == 0) {
                alert('Please enter a valid name.');
                return false;
            }

            if (!this.re.test(email)) {
                alert('Please enter a valid email.');
                return false;
            }

            var user = this.store.createRecord('user', {
                id: this.get('model.length') + 1,
                name: name,
                email: email
            });

            user.save();
            this.set('name', '');
            this.set('email', '');
            this.transitionToRoute('users');
        },
        cancel: function(){
            this.transitionToRoute('users');
        }
    }
});

App.ChannelEditController = Ember.ObjectController.extend({
    statusList : ['online','available','away','busy','blocked','offline','unknown'],
    actions: {
        save: function(){
            var channel = this.get('model');
            this.transitionToRoute('user', channel.get('user'));
        },
        cancel: function(){
            var channel = this.get('model');
            channel.rollback();
            this.transitionToRoute('user', channel.get('user'));
        }
    }
});


/** MODELS **/
App.User = DS.Model.extend({
    name: DS.attr('string'),
    email: DS.attr('string'),
    channels: DS.hasMany('channel', {async: true})
});

App.Channel = DS.Model.extend({
    name: DS.attr('string'),
    status: DS.attr('string', {defaultValue: 'unknown'}),
    message: DS.attr('string', {defaultValue: '<none>'}),
    user: DS.belongsTo('user', {async: true})
});

App.ChannelName = DS.Model.extend({
    name: DS.attr('string')
});


/** FIXTURES **/
App.User.reopenClass({
    FIXTURES: [
        { id: 1, name: 'Guido van Rossum',  email: 'guido@psf.org',        channels: [101, 102] },
        { id: 2, name: 'Richard Stallman',  email: 'rms@gnu.org',          channels: [103, 104] },
        { id: 3, name: 'Mark Dufour',       email: 'm.dufour@zarafa.com',  channels: [105]     },
        { id: 4, name: 'Kiffin Gish',       email: 'k.gish@zarafa.com',    channels: [106, 107] }
    ]
});

App.Channel.reopenClass({
    FIXTURES: [
        { id: 101, user: 1, name: 'xmpp',     status: 'busy',         message: 'Go away!'             },
        { id: 102, user: 1, name: 'spreed',   status: 'unknown',      message: ''                     },
        { id: 103, user: 2, name: 'xmpp',     status: 'available',    message: 'Bring it on!'         },
        { id: 104, user: 2, name: 'voip',     status: 'busy',         message: 'Went to the toilet'   },
        { id: 105, user: 3, name: 'skype',    status: 'away',         message: 'At the lunch meeting' },
        { id: 106, user: 4, name: 'whatsapp', status: 'available',    message: 'Whatsapp me!'         },
        { id: 107, user: 4, name: 'google+',  status: 'busy',         message: 'Playing golf again'   }
    ]
});

App.ChannelName.reopenClass({
    FIXTURES: [
        { id: 201, name: 'xmpp'     },
        { id: 202, name: 'spreed'   },
        { id: 203, name: 'voip'     },
        { id: 204, name: 'skype'    },
        { id: 205, name: 'facebook' },
        { id: 206, name: 'google+'  },
        { id: 207, name: 'whatsapp' }
    ]
});

/** HANDLEBARS HELPERS **/
// usage: {{pluralize collection.length 'quiz' 'quizzes'}}
Handlebars.registerHelper('pluralize', function(number, single, plural) {
    return (number === 1) ? single : plural;
});
