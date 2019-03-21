var express = require('express');
var axios = require('axios');
var router = express.Router();
var ip = require('../config/ip.js');

activeBackend = 1;

postPaths = [
  '/auth',
  '/createGroup',
  '/joinGroup',
  '/leaveGroup',
  '/sendMessage',
  '/setReadAt',
];

getPaths = [
  '/getUserInfo',
  '/getAllGroup',
  '/getAllMessage',
  '/getUnreadMessage',
  '/viewUnreadMessages',
  '/getMessageOrder',
];

postPaths.map(path => {
  router.post(path, function (req, res, next) {
    // ACTIVE PRIMARY BACKEND
    axios.post(ip.primaryBackend + path, req.body)
      .then(function (response) {
        if (activeBackend === 2) {
          console.log("primary backend is back and taking over the system");
          activeBackend = 1;
        }
        if (path === '/sendMessage') io.emit('chat', response.data);
        console.log('From: primary backend');
        res.send(response.data);
      })
      .catch(function (err) {

        // ACTIVE SECONDARY BACKEND
        axios.post(ip.secondaryBackend + path, req.body)
          .then(function (response) {
            if (activeBackend === 1) {
              console.log("primary backend is inactived");
              console.log("secondary backend is taking over the system");
              activeBackend = 2;
            }
            if (path === '/sendMessage') io.emit('chat', response.data);
            console.log('From: secondary backend');
            res.send(response.data);
          })
          .catch(function (err) {
            console.error(err);
            res.send('ERROR');
          });
      });
  });
});

getPaths.map(path => {
  router.get(path, function (req, res, next) {
    // ACTIVE PRIMARY BACKEND
    axios.get(ip.primaryBackend + path, { params: req.query })
      .then(function (response) {
        if (activeBackend === 2) {
          console.log("primary backend is back and taking over the system");
          activeBackend = 1;
        }
        console.log('From: primary backend');
        res.send(response.data);
      })
      .catch(function (err) {

        // ACTIVE SECONDARY BACKEND
        axios.get(ip.secondaryBackend + path, { params: req.query })
          .then(function (response) {
            if (activeBackend === 1) {
              console.log("primary backend is inactived");
              console.log("secondary backend is taking over the system");
              activeBackend = 2;
            }
            console.log('From: secondary backend');
            res.send(response.data);
          })
          .catch(function (err) {
            console.error(err);
            res.send('ERROR');
          });
      });
  });
});

module.exports = router;