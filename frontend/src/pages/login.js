import './style.css';

import React, { Button, Component } from "react";

import Cookies from 'universal-cookie';
import IpList from '../config/ip';
import axios from 'axios';
import io from 'socket.io-client';

const cookies = new Cookies();
export default class Login extends Component {

  loadBalancerAddress = 'http://127.0.0.1:3000';

  state = {
    username: "",
  };

  handleChange = (event) => {
    this.setState({ username: event.target.value });
  }

  handleSubmit = (event) => {
    let that = this;
    axios.post(IpList.loadBalancer + '/auth', { name: this.state.username })
    .then(function (response) {
      console.log(response);
      cookies.set('isAuthen', 'true', { path: '/', maxAge: 60 * 60 * 24 });
      cookies.set('username', that.state.username, { path: '/', maxAge: 60 * 60 * 24 });
      cookies.set('uid', response.data.uid, { path: '/', maxAge: 60 * 60 * 24 });
      window.location = '/main';
    })
    .catch(function (err) {
      console.error(err);
    });
  }

  render() {
    return (
      <div style={{
      alignItems: 'center', position: 'absolute',
      top: '20%', bottom: 0, right: 0, left: 0,
      margin: 'auto', width: '100%', height:'50vh' }}>
        <div className="login">
        <h1 class="header">Enter username</h1>
          <div className="login-container">
            <p><input type="text" placeholder="Username" value={this.state.username} onChange={this.handleChange}/></p>
            <p><input type="submit" value="Login" onClick={this.handleSubmit} /></p>
          </div>
        </div>
          {/*<input type="submit" value="Login" onClick={this.handleSubmit}/>*/}
      </div>
        
    );
  }
}