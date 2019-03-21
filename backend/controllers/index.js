var express = require('express');
var router = express.Router();
var User = require('../models/user.js');
var Group = require('../models/group.js');
var Message = require('../models/message.js');
var Join = require('../models/join.js');

/* GET home page. */

// -------------
// --- users ---
// -------------

// body: [name (string)]
// Result: uid (objectId)
router.post('/auth', function (req, res) {
  var query = { name: req.body.name };
  User.find(query, function (err, users) {
    if (err) throw err
    else if (users.length == 0) {
      var user_model = new User(query);
      user_model.save(function (err, userss) {
        if (err) throw err
        return res.send({ "uid": userss.id });
      });
    }
    else return res.send({ "uid": users[0].id });
  });
});

// query: [uid (objectId)]
// result: groups (array of object)
router.get('/getUserInfo', function (req, res) {
  Join.find({ uid: req.query.uid }, function (err, joins) {
    if(err) {
      console.error(err);
      res.send({groups: []});
    }
    else {
      var result = [];
      var promises;
      promises = joins.map((join, index) =>
        Group.find({
          _id: join.gid
        }).then(function (groups) {
          if (groups.length) result.push(groups[0]);
        })
      );

      Promise.all(promises).then(() => {
        res.send({
          groups: result
        });
      });
    }

  });
});

// ------------
// --- chat ---
// ------------

// body: [uid (objectId), gname (string)]
// result: gid (objectId)
router.post('/createGroup', function (req, res) {
  var query = { name: req.body.gname };
  Group.find(query, function (err, groups) {
    if (err) console.error("group finding error");
    else if (groups.length == 0) {
      var group_model = new Group(query);
      group_model.save(function (err, group) {
        if (err) throw err;
        var join_model = new Join({ uid: req.body.uid, gid: group.id, read_at: 0 });
        join_model.save(function (err) {
          if (err) throw err;
          return res.send({ "gid": group.id });
        })
      })
    }
    else {
      return res.send({ "gid": groups[0].id });
    }
  })
});

// body: [uid (objectId), gid (objectId)]
// result: [“EXISTED” / “NOT FOUND”]
router.post('/joinGroup', function (req, res) {
  var query = { _id: req.body.gid };
  Group.find(query, function (err, groups) {
    if (err) throw err
    if (groups.length == 0) {
      return res.send("NOT FOUND");
    }
    else {
      Join.findOne({ uid: req.body.uid, gid: req.body.gid, }, (err, join) => {
        if(join) {
          return res.send('EXISTED');
        }

        var join_model = new Join({
          uid: req.body.uid,
          gid: req.body.gid,
          read_at: 0
        });
        join_model.save(function (err) {
          if (err) throw err;
          else
            return res.send("EXISTED");
        })
      });
    }
  })
});

// body: [uid (objectId), gid (objectId)]    
// result: [“SUCCESS” / “ERROR”]
router.post('/leaveGroup', function (req, res) {
  var query = { uid: req.body.uid, gid: req.body.gid };
  Join.remove(query, function (err, joins) {
    if (err) return res.send("ERROR");
    else return res.send("SUCCESS");
  });
});

// result: groups (array of object)
router.get('/getAllGroup', function (req, res) {
  
  Group.find({}, function (err, groups) {
    if (err) {
      throw err;
    }else {
      return res.send(groups);
    }
  });
});

// Query: [gid (objectId)]
// Result: users [array of object]
router.get('/getGroupUser', function (req, res) {
  result = []
  Join.find({ gid: req.query.gid }, function (err, joins) {
    if (err) {
      throw err
    } else {
      joins.map((join, index) => {
        result.push({ "uid": join.uid });
        if (index === joins.length - 1) return res.send(result);
      });
    }
  });
});

// query: [gid (objectId)]
// result: messages (array of object)
router.get("/getAllMessage", function (req, res) {
  Message.find({ gid: req.query.gid }, function (err, messages) {

    if (err) res.send('FAIL');
    else {
      let promises = [];

      promises = messages.map(message => {
        return new Promise((resolve, reject) => {
          User.findById(message.uid, (err, user) => {
            if(err) {
              console.error(err);
              reject()
            }
            else {
              message._doc.user = user;
              resolve();
            }
          });
        });
      });

      Promise.all(promises).then(() => {
        res.send({messages: messages});
      }).catch((err) => {
        res.send('FAIL');
      });
    }
  });
});

// query: [uid (objectId) / gid (objectId)]
// result: messages (array of object)
router.get('/viewUnreadMessages', function (req, res) {
  var uid = req.query.uid;
  var gid = req.query.gid;
  var query = { uid: uid, gid: gid };
  var read_at;
  Join.find(query, function (err, join) {
    if (err) {
      throw err;
    }
    else
    
    if(join.length) {
      read_at = join[0].read_at;
      Message.find({ send_at: { $gt: read_at }, gid: req.query.gid }).sort('send_at').exec(function (err, messages) {
        if (err) throw err
        else {
          let promises = [];

          promises = messages.map(message => {
            return new Promise((resolve, reject) => {
              User.findById(message.uid, (err, user) => {
                if(err) {
                  console.error(err);
                  reject()
                }
                else {
                  message._doc.user = user;
                  resolve();
                }
              });
            });
          });

          Promise.all(promises).then(() => {
            res.send({messages: messages});
          }).catch((err) => {
            res.send('FAIL');
          });
        }
      });
    }
  });
});

// body: [uid (objectId), gid (objectId), content (string)]
// result: [message]
router.post('/sendMessage', function (req, res) {
  var query = Group.findOne({ gid: req.body.gid }).select('gid');
  query.exec(function (err, group) {
    if (err) throw err;
    else {
      var message_model = new Message({ uid: req.body.uid, gid: req.body.gid, content: req.body.content, send_at: Date.now() });
      message_model.save(function (err, result) {
        if (err) {
          res.send("ERROR");
          throw err
        }
        else {
          User.find({ _id: message_model.uid }, (err, users) => {
            let message = result._doc;
            message.user = users[0];
            Message.find({}).then(allMessages => {
              res.send({ message: message, messageOrder: allMessages.length });
            });
          });
        }
      })
    }
  })
});

// Body: [uid (objectId), gid (objectId)]
// Result: [“SUCCESS” / “ERROR”]
router.post("/setReadAt", function (req, res) {

  Join.findOne({ uid: req.body.uid, gid: req.body.gid }, function (err, joins) {

    if (err) throw err
    else if (joins == null) return res.send("ERROR");
    else {
      joins.set({ read_at: Date.now() });
      joins.save(function (err, update) {
        if (err) throw err
        else {

          return res.send("SUCCESS");
        }
      });
    }
  });
});

router.get('/getMessageOrder', function (req, res) {
  Message.find({}).then(allMessages => {
    return res.send({messageOrder: allMessages.length});
  });
});

module.exports = router;
