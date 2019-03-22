import React, { Component } from 'react';

import Cookies from 'universal-cookie';
import Login from './pages/login';
import Main from './pages/main';

const cookies = new Cookies();
class App extends Component {

    constructor(props) {
        super(props);
        this.changeUid = this.changeUid.bind(this);
        this.changeGid = this.changeGid.bind(this);
    }

    state = {
        uid : -1, 
        gid : -1 
    }
    changeUid(uid){
        this.setState(uid);
    }
    changeGid(gid){
        this.setState(gid);
    }

    componentDidMount(){
        console.log(cookies.get('uid'),window.location.pathname)
        if(window.location.pathname === '/logout') {
            cookies.remove('isAuthen');
            cookies.remove('username');
            cookies.remove('uid');
            console.log( cookies.get('uid'))
            window.location.assign('login'); 
        }
        else if(window.location.pathname !== '/login' && cookies.get('isAuthen') !== 'true') {
            window.location.assign('login');
        }
	else if(window.location.pathname !== '/main' && cookies.get('isAuthen') === 'true') {
            window.location.assign('main');
        }
    }

    render(){
        return(
            <div style={{ width: '100%', height: '100%'}}>
                {window.location.pathname === '/login' && <Login changeUid = { this.changeUid } />}
                {window.location.pathname === '/main' && <Main uid = {this.state.uid} gid = {this.state.uid} changeGid = {this.changeGid}/>}
            </div>
        );
    }
}

export default App;
